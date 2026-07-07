// Dynamically registers the cliproxyapi OpenAI-compatible provider for Pi.
// Auto-discovered from ~/.pi/agent/extensions/ and refreshed each Pi startup.
// @ts-nocheck

import { pathToFileURL } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const PROVIDER_ID = "cliproxyapi";
const BASE_URL = process.env.PI_CLIPROXYAPI_BASE_URL ?? "http://cliproxyapi:8317/v1";
const API_KEY = process.env.PI_CLIPROXYAPI_API_KEY ?? "cliproxy";
const DEFAULT_CONTEXT_WINDOW = 128_000;
const DEFAULT_MAX_TOKENS = 16_384;

const EXCLUDED_MODEL_ID_PARTS = ["image", "imagine", "video"];
const STANDARD_PARENTHESES_REASONING_LEVEL_MAP = {
  minimal: null,
  low: "low",
  medium: "medium",
  high: "high",
  xhigh: "xhigh",
};
const PARENTHETICAL_REASONING_LEVEL_MAPS = {
  "claude-fable-5": STANDARD_PARENTHESES_REASONING_LEVEL_MAP,
  "claude-opus-4-8": STANDARD_PARENTHESES_REASONING_LEVEL_MAP,
  "claude-sonnet-5": STANDARD_PARENTHESES_REASONING_LEVEL_MAP,
  "gpt-5.5": STANDARD_PARENTHESES_REASONING_LEVEL_MAP,
  "glm-5.2": {
    minimal: null,
    low: null,
    medium: null,
    high: "high",
    xhigh: "max",
  },
};

type StreamSimple = (...args: any[]) => any;

type OpenAIModelList = {
  data?: Array<{
    id?: string;
    name?: string;
    context_window?: number;
    contextWindow?: number;
    max_tokens?: number;
    maxTokens?: number;
  }>;
};

function titleFromId(id: string): string {
  return id
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isTextModel(id: string): boolean {
  const lower = id.toLowerCase();
  return !EXCLUDED_MODEL_ID_PARTS.some((part) => lower.includes(part));
}

function parentheticalReasoningLevelMap(id: string): Record<string, string | null> | undefined {
  return PARENTHETICAL_REASONING_LEVEL_MAPS[id];
}

function supportsParentheticalReasoning(id: string): boolean {
  return Boolean(parentheticalReasoningLevelMap(id));
}

function upstreamModelId(id: string, reasoning?: string): string {
  const levelMap = parentheticalReasoningLevelMap(id);
  if (!levelMap) return id;
  if (!reasoning || reasoning === "off") return id;
  const mappedReasoning = levelMap[reasoning] ?? reasoning;
  if (!mappedReasoning) return id;
  return `${id}(${mappedReasoning})`;
}

async function loadOpenAIResponsesStreamSimple(): Promise<StreamSimple | undefined> {
  const candidates = [
    "/home/fedora/.local/share/mise/installs/npm-earendil-works-pi-coding-agent/0.80.3/lib/node_modules/@earendil-works/pi-coding-agent/node_modules/@earendil-works/pi-ai/dist/api/openai-responses.js",
    "/home/fedora/.pi/agent/npm/node_modules/@earendil-works/pi-ai/dist/providers/openai-responses.js",
  ];
  for (const candidate of candidates) {
    try {
      const module = await import(pathToFileURL(candidate).href);
      const streamSimple = module.streamSimple ?? module.streamSimpleOpenAIResponses;
      if (typeof streamSimple === "function") return streamSimple;
    } catch {
      // Try the next known Pi install layout.
    }
  }
  console.warn("[cliproxyapi-provider] Could not load Pi's OpenAI Responses stream implementation.");
  return undefined;
}

export default async function (pi: ExtensionAPI) {
  const streamSimpleOpenAIResponses = await loadOpenAIResponsesStreamSimple();
  if (!streamSimpleOpenAIResponses) return;

  const modelsUrl = `${BASE_URL.replace(/\/$/, "")}/models`;
  let payload: OpenAIModelList;

  try {
    const response = await fetch(modelsUrl, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    payload = await response.json() as OpenAIModelList;
  } catch (error) {
    console.warn(`[cliproxyapi-provider] Could not fetch ${modelsUrl}: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  const ids = (payload.data ?? [])
    .map((model) => model.id?.trim())
    .filter((id): id is string => Boolean(id) && isTextModel(id))
    .sort((a, b) => a.localeCompare(b));

  const models = ids.map((id) => {
    const source = payload.data?.find((model) => model.id === id) ?? {};
    const hasParentheticalReasoning = supportsParentheticalReasoning(id);
    return {
      id,
      name: source.name ?? titleFromId(id),
      api: "openai-responses",
      reasoning: hasParentheticalReasoning,
      thinkingLevelMap: hasParentheticalReasoning ? parentheticalReasoningLevelMap(id) : undefined,
      input: ["text"],
      contextWindow: source.context_window ?? source.contextWindow ?? DEFAULT_CONTEXT_WINDOW,
      maxTokens: source.max_tokens ?? source.maxTokens ?? DEFAULT_MAX_TOKENS,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    };
  });

  pi.registerProvider(PROVIDER_ID, {
    name: "CLI Proxy API",
    baseUrl: BASE_URL,
    apiKey: API_KEY,
    api: "openai-responses",
    compat: {
      supportsDeveloperRole: false,
      supportsReasoningEffort: false,
    },
    models,
    streamSimple(model, context, options) {
      const upstreamId = upstreamModelId(model.id, options?.reasoning);
      return streamSimpleOpenAIResponses(
        {
          ...model,
          id: upstreamId,
          name: upstreamId === model.id ? model.name : `${model.name} ${options?.reasoning}`,
          reasoning: false,
          thinkingLevelMap: undefined,
        },
        context,
        {
          ...options,
          reasoning: undefined,
        },
      );
    },
  });
}
