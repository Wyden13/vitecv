import "server-only";

import type { ChatMessage } from "./prompts";

const DEFAULT_BASE_URL = "https://api.z.ai/api";
const DEFAULT_MODEL = "glm-5.3-flash";
const DEFAULT_REASONING_EFFORT = "low";
const TIMEOUT_MS = 90_000;

/**
 * Fixed, not per-request — a rotating seed would defeat the point. Paired with
 * `do_sample: false` below, which is the switch that actually matters.
 */
const DETERMINISM_SEED = 7;

export interface GlmResult {
  data: unknown;
  model: string;
}

function readConfig() {
  const apiKey = process.env.GLM_API_KEY;  if (!apiKey) {
    throw new Error(
      "GLM Model Missing GLM_API_KEY",
    );
  }
  return {
    apiKey,
    model: process.env.GLM_MODEL || DEFAULT_MODEL,
    baseUrl: (process.env.GLM_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ""),
    reasoningEffort:
      process.env.GLM_REASONING_EFFORT || DEFAULT_REASONING_EFFORT,
  };
}

function reasoningVariants(effort: string): Record<string, unknown>[] {
  const thinking = {
    thinking: { type: "enabled" },
    reasoning_effort: effort === "disabled" ? DEFAULT_REASONING_EFFORT : effort,
  };
  const disabled = { thinking: { type: "disabled" } };
  return effort === "disabled" ? [disabled, thinking] : [thinking, disabled];
}

function isReasoningRejection(status: number, body: string): boolean {
  if (status !== 400) return false;
  const text = body.toLowerCase();
  return text.includes("thinking") || text.includes("reasoning");
}

function describeFailure(status: number, body: string): string {
  if (status === 401 || status === 403) {
    return "GLM rejected the API key. Check GLM_API_KEY in .env.";
  }
  if (status === 429) {
    return "GLM is rate limiting this key. Wait a moment and try again.";
  }
  if (status >= 500) {
    return "GLM is unavailable right now. Try again in a minute.";
  }

  return `GLM request failed (${status}): ${body.slice(0, 200)}`;
}

interface Attempt {
  ok: boolean;
  status: number;
  body: string;
}

async function post(
  url: string,
  apiKey: string,
  payload: Record<string, unknown>,
): Promise<Attempt> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await response.text(),
    };
  } catch (caught) {
    if (caught instanceof Error && caught.name === "AbortError") {
      throw new Error(
        `GLM took longer than ${TIMEOUT_MS / 1000}s. Try again.`,
      );
    }
    throw new Error(
      caught instanceof Error ? caught.message : "Could not reach GLM.",
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function callGlmJson(messages: ChatMessage[]): Promise<GlmResult> {
  const { apiKey, model, baseUrl, reasoningEffort } = readConfig();
  const url = `${baseUrl}/paas/v4/chat/completions`;

  const base = {
    model,
    messages,
    response_format: { type: "json_object" },
    do_sample: false,
    seed: DETERMINISM_SEED,
    temperature: 0.2,
  };

  const variants = reasoningVariants(reasoningEffort);
  let attempt = await post(url, apiKey, { ...base, ...variants[0] });

  if (isReasoningRejection(attempt.status, attempt.body)) {
    console.warn(
      `[glm] ${model} refused GLM_REASONING_EFFORT="${reasoningEffort}" — ` +
      "retrying with thinking the other way round. Results from the fallback " +
      "are not comparable with the primary variant. Set a value this model " +
      "accepts to silence this.",
    );
    attempt = await post(url, apiKey, { ...base, ...variants[1] });
  }

  if (!attempt.ok) {
    throw new Error(describeFailure(attempt.status, attempt.body));
  }

  const body = JSON.parse(attempt.body) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = body.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("GLM returned an empty response.");
  }

  try {
    return { data: JSON.parse(content), model };
  } catch {
    throw new Error("GLM returned content that was not valid JSON.");
  }
}
