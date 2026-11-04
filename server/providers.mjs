import { config } from "./config.mjs";

async function fetchJson(url, options = {}, timeoutMs = 25000) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(timeoutMs),
  });

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const message =
      body?.error?.message ||
      body?.message ||
      body?.info ||
      `上游服务返回 ${response.status}`;
    throw new Error(message);
  }

  return body;
}

let mapRequestChain = Promise.resolve();
let lastMapRequestAt = 0;

function mapRequest(url, timeoutMs = 25000) {
  const task = async () => {
    const wait = Math.max(0, 420 - (Date.now() - lastMapRequestAt));
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastMapRequestAt = Date.now();
    return fetchJson(url, {}, timeoutMs);
  };
  const result = mapRequestChain.then(task, task);
  mapRequestChain = result.catch(() => undefined);
  return result;
}

function ensureMapKey() {
  if (!config.mapKey) {
    throw new Error("未配置 AMAP_WEB_SERVICE_KEY");
  }
}

function normalizePlaceName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/(?:附近|周边|旁边|中心区域)/g, "")
    .replace(/[\s\-—_·•,，.。:：;；()（）[\]【】/\\|]/g, "");
}

function landmarkTerms(address) {
  const text = normalizePlaceName(address);
  const terms = new Set();
  for (const match of text.matchAll(/门|路口|广场|地铁站|停车场|车站|机场/g)) {
    const end = match.index + match[0].length;
    for (let size = 2; size <= 6; size += 1) {
      const term = text.slice(Math.max(0, end - size), end);
      if (term.length >= 2) terms.add(term);
    }
  }
  return [...terms].sort((a, b) => b.length - a.length);
}

export function pickAddressPoi(address, pois) {
  const target = normalizePlaceName(address);
  const terms = landmarkTerms(address);
  if (terms.length === 0) return null;

  const scored = pois
    .map((poi) => {
      const name = normalizePlaceName(poi.name);
      const fullAddress = normalizePlaceName(`${poi.name} ${poi.address}`);
      let score = 0;
      if (name.includes(target) || target.includes(name)) score += 100;
      for (const term of terms) {
        if (name.includes(term)) score += 30;
        if (fullAddress.includes(term)) score += 10;
      }
      return { poi, score };
    })
    .filter((item) => item.score >= 20)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.poi || null;
}

export async function geocodeAddress(address) {
  ensureMapKey();
  const terms = landmarkTerms(address);
  const geocodeParams = new URLSearchParams({
    key: config.mapKey,
    address,
  });
  const placeParams = new URLSearchParams({
    key: config.mapKey,
    keywords: address,
    offset: "10",
    page: "1",
    extensions: "base",
  });
  const [geocodeBody, placeBody] = await Promise.all([
    mapRequest(
      `https://restapi.amap.com/v3/geocode/geo?${geocodeParams.toString()}`,
    ),
    mapRequest(
      `https://restapi.amap.com/v3/place/text?${placeParams.toString()}`,
    ),
  ]);
  const landmarkPoi =
    placeBody.status === "1" && Array.isArray(placeBody.pois)
      ? pickAddressPoi(address, placeBody.pois)
      : null;

  if (landmarkPoi) {
    const [lng, lat] = String(landmarkPoi.location || "")
      .split(",")
      .map((value) => Number(value));
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return {
        lat,
        lng,
        label: landmarkPoi.name || address,
        province: landmarkPoi.pname || "",
        city: landmarkPoi.cityname || landmarkPoi.pname || "",
        district: landmarkPoi.adname || "",
      };
    }
  }

  if (
    geocodeBody.status !== "1" ||
    !Array.isArray(geocodeBody.geocodes) ||
    !geocodeBody.geocodes[0]
  ) {
    throw new Error(geocodeBody.info || "地址无法解析");
  }

  const first = geocodeBody.geocodes[0];
  const [lng, lat] = String(first.location)
    .split(",")
    .map((value) => Number(value));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("地址解析结果缺少有效坐标");
  }

  return {
    lat,
    lng,
    label: first.formatted_address || address,
    precisionNote: terms.length
      ? `地图没有单独收录“${terms[0]}”，当前显示的是地址中心点。`
      : undefined,
    province: first.province || "",
    city: first.city || first.province || "",
    district: first.district || "",
  };
}

async function requestAround(center, { keywords = "", types = "", page = 1 }) {
  ensureMapKey();
  const params = new URLSearchParams({
    key: config.mapKey,
    location: `${center.lng},${center.lat}`,
    radius: "3000",
    offset: "25",
    page: String(page),
    extensions: "all",
    sortrule: "distance",
  });
  if (keywords) params.set("keywords", keywords);
  if (types) params.set("types", types);

  const body = await mapRequest(
    `https://restapi.amap.com/v3/place/around?${params.toString()}`,
  );
  if (body.status !== "1") {
    throw new Error(body.info || "高德周边检索失败");
  }
  return Array.isArray(body.pois) ? body.pois : [];
}

export async function fetchRestaurantPois(center) {
  const [pageOne, pageTwo] = await Promise.all([
    requestAround(center, { types: "050000", page: 1 }),
    requestAround(center, { types: "050000", page: 2 }),
  ]);
  return dedupePois([...pageOne, ...pageTwo]);
}

export async function fetchCategoryPois(center, categoryConfig) {
  const keywordGroups = categoryConfig.keywords.slice(0, 3);
  const lists = await Promise.allSettled(
    keywordGroups.map((keywords) =>
      requestAround(center, { keywords, types: "050000", page: 1 }),
    ),
  );

  return dedupePois(
    lists.flatMap((result) => (result.status === "fulfilled" ? result.value : [])),
  );
}

export async function fetchDemandAnchors(center) {
  const queries = [
    { label: "教育设施", keywords: "大学", types: "140000" },
    { label: "办公设施", keywords: "写字楼", types: "120000" },
    { label: "居住设施", keywords: "住宅", types: "120000" },
  ];
  const results = await Promise.allSettled(
    queries.map((query) => requestAround(center, query)),
  );

  return results.flatMap((result, index) =>
    result.status === "fulfilled"
      ? result.value.slice(0, 8).map((poi) => ({
          ...normalizePoi(poi),
          anchorType: queries[index].label,
        }))
      : [],
  );
}

export function normalizePoi(poi) {
  const [lng, lat] = String(poi.location || "")
    .split(",")
    .map((value) => Number(value));
  const rating = Number(poi.biz_ext?.rating);
  const cost = Number(poi.biz_ext?.cost);
  const reviewCount = Number(
    poi.biz_ext?.review_count ?? poi.review_count ?? poi.biz_ext?.reviews,
  );
  const distanceM = Number(poi.distance);

  return {
    id: String(poi.id || `${poi.name}-${poi.location}`),
    name: String(poi.name || "未命名门店"),
    type: String(poi.type || ""),
    typecode: String(poi.typecode || ""),
    address: String(poi.address || ""),
    lat,
    lng,
    distanceM: Number.isFinite(distanceM) ? distanceM : null,
    rating: Number.isFinite(rating) && rating > 0 ? rating : null,
    reviewCount:
      Number.isFinite(reviewCount) && reviewCount > 0 ? reviewCount : null,
    cost: Number.isFinite(cost) && cost > 0 ? cost : null,
    hours: poi.biz_ext?.open_time || null,
    tel: poi.tel || "",
    city: poi.cityname || "",
    district: poi.adname || "",
  };
}

export function dedupePois(pois) {
  const seen = new Set();
  const output = [];

  for (const poi of pois) {
    const normalized = normalizePoi(poi);
    if (
      !Number.isFinite(normalized.lat) ||
      !Number.isFinite(normalized.lng)
    ) {
      continue;
    }
    const key = `${normalized.name}|${normalized.address}|${normalized.lat.toFixed(
      4,
    )}|${normalized.lng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(normalized);
  }

  return output.sort(
    (a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity),
  );
}

export async function tavilySearch(query, maxResults = 3) {
  if (!config.searchKey) return [];

  const body = await fetchJson(
    config.searchUrl,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.searchKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        max_results: maxResults,
        include_answer: false,
        include_raw_content: false,
      }),
    },
    28000,
  );

  return (Array.isArray(body.results) ? body.results : []).map((result) => ({
    title: String(result.title || "公开页面"),
    url: String(result.url || ""),
    content: String(result.content || "").slice(0, 700),
    score: Number(result.score) || null,
  }));
}

export async function deepseekJson(system, user) {
  if (!config.llmKey || !config.llmBaseUrl || !config.llmModel) {
    throw new Error("未配置完整的大模型服务");
  }

  const body = await fetchJson(
    `${config.llmBaseUrl}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.llmKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.llmModel,
        temperature: 0.2,
        max_tokens: 4500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    },
    50000,
  );

  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    const reason = body.choices?.[0]?.finish_reason || "unknown";
    throw new Error(`大模型没有返回分析内容（finish_reason: ${reason}）`);
  }

  const cleaned = String(content)
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const candidates = [cleaned];
  const firstObject = cleaned.indexOf("{");
  const lastObject = cleaned.lastIndexOf("}");
  if (firstObject >= 0 && lastObject > firstObject) {
    candidates.push(cleaned.slice(firstObject, lastObject + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next normalized candidate.
    }
  }

  throw new Error(
    `大模型返回的 JSON 无法解析（${cleaned.length} 字符，开头：${cleaned.slice(0, 80)}）`,
  );
}
