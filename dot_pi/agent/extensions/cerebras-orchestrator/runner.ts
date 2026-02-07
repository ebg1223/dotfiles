import { spawn } from "node:child_process";
import type { Message } from "@mariozechner/pi-ai";
import type { AgentConfig } from "./agents.js";

export interface UsageSummary {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  totalCost: number;
  turns: number;
}

export interface AgentRunResult {
  agent: string;
  source: "user" | "project";
  exitCode: number;
  finalText: string;
  stopReason?: string;
  stderr: string;
  usage: UsageSummary;
  toolCalls: number;
  messages: Message[];
}

export interface AgentRunProgress {
  phase: "model" | "tool";
  text: string;
}

function emptyUsage(): UsageSummary {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    totalCost: 0,
    turns: 0,
  };
}

function extractAssistantText(messages: Message[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "assistant") continue;

    const textParts = message.content
      .filter((part) => part.type === "text")
      .map((part) => part.text.trim())
      .filter(Boolean);

    if (textParts.length > 0) return textParts.join("\n");
  }

  return "";
}

function mergeUsage(target: UsageSummary, message: Message): void {
  if (message.role !== "assistant") return;
  if (!message.usage) return;

  target.turns += 1;
  target.input += message.usage.input ?? 0;
  target.output += message.usage.output ?? 0;
  target.cacheRead += message.usage.cacheRead ?? 0;
  target.cacheWrite += message.usage.cacheWrite ?? 0;
  target.totalTokens += message.usage.totalTokens ?? 0;
  target.totalCost += message.usage.cost?.total ?? 0;
}

export async function runAgentTask(
  agent: AgentConfig,
  taskPrompt: string,
  cwd: string,
  signal: AbortSignal | undefined,
  onProgress?: (progress: AgentRunProgress) => void,
  systemPromptOverride?: string,
): Promise<AgentRunResult> {
  const args: string[] = ["--mode", "json", "-p", "--no-session"];
  if (agent.model) args.push("--model", agent.model);
  if (agent.tools && agent.tools.length > 0) args.push("--tools", agent.tools.join(","));

  if (systemPromptOverride?.trim()) {
    args.push("--system-prompt", systemPromptOverride);
  } else if (agent.systemPrompt) {
    args.push("--append-system-prompt", agent.systemPrompt);
  }

  args.push(taskPrompt);

  const messages: Message[] = [];
  const usage = emptyUsage();

  let stderr = "";
  let stopReason: string | undefined;
  let toolCalls = 0;

  const exitCode = await new Promise<number>((resolve) => {
    const processRef = spawn("pi", args, {
      cwd,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdoutBuffer = "";

    const processJsonLine = (line: string) => {
      if (!line.trim()) return;

      let payload: any;
      try {
        payload = JSON.parse(line);
      } catch {
        return;
      }

      if (payload.type === "message_end" && payload.message) {
        messages.push(payload.message as Message);
        mergeUsage(usage, payload.message as Message);
        if (payload.message?.role === "assistant") {
          stopReason = payload.message.stopReason ?? stopReason;
        }
      }

      if (payload.type === "tool_execution_start") {
        toolCalls += 1;
        const toolName = payload.toolName ?? "tool";
        onProgress?.({ phase: "tool", text: `running ${toolName}` });
      }

      if (
        payload.type === "message_update" &&
        payload.assistantMessageEvent?.type === "text_delta" &&
        typeof payload.assistantMessageEvent.delta === "string"
      ) {
        const delta = payload.assistantMessageEvent.delta.trim();
        if (delta) onProgress?.({ phase: "model", text: delta.slice(0, 120) });
      }
    };

    processRef.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split("\n");
      stdoutBuffer = lines.pop() ?? "";
      for (const line of lines) processJsonLine(line);
    });

    processRef.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    processRef.on("error", () => resolve(1));
    processRef.on("close", (code) => {
      if (stdoutBuffer.trim()) processJsonLine(stdoutBuffer);
      resolve(code ?? 0);
    });

    if (signal) {
      const abortHandler = () => {
        processRef.kill("SIGTERM");
        setTimeout(() => {
          if (!processRef.killed) processRef.kill("SIGKILL");
        }, 3000);
      };

      if (signal.aborted) abortHandler();
      else signal.addEventListener("abort", abortHandler, { once: true });
    }
  });

  return {
    agent: agent.name,
    source: agent.source,
    exitCode,
    finalText: extractAssistantText(messages),
    stopReason,
    stderr,
    usage,
    toolCalls,
    messages,
  };
}

export async function mapWithConcurrency<TIn, TOut>(
  items: TIn[],
  maxConcurrency: number,
  mapper: (item: TIn, index: number) => Promise<TOut>,
): Promise<TOut[]> {
  if (items.length === 0) return [];

  const workerCount = Math.max(1, Math.min(items.length, maxConcurrency));
  const results = new Array<TOut>(items.length);
  let cursor = 0;

  const workers = Array.from({ length: workerCount }, async () => {
    while (cursor < items.length) {
      const current = cursor;
      cursor += 1;
      results[current] = await mapper(items[current], current);
    }
  });

  await Promise.all(workers);
  return results;
}
