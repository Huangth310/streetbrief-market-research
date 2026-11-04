import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(rootDir, ".env.local") });
dotenv.config({ path: path.join(rootDir, ".env") });

export const config = {
  rootDir,
  port: Number(process.env.PORT || 8787),
  mapKey: process.env.AMAP_WEB_SERVICE_KEY || "",
  searchUrl:
    process.env.SEARCH_API_URL?.replace(/\/+$/, "") ||
    "https://api.tavily.com/search",
  searchKey: process.env.SEARCH_API_KEY || "",
  llmBaseUrl: process.env.LLM_BASE_URL?.replace(/\/+$/, "") || "",
  llmKey: process.env.LLM_API_KEY || "",
  llmModel: process.env.LLM_MODEL || "",
};

export function configuredServices() {
  return {
    amap: Boolean(config.mapKey),
    search: Boolean(config.searchKey),
    llm: Boolean(config.llmKey && config.llmBaseUrl && config.llmModel),
  };
}
