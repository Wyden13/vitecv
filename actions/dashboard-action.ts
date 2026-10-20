"use server";

import { getCurrentUser } from "@/libs/dal";
import {
  marketGuidanceMessages,
  promptRouteMessages,
} from "@/libs/dashboard/prompts";
import {
  normalizeMarketGuidance,
  normalizePromptRoute,
  type MarketGuidance,
  type PromptRoute,
} from "@/libs/dashboard/intentSchema";
import { callGlmJson } from "@/libs/insights/glm";

/** A pasted posting is the largest realistic input, so share its cap. */
const MAX_PROMPT_CHARS = 12_000;
const MAX_LOCATION_CHARS = 120;

async function requireSession(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in to use the assistant.");
}

export async function routePrompt(text: string): Promise<PromptRoute> {
  await requireSession();

  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Type what you would like to do first.");
  }

  const { data } = await callGlmJson(
    promptRouteMessages(text.slice(0, MAX_PROMPT_CHARS)),
  );

  return normalizePromptRoute(data);
}

export async function marketGuidance(
  location: string,
): Promise<MarketGuidance> {
  await requireSession();

  const place = typeof location === "string" ? location.trim() : "";
  if (!place) throw new Error("Enter a city or region first.");

  const capped = place.slice(0, MAX_LOCATION_CHARS);
  const { data } = await callGlmJson(marketGuidanceMessages(capped));

  return normalizeMarketGuidance(data, capped);
}
