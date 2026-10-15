import "server-only";

import type { ChatMessage } from "./prompts";

/**
 * Minimal GLM client — one function, plain fetch, no SDK.
 *
 * The API is OpenAI-shaped (`POST /paas/v4/chat/completions`, bearer auth), so
 * a dependency would buy nothing. Living behind `server-only` is the point:
 * `GLM_API_KEY` must never reach a client bundle, and the only callers are
 * server actions (Insights, and resume import in `resume-parse-action.ts`).
 *
 * `response_format: json_object` is as strict as this API gets — it has no
 * schema type — so the caller validates the parsed object rather than trusting
 * it. See `insightSchema.ts` and `libs/resume/parse/structureSchema.ts`.
 */

const DEFAULT_BASE_URL = "https://api.z.ai/api";
const DEFAULT_MODEL = "glm-5.3-flash";
/** Cheapest level the 5.3 series accepts; the API's own default is `max`. */
const DEFAULT_REASONING_EFFORT = "low";
/** A low-effort call measured ~16s; this leaves room for a slow day. */
const TIMEOUT_MS = 90_000;

export interface GlmResult {
  data: unknown;
  model: string;
}

function readConfig() {
  const apiKey = process.env.GLM_API_KEY;

  if (!apiKey) {
    throw new Error(
      "[glm] Missing GLM_API_KEY. Add it to .env — see .env.example. " +
      "Get a key from https://z.ai (or set GLM_BASE_URL for another provider).",
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

/**
 * The reasoning bodies to try, preferred first.
 *
 * No single body suits every model: the 5.3 series always thinks and rejects
 * `thinking.disabled` outright (error 1210), while glm-4.6 predates
 * `reasoning_effort`. Matching on model-id prefixes would bake that table into
 * code and break the day glm-5.4 ships, so instead the configured mode is
 * tried and the *opposite* one is the fallback.
 *
 * Both candidates are deliberately cheap. Omitting the fields instead would
 * hand the model its own default — `max` on the 5.3 series, which measured
 * past 60s on a one-page resume — so the "fix" would have been a timeout.
 */
function reasoningVariants(effort: string): Record<string, unknown>[] {
  const thinking = {
    thinking: { type: "enabled" },
    reasoning_effort: effort === "disabled" ? DEFAULT_REASONING_EFFORT : effort,
  };
  const disabled = { thinking: { type: "disabled" } };

  return effort === "disabled" ? [disabled, thinking] : [thinking, disabled];
}

/** Narrow test for the "wrong reasoning setting for this model" class of 400. */
function isReasoningRejection(status: number, body: string): boolean {
  if (status !== 400) return false;

  const text = body.toLowerCase();
  return text.includes("thinking") || text.includes("reasoning");
}

/** Readable causes, because these surface to the user through a toast. */
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
  // Without this a hung upstream holds the action open until the platform
  // timeout, with no usable error for the user.
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
    temperature: 0.2,
  };

  const variants = reasoningVariants(reasoningEffort);
  let attempt = await post(url, apiKey, { ...base, ...variants[0] });

  // A model that refuses the configured reasoning mode gets one try with the
  // other mode, so an unfamiliar model id degrades instead of killing the page.
  // A 400 means nothing was charged, so this cannot double-bill, and the guard
  // is narrow enough that a bad key or a rate limit still fails outright.
  if (isReasoningRejection(attempt.status, attempt.body)) {
    console.warn(
      `[glm] ${model} refused GLM_REASONING_EFFORT="${reasoningEffort}" — ` +
      "retrying with thinking the other way round. Set a value it accepts to " +
      "silence this.",
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
    // JSON mode makes this unlikely rather than impossible.
    throw new Error("GLM returned content that was not valid JSON.");
  }
}
