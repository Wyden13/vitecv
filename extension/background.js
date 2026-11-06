importScripts("config.js");

// The background worker owns the token and every request to the web app. A
// content script's fetch runs under the host page's CORS and mixed-content
// rules (https page -> http://localhost), a service worker's does not, and
// keeping the token here means page scripts can never reach it.
const api = globalThis.browser ?? globalThis.chrome;
const { APP_BASE_URL } = globalThis.VCV_CONFIG;

const TOKEN_KEY = "jobTrackerToken";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readToken() {
  try {
    return (await api.storage.local.get(TOKEN_KEY))?.[TOKEN_KEY] ?? "";
  } catch {
    return "";
  }
}

async function writeToken(token) {
  if (token) await api.storage.local.set({ [TOKEN_KEY]: token });
  else await api.storage.local.remove(TOKEN_KEY);
}

// Authenticated call. A 401 means the token was revoked, so drop it and tell
// the panel to show the pairing screen again.
async function call(path, { method = "GET", body } = {}) {
  const token = await readToken();
  if (!token) return { ok: false, status: 401, code: "unauthorized" };

  let response;
  try {
    response = await fetch(`${APP_BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return {
      ok: false,
      status: 0,
      error: `Could not reach viteCV at ${APP_BASE_URL}.`,
    };
  }

  const data = await response.json().catch(() => null);

  if (response.status === 401) {
    await writeToken("");
    return { ok: false, status: 401, code: "unauthorized", error: data?.error };
  }

  return response.ok
    ? { ok: true, status: response.status, data }
    : {
        ok: false,
        status: response.status,
        code: data?.code,
        error: data?.error || `Request failed (${response.status}).`,
      };
}

async function pair(code) {
  let response;
  try {
    response = await fetch(`${APP_BASE_URL}/api/extension/pair`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  } catch {
    return { ok: false, error: `Could not reach viteCV at ${APP_BASE_URL}.` };
  }

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.token) {
    return { ok: false, error: data?.error || "Could not connect." };
  }

  await writeToken(data.token);
  return { ok: true };
}

// --- Extraction -----------------------------------------------------------

async function runExtractor(tabId, file) {
  const results = await api.scripting.executeScript({
    target: { tabId },
    files: [file],
  });
  return results?.[0]?.result;
}

// LinkedIn renders the job panel after load, so its extractor reports
// { retry: true } until the fields exist.
async function runWithRetries(tabId, file, attempts = 12) {
  let data;
  for (let i = 0; i < attempts; i++) {
    data = await runExtractor(tabId, file);
    if (!data?.retry) return data;
    await sleep(250);
  }
  return data;
}

async function extract(tab) {
  let hostname = "";
  try {
    hostname = new URL(tab.url).hostname;
  } catch {
    // Unknown host; the generic extractor is the safe default.
  }

  const isLinkedIn =
    hostname === "linkedin.com" || hostname.endsWith(".linkedin.com");

  let data = isLinkedIn
    ? await runWithRetries(tab.id, "linkedin-extractor.js")
    : await runExtractor(tab.id, "extractor.js");

  if (isLinkedIn && (data?.error || !data)) {
    const fallback = await runExtractor(tab.id, "extractor.js");
    if (fallback?.title) data = fallback;
  }

  if (data?.error) throw new Error(data.error);
  if (!data || typeof data !== "object") {
    throw new Error("Could not read this page.");
  }
  return data;
}

// --- Messages -------------------------------------------------------------

const handlers = {
  status: async () => ({ connected: Boolean(await readToken()) }),
  pair: (message) => pair(message.code),
  disconnect: async () => {
    await writeToken("");
    return { ok: true };
  },
  extract: async (_message, sender) => {
    try {
      return { ok: true, job: await extract(sender.tab) };
    } catch (error) {
      return { ok: false, error: error?.message || "Extraction failed." };
    }
  },
  lookup: (message) =>
    call(`/api/jobs/lookup?url=${encodeURIComponent(message.url)}`),
  save: (message) => call("/api/jobs", { method: "POST", body: message.job }),
  analyze: (message) =>
    call("/api/jobs/analyze", {
      method: "POST",
      body: { description: message.description, url: message.url },
    }),
};

api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = handlers[message?.type];
  if (!handler) return false;

  handler(message, sender)
    .then(sendResponse)
    .catch((error) =>
      sendResponse({ ok: false, error: error?.message || "Unexpected error." }),
    );
  return true; // keep the channel open for the async response
});

// The toolbar button opens the panel on any page, including ones the content
// script did not recognise as a job posting.
api.action.onClicked.addListener((tab) => {
  if (tab.id) api.tabs.sendMessage(tab.id, { type: "toggle" }).catch(() => {});
});
