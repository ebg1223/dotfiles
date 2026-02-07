import { keyHint } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import type { AgentConfig, AgentDiscoveryResult, AgentScope } from "./agents.js";
import { listAgentNames, getAgentByName, discoverAgents } from "./agents.js";
import { mapWithConcurrency, runAgentTask } from "./runner.js";
import {
  MAX_TASKS,
  type WorkflowDetails,
  type WorkflowParams,
  type TaskRuntime,
  buildCriticPrompt,
  buildWorkerPrompt,
  combineUsage,
  parseCriticReport,
  parseWorkerReport,
  resolveTaskCwd,
  statusCounts,
  summarizeRun,
} from "./workflow-utils.js";

export type ToolContext = any;
export type ToolOnUpdate = any;

export function usageSummaryText(usage: {
  turns: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalCost: number;
}): string {
  return `turns=${usage.turns} input=${usage.input} output=${usage.output} cacheRead=${usage.cacheRead} cacheWrite=${usage.cacheWrite} cost=$${usage.totalCost.toFixed(4)}`;
}

export function buildPlannerPrompt(
  goal: string,
  maxWaves: number,
  maxTasksPerWave: number,
  planningContext: string[],
  planningConstraints: string[],
  revisionFeedback: string[],
): string {
  const schema =
    '{"waves":[{"name":"string","tasks":[{"id":"string","objective":"string","acceptanceCriteria":["string"],"files":["string"],"constraints":["string"],"context":["string"],"cwd":"string"}]}]}';

  const lines = [
    "MANDATORY RULES (MUST FOLLOW EXACTLY):",
    "1) You MUST return ONLY valid JSON. No markdown. No code fences.",
    "2) Top-level output MUST match this schema exactly:",
    schema,
    "3) Every task MUST include id, objective, and at least one acceptance criterion.",
    "4) Tasks inside the same wave MUST be independently executable in parallel.",
    "5) Cross-task dependencies MUST be represented by later waves.",
    `6) You MUST return between 1 and ${maxWaves} waves, and each wave MUST have between 1 and ${maxTasksPerWave} tasks.`,
    "",
    `GOAL: ${goal}`,
    `PLANNING CONTEXT: ${(planningContext.length > 0 ? planningContext : ["none"]).map((item) => `- ${item}`).join("\n")}`,
    `PLANNING CONSTRAINTS: ${(planningConstraints.length > 0 ? planningConstraints : ["none"]).map((item) => `- ${item}`).join("\n")}`,
  ];

  if (revisionFeedback.length > 0) {
    lines.push("", "REVISION FEEDBACK (MUST FIX):", ...revisionFeedback.map((item) => `- ${item}`));
  }

  return lines.join("\n");
}

function createTaskRuntimes(params: WorkflowParams, baseCwd: string): TaskRuntime[] {
  const tasks: TaskRuntime[] = [];
  params.waves.forEach((wave, waveIndex) => {
    const waveName = wave.name?.trim() || `Wave ${waveIndex + 1}`;
    for (const task of wave.tasks) {
      tasks.push({
        id: task.id,
        objective: task.objective,
        waveIndex,
        waveName,
        status: "pending",
        attempt: 0,
        cwd: resolveTaskCwd(baseCwd, task.cwd),
        files: task.files ?? [],
        acceptanceCriteria: task.acceptanceCriteria,
        constraints: task.constraints ?? [],
        context: task.context ?? [],
        filesTouched: [],
        blockers: [],
        issues: [],
        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, totalCost: 0, turns: 0 },
        toolCalls: 0,
      });
    }
  });
  return tasks;
}

function validateWorkflow(params: WorkflowParams): string | null {
  const totalTasks = params.waves.reduce((sum, wave) => sum + wave.tasks.length, 0);
  if (totalTasks > MAX_TASKS) return `Too many tasks (${totalTasks}). Maximum is ${MAX_TASKS}.`;

  const ids = new Set<string>();
  for (const wave of params.waves) {
    for (const task of wave.tasks) {
      if (ids.has(task.id)) return `Duplicate task id detected: ${task.id}`;
      ids.add(task.id);
    }
  }

  return null;
}

export function resolveWorkflowAgents(discovery: AgentDiscoveryResult, workerAgentName: string, criticAgentName: string) {
  const workerAgent = getAgentByName(discovery.agents, workerAgentName);
  const criticAgent = getAgentByName(discovery.agents, criticAgentName);
  return { workerAgent, criticAgent };
}

export async function confirmProjectAgentsIfNeeded(
  ctx: ToolContext,
  scope: AgentScope,
  shouldConfirm: boolean,
  discovery: AgentDiscoveryResult,
  agents: AgentConfig[],
): Promise<boolean> {
  if (!ctx.hasUI || !shouldConfirm) return true;
  if (scope !== "project" && scope !== "both") return true;

  const projectAgents = agents.filter((agent) => agent.source === "project");
  if (projectAgents.length === 0) return true;

  const approved = await ctx.ui.confirm(
    "Approve project-local agents?",
    `Agents: ${projectAgents.map((agent) => `${agent.name} (${agent.source})`).join(", ")}\n` +
      `source dir: ${discovery.projectAgentsDir ?? "unknown"}`,
  );
  return approved;
}

function formatWaveSummary(params: WorkflowParams): string {
  const lines: string[] = [];
  for (let index = 0; index < params.waves.length; index += 1) {
    const wave = params.waves[index];
    const waveName = wave.name?.trim() || `Wave ${index + 1}`;
    const taskPreview = wave.tasks.slice(0, 4).map((task) => task.id).join(", ");
    const overflow = wave.tasks.length > 4 ? ` +${wave.tasks.length - 4} more` : "";
    lines.push(`${waveName}: ${wave.tasks.length} task(s)${taskPreview ? ` [${taskPreview}${overflow}]` : ""}`);
  }
  return lines.join("\n");
}

async function requireExecutionApproval(
  ctx: ToolContext,
  params: WorkflowParams,
  executionApproved: boolean,
): Promise<{ approved: boolean; message?: string }> {
  if (executionApproved) return { approved: true };

  if (!ctx.hasUI) {
    return {
      approved: false,
      message:
        "Execution approval required. Re-run with executionApproved=true for non-interactive mode.",
    };
  }

  const summary = formatWaveSummary(params);
  const approved = await ctx.ui.confirm(
    "Approve workflow execution?",
    `Goal: ${params.goal}\n\n${summary}`,
  );

  if (!approved) {
    return { approved: false, message: "Execution cancelled: plan not approved by user." };
  }

  return { approved: true };
}

export async function executeWorkflow(
  params: WorkflowParams,
  signal: AbortSignal | undefined,
  onUpdate: ToolOnUpdate,
  ctx: ToolContext,
  planning?: WorkflowDetails["planning"],
) {
  const validationError = validateWorkflow(params);
  if (validationError) return { content: [{ type: "text", text: validationError }], isError: true };

  const workerAgentName = params.workerAgent ?? "implementer";
  const criticAgentName = params.criticAgent ?? "critic";
  const maxConcurrency = params.maxConcurrency ?? 4;
  const maxWorkerAttempts = params.maxWorkerAttempts ?? 2;
  const failFast = params.failFast ?? true;
  const agentScope = params.agentScope ?? "user";
  const confirmProjectAgents = params.confirmProjectAgents ?? true;

  const discovery = discoverAgents(ctx.cwd, agentScope);
  const { workerAgent, criticAgent } = resolveWorkflowAgents(discovery, workerAgentName, criticAgentName);

  if (!workerAgent || !criticAgent) {
    return {
      content: [
        {
          type: "text",
          text: `Missing required agents. worker=${workerAgentName} critic=${criticAgentName}. Available: ${listAgentNames(discovery.agents)}`,
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
    [workerAgent, criticAgent],
  );
  if (!approved) {
    return { content: [{ type: "text", text: "Cancelled by user: project-local agents not approved." }], isError: true };
  }

  const approvalResult = await requireExecutionApproval(ctx, params, params.executionApproved ?? false);
  if (!approvalResult.approved) {
    return {
      content: [{ type: "text", text: approvalResult.message ?? "Execution cancelled." }],
      isError: true,
    };
  }

  const tasks = createTaskRuntimes(params, ctx.cwd);
  const details: WorkflowDetails = {
    goal: params.goal,
    workerAgent: workerAgent.name,
    criticAgent: criticAgent.name,
    agentScope,
    maxWorkerAttempts,
    startedAt: Date.now(),
    tasks,
    planning,
  };

  const emitUpdate = (message: string) => {
    if (!onUpdate) return;
    onUpdate({ content: [{ type: "text", text: message }], details });
  };

  const runSingleTask = async (task: TaskRuntime): Promise<void> => {
    let revisionFeedback: string[] = [];

    for (let attempt = 1; attempt <= maxWorkerAttempts; attempt += 1) {
      task.attempt = attempt;
      task.status = "running-worker";
      task.error = undefined;
      emitUpdate(`Worker ${task.id} attempt ${attempt}/${maxWorkerAttempts}`);

      const workerSystemPrompt = `${buildWorkerPrompt(params.goal, task, revisionFeedback)}\n\n${workerAgent.systemPrompt}`;
      const workerRun = await runAgentTask(
        workerAgent,
        "Execute the task now and return JSON only.",
        task.cwd,
        signal,
        (progress) => {
          if (progress.phase === "tool") emitUpdate(`Task ${task.id}: ${progress.text}`);
        },
        workerSystemPrompt,
      );
      summarizeRun(task, workerRun);
      task.workerAgentSource = workerRun.source;

      if (workerRun.exitCode !== 0) {
        task.error = workerRun.stderr.trim() || "worker exited with non-zero code";
        if (attempt < maxWorkerAttempts) {
          revisionFeedback = [task.error];
          continue;
        }
        task.status = "failed";
        return;
      }

      const workerReport = parseWorkerReport(workerRun.finalText);
      if (!workerReport) {
        task.error = "worker output did not match required JSON schema";
        if (attempt < maxWorkerAttempts) {
          revisionFeedback = [task.error, "Return ONLY strict JSON using required keys."];
          continue;
        }
        task.status = "failed";
        return;
      }

      task.workerSummary = workerReport.summary;
      task.filesTouched = workerReport.filesTouched;
      task.blockers = workerReport.blockers;

      task.status = "running-critic";
      emitUpdate(`Critic reviewing ${task.id}`);

      const criticSystemPrompt = `${buildCriticPrompt(params.goal, task, workerRun.finalText)}\n\n${criticAgent.systemPrompt}`;
      const criticRun = await runAgentTask(
        criticAgent,
        "Review the worker output and return JSON only.",
        task.cwd,
        signal,
        undefined,
        criticSystemPrompt,
      );
      summarizeRun(task, criticRun);
      task.criticAgentSource = criticRun.source;

      if (criticRun.exitCode !== 0) {
        task.error = criticRun.stderr.trim() || "critic exited with non-zero code";
        if (attempt < maxWorkerAttempts) {
          revisionFeedback = [task.error];
          continue;
        }
        task.status = "failed";
        return;
      }

      const criticReport = parseCriticReport(criticRun.finalText);
      if (!criticReport) {
        task.error = "critic output did not match required JSON schema";
        if (attempt < maxWorkerAttempts) {
          revisionFeedback = [task.error, "Return ONLY strict JSON using required keys."];
          continue;
        }
        task.status = "failed";
        return;
      }

      task.criticDecision = criticReport.decision;
      task.issues = criticReport.issues;

      if (criticReport.decision === "approve") {
        task.status = workerReport.status === "blocked" ? "blocked" : "completed";
        if (task.status === "blocked" && !task.error) {
          task.error = workerReport.blockers.join("; ") || "blocked without explicit blocker details";
        }
        return;
      }

      if (attempt < maxWorkerAttempts) {
        revisionFeedback = [
          ...(criticReport.issues.length > 0 ? criticReport.issues : [criticReport.rationale]),
          ...criticReport.revisionInstructions,
        ];
        continue;
      }

      task.error = criticReport.issues.join("; ") || criticReport.rationale;
      task.status = "failed";
      return;
    }
  };

  try {
    for (let waveIndex = 0; waveIndex < params.waves.length; waveIndex += 1) {
      const waveTasks = tasks.filter((task) => task.waveIndex === waveIndex);
      await mapWithConcurrency(waveTasks, maxConcurrency, async (task) => runSingleTask(task));

      const waveHasFailure = waveTasks.some((task) => task.status === "failed" || task.status === "blocked");
      if (waveHasFailure && failFast) {
        for (const task of tasks.filter((entry) => entry.waveIndex > waveIndex && entry.status === "pending")) {
          task.status = "skipped";
        }
        break;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    for (const task of tasks.filter((entry) => entry.status === "pending" || entry.status.startsWith("running"))) {
      task.status = "failed";
      task.error = message;
    }
  }

  details.finishedAt = Date.now();
  const counts = statusCounts(tasks);
  const usage = combineUsage(tasks);
  const hasErrors = counts.failed > 0 || counts.blocked > 0;

  return {
    content: [
      {
        type: "text",
        text:
          `Workflow finished: ${counts.completed} completed, ${counts.blocked} blocked, ${counts.failed} failed, ${counts.skipped} skipped\n` +
          `Usage: ${usageSummaryText(usage)}`,
      },
    ],
    details,
    isError: hasErrors,
  };
}

export function renderWorkflowCall(name: string, goal: string, totalTasks?: number): Text {
  if (typeof totalTasks === "number") {
    return new Text(`${name} ${totalTasks} task${totalTasks === 1 ? "" : "s"}\n${goal}`, 0, 0);
  }
  return new Text(`${name}\n${goal}`, 0, 0);
}

export function renderWorkflowResult(result: any, options: any, theme: any): Text {
  const details = result.details as WorkflowDetails | undefined;
  if (!details) {
    const plainText = result.content?.find((part: any) => part.type === "text");
    return new Text(plainText?.text ?? "", 0, 0);
  }

  const counts = statusCounts(details.tasks);
  const icon = counts.failed > 0 ? theme.fg("error", "✗") : counts.blocked > 0 ? theme.fg("warning", "◐") : theme.fg("success", "✓");

  const headerLines = [
    `${icon} ${theme.fg("toolTitle", `cerebras workflow`)} ${theme.fg("muted", `(${details.workerAgent} -> ${details.criticAgent})`)}`,
    theme.fg("muted", `completed=${counts.completed} blocked=${counts.blocked} failed=${counts.failed} skipped=${counts.skipped}`),
  ];

  if (details.planning) {
    headerLines.push(theme.fg("muted", `planner=${details.planning.plannerAgent} attempts=${details.planning.attempts}`));
    headerLines.push(theme.fg("muted", usageSummaryText(details.planning.usage)));
  }

  if (!options.expanded) {
    const lines = details.tasks.slice(0, 8).map((task) => {
      const statusColor =
        task.status === "completed"
          ? "success"
          : task.status === "failed" || task.status === "blocked"
            ? "error"
            : task.status === "skipped"
              ? "muted"
              : "warning";
      return `${theme.fg(statusColor, task.status.padEnd(14))} ${task.id} (attempt ${task.attempt}/${details.maxWorkerAttempts})`;
    });

    if (details.tasks.length > 8) {
      lines.push(theme.fg("muted", `... ${details.tasks.length - 8} more (${keyHint("expandTools", "expand")})`));
    }

    return new Text(`${headerLines.join("\n")}\n\n${lines.join("\n")}`, 0, 0);
  }

  const lines: string[] = [...headerLines, ""];
  for (const task of details.tasks) {
    lines.push(`${theme.bold(task.id)}  ${theme.fg("muted", `[${task.waveName}]`)}  ${task.status}`);
    lines.push(`  objective: ${task.objective}`);
    lines.push(`  attempt: ${task.attempt}/${details.maxWorkerAttempts}  cwd: ${task.cwd}`);
    if (task.workerSummary) lines.push(`  summary: ${task.workerSummary}`);
    if (task.filesTouched.length > 0) lines.push(`  files: ${task.filesTouched.join(", ")}`);
    if (task.issues.length > 0) lines.push(`  critic issues: ${task.issues.join(" | ")}`);
    if (task.error) lines.push(theme.fg("error", `  error: ${task.error}`));
    lines.push("");
  }

  return new Text(lines.join("\n"), 0, 0);
}
