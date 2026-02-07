import * as path from "node:path";
import { StringEnum } from "@mariozechner/pi-ai";
import { Type, type Static } from "@sinclair/typebox";
import type { AgentRunResult, UsageSummary } from "./runner.js";
import type { AgentScope } from "./agents.js";

export type TaskStatus =
  | "pending"
  | "running-worker"
  | "running-critic"
  | "completed"
  | "blocked"
  | "failed"
  | "skipped";

export interface WorkerReport {
  status: "completed" | "blocked";
  summary: string;
  actions: string[];
  filesTouched: string[];
  blockers: string[];
  notes: string[];
}

export interface CriticReport {
  decision: "approve" | "revise";
  rationale: string;
  issues: string[];
  revisionInstructions: string[];
}

export interface TaskRuntime {
  id: string;
  objective: string;
  waveIndex: number;
  waveName: string;
  status: TaskStatus;
  attempt: number;
  cwd: string;
  files: string[];
  acceptanceCriteria: string[];
  constraints: string[];
  context: string[];
  workerSummary?: string;
  filesTouched: string[];
  blockers: string[];
  criticDecision?: CriticReport["decision"];
  issues: string[];
  error?: string;
  usage: UsageSummary;
  toolCalls: number;
  workerAgentSource?: "user" | "project";
  criticAgentSource?: "user" | "project";
}

export interface WorkflowDetails {
  goal: string;
  workerAgent: string;
  criticAgent: string;
  agentScope: AgentScope;
  maxWorkerAttempts: number;
  startedAt: number;
  finishedAt?: number;
  tasks: TaskRuntime[];
  planning?: {
    plannerAgent: string;
    attempts: number;
    usage: UsageSummary;
  };
}

export const MAX_TASKS = 64;

const WorkflowTaskSchema = Type.Object({
  id: Type.String({ minLength: 1, maxLength: 80, description: "Unique task id" }),
  objective: Type.String({ minLength: 5, maxLength: 2000, description: "Concrete task objective" }),
  context: Type.Optional(Type.Array(Type.String({ minLength: 1, maxLength: 500 }), { maxItems: 20 })),
  files: Type.Optional(Type.Array(Type.String({ minLength: 1, maxLength: 500 }), { maxItems: 50 })),
  acceptanceCriteria: Type.Array(Type.String({ minLength: 1, maxLength: 500 }), {
    minItems: 1,
    maxItems: 20,
    description: "Explicit acceptance checks",
  }),
  constraints: Type.Optional(Type.Array(Type.String({ minLength: 1, maxLength: 500 }), { maxItems: 20 })),
  cwd: Type.Optional(Type.String({ minLength: 1, maxLength: 500, description: "Task cwd (project relative or absolute)" })),
});

const WorkflowWaveSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 120 })),
  tasks: Type.Array(WorkflowTaskSchema, { minItems: 1, maxItems: 20 }),
});

export const WorkflowParamsSchema = Type.Object({
  goal: Type.String({ minLength: 5, maxLength: 3000 }),
  waves: Type.Array(WorkflowWaveSchema, { minItems: 1, maxItems: 12 }),
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

export type WorkflowParams = Static<typeof WorkflowParamsSchema>;

export function combineUsage(records: TaskRuntime[]): UsageSummary {
  return records.reduce<UsageSummary>(
    (acc, record) => ({
      input: acc.input + record.usage.input,
      output: acc.output + record.usage.output,
      cacheRead: acc.cacheRead + record.usage.cacheRead,
      cacheWrite: acc.cacheWrite + record.usage.cacheWrite,
      totalTokens: acc.totalTokens + record.usage.totalTokens,
      totalCost: acc.totalCost + record.usage.totalCost,
      turns: acc.turns + record.usage.turns,
    }),
    { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, totalCost: 0, turns: 0 },
  );
}

export function statusCounts(tasks: TaskRuntime[]): Record<TaskStatus, number> {
  const counts: Record<TaskStatus, number> = {
    pending: 0,
    "running-worker": 0,
    "running-critic": 0,
    completed: 0,
    blocked: 0,
    failed: 0,
    skipped: 0,
  };
  for (const task of tasks) counts[task.status] += 1;
  return counts;
}

export function extractJsonCandidate(raw: string): unknown {
  const trimmed = raw.trim();
  const candidates: string[] = [trimmed];

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) candidates.push(fenceMatch[1].trim());

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // keep trying
    }
  }

  return null;
}

function normalizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean);
}

export function parseWorkerReport(raw: string): WorkerReport | null {
  const json = extractJsonCandidate(raw) as Record<string, unknown> | null;
  if (!json || typeof json !== "object") return null;

  const status = json.status;
  const summary = typeof json.summary === "string" ? json.summary.trim() : "";
  if ((status !== "completed" && status !== "blocked") || !summary) return null;

  return {
    status,
    summary,
    actions: normalizeStringArray(json.actions),
    filesTouched: normalizeStringArray(json.filesTouched),
    blockers: normalizeStringArray(json.blockers),
    notes: normalizeStringArray(json.notes),
  };
}

export function parseCriticReport(raw: string): CriticReport | null {
  const json = extractJsonCandidate(raw) as Record<string, unknown> | null;
  if (!json || typeof json !== "object") return null;

  const decision = json.decision;
  const rationale = typeof json.rationale === "string" ? json.rationale.trim() : "";
  if ((decision !== "approve" && decision !== "revise") || !rationale) return null;

  return {
    decision,
    rationale,
    issues: normalizeStringArray(json.issues),
    revisionInstructions: normalizeStringArray(json.revisionInstructions),
  };
}

export function parsePlannedWaves(
  raw: string,
  maxWaves: number,
  maxTasksPerWave: number,
): WorkflowParams["waves"] | null {
  const json = extractJsonCandidate(raw) as Record<string, unknown> | unknown[] | null;
  if (!json) return null;

  const candidateWaves =
    Array.isArray(json) ? json : Array.isArray((json as Record<string, unknown>).waves) ? (json as Record<string, unknown>).waves : null;
  if (!Array.isArray(candidateWaves) || candidateWaves.length === 0 || candidateWaves.length > maxWaves) {
    return null;
  }

  const seenIds = new Set<string>();
  const waves: WorkflowParams["waves"] = [];

  for (let waveIndex = 0; waveIndex < candidateWaves.length; waveIndex += 1) {
    const rawWave = candidateWaves[waveIndex] as Record<string, unknown>;
    if (!rawWave || typeof rawWave !== "object") return null;

    const rawTasks = rawWave.tasks;
    if (!Array.isArray(rawTasks) || rawTasks.length === 0 || rawTasks.length > maxTasksPerWave) {
      return null;
    }

    const waveTasks: WorkflowParams["waves"][number]["tasks"] = [];
    for (const rawTask of rawTasks) {
      if (!rawTask || typeof rawTask !== "object") return null;
      const taskObj = rawTask as Record<string, unknown>;

      const id = typeof taskObj.id === "string" ? taskObj.id.trim() : "";
      const objective = typeof taskObj.objective === "string" ? taskObj.objective.trim() : "";
      const acceptanceCriteria = normalizeStringArray(taskObj.acceptanceCriteria);
      if (!id || !objective || acceptanceCriteria.length === 0) return null;
      if (seenIds.has(id)) return null;
      seenIds.add(id);

      const normalizedTask: WorkflowParams["waves"][number]["tasks"][number] = {
        id,
        objective,
        acceptanceCriteria,
      };

      const files = normalizeStringArray(taskObj.files);
      if (files.length > 0) normalizedTask.files = files;

      const constraints = normalizeStringArray(taskObj.constraints);
      if (constraints.length > 0) normalizedTask.constraints = constraints;

      const context = normalizeStringArray(taskObj.context);
      if (context.length > 0) normalizedTask.context = context;

      if (typeof taskObj.cwd === "string" && taskObj.cwd.trim()) {
        normalizedTask.cwd = taskObj.cwd.trim();
      }

      waveTasks.push(normalizedTask);
    }

    waves.push({
      name: typeof rawWave.name === "string" && rawWave.name.trim() ? rawWave.name.trim() : `Wave ${waveIndex + 1}`,
      tasks: waveTasks,
    });
  }

  return waves;
}

function truncateForPrompt(input: string, limit = 7000): string {
  if (input.length <= limit) return input;
  return `${input.slice(0, limit)}\n\n[truncated ${input.length - limit} characters]`;
}

export function resolveTaskCwd(baseCwd: string, requestedCwd: string | undefined): string {
  const resolvedBase = path.resolve(baseCwd);
  if (!requestedCwd) return resolvedBase;

  const resolved = path.resolve(resolvedBase, requestedCwd);
  const relative = path.relative(resolvedBase, resolved);
  const escapesRoot = relative.startsWith("..") || path.isAbsolute(relative);
  if (escapesRoot) {
    throw new Error(`Task cwd must stay inside project root: ${requestedCwd}`);
  }

  return resolved;
}

export function buildWorkerPrompt(goal: string, task: TaskRuntime, revisionFeedback: string[]): string {
  const lines = [
    "MANDATORY RULES (MUST FOLLOW EXACTLY):",
    "1) You MUST execute only the provided task. Do NOT decompose into unrelated work.",
    "2) You MUST honor every acceptance criterion and constraint.",
    "3) You MUST return ONLY valid JSON with this schema:",
    '{"status":"completed|blocked","summary":"string","actions":["string"],"filesTouched":["string"],"blockers":["string"],"notes":["string"]}',
    "4) If acceptance criteria cannot be met, status MUST be \"blocked\" and blockers MUST explain why.",
    "5) Do NOT include markdown, prose outside JSON, or code fences.",
    "",
    `GLOBAL GOAL: ${goal}`,
    `TASK ID: ${task.id}`,
    `TASK OBJECTIVE: ${task.objective}`,
    `ACCEPTANCE CRITERIA: ${task.acceptanceCriteria.map((item) => `- ${item}`).join("\n")}`,
    `CONSTRAINTS: ${(task.constraints.length > 0 ? task.constraints : ["none"]).map((item) => `- ${item}`).join("\n")}`,
    `FOCUS FILES: ${(task.files.length > 0 ? task.files : ["none specified"]).map((item) => `- ${item}`).join("\n")}`,
    `TASK CONTEXT: ${(task.context.length > 0 ? task.context : ["none"]).map((item) => `- ${item}`).join("\n")}`,
  ];

  if (revisionFeedback.length > 0) {
    lines.push("", "REVISION FEEDBACK FROM CRITIC (MUST ADDRESS):", ...revisionFeedback.map((item) => `- ${item}`));
  }

  return lines.join("\n");
}

export function buildCriticPrompt(goal: string, task: TaskRuntime, workerOutputRaw: string): string {
  return [
    "MANDATORY RULES (MUST FOLLOW EXACTLY):",
    "1) You MUST evaluate worker output against objective, acceptance criteria, and constraints.",
    "2) You MUST return ONLY valid JSON with this schema:",
    '{"decision":"approve|revise","rationale":"string","issues":["string"],"revisionInstructions":["string"]}',
    "3) decision MUST be \"approve\" only when acceptance criteria are fully met.",
    "4) If worker output is malformed or incomplete, decision MUST be \"revise\".",
    "5) Do NOT include markdown, prose outside JSON, or code fences.",
    "",
    `GLOBAL GOAL: ${goal}`,
    `TASK ID: ${task.id}`,
    `TASK OBJECTIVE: ${task.objective}`,
    `ACCEPTANCE CRITERIA: ${task.acceptanceCriteria.map((item) => `- ${item}`).join("\n")}`,
    `CONSTRAINTS: ${(task.constraints.length > 0 ? task.constraints : ["none"]).map((item) => `- ${item}`).join("\n")}`,
    "",
    "WORKER OUTPUT TO REVIEW:",
    truncateForPrompt(workerOutputRaw),
  ].join("\n");
}

export function summarizeRun(task: TaskRuntime, run: AgentRunResult): void {
  task.usage = {
    input: task.usage.input + run.usage.input,
    output: task.usage.output + run.usage.output,
    cacheRead: task.usage.cacheRead + run.usage.cacheRead,
    cacheWrite: task.usage.cacheWrite + run.usage.cacheWrite,
    totalTokens: task.usage.totalTokens + run.usage.totalTokens,
    totalCost: task.usage.totalCost + run.usage.totalCost,
    turns: task.usage.turns + run.usage.turns,
  };
  task.toolCalls += run.toolCalls;
}
