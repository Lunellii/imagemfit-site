import http from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

const loadDotEnvFile = (filePath) => {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
};

loadDotEnvFile(resolve(rootDir, ".env.server"));

const HOST = process.env.AI_CLASSIFIER_HOST || "127.0.0.1";
const PORT = Number(process.env.AI_CLASSIFIER_PORT || 8787);
const MAX_REQUEST_BYTES = Number(process.env.AI_CLASSIFIER_MAX_REQUEST_BYTES || 12_000_000);
const RATE_LIMIT_PER_MIN = Number(process.env.AI_CLASSIFIER_RATE_LIMIT_PER_MIN || 120);
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || "").trim();
const OPENAI_MODEL = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").trim().replace(/\/+$/, "");
const ALLOWED_ORIGINS = new Set(
  String(process.env.AI_CLASSIFIER_ALLOWED_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const normalizeCategoryName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const parseFirstJsonObject = (value) => {
  const text = String(value || "").trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (_err) {
    // fallback below
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch (_err) {
      return null;
    }
  }

  return null;
};

const normalizeConfidence = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  if (num < 0) return 0;
  if (num > 1) return 1;
  return num;
};

const sendJson = (res, statusCode, data, origin = "") => {
  const responseBody = JSON.stringify(data);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.end(responseBody);
};

const readJsonBody = (req, maxBytes) =>
  new Promise((resolveBody, rejectBody) => {
    let buffer = "";
    let bytes = 0;

    req.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        rejectBody(new Error("PAYLOAD_TOO_LARGE"));
        req.destroy();
        return;
      }
      buffer += chunk;
    });

    req.on("end", () => {
      if (!buffer) {
        resolveBody({});
        return;
      }
      try {
        resolveBody(JSON.parse(buffer));
      } catch (_err) {
        rejectBody(new Error("INVALID_JSON"));
      }
    });

    req.on("error", () => rejectBody(new Error("REQUEST_ERROR")));
  });

const requestCounters = new Map();
const isRateLimited = (ip) => {
  const now = Date.now();
  const windowMs = 60_000;
  const key = ip || "unknown";
  const current = requestCounters.get(key);

  if (!current || now - current.windowStart > windowMs) {
    requestCounters.set(key, { windowStart: now, count: 1 });
    return false;
  }

  current.count += 1;
  requestCounters.set(key, current);
  return current.count > RATE_LIMIT_PER_MIN;
};

const classifyCategory = async ({ imageDataUrl, focusImageDataUrl, fileName, categories }) => {
  if (!OPENAI_API_KEY) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const safeCategories = Array.isArray(categories) ? categories : [];
  if (!safeCategories.length) {
    throw new Error("NO_CATEGORIES_AVAILABLE");
  }

  const categoriesPrompt = safeCategories
    .map((category) => `- id: ${category.id}\n  nome: ${category.name}\n  descricao: ${category.description || "sem descricao"}`)
    .join("\n");

  const prompt = [
    "Classifique o estilo artistico do quadro em exatamente UMA categoria da lista.",
    "Importante: avalie SOMENTE a arte do quadro/moldura. Ignore sofa, parede, piso, pessoas, objetos e ambiente.",
    "Se houver conflito entre ambiente e arte do quadro, priorize sempre a arte do quadro.",
    "Use apenas os ids informados abaixo.",
    "Retorne somente JSON no formato:",
    '{"category_id":"ID_EXATO","confidence":0.0,"reason":"texto curto"}',
    "",
    `Arquivo: ${fileName || "sem nome"}`,
    "",
    "Categorias:",
    categoriesPrompt
  ].join("\n");

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Voce classifica quadros por estilo. Foque apenas na arte do quadro. Responda somente JSON valido."
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageDataUrl, detail: "low" } },
            ...(focusImageDataUrl ? [{ type: "image_url", image_url: { url: focusImageDataUrl, detail: "low" } }] : [])
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    let errorPayload = null;
    try {
      errorPayload = await response.json();
    } catch (_err) {
      errorPayload = null;
    }

    const errorMessage = String(errorPayload?.error?.message || "");
    const errorCode = String(errorPayload?.error?.code || "");
    const errorType = String(errorPayload?.error?.type || "");
    const diagnostic = `${response.status} ${response.statusText} | code=${errorCode} type=${errorType} message=${errorMessage}`;

    if (response.status === 401 || response.status === 403) {
      console.error("[ai-classifier] auth failed:", diagnostic);
      throw new Error("OPENAI_AUTH_FAILED");
    }
    if (response.status === 429) {
      console.error("[ai-classifier] rate/quota:", diagnostic);
      throw new Error("OPENAI_QUOTA_OR_RATE_LIMIT");
    }
    if (response.status === 404) {
      console.error("[ai-classifier] model not found:", diagnostic);
      throw new Error("OPENAI_MODEL_NOT_FOUND");
    }
    if (response.status === 400) {
      console.error("[ai-classifier] bad request:", diagnostic);
      throw new Error("OPENAI_BAD_REQUEST");
    }

    console.error("[ai-classifier] openai error:", diagnostic);
    throw new Error("AI_CLASSIFICATION_FAILED");
  }

  const payload = await response.json();
  const text = payload?.choices?.[0]?.message?.content || "";
  const parsed = parseFirstJsonObject(text);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI_INVALID_RESPONSE");
  }

  const requestedCategoryId = String(parsed.category_id || "").trim();
  let matchedCategory = safeCategories.find((category) => category.id === requestedCategoryId);

  if (!matchedCategory && parsed.category_name) {
    const normalizedTargetName = normalizeCategoryName(parsed.category_name);
    matchedCategory = safeCategories.find((category) => normalizeCategoryName(category.name) === normalizedTargetName);
  }

  if (!matchedCategory) {
    throw new Error("AI_CATEGORY_NOT_FOUND");
  }

  return {
    category_id: matchedCategory.id,
    category_name: matchedCategory.name,
    confidence: normalizeConfidence(parsed.confidence),
    reason: String(parsed.reason || "").trim(),
    provider: "openai"
  };
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const origin = String(req.headers.origin || "");

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    sendJson(res, 403, { error: "ORIGIN_NOT_ALLOWED" }, origin);
    return;
  }

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    if (origin && ALLOWED_ORIGINS.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Vary", "Origin");
    }
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, configured: Boolean(OPENAI_API_KEY) }, origin);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/classify-category") {
    const ip = String(req.socket.remoteAddress || "");
    if (isRateLimited(ip)) {
      sendJson(res, 429, { error: "RATE_LIMITED" }, origin);
      return;
    }

    let body = {};
    try {
      body = await readJsonBody(req, MAX_REQUEST_BYTES);
    } catch (error) {
      if (error.message === "PAYLOAD_TOO_LARGE") {
        sendJson(res, 413, { error: "PAYLOAD_TOO_LARGE" }, origin);
      } else {
        sendJson(res, 400, { error: "INVALID_REQUEST" }, origin);
      }
      return;
    }

    const imageDataUrl = String(body.image_data_url || "");
    const fileName = String(body.file_name || "");
    const focusImageDataUrl = String(body.focus_image_data_url || "");
    const categories = Array.isArray(body.categories) ? body.categories : [];

    if (!imageDataUrl.startsWith("data:image/")) {
      sendJson(res, 400, { error: "INVALID_IMAGE_DATA" }, origin);
      return;
    }

    if (focusImageDataUrl && !focusImageDataUrl.startsWith("data:image/")) {
      sendJson(res, 400, { error: "INVALID_FOCUS_IMAGE_DATA" }, origin);
      return;
    }

    if (!categories.length) {
      sendJson(res, 400, { error: "NO_CATEGORIES_AVAILABLE" }, origin);
      return;
    }

    try {
      const result = await classifyCategory({
        imageDataUrl,
        focusImageDataUrl,
        fileName,
        categories
      });
      sendJson(res, 200, result, origin);
    } catch (error) {
      sendJson(res, 500, { error: error.message || "AI_CLASSIFICATION_FAILED" }, origin);
    }
    return;
  }

  sendJson(res, 404, { error: "NOT_FOUND" }, origin);
});

server.listen(PORT, HOST, () => {
  const keyStatus = OPENAI_API_KEY ? "configured" : "missing";
  console.log(`[ai-classifier] listening on http://${HOST}:${PORT} (OPENAI_API_KEY: ${keyStatus})`);
});
