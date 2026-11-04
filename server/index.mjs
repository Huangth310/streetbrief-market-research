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

app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    time: new Date().toISOString(),
    services: configuredServices(),
    model: config.llmModel || null,
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

app.post("/api/analyze", async (request, response) => {
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
  app.use(express.static(distDir, { maxAge: "1h" }));
  app.get("*", (_request, response) => {
    response.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(config.port, "0.0.0.0", () => {
  const services = configuredServices();
  console.log(
    `Streetbrief API listening on http://localhost:${config.port} | amap=${services.amap} search=${services.search} llm=${services.llm}`,
  );
});
