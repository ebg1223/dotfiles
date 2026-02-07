import { StringEnum } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type, type Static } from "@sinclair/typebox";
import { discoverAgents, getAgentByName, listAgentNames, type AgentScope } from "./agents.js";
import { runAgentTask, type UsageSummary } from "./runner.js";
import { WorkflowParamsSchema, type WorkflowParams, parsePlannedWaves } from "./workflow-utils.js";
import {
  buildPlannerPrompt,
  confirmProjectAgentsIfNeeded,
  executeWorkflow,
  renderWorkflowCall,
  renderWorkflowResult,
} from "./workflow-engine.js";

const PlanAndRunParamsSchema = Type.Object({
  goal: Type.String({ minLength: 5, maxLength: 3000 }),
  plannerAgent: Type.Optional(Type.String({ default: "planner" })),
  planningContext: Type.Optional(Type.Array(Type.String({ minLength: 1, maxLength: 500 }), { maxItems: 30 })),
  planningConstraints: Type.Optional(Type.Array(Type.String({ minLength: 1, maxLength: 500 }), { maxItems: 30 })),
  maxWaves: Type.Optional(Type.Integer({ minimum: 1, maximum: 12, default: 6 })),
  maxTasksPerWave: Type.Optional(Type.Integer({ minimum: 1, maximum: 20, default: 6 })),
  planningAttempts: Type.Optional(Type.Integer({ minimum: 1, maximum: 3, default: 2 })),
  workerAgent: Type.Optional(Type.String({ default: "implementer" })),
  criticAgent: Type.Optional(Type.String({ default: "critic" })),
  maxConcurrency: Type.Optional(Type.Integer({ minimum: 1, maximum: 8, default: 4 })),
  maxWorkerAttempts: Type.Optional(Type.Integer({ minimum: 1, maximum: 3, default: 2 })),
  failFast: Type.Optional(Type.Boolean({ default: true })),
  agentScope: Type.Optional(StringEnum(["user", "project", "both"] as const, { default: "user" })),
  confirmProjectAgents: Type.Optional(Type.Boolean({ default: true })),
  executionApproved: Type.Optional(
    Type.Boolean({
      default: false,
      description: "Set true to bypass interactive approval dialogs when running non-interactive automation.",
    }),
  ),
});

type PlanAndRunParams = Static<typeof PlanAndRunParamsSchema>;

function emptyUsage(): UsageSummary {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, totalCost: 0, turns: 0 };
}

function addUsage(target: UsageSummary, incoming: UsageSummary): UsageSummary {
  return {
    input: target.input + incoming.input,
    output: target.output + incoming.output,
    cacheRead: target.cacheRead + incoming.cacheRead,
    cacheWrite: target.cacheWrite + incoming.cacheWrite,
    totalTokens: target.totalTokens + incoming.totalTokens,
    totalCost: target.totalCost + incoming.totalCost,
    turns: target.turns + incoming.turns,
  };
}

export default function cerebrasOrchestratorExtension(pi: ExtensionAPI) {
  pi.registerCommand("cerebras-template", {
    description: "Insert a workflow planning prompt for cerebras orchestration",
    handler: async (_args, ctx) => {
      ctx.ui.setEditorText(
        "Call cerebras_plan_and_orchestrate for freeform goals. " +
          "If you already have explicit waves, call cerebras_orchestrate.",
      );
      ctx.ui.notify("Inserted cerebras workflow template", "info");
    },
  });

  pi.registerTool({
    name: "cerebras_orchestrate",
    label: "Cerebras Orchestrate",
    description:
      "Execute a wave-based implementation workflow: dispatch parallel cerebras worker tasks, run critic validation for each task, and retry failed reviews before finalizing.",
    parameters: WorkflowParamsSchema,
    execute: async (_toolCallId, params: WorkflowParams, signal, onUpdate, ctx) =>
      executeWorkflow(params, signal, onUpdate, ctx),
    renderCall(args) {
      const totalTasks = Array.isArray(args.waves)
        ? args.waves.reduce((sum: number, wave: any) => sum + (Array.isArray(wave.tasks) ? wave.tasks.length : 0), 0)
        : 0;
      return renderWorkflowCall("cerebras_orchestrate", args.goal ?? "", totalTasks);
    },
    renderResult: renderWorkflowResult,
  });

  pi.registerTool({
    name: "cerebras_plan_and_orchestrate",
    label: "Cerebras Plan+Run",
    description:
      "Generate a wave-based execution plan from a freeform goal via planner agent, then dispatch workers in parallel with mandatory critic review.",
    parameters: PlanAndRunParamsSchema,

    async execute(_toolCallId, params: PlanAndRunParams, signal, onUpdate, ctx) {
      const plannerAgentName = params.plannerAgent ?? "planner";
      const workerAgentName = params.workerAgent ?? "implementer";
      const criticAgentName = params.criticAgent ?? "critic";
      const agentScope = (params.agentScope ?? "user") as AgentScope;
      const confirmProjectAgents = params.confirmProjectAgents ?? true;
      const planningAttempts = params.planningAttempts ?? 2;
      const maxWaves = params.maxWaves ?? 6;
      const maxTasksPerWave = params.maxTasksPerWave ?? 6;

      const discovery = discoverAgents(ctx.cwd, agentScope);
      const plannerAgent = getAgentByName(discovery.agents, plannerAgentName);
      const workerAgent = getAgentByName(discovery.agents, workerAgentName);
      const criticAgent = getAgentByName(discovery.agents, criticAgentName);

      if (!plannerAgent || !workerAgent || !criticAgent) {
        return {
          content: [
            {
              type: "text",
              text:
                `Missing required agents. planner=${plannerAgentName} worker=${workerAgentName} critic=${criticAgentName}. ` +
                `Available: ${listAgentNames(discovery.agents)}`,
            },
          ],
          isError: true,
        };
      }

      const approved = await confirmProjectAgentsIfNeeded(
        ctx,
        agentScope,
        confirmProjectAgents,
        discovery,
        [plannerAgent, workerAgent, criticAgent],
      );
      if (!approved) {
        return { content: [{ type: "text", text: "Cancelled by user: project-local agents not approved." }], isError: true };
      }

      let plannedWaves: WorkflowParams["waves"] | null = null;
      let revisionFeedback: string[] = [];
      let planningUsage = emptyUsage();
      let usedAttempts = 0;

      for (let attempt = 1; attempt <= planningAttempts; attempt += 1) {
        usedAttempts = attempt;
        if (onUpdate) onUpdate({ content: [{ type: "text", text: `Planner attempt ${attempt}/${planningAttempts}` }] });

        const plannerSystemPrompt = `${buildPlannerPrompt(
          params.goal,
          maxWaves,
          maxTasksPerWave,
          params.planningContext ?? [],
          params.planningConstraints ?? [],
          revisionFeedback,
        )}\n\n${plannerAgent.systemPrompt}`;

        const plannerRun = await runAgentTask(
          plannerAgent,
          "Create a wave-based plan now and return JSON only.",
          ctx.cwd,
          signal,
          undefined,
          plannerSystemPrompt,
        );
        planningUsage = addUsage(planningUsage, plannerRun.usage);

        if (plannerRun.exitCode !== 0) {
          revisionFeedback = [plannerRun.stderr.trim() || "planner exited with non-zero code"];
          continue;
        }

        plannedWaves = parsePlannedWaves(plannerRun.finalText, maxWaves, maxTasksPerWave);
        if (plannedWaves) break;

        revisionFeedback = [
          "Planner output was invalid JSON or schema-invalid.",
          "Return ONLY strict JSON with top-level waves[] and valid task packets.",
        ];
      }

      if (!plannedWaves) {
        return {
          content: [{ type: "text", text: "Planner failed to produce a valid workflow plan after retries." }],
          isError: true,
        };
      }

      return executeWorkflow(
        {
          goal: params.goal,
          waves: plannedWaves,
          workerAgent: workerAgentName,
          criticAgent: criticAgentName,
          maxConcurrency: params.maxConcurrency,
          maxWorkerAttempts: params.maxWorkerAttempts,
          failFast: params.failFast,
          agentScope,
          confirmProjectAgents: false,
          executionApproved: params.executionApproved,
        },
        signal,
        onUpdate,
        ctx,
        { plannerAgent: plannerAgent.name, attempts: usedAttempts, usage: planningUsage },
      );
    },

    renderCall(args) {
      return renderWorkflowCall("cerebras_plan_and_orchestrate", args.goal ?? "");
    },

    renderResult: renderWorkflowResult,
  });
}
