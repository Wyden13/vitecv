"use server";

import { getCurrentUser } from "@/libs/dal";
import { marketGuidanceMessages } from "@/libs/dashboard/prompts";
import {
  normalizeMarketGuidance,
  type MarketGuidance,
} from "@/libs/dashboard/intentSchema";
import { callGlmJson } from "@/libs/insights/glm";

const MAX_LOCATION_CHARS = 120;

async function requireSession(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in to use the assistant.");
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
