import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { parseFrontmatter } from "@mariozechner/pi-coding-agent";

export type AgentScope = "user" | "project" | "both";

export interface AgentConfig {
  name: string;
  description: string;
  model?: string;
  tools?: string[];
  systemPrompt: string;
  source: "user" | "project";
  filePath: string;
}

export interface AgentDiscoveryResult {
  agents: AgentConfig[];
  projectAgentsDir: string | null;
}

function isDirectory(candidate: string): boolean {
  try {
    return fs.statSync(candidate).isDirectory();
  } catch {
    return false;
  }
}

function readAgentFile(filePath: string, source: "user" | "project"): AgentConfig | null {
  let content = "";
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }

  const { frontmatter, body } = parseFrontmatter<Record<string, string>>(content);
  const name = frontmatter.name?.trim();
  const description = frontmatter.description?.trim();
  if (!name || !description) return null;

  const tools = frontmatter.tools
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return {
    name,
    description,
    model: frontmatter.model?.trim() || undefined,
    tools: tools && tools.length > 0 ? tools : undefined,
    systemPrompt: body.trim(),
    source,
    filePath,
  };
}

function loadAgentsFromDir(dirPath: string, source: "user" | "project"): AgentConfig[] {
  if (!isDirectory(dirPath)) return [];

  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const agents: AgentConfig[] = [];
  for (const entry of entries) {
    if (!entry.name.endsWith(".md")) continue;
    if (!entry.isFile() && !entry.isSymbolicLink()) continue;

    const filePath = path.join(dirPath, entry.name);
    const config = readAgentFile(filePath, source);
    if (config) agents.push(config);
  }

  return agents;
}

function findNearestProjectAgentsDir(cwd: string): string | null {
  let currentDir = cwd;
  while (true) {
    const candidate = path.join(currentDir, ".pi", "agents");
    if (isDirectory(candidate)) return candidate;

    const parent = path.dirname(currentDir);
    if (parent === currentDir) return null;
    currentDir = parent;
  }
}

export function discoverAgents(cwd: string, scope: AgentScope): AgentDiscoveryResult {
  const userAgentsDir = path.join(os.homedir(), ".pi", "agent", "agents");
  const projectAgentsDir = findNearestProjectAgentsDir(cwd);

  const userAgents = scope === "project" ? [] : loadAgentsFromDir(userAgentsDir, "user");
  const projectAgents =
    scope === "user" || !projectAgentsDir ? [] : loadAgentsFromDir(projectAgentsDir, "project");

  const deduped = new Map<string, AgentConfig>();
  if (scope === "both") {
    for (const agent of userAgents) deduped.set(agent.name, agent);
    for (const agent of projectAgents) deduped.set(agent.name, agent);
  } else if (scope === "user") {
    for (const agent of userAgents) deduped.set(agent.name, agent);
  } else {
    for (const agent of projectAgents) deduped.set(agent.name, agent);
  }

  return {
    agents: Array.from(deduped.values()),
    projectAgentsDir,
  };
}

export function getAgentByName(agents: AgentConfig[], name: string): AgentConfig | undefined {
  return agents.find((agent) => agent.name === name);
}

export function listAgentNames(agents: AgentConfig[]): string {
  if (agents.length === 0) return "none";
  return agents.map((agent) => `${agent.name} (${agent.source})`).join(", ");
}
