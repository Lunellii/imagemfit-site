import http from "node:http";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.resolve(rootDir, "dist");
const storageRoot = path.resolve(process.env.IFQ_STORAGE_DIR || path.resolve(rootDir, "storage"));
const uploadsDir = path.resolve(storageRoot, "uploads");
const dataDir = path.resolve(storageRoot, "data");
const categoriesFile = path.resolve(dataDir, "categories.json");
const imagesFile = path.resolve(dataDir, "images.json");
const seedCatalogFile = path.resolve(rootDir, "src", "data", "seedCatalog.json");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 3000);
const MAX_JSON_BYTES = Number(process.env.IFQ_MAX_JSON_BYTES || 12_000_000);
const MAX_UPLOAD_BYTES = Number(process.env.IFQ_MAX_UPLOAD_BYTES || 10_000_000);

const ENABLE_ADMIN = String(process.env.ENABLE_ADMIN || process.env.VITE_ENABLE_ADMIN || "")
  .trim()
  .toLowerCase() === "true";
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || "")
  .trim()
  .toLowerCase();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || "").trim();
const ADMIN_SESSION_SECRET = String(process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SECRET || "").trim() || crypto.randomBytes(32).toString("hex");
const ADMIN_SESSION_TTL_MS = Number(process.env.ADMIN_SESSION_TTL_MS || 1000 * 60 * 60 * 6);
const ADMIN_COOKIE_NAME = "ifq_admin_token";

const loginRateByIp = new Map();
let writeQueue = Promise.resolve();
let db = { categories: [], images: [] };
let dbReady = false;

const nowIso = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
const normalizeCode = (value) => String(value || "").trim().replace(/^#+/, "").toUpperCase();
const normalizeCategoryName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const MIME = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

const readJson = async (filePath, fallback) => {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (_err) {
    return fallback;
  }
};

const writeJsonAtomic = async (filePath, value) => {
  const temp = `${filePath}.${Date.now()}.tmp`;
  await fs.writeFile(temp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(temp, filePath);
};

const queueWrite = () => {
  const snapshot = { categories: db.categories, images: db.images };
  writeQueue = writeQueue.then(async () => {
    await writeJsonAtomic(categoriesFile, snapshot.categories);
    await writeJsonAtomic(imagesFile, snapshot.images);
  });
  return writeQueue;
};

const sortBy = (arr, sortExpr = "created_date") => {
  const isDesc = String(sortExpr || "").startsWith("-");
  const field = isDesc ? String(sortExpr).slice(1) : String(sortExpr || "created_date");
  const sorted = [...arr].sort((a, b) => {
    const av = a?.[field];
    const bv = b?.[field];
    if (av === bv) return 0;
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    if (typeof av === "number" && typeof bv === "number") return av - bv;
    return String(av).localeCompare(String(bv), "pt-BR");
  });
  return isDesc ? sorted.reverse() : sorted;
};

const parseCookies = (cookieHeader) => {
  const parsed = {};
  for (const part of String(cookieHeader || "").split(";")) {
    const [key, ...rest] = part.split("=");
    const name = String(key || "").trim();
    if (!name) continue;
    parsed[name] = decodeURIComponent(rest.join("=").trim());
  }
  return parsed;
};

const encodeBase64Url = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const decodeBase64Url = (value) => {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(String(value || "").length / 4) * 4, "=");
  return Buffer.from(normalized, "base64");
};

const sign = (payloadBase64) =>
  encodeBase64Url(
    crypto
      .createHmac("sha256", ADMIN_SESSION_SECRET)
      .update(payloadBase64)
      .digest()
  );

const createToken = (email) => {
  const payload = { role: "admin", email, exp: Date.now() + ADMIN_SESSION_TTL_MS };
  const payloadBase64 = encodeBase64Url(JSON.stringify(payload));
  return `${payloadBase64}.${sign(payloadBase64)}`;
};

const verifyToken = (token) => {
  const [payloadBase64 = "", sig = ""] = String(token || "").split(".");
  if (!payloadBase64 || !sig) return null;
  const expected = sign(payloadBase64);
  const sigBuffer = Buffer.from(sig);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(payloadBase64).toString("utf8"));
    if (payload.role !== "admin") return null;
    if (!Number.isFinite(payload.exp) || payload.exp <= Date.now()) return null;
    return payload;
  } catch (_err) {
    return null;
  }
};

const readBody = (req, maxBytes = MAX_JSON_BYTES) =>
  new Promise((resolve, reject) => {
    let bytes = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        reject(new Error("PAYLOAD_TOO_LARGE"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (_err) {
        reject(new Error("INVALID_JSON"));
      }
    });
    req.on("error", () => reject(new Error("REQUEST_ERROR")));
  });

const sendJson = (res, status, data) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
};

const secureReq = (req) => {
  const xfp = String(req.headers["x-forwarded-proto"] || "").toLowerCase();
  return req.socket.encrypted || xfp.includes("https");
};

const cookieStr = (name, value, options = {}) => {
  const out = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) out.push(`Max-Age=${Math.max(0, Number(options.maxAge) || 0)}`);
  if (options.path) out.push(`Path=${options.path}`);
  if (options.httpOnly) out.push("HttpOnly");
  if (options.sameSite) out.push(`SameSite=${options.sameSite}`);
  if (options.secure) out.push("Secure");
  return out.join("; ");
};

const getAdminSession = (req) => {
  const cookies = parseCookies(req.headers.cookie);
  return verifyToken(cookies[ADMIN_COOKIE_NAME]);
};

const parseImageDataUrl = (value) => {
  const match = String(value || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length) return null;
  if (buffer.length > MAX_UPLOAD_BYTES) throw new Error("UPLOAD_TOO_LARGE");
  return { mime, buffer };
};

const extFromMime = (mime) => ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif", "image/svg+xml": "svg" }[mime] || "bin");

const safeResolve = (base, relativePath) => {
  const resolved = path.resolve(base, `.${relativePath}`);
  return resolved.startsWith(base) ? resolved : null;
};

const serveFile = async (res, filePath) => {
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", ext === ".html" ? "no-cache" : "public, max-age=86400");
    res.end(data);
    return true;
  } catch (_err) {
    return false;
  }
};

const bootstrap = async () => {
  if (dbReady) return;
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.mkdir(dataDir, { recursive: true });

  const categories = await readJson(categoriesFile, []);
  const images = await readJson(imagesFile, []);
  db.categories = Array.isArray(categories) ? categories : [];
  db.images = Array.isArray(images) ? images : [];

  if (!db.categories.length) {
    const seedCatalog = await readJson(seedCatalogFile, { images: [] });
    const seen = new Set();
    const names = (seedCatalog.images || [])
      .map((entry) => String(entry?.category || "").trim())
      .filter(Boolean)
      .filter((name) => {
        const key = normalizeCategoryName(name);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    db.categories = names.map((name, index) => ({
      id: uid(),
      name,
      description: `Coleção ${name} com curadoria para compor ambientes com estilo.`,
      cover_enabled: true,
      order: index,
      created_date: nowIso()
    }));
  }

  if (!db.images.length) {
    const seedCatalog = await readJson(seedCatalogFile, { images: [] });
    const byCategory = new Map(db.categories.map((category) => [normalizeCategoryName(category.name), category.id]));
    db.images = (seedCatalog.images || [])
      .map((entry, index) => {
        const categoryId = byCategory.get(normalizeCategoryName(entry.category));
        const code = normalizeCode(entry.code || entry.title);
        if (!categoryId || !code || !entry.image) return null;
        return {
          id: uid(),
          title: String(entry.title || code),
          code,
          image_url: String(entry.image),
          category_id: categoryId,
          is_new: index < 20,
          created_date: new Date(Date.now() - index * 60000).toISOString()
        };
      })
      .filter(Boolean);
  }

  await queueWrite();
  dbReady = true;
};

const server = http.createServer(async (req, res) => {
  try {
    await bootstrap();
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;

    if (req.method === "GET" && pathname === "/api/storage/health") return sendJson(res, 200, { ok: true, mode: "server", admin_enabled: ENABLE_ADMIN });

    if (req.method === "POST" && pathname === "/api/admin/login") {
      if (!ENABLE_ADMIN) return sendJson(res, 403, { error: "ADMIN_DISABLED_PUBLIC" });
      if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return sendJson(res, 500, { error: "ADMIN_CREDENTIALS_NOT_CONFIGURED" });
      const body = await readBody(req).catch((err) => ({ __error: err.message }));
      if (body.__error) return sendJson(res, body.__error === "PAYLOAD_TOO_LARGE" ? 413 : 400, { error: body.__error });
      const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown");
      const now = Date.now();
      const limit = loginRateByIp.get(ip);
      if (limit && limit.lockUntil > now) return sendJson(res, 429, { error: "LOGIN_RATE_LIMITED", retry_after_seconds: Math.ceil((limit.lockUntil - now) / 1000) });
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "").trim();
      if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        const failed = limit && now - limit.first <= 15 * 60 * 1000 ? limit.count + 1 : 1;
        const first = limit && now - limit.first <= 15 * 60 * 1000 ? limit.first : now;
        const lockUntil = failed >= 5 ? now + 15 * 60 * 1000 : 0;
        loginRateByIp.set(ip, { count: failed, first, lockUntil });
        return sendJson(res, lockUntil ? 429 : 401, lockUntil ? { error: "LOGIN_RATE_LIMITED", retry_after_seconds: 900 } : { error: "INVALID_ADMIN_CREDENTIALS" });
      }
      loginRateByIp.delete(ip);
      const token = createToken(ADMIN_EMAIL);
      res.setHeader("Set-Cookie", cookieStr(ADMIN_COOKIE_NAME, token, { path: "/", httpOnly: true, sameSite: "Lax", secure: secureReq(req), maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000) }));
      return sendJson(res, 200, { id: "server-admin", role: "admin", name: "Admin", email: ADMIN_EMAIL });
    }

    if (req.method === "GET" && pathname === "/api/admin/me") {
      const session = getAdminSession(req);
      if (!ENABLE_ADMIN || !session) return sendJson(res, 401, { error: "UNAUTHORIZED" });
      return sendJson(res, 200, { id: "server-admin", role: "admin", name: "Admin", email: session.email || ADMIN_EMAIL });
    }

    if (req.method === "POST" && pathname === "/api/admin/logout") {
      res.setHeader("Set-Cookie", cookieStr(ADMIN_COOKIE_NAME, "", { path: "/", httpOnly: true, sameSite: "Lax", secure: secureReq(req), maxAge: 0 }));
      return sendJson(res, 200, { success: true });
    }

    if (
      pathname.startsWith("/api/") &&
      !["/api/categories", "/api/images", "/api/images/grouped", "/api/uploads/base64", "/api/classify-category"].some((prefix) =>
        pathname.startsWith(prefix)
      )
    ) {
      return sendJson(res, 404, { error: "NOT_FOUND" });
    }

    const session = getAdminSession(req);
    const adminRequired =
      req.method !== "GET" &&
      (pathname.startsWith("/api/categories") ||
        pathname.startsWith("/api/images") ||
        pathname === "/api/uploads/base64" ||
        pathname === "/api/classify-category");
    if (adminRequired) {
      if (!ENABLE_ADMIN) return sendJson(res, 403, { error: "ADMIN_DISABLED_PUBLIC" });
      if (!session) return sendJson(res, 401, { error: "UNAUTHORIZED" });
    }

    if (req.method === "GET" && pathname === "/api/categories") {
      const sort = url.searchParams.get("sort") || "order";
      const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") || 100)));
      return sendJson(res, 200, sortBy(db.categories, sort).slice(0, limit));
    }

    if (req.method === "POST" && pathname === "/api/categories") {
      const body = await readBody(req).catch((err) => ({ __error: err.message }));
      if (body.__error) return sendJson(res, body.__error === "PAYLOAD_TOO_LARGE" ? 413 : 400, { error: body.__error });
      const name = String(body.name || "").trim();
      if (!name) return sendJson(res, 400, { error: "CATEGORY_NAME_REQUIRED" });
      const item = { id: uid(), name, description: String(body.description || "").trim(), cover_enabled: typeof body.cover_enabled === "boolean" ? body.cover_enabled : true, order: Number.isFinite(Number(body.order)) ? Number(body.order) : db.categories.length, created_date: nowIso() };
      db.categories.push(item);
      await queueWrite();
      return sendJson(res, 201, item);
    }

    if (req.method === "PATCH" && pathname.startsWith("/api/categories/")) {
      const categoryId = pathname.replace("/api/categories/", "");
      const index = db.categories.findIndex((item) => item.id === categoryId);
      if (index < 0) return sendJson(res, 404, { error: "CATEGORY_NOT_FOUND" });
      const body = await readBody(req).catch((err) => ({ __error: err.message }));
      if (body.__error) return sendJson(res, body.__error === "PAYLOAD_TOO_LARGE" ? 413 : 400, { error: body.__error });
      const current = db.categories[index];
      db.categories[index] = { ...current, name: body.name ?? current.name, description: body.description ?? current.description, cover_enabled: typeof body.cover_enabled === "boolean" ? body.cover_enabled : current.cover_enabled, order: Number.isFinite(Number(body.order)) ? Number(body.order) : current.order };
      await queueWrite();
      return sendJson(res, 200, db.categories[index]);
    }

    if (req.method === "DELETE" && pathname.startsWith("/api/categories/")) {
      const categoryId = pathname.replace("/api/categories/", "");
      const before = db.categories.length;
      db.categories = db.categories.filter((item) => item.id !== categoryId);
      const removedImages = db.images.filter((img) => img.category_id === categoryId);
      db.images = db.images.filter((img) => img.category_id !== categoryId);
      for (const image of removedImages) {
        if (String(image.image_url || "").startsWith("/uploads/")) {
          const target = safeResolve(uploadsDir, image.image_url.replace(/^\/uploads/, ""));
          if (target) await fs.unlink(target).catch(() => null);
        }
      }
      if (db.categories.length === before) return sendJson(res, 404, { error: "CATEGORY_NOT_FOUND" });
      await queueWrite();
      return sendJson(res, 200, { success: true });
    }

    if (req.method === "GET" && pathname === "/api/images") {
      const sort = url.searchParams.get("sort") || "-created_date";
      const pageRaw = url.searchParams.get("page");
      const pageSizeRaw = url.searchParams.get("page_size");
      const limitRaw = url.searchParams.get("limit");
      const filters = {};
      for (const [key, value] of url.searchParams.entries()) {
        if (["sort", "page", "page_size", "limit"].includes(key)) continue;
        filters[key] = key === "is_new" ? ["1", "true", "yes", "sim"].includes(String(value).toLowerCase()) : value;
      }
      const filtered = db.images.filter((image) =>
        Object.entries(filters).every(([key, value]) => (key === "is_new" ? Boolean(image.is_new) === Boolean(value) : String(image[key] || "") === String(value || "")))
      );
      const sorted = sortBy(filtered, sort);
      if (pageRaw || pageSizeRaw) {
        const page = Math.max(1, Number(pageRaw || 1));
        const pageSize = Math.min(200, Math.max(1, Number(pageSizeRaw || 35)));
        const start = (page - 1) * pageSize;
        return sendJson(res, 200, { items: sorted.slice(start, start + pageSize), total: sorted.length, page, page_size: pageSize });
      }
      const limit = Math.min(5000, Math.max(1, Number(limitRaw || 100)));
      return sendJson(res, 200, sorted.slice(0, limit));
    }

    if (req.method === "POST" && pathname === "/api/images/grouped") {
      const body = await readBody(req).catch((err) => ({ __error: err.message }));
      if (body.__error) return sendJson(res, body.__error === "PAYLOAD_TOO_LARGE" ? 413 : 400, { error: body.__error });
      const sort = body.sort || "-created_date";
      const limitPerCategory = Math.min(40, Math.max(1, Number(body.limit_per_category || 8)));
      const idSet = Array.isArray(body.category_ids) && body.category_ids.length ? new Set(body.category_ids) : null;
      const grouped = {};
      for (const image of sortBy(db.images, sort)) {
        if (idSet && !idSet.has(image.category_id)) continue;
        if (!grouped[image.category_id]) grouped[image.category_id] = [];
        if (grouped[image.category_id].length < limitPerCategory) grouped[image.category_id].push(image);
      }
      return sendJson(res, 200, grouped);
    }

    if (req.method === "POST" && pathname === "/api/images") {
      const body = await readBody(req).catch((err) => ({ __error: err.message }));
      if (body.__error) return sendJson(res, body.__error === "PAYLOAD_TOO_LARGE" ? 413 : 400, { error: body.__error });
      const code = normalizeCode(body.code || body.title);
      if (!code) return sendJson(res, 400, { error: "INVALID_IMAGE_CODE" });
      if (db.images.some((item) => normalizeCode(item.code) === code)) return sendJson(res, 409, { error: "DUPLICATE_IMAGE_CODE", duplicate_code: code });
      const categoryId = String(body.category_id || "");
      if (!db.categories.some((category) => category.id === categoryId)) return sendJson(res, 400, { error: "CATEGORY_NOT_FOUND" });
      const imageUrl = String(body.image_url || "").trim();
      if (!imageUrl) return sendJson(res, 400, { error: "IMAGE_URL_REQUIRED" });
      const item = { id: uid(), title: String(body.title || code), code, image_url: imageUrl, category_id: categoryId, is_new: body.is_new !== undefined ? Boolean(body.is_new) : true, created_date: nowIso() };
      db.images.push(item);
      await queueWrite();
      return sendJson(res, 201, item);
    }

    if (req.method === "DELETE" && pathname.startsWith("/api/images/")) {
      const imageId = pathname.replace("/api/images/", "");
      const index = db.images.findIndex((item) => item.id === imageId);
      if (index < 0) return sendJson(res, 404, { error: "IMAGE_NOT_FOUND" });
      const [removed] = db.images.splice(index, 1);
      if (String(removed.image_url || "").startsWith("/uploads/")) {
        const target = safeResolve(uploadsDir, removed.image_url.replace(/^\/uploads/, ""));
        if (target) await fs.unlink(target).catch(() => null);
      }
      await queueWrite();
      return sendJson(res, 200, { success: true });
    }

    if (req.method === "POST" && pathname === "/api/uploads/base64") {
      const body = await readBody(req).catch((err) => ({ __error: err.message }));
      if (body.__error) return sendJson(res, body.__error === "PAYLOAD_TOO_LARGE" ? 413 : 400, { error: body.__error });
      const parsed = parseImageDataUrl(body.data_url);
      if (!parsed) return sendJson(res, 400, { error: "INVALID_IMAGE_DATA" });
      const ext = extFromMime(parsed.mime);
      const folder = `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;
      const folderPath = path.resolve(uploadsDir, folder);
      await fs.mkdir(folderPath, { recursive: true });
      const base = path
        .basename(String(body.file_name || "arquivo"))
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
      const finalName = `${base || "img"}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
      const target = path.resolve(folderPath, finalName);
      await fs.writeFile(target, parsed.buffer);
      return sendJson(res, 201, { file_url: `/uploads/${folder}/${finalName}` });
    }

    if (req.method === "POST" && pathname === "/api/classify-category") {
      return sendJson(res, 501, {
        error: "AI_CLASSIFICATION_DISABLED",
        message: "A classificacao automatica por IA foi desativada."
      });
    }

    if (req.method === "GET" && pathname.startsWith("/uploads/")) {
      const target = safeResolve(uploadsDir, pathname.replace(/^\/uploads/, ""));
      if (!target) return sendJson(res, 400, { error: "INVALID_UPLOAD_PATH" });
      const ok = await serveFile(res, target);
      if (!ok) return sendJson(res, 404, { error: "UPLOAD_NOT_FOUND" });
      return;
    }

    if (pathname.startsWith("/api/")) return sendJson(res, 404, { error: "NOT_FOUND" });
    if (!["GET", "HEAD"].includes(req.method || "")) return sendJson(res, 405, { error: "METHOD_NOT_ALLOWED" });

    const requested = pathname === "/" ? "/index.html" : pathname;
    const distFile = safeResolve(distDir, requested);
    if (distFile && (await serveFile(res, distFile))) return;
    const fallback = path.resolve(distDir, "index.html");
    if (await serveFile(res, fallback)) return;
    return sendJson(res, 500, { error: "DIST_NOT_FOUND", detail: "Execute npm run build antes de iniciar." });
  } catch (error) {
    return sendJson(res, 500, { error: "SERVER_ERROR", detail: String(error?.message || error) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[app-server] listening on http://${HOST}:${PORT}`);
  console.log(`[app-server] storage=${storageRoot}`);
  console.log(`[app-server] admin=${ENABLE_ADMIN ? "enabled" : "disabled"}`);
});
