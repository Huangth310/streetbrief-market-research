import fs from "node:fs";
import path from "node:path";
import express from "express";
import { config, configuredServices } from "./config.mjs";
import { geocodeAddress } from "./providers.mjs";
import { buildLiveReport } from "./report-builder.mjs";
import { CATEGORY_CONFIG } from "./catalog.mjs";

const app = express();
const cache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE_ENTRIES = 300;

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use((_request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  next();
});

function createRateLimiter({ windowMs, maxRequests }) {
  const clients = new Map();

  return (request, response, next) => {
    const now = Date.now();
    const key = request.ip || request.socket.remoteAddress || "unknown";
    let bucket = clients.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      clients.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, maxRequests - bucket.count);
    response.setHeader("X-RateLimit-Limit", String(maxRequests));
    response.setHeader("X-RateLimit-Remaining", String(remaining));

    if (bucket.count > maxRequests) {
      response.setHeader(
        "Retry-After",
        String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))),
      );
      return response.status(429).json({
        error: "访问过于频繁，请稍后再试",
      });
    }

    if (clients.size > 2_000) {
      for (const [clientKey, clientBucket] of clients) {
        if (clientBucket.resetAt <= now) clients.delete(clientKey);
      }
    }

    next();
  };
}

const apiLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 120,
});
const analysisLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 20,
});

app.use("/api", apiLimiter);
app.use(express.json({ limit: "64kb" }));

app.get("/api/health", (_request, response) => {
  const services = configuredServices();
  response.json({
    ok: true,
    time: new Date().toISOString(),
    services,
    model: config.llmModel || null,
    ready: services.amap,
  });
});

app.post("/api/geocode", async (request, response) => {
  const address = String(request.body?.address || "").trim();
  if (!address) {
    return response.status(400).json({ error: "请提供要解析的地址" });
  }

  try {
    const result = await geocodeAddress(address);
    return response.json(result);
  } catch (error) {
    return response.status(502).json({
      error: error instanceof Error ? error.message : "地址解析失败",
    });
  }
});

app.post("/api/analyze", analysisLimiter, async (request, response) => {
  const address = String(request.body?.address || "").trim();
  const mode = request.body?.mode === "discover" ? "discover" : "targeted";
  const category = String(request.body?.category || "");

  if (address.length < 2) {
    return response.status(400).json({ error: "经营位置不够具体" });
  }
  if (
    mode === "targeted" &&
    !Object.prototype.hasOwnProperty.call(CATEGORY_CONFIG, category)
  ) {
    return response.status(400).json({ error: "当前版本不支持该经营品类" });
  }

  const cacheKey = `${address}|${mode}|${category}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return response.json({
      ...cached.report,
      cacheHit: true,
    });
  }

  try {
    const startedAt = Date.now();
    const report = await buildLiveReport({ address, mode, category });
    if (cache.size >= MAX_CACHE_ENTRIES) {
      for (const [key, item] of cache) {
        if (Date.now() - item.createdAt >= CACHE_TTL_MS) cache.delete(key);
      }
      if (cache.size >= MAX_CACHE_ENTRIES) {
        cache.delete(cache.keys().next().value);
      }
    }
    cache.set(cacheKey, { createdAt: Date.now(), report });
    console.log(
      `[analyze] ${mode}/${report.category} completed in ${
        Date.now() - startedAt
      }ms with ${report.competitors.length} direct competitors`,
    );
    return response.json(report);
  } catch (error) {
    console.error("[analyze] failed:", error);
    return response.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : "真实市场数据暂不可用，请稍后重试",
    });
  }
});

const distDir = path.join(config.rootDir, "dist");
if (fs.existsSync(distDir)) {
  app.use(
    express.static(distDir, {
      setHeaders(response, filePath) {
        if (path.basename(filePath) === "index.html") {
          response.setHeader("Cache-Control", "no-store");
        } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          response.setHeader(
            "Cache-Control",
            "public, max-age=31536000, immutable",
          );
        }
      },
    }),
  );
  app.get("*", (_request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(config.port, "0.0.0.0", () => {
  const services = configuredServices();
  console.log(
    `Streetbrief API listening on http://localhost:${config.port} | amap=${services.amap} search=${services.search} llm=${services.llm}`,
  );
});
