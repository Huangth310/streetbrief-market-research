import { CATEGORY_CONFIG } from "./catalog.mjs";
import {
  deepseekJson,
  fetchCategoryPois,
  fetchDemandAnchors,
  fetchRestaurantPois,
  geocodeAddress,
  tavilySearch,
} from "./providers.mjs";

const categories = Object.keys(CATEGORY_CONFIG);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function nowLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date())
    .replaceAll("/", "-");
}

function normalizeText(poi) {
  return `${poi.name} ${poi.type} ${poi.typecode}`.toLowerCase();
}

function normalizeEvidenceText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(
      /[學区區灣門號樓层臺台東东廣广場场園园]/g,
      (character) =>
        ({
          學: "学",
          區: "区",
          灣: "湾",
          門: "门",
          號: "号",
          樓: "楼",
          層: "层",
          臺: "台",
          東: "东",
          廣: "广",
          場: "场",
          園: "园",
        })[character] || character,
    )
    .replace(/[\s\-—_·•,，.。:：;；()（）[\]【】/\\|]/g, "");
}

export function isRelevantWebResult(competitor, poi, result) {
  const haystack = normalizeEvidenceText(
    `${result.title || ""} ${result.content || ""}`,
  );
  const targetName = normalizeEvidenceText(competitor.name);
  const targetAddress = normalizeEvidenceText(poi.address);
  return (
    (targetName.length >= 6 && haystack.includes(targetName)) ||
    (targetAddress.length >= 10 && haystack.includes(targetAddress))
  );
}

export function matchesCategory(poi, category) {
  const text = normalizeText(poi);
  const type = String(poi.type || "").toLowerCase();
  const teaLed =
    /冷饮店|茶饮|奶茶|果茶|柠檬茶/.test(type) ||
    /冷饮店|茶饮|奶茶|果茶|柠檬茶/.test(text);
  const coffeeLed = /咖啡厅|咖啡馆/.test(type);
  if (category === "coffee" && teaLed && !coffeeLed) return false;
  if (category === "tea" && coffeeLed && !teaLed) return false;
  return CATEGORY_CONFIG[category].matchTerms.some((term) =>
    text.includes(term.toLowerCase()),
  );
}

function makeEvidenceId(prefix, index) {
  return `${prefix}${String(index + 1).padStart(2, "0")}`;
}

function mapEvidenceFor(poi, id) {
  const details = [
    `距离 ${poi.distanceM ?? "未获取"} 米`,
    poi.type ? `分类 ${poi.type}` : "",
    poi.rating ? `公开评分 ${poi.rating}` : "",
    poi.reviewCount ? `公开评价数 ${poi.reviewCount}` : "",
    poi.cost ? `公开人均约 ${poi.cost} 元` : "",
    poi.hours ? `公开营业时间 ${poi.hours}` : "",
  ]
    .filter(Boolean)
    .join("；");

  return {
    id,
    title: `${poi.name} · 高德地点信息`,
    source: "高德地图 Web 服务 API",
    sourceType: "map-api",
    capturedAt: nowLabel(),
    grade: "A",
    excerpt: `${poi.name}：${details}。`,
    field: "门店位置与公开基础字段",
    synthetic: false,
  };
}

function baseCompleteness(poi) {
  let score = 20;
  if (poi.name) score += 10;
  if (poi.address) score += 10;
  if (poi.type) score += 10;
  if (poi.rating) score += 15;
  if (poi.cost) score += 15;
  if (poi.hours) score += 10;
  if (poi.tel) score += 5;
  if ((poi.distanceM ?? Infinity) <= 800) score += 5;
  return clamp(score, 25, 78);
}

function priceBandFromCost(cost) {
  if (!Number.isFinite(cost) || cost <= 0) return null;
  return `${Math.max(1, Math.round(cost * 0.75))}–${Math.ceil(
    cost * 1.25,
  )} 元`;
}

function extractPrice(snippet) {
  const match = snippet.match(
    /(?:人均|客单|价格|消费)[^0-9]{0,8}(\d{1,3})(?:\s*元)?/,
  );
  return match ? Number(match[1]) : null;
}

function extractHours(snippet) {
  const match = snippet.match(
    /(?:营业时间)?\s*([01]?\d|2[0-3]):[0-5]\d\s*[-–—至]\s*([01]?\d|2[0-3]):[0-5]\d/,
  );
  return match ? match[0].replace(/^营业时间\s*/, "") : null;
}

function conceptFor(poi, category) {
  const typeParts = String(poi.type || "").split(";");
  const specific = typeParts[typeParts.length - 1] || typeParts[0];
  if (specific && specific.length <= 14) return specific;
  return CATEGORY_CONFIG[category].shortLabel;
}

function tacticList(poi, evidenceCount) {
  const output = [];
  if ((poi.distanceM ?? Infinity) <= 800) output.push("位于核心调查圈");
  if (poi.hours) output.push(`公开营业至 ${poi.hours}`);
  if (poi.cost) output.push(`公开人均约 ${poi.cost} 元`);
  if (evidenceCount > 0) output.push(`已关联 ${evidenceCount} 条公开网页线索`);
  if (output.length === 0) output.push("仅获取地点基础信息");
  return output.slice(0, 3);
}

function selectDepthTargets(competitors, limit = 6) {
  const distanceBands = [
    competitors.filter((item) => item.distanceM <= 800),
    competitors.filter(
      (item) => item.distanceM > 800 && item.distanceM <= 1600,
    ),
    competitors.filter((item) => item.distanceM > 1600),
  ];
  const selected = [];
  let cursor = 0;

  while (
    selected.length < limit &&
    distanceBands.some((band) => band.length > 0)
  ) {
    const band = distanceBands[cursor % distanceBands.length];
    const next = band.shift();
    if (next) selected.push(next);
    cursor += 1;
  }

  return selected;
}

async function enrichCompetitors(candidates, category, evidence) {
  const evidenceByCompetitor = new Map();
  const competitors = candidates.map((poi, index) => {
    const id = `C${index + 1}`;
    const mapEvidenceId = makeEvidenceId("M", index);
    evidence.push(mapEvidenceFor(poi, mapEvidenceId));
    const evidenceIds = [mapEvidenceId];
    evidenceByCompetitor.set(id, evidenceIds);
    return {
      id,
      name: poi.name,
      categoryLabel: CATEGORY_CONFIG[category].label,
      lat: poi.lat,
      lng: poi.lng,
      distanceM: poi.distanceM ?? 3000,
      rating: poi.rating,
      reviewCount: poi.reviewCount ?? null,
      hours: poi.hours || null,
      priceBand: priceBandFromCost(poi.cost),
      concept: conceptFor(poi, category),
      tactics: [],
      completeness: baseCompleteness(poi),
      evidenceIds,
      _poi: poi,
    };
  });

  const enrichTargets = selectDepthTargets([...competitors], 6);
  const webResults = await Promise.allSettled(
    enrichTargets.map(async (competitor) => {
      const depthIndex = competitors.indexOf(competitor);
      const poi = competitor._poi;
      const query = [
        competitor.name,
        poi.city,
        poi.district,
        poi.address,
        CATEGORY_CONFIG[category].shortLabel,
        "菜单 价格 营业时间",
      ]
        .filter(Boolean)
        .join(" ");
      const results = await tavilySearch(query, 3);
      const ids = evidenceByCompetitor.get(competitor.id);
      const seenUrls = new Set();

      for (const [resultIndex, result] of results.entries()) {
        if (!result.url || seenUrls.has(result.url)) continue;
        if (!isRelevantWebResult(competitor, poi, result)) continue;
        seenUrls.add(result.url);
        const webEvidenceId = makeEvidenceId(
          `W${String(depthIndex + 1).padStart(2, "0")}-`,
          resultIndex,
        );
        evidence.push({
          id: webEvidenceId,
          title: result.title,
          source: "Tavily 公开网页检索",
          sourceType: "public-web",
          capturedAt: nowLabel(),
          grade: "B",
          excerpt: result.content || "公开搜索返回了该来源，但未提供可引用摘要。",
          field: "菜单、价格、营业信息或公开活动",
          url: result.url,
          synthetic: false,
        });
        ids.push(webEvidenceId);
      }

      if (ids.length > 1) {
        const joined = results.map((item) => item.content).join(" ");
        if (!competitor.priceBand) {
          const price = extractPrice(joined);
          if (price) competitor.priceBand = priceBandFromCost(price);
        }
        if (!competitor.hours) {
          const hours = extractHours(joined);
          if (hours) competitor.hours = hours;
        }
        competitor.completeness = clamp(
          competitor.completeness + Math.min(22, ids.length * 7),
          30,
          96,
        );
      }
    }),
  );

  for (const competitor of competitors) {
    competitor.tactics = tacticList(
      competitor._poi,
      competitor.evidenceIds.length - 1,
    );
    delete competitor._poi;
  }

  return {
    competitors,
    webEvidenceCount: evidence.filter(
      (item) => item.sourceType === "public-web",
    ).length,
  };
}

function calculateRanking(grouped, anchorCount) {
  return categories.map((category) => {
    const items = grouped[category];
    const averageCompleteness = items.length
      ? items.reduce((total, item) => total + baseCompleteness(item), 0) /
        items.length
      : 0;
    const breakdown = {
      demand: clamp(Math.round(anchorCount * 3), 0, 25),
      competition:
        items.length >= 5 ? 20 : items.length >= 3 ? 16 : items.length ? 10 : 3,
      scenario: clamp(Math.round(8 + averageCompleteness * 0.12), 0, 20),
      differentiation: clamp(
        Math.round(items.length ? averageCompleteness * 0.1 : 0),
        0,
        15,
      ),
      evidence: clamp(Math.round(averageCompleteness * 0.12), 0, 15),
    };
    const score = clamp(
      Object.values(breakdown).reduce((total, value) => total + value, 0),
      0,
      100,
    );
    const opportunity = classifyMarketOpportunity({
      directCompetitorCount: items.length,
      coverage: averageCompleteness,
      anchorCount,
    });
    const labelText =
      opportunity === "insufficient"
        ? "资料较少"
        : opportunity === "mature_entry"
          ? items.length >= 7
            ? "门店较多"
            : "已有同类门店"
          : "资料较少";
    return {
      category,
      label: CATEGORY_CONFIG[category].label,
      score,
      potentialScore: potentialScoreFor(score, opportunity, {
        competitorCount: items.length,
        anchorCount,
        coverage: averageCompleteness,
      }),
      breakdown,
      confidence:
        items.length >= 5 && averageCompleteness >= 75
          ? "high"
          : items.length >= 3 && averageCompleteness >= 55
            ? "medium"
            : "low",
      missingData:
        items.length < 3
          ? ["同类门店样本不足", "公开菜单与价格", "公开评价主题"]
          : averageCompleteness < 65
            ? ["部分门店菜单与价格", "评价主题覆盖"]
            : ["菜单价格逐店核验", "评价主题覆盖"],
      opportunity,
      labelText,
      note:
        items.length > 0
          ? `调查范围内找到 ${items.length} 家同类门店。`
          : "调查范围内暂未找到同类门店。",
    };
  });
}

export function classifyMarketOpportunity({
  directCompetitorCount,
  coverage,
  anchorCount,
}) {
  if (
    directCompetitorCount < 3 ||
    coverage < 50 ||
    anchorCount < 1
  ) {
    return "insufficient";
  }
  return "mature_entry";
}

function potentialScoreFor(
  score,
  opportunity,
  { competitorCount, anchorCount, coverage },
) {
  if (opportunity === "insufficient") return score >= 65 ? 2 : 1;
  let potential = score >= 80 ? 5 : score >= 66 ? 4 : score >= 52 ? 3 : score >= 38 ? 2 : 1;
  if (competitorCount >= 12) potential = Math.min(potential, 3);
  else if (competitorCount >= 6) potential = Math.min(potential, 4);
  if (anchorCount === 0 || coverage < 45) potential = Math.min(potential, 2);
  return potential;
}

function decisionForPotential(potentialScore) {
  if (potentialScore >= 5) return "建议优先开店";
  if (potentialScore === 4) return "建议筹备开店";
  if (potentialScore === 3) return "建议先做小范围测试";
  if (potentialScore === 2) return "暂缓开店";
  return "暂不建议开店";
}

function anchorEvidence(anchors, evidence) {
  const groups = new Map();
  for (const anchor of anchors) {
    const group = groups.get(anchor.anchorType) || [];
    group.push(anchor);
    groups.set(anchor.anchorType, group);
  }

  const ids = [];
  let index = 0;
  for (const [type, items] of groups.entries()) {
    const id = makeEvidenceId("A", index++);
    evidence.push({
      id,
      title: `周边${type}地点`,
      source: "高德地图 Web 服务 API",
      sourceType: "map-api",
      capturedAt: nowLabel(),
      grade: "B",
      excerpt: `3 公里内检索到 ${items.length} 个${type}地点，包括 ${items
        .slice(0, 3)
        .map((item) => item.name)
        .join("、")}。最近距离约 ${Math.min(
        ...items.map((item) => item.distanceM ?? 9999),
      )} 米。`,
      field: "需求设施",
      synthetic: false,
    });
    ids.push(id);
  }
  return { ids, groups };
}

function priceRangeFor(competitors) {
  const numbers = competitors.flatMap((item) =>
    [...String(item.priceBand || "").matchAll(/\d+/g)].map((match) =>
      Number(match[0]),
    ),
  );
  if (numbers.length === 0) return null;
  return `${Math.min(...numbers)}–${Math.max(...numbers)} 元`;
}

function commonHoursFor(competitors) {
  const counts = new Map();
  for (const item of competitors) {
    if (!item.hours) continue;
    counts.set(item.hours, (counts.get(item.hours) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function segmentDefinition(type) {
  if (type === "教育设施") {
    return {
      title: "学校与培训人群",
      use: "课间、放学前后的快速消费",
    };
  }
  if (type === "办公设施") {
    return {
      title: "附近上班人群",
      use: "工作日午间和下午的稳定补给",
    };
  }
  return {
    title: "周边居住人群",
    use: "下班后与周末的日常消费",
  };
}

function fallbackAnalysis({
  category,
  competitors,
  anchors,
  coverage,
  score,
  opportunity,
}) {
  const cat = CATEGORY_CONFIG[category];
  const evidenceIds = competitors
    .slice(0, 4)
    .flatMap((item) => item.evidenceIds.slice(0, 1));
  const anchorIds = anchors.ids.length ? anchors.ids : evidenceIds.slice(0, 1);
  const safeEvidenceIds = evidenceIds.length ? evidenceIds : ["G01"];
  const safeAnchorIds = anchorIds.length ? anchorIds : safeEvidenceIds;
  const priceKnown = competitors.filter((item) => item.priceBand);
  const safePriceEvidenceIds = priceKnown
    .flatMap((item) => item.evidenceIds)
    .slice(0, 4);
  const coreCount = competitors.filter((item) => item.distanceM <= 800).length;
  const nearestDistance = competitors.length
    ? Math.min(...competitors.map((item) => item.distanceM))
    : null;
  const knownHours = competitors.filter((item) => item.hours).length;
  const priceRange = priceRangeFor(priceKnown);
  const commonHours = commonHoursFor(competitors);
  const nearestCompetitors = competitors.slice(0, 3);
  const productAxes = [
    ...new Set(
      nearestCompetitors
        .map((item) => item.concept)
        .filter((item) => item && item !== "低资料样本"),
    ),
  ];
  const anchorGroups = [...anchors.groups.entries()]
    .map(([type, items], index) => {
      const definition = segmentDefinition(type);
      return {
        type,
        items,
        names: items.slice(0, 3).map((item) => item.name),
        nearestM: Math.min(
          ...items.map((item) => item.distanceM ?? 9999),
        ),
        evidenceId: anchors.ids[index],
        segment: definition,
      };
    })
    .sort((a, b) => a.nearestM - b.nearestM);
  const anchorSegments = anchorGroups.map((group, index) => ({
    id: `S${index + 1}`,
    level:
      (anchorGroups[0]?.nearestM ?? Infinity) > 1500
        ? "potential"
        : index === 0
          ? "core"
          : index === 1
            ? "secondary"
            : "potential",
    title: group.segment.title,
    description: `${group.items.length} 处${group.type}，最近约 ${group.nearestM} 米，可能对应${group.segment.use}。`,
    evidenceIds: [
      group.evidenceId,
      ...safeEvidenceIds.slice(0, 2),
    ],
  }));
  const segmentTitles = anchorSegments.map((item) => item.title);
  const nearestNames = nearestCompetitors
    .map((item) => `${item.name}（${item.distanceM} 米）`)
    .join("、");
  const headline = competitors.length
    ? coreCount > 0
      ? `${coreCount} 家${cat.shortLabel}店位于 800 米内`
      : `${competitors.length} 家${cat.shortLabel}店分布在 3 公里内`
    : `3 公里内暂未找到直接${cat.shortLabel}门店`;

  return {
    headline,
    summary: competitors.length
      ? `附近找到 ${competitors.length} 家同类门店，最近一家约 ${nearestDistance} 米。${
          priceKnown.length
            ? `${priceKnown.length} 家能比较价格，公开价格覆盖 ${priceRange}。`
            : "目前没有可核对的公开价格。"
        }${knownHours ? `${knownHours} 家公开了营业时间。` : ""}`
      : `3 公里内没有找到同类${cat.shortLabel}门店。`,
    analysisSummary: competitors.length
      ? `近端已经出现 ${competitors.length} 家同类门店，公开价格${
          priceRange ? `覆盖 ${priceRange}` : "尚未取得"
        }。${
          priceKnown.length >= 3
            ? "多个价位都有公开样本，单靠低价很难形成清晰区别。"
            : "价格资料仍然有限，选价前需要补齐门店菜单。"
        }${
          anchorGroups[0]
            ? `距离最近的生活场景更接近${anchorSegments[0].title}。`
            : ""
        }首店应先服务这一近端场景，再根据试营业记录决定菜单宽度和营业时长。`
      : `附近没有形成清晰的同类门店供给。${
          anchorGroups[0]
            ? `最近的周边地点可能与${anchorSegments[0].title}有关。`
            : ""
        }在补齐到店和价格资料前，不宜直接进入。`,
    facts: [
      {
        id: "F1",
        layer: "fact",
        title: `${competitors.length} 家同类门店，${coreCount} 家在 800 米内`,
        detail: competitors.length
          ? `距离最近的门店是 ${nearestNames}。`
          : "当前没有可纳入地图的同类门店。",
        implication:
          "消费者已经有可以比较的同类选择，新品需要说明自己更适合哪一段日常消费。",
        confidence: "medium",
        evidenceIds: safeEvidenceIds.slice(0, 4),
      },
      {
        id: "F2",
        layer: "fact",
        title: priceKnown.length
          ? `${priceKnown.length} 家门店有可比较价格`
          : "暂未取得可比较价格",
        detail: priceKnown.length
          ? `公开价格覆盖 ${priceRange}。${knownHours} 家门店有公开营业时间${
              commonHours ? `，其中最常见的是 ${commonHours}。` : "。"
            }`
          : `${knownHours} 家门店有公开营业时间${
              commonHours ? `，最常见的是 ${commonHours}` : ""
            }。`,
        implication:
          "价格和营业时间可以直接作为菜单与排班的起点，没有公开价格的门店不参与价格比较。",
        confidence: priceKnown.length >= 2 ? "medium" : "low",
        evidenceIds: safeEvidenceIds.slice(0, 3),
      },
      {
        id: "F3",
        layer: "proxy",
        title: anchorSegments.length
          ? `最近的地点包括${anchorGroups
              .map((group) => group.names[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("、")}`
          : "附近需求地点较少",
        detail: anchorSegments.length
          ? anchorSegments
              .map((item) => item.description.replace(/。$/, ""))
              .join("；") + "。"
          : "公开地点资料里没有呈现学校、办公或居住地点的集中分布。",
        implication:
          anchorSegments[0]
            ? `首轮可以先服务${anchorSegments[0].title}，用${anchorSegments[0].description.match(/可能对应(.+?)。/)?.[1] || "日常到店场景"}测试产品结构。`
            : "先通过线下时段观察确定主要到店人群，再决定产品和营业时间。",
        confidence: anchorSegments.length >= 2 ? "medium" : "low",
        evidenceIds: safeAnchorIds,
      },
    ],
    segments: anchorSegments.length
      ? anchorSegments
      : [
          {
            id: "S1",
            level: "potential",
            title: "附近到店人群",
            description: `已找到 ${competitors.length} 家同类门店，最近一家约 ${nearestDistance} 米。具体由哪类人群消费，需要到店时段观察。`,
            evidenceIds: safeEvidenceIds.slice(0, 2),
          },
        ],
    opportunities: [
      {
        id: "O1",
        type: opportunity,
        title:
          opportunity === "insufficient"
            ? "现有门店和价格资料不足"
            : segmentTitles[0]
              ? `先围绕${segmentTitles[0]}做一轮小范围测试`
              : "先围绕最近的门店做差异比较",
        summary:
          opportunity === "insufficient"
            ? "附近可识别的直接门店较少，现有价格和营业资料还不足以支撑明确的市场判断。"
            : `附近已有 ${competitors.length} 家同类门店，${coreCount} 家在 800 米内。${
                priceKnown.length
                  ? `公开价格覆盖 ${priceRange}，可以从价格空档、出餐速度或营业时段中选一个方向。`
                  : "价格资料较少，可以先比较产品组合和营业时段。"
              }`,
        rationale:
          anchorSegments.length
            ? `${anchorSegments[0].title}的最近需求地点与同类门店距离接近，适合作为首轮试验场景。`
            : `附近同类门店最近 ${nearestDistance} 米。`,
        caution:
          "这个方向来自公开门店资料，实际销量和到店人数要用试营业记录判断。",
        confidence: coverage >= 60 ? "medium" : "low",
        evidenceIds: [
          ...safeEvidenceIds.slice(0, 3),
          ...safeAnchorIds.slice(0, 2),
        ],
      },
    ],
    recommendations: [
      {
        id: "R1",
        area: "定位",
        title: segmentTitles[0]
          ? `先把第一批客人锁定为${segmentTitles[0]}`
          : "先做覆盖近端日常需求的小店模型",
        detail: anchorGroups[0]
          ? `首批产品、门口说明和营业时段都围绕${anchorGroups[0].segment.use}展开，减少同时服务多类客群。`
          : `附近已有 ${competitors.length} 家同类门店，最近一家 ${nearestDistance} 米。首店先覆盖最基本的到店需求，再按真实订单扩充场景。`,
        verification: "试营业前三个工作日，记录上午、午间和晚间三个时段的进店人数与购买内容。",
        evidenceIds: safeEvidenceIds,
      },
      {
        id: "R2",
        area: "产品",
        title: "首批菜单控制在 6 至 8 个单品",
        detail:
          productAxes.length >= 2
            ? `以${productAxes.slice(0, 3).join("、")}为主轴，保留基础款、一个主推组合和一个季节款。`
            : `用日常${cat.shortLabel}基础款、一个主推组合和一个季节款组成首批菜单，先减少低频配料与复杂做法。`,
        verification: "记录每个单品的售罄时间、退款次数、再次购买和出杯等待时间。",
        evidenceIds: safeEvidenceIds.slice(0, 2),
      },
      {
        id: "R3",
        area: "价格",
        title: priceRange
          ? `主力价格放在 ${priceRange}`
          : "先补齐三家门店的价格信息",
        detail: priceRange
          ? `公开价格覆盖 ${priceRange}。建议基础款靠近低价端，主推组合放在区间中部，保留一个接近上限的单品。`
          : `目前只有 ${priceKnown.length} 家门店有可比价格。先到店记录菜单和份量，再确定主力价格。`,
        verification: "按价格档记录实际成交数量、退款和加购，每周复盘一次价格变化。",
        evidenceIds:
          safePriceEvidenceIds.length > 0
            ? safePriceEvidenceIds
            : safeEvidenceIds,
      },
      {
        id: "R4",
        area: "时段",
        title: commonHours
          ? `营业时间先对照 ${commonHours}`
          : "先做一个明确的主营业时段",
        detail: commonHours
          ? `${knownHours} 家同类门店公开了营业时间，最常见的是 ${commonHours}。先覆盖这个时段，再根据真实订单决定是否提前或延后。`
          : "公开营业时间有限。先选择一段最容易服务周边日常需求的时段，记录订单后再扩展。",
        verification: "每 30 分钟记录订单数、出杯等待和人员压力，再决定是否延长营业。",
        evidenceIds: safeEvidenceIds.slice(0, 3),
      },
      {
        id: "R5",
        area: "渠道",
        title: "首周把到店和线上订单分开记录",
        detail:
          "步行到店先服务近端客群，线上渠道使用同样的产品结构。到店、外卖和团购分别记录，避免把低价订单算作稳定复购。",
        verification: "连续一周分别记录到店、外卖和团购的订单、退款与复购。",
        evidenceIds: safeEvidenceIds.slice(0, 3),
      },
    ],
    limitations: [
      "公开地点资料与网页摘要无法证明真实客流、销售额、销量或利润。",
      "缺少菜单或价格证据的门店不会进入价格带推断。",
      "Tavily 返回的是公开网页摘要，最终事实仍需打开来源核对。",
      `当前报告生成于 ${nowLabel()}，数据新鲜度以证据卡片中的采集时间为准。`,
    ],
    scoreHint: score,
  };
}

function collectNumericTokens(value, tokens = new Set()) {
  if (typeof value === "string") {
    for (const match of value.matchAll(/\d+(?:\.\d+)?/g)) {
      tokens.add(String(Number(match[0])));
    }
    return tokens;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectNumericTokens(item, tokens);
    return tokens;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectNumericTokens(item, tokens);
    }
  }
  return tokens;
}

function findUnsupportedNumbers(raw, evidence, fallback) {
  const allowed = collectNumericTokens(evidence);
  collectNumericTokens(fallback, allowed);
  const factualPart = {
    headline: raw?.headline,
    summary: raw?.summary,
    facts: raw?.facts,
    segments: raw?.segments,
    opportunities: raw?.opportunities,
    limitations: raw?.limitations,
  };
  const claims = collectNumericTokens(factualPart);
  const unsupported = [...claims].filter((claim) => !allowed.has(claim));
  if (
    /(?:客流|销量|销售额|订单量|利润|人口占比|转化率)[^。；]{0,12}\d/i.test(
      JSON.stringify(raw),
    )
  ) {
    unsupported.push("forbidden-business-metric");
  }
  return unsupported;
}

const genericCopyPattern =
  /仍有缺口|仍需验证|先验证真实竞争中的差异点|把玩家放回|三条线，连成|只做相对分层/;

function preferredText(value, fallback) {
  const text = typeof value === "string" ? value.trim() : "";
  return text && !genericCopyPattern.test(text) ? text : fallback;
}

function sanitizeAnalysis(raw, fallback, evidenceIds, evidence) {
  if (!raw || typeof raw !== "object") return fallback;
  const unsupportedNumbers = findUnsupportedNumbers(
    raw,
    evidence,
    fallback,
  );
  if (unsupportedNumbers.length) {
    console.warn(
      "LLM analysis rejected unsupported numeric claims:",
      unsupportedNumbers.join(", "),
    );
    return fallback;
  }
  const allowed = new Set(evidenceIds);
  const cleanIds = (ids, backup) => {
    const list = Array.isArray(ids)
      ? ids.map(String).filter((id) => allowed.has(id))
      : [];
    return list.length ? [...new Set(list)] : backup;
  };

  const facts = Array.isArray(raw.facts) ? raw.facts.slice(0, 3) : [];
  const segments = Array.isArray(raw.segments) ? raw.segments.slice(0, 3) : [];
  const opportunities = Array.isArray(raw.opportunities)
    ? raw.opportunities.slice(0, 1)
    : [];
  const recommendations = Array.isArray(raw.recommendations)
    ? raw.recommendations.slice(0, 5)
    : [];

  return {
    headline: preferredText(raw.headline, fallback.headline),
    summary: fallback.summary,
    analysisSummary: preferredText(
      raw.analysisSummary || raw.summary,
      fallback.analysisSummary,
    ),
    facts: facts.length >= 2
      ? facts.map((fact, index) => ({
          ...fallback.facts[index],
          ...fact,
          id: fallback.facts[index].id,
          title: preferredText(fact.title, fallback.facts[index].title),
          detail: preferredText(fact.detail, fallback.facts[index].detail),
          implication: preferredText(
            fact.implication,
            fallback.facts[index].implication,
          ),
          layer: ["fact", "proxy", "inference"].includes(fact.layer)
            ? fact.layer
            : fallback.facts[index].layer,
          confidence: ["high", "medium", "low"].includes(fact.confidence)
            ? fact.confidence
            : "low",
          evidenceIds: cleanIds(
            fact.evidenceIds,
            fallback.facts[index].evidenceIds,
          ),
        }))
      : fallback.facts,
    segments: segments.length >= 2
      ? segments.map((segment, index) => ({
          ...fallback.segments[index],
          ...segment,
          id: fallback.segments[index].id,
          title: preferredText(segment.title, fallback.segments[index].title),
          description: preferredText(
            segment.description,
            fallback.segments[index].description,
          ),
          level: ["core", "secondary", "potential"].includes(segment.level)
            ? segment.level
            : fallback.segments[index].level,
          evidenceIds: cleanIds(
            segment.evidenceIds,
            fallback.segments[index].evidenceIds,
          ),
        }))
      : fallback.segments,
    opportunities: opportunities.length
      ? opportunities.map((item, index) => ({
          ...(fallback.opportunities[index] || fallback.opportunities[0]),
          ...item,
          id:
            fallback.opportunities[index]?.id ||
            fallback.opportunities[0].id,
          title: preferredText(
            item.title,
            fallback.opportunities[index]?.title ||
              fallback.opportunities[0].title,
          ),
          summary: preferredText(
            item.summary,
            fallback.opportunities[index]?.summary ||
              fallback.opportunities[0].summary,
          ),
          rationale: preferredText(
            item.rationale,
            fallback.opportunities[index]?.rationale ||
              fallback.opportunities[0].rationale,
          ),
          caution: preferredText(
            item.caution,
            fallback.opportunities[index]?.caution ||
              fallback.opportunities[0].caution,
          ),
          type: ["gap", "mature_entry", "insufficient"].includes(item.type)
            ? item.type
            : fallback.opportunities[index]?.type || "insufficient",
          confidence: ["high", "medium", "low"].includes(item.confidence)
            ? item.confidence
            : "low",
          evidenceIds: cleanIds(
            item.evidenceIds,
            fallback.opportunities[index]?.evidenceIds ||
              fallback.opportunities[0].evidenceIds,
          ),
        }))
      : fallback.opportunities,
    recommendations: recommendations.length >= 3
      ? recommendations.map((item, index) => ({
          ...(fallback.recommendations[index] || fallback.recommendations[0]),
          ...item,
          id:
            fallback.recommendations[index]?.id ||
            fallback.recommendations[0].id,
          title: preferredText(
            item.title,
            fallback.recommendations[index]?.title ||
              fallback.recommendations[0].title,
          ),
          detail: preferredText(
            item.detail,
            fallback.recommendations[index]?.detail ||
              fallback.recommendations[0].detail,
          ),
          verification: preferredText(
            item.verification,
            fallback.recommendations[index]?.verification ||
              fallback.recommendations[0].verification,
          ),
          area: ["定位", "产品", "价格", "时段", "渠道"].includes(item.area)
            ? item.area
            : "定位",
          evidenceIds: cleanIds(
            item.evidenceIds,
            fallback.recommendations[index]?.evidenceIds ||
              fallback.recommendations[0].evidenceIds,
          ),
        }))
      : fallback.recommendations,
    limitations:
      Array.isArray(raw.limitations) && raw.limitations.length
        ? raw.limitations.map(String).slice(0, 5)
        : fallback.limitations,
  };
}

function readableEvidenceText(value) {
  return String(value || "")
    .replace(/https?:\/\/\S+|www\.\S+/gi, " ")
    .replace(/\b\d{7,}\b/g, " ")
    .replace(/[\uE000-\uF8FF]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\[\s*(?:…|\.\.\.)\s*\]/g, "")
    .trim();
}

function deterministicEvidenceSummary(item) {
  const text = readableEvidenceText(item.excerpt);
  if (!text) return "来源页面暂时没有可用摘要。";
  if (item.sourceType === "map-api" || item.sourceType === "map-sample") {
    return text.slice(0, 120);
  }

  const facts = [];
  const time = text.match(
    /(?:[01]?\d|2[0-3]):[0-5]\d\s*[-–—至]\s*(?:[01]?\d|2[0-3]):[0-5]\d/,
  );
  if (time) facts.push(`营业时间 ${time[0]}`);
  const rating = text.match(/\b(\d(?:\.\d)?)\s*\/\s*5\b/);
  if (rating) facts.push(`公开评分 ${rating[1]}/5`);
  const price = text.match(/(?:人均|客单|价格)[^。；]{0,12}\d+(?:\.\d+)?\s*元/);
  if (price) facts.push(price[0]);

  if (facts.length > 0) {
    return [...new Set(facts)].slice(0, 3).join("；").slice(0, 150);
  }

  const navigation =
    /上载食评|新增餐厅|更新餐厅资料|复制连结|打开.*App|更多WhatsApp|openrice\s*珠海|Travel guides/i;
  const useful = /营业|人均|价格|菜单|招牌|地址|推荐|咖啡|茶|面包|轻食|小吃|套餐|元/;
  const segment = text
    .split(/[。！？；|]+/)
    .map((part) => part.trim())
    .find(
      (part) =>
        part.length >= 8 &&
        part.length <= 120 &&
        useful.test(part) &&
        !navigation.test(part),
    );
  return segment || "网页没有提取到可核对的营业时间、价格或菜单。";
}

function deterministicEvidenceHighlights(item) {
  const text = readableEvidenceText(item.excerpt);
  const patterns = [
    /(?:营业时间|营业)[：:\s]*([^。；]{2,48})/,
    /(?:人均|客单|价格)[^。；]{0,16}\d+(?:\.\d+)?\s*元?/,
    /\b\d(?:\.\d)?\s*\/\s*5\b/,
    /(?:地址)[：:\s]*([^。；]{4,64})/,
    /(?:招牌|推荐|菜单)[：:\s]*([^。；]{2,56})/,
  ];
  const highlights = patterns
    .map((pattern) => text.match(pattern)?.[0]?.trim())
    .filter(Boolean);
  return [...new Set(highlights)].slice(0, 3);
}

function applyDeterministicEvidenceSummaries(evidence) {
  for (const item of evidence) {
    item.summary = deterministicEvidenceSummary(item);
    item.highlights = deterministicEvidenceHighlights(item);
  }
}

function applyLlmEvidenceSummaries(raw, evidence) {
  const webEvidence = evidence
    .filter((item) => item.sourceType === "public-web")
    .slice(0, 18);
  if (webEvidence.length === 0) return;

  const byId = new Map(
    (Array.isArray(raw?.evidenceSummaries)
      ? raw.evidenceSummaries
      : []
    ).map((item) => [
      String(item.id || ""),
      item,
    ]),
  );
  for (const item of webEvidence) {
    const generated = byId.get(item.id);
    if (!generated) continue;
    const summary =
      typeof generated.summary === "string"
        ? generated.summary.trim().slice(0, 180)
        : "";
    const highlights = Array.isArray(generated.highlights)
      ? generated.highlights
          .map((value) => String(value).trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];
    if (!summary) continue;

    const allowed = collectNumericTokens({
      title: item.title,
      excerpt: item.excerpt,
    });
    const claims = collectNumericTokens({ summary, highlights });
    if ([...claims].some((claim) => !allowed.has(claim))) continue;
    item.summary = summary;
    item.highlights = highlights;
  }
}

function buildLlmPrompt({
  address,
  category,
  competitors,
  anchors,
  evidence,
  score,
  coverage,
}) {
  const ledger = evidence.slice(0, 30).map((item) => ({
    id: item.id,
    field: item.field,
    summary: item.summary || item.excerpt,
    highlights: item.highlights || [],
    source: item.source,
    sourceType: item.sourceType,
  }));
  const competitorData = competitors.map((item) => ({
    id: item.id,
    name: item.name,
    distanceM: item.distanceM,
    hours: item.hours,
    priceBand: item.priceBand,
    rating: item.rating,
    concept: item.concept,
    evidenceIds: item.evidenceIds,
  }));
  const anchorData = [...anchors.groups.entries()].map(([type, items]) => ({
    type,
    count: items.length,
    nearestM: Math.min(...items.map((item) => item.distanceM ?? 9999)),
  }));
  const evidenceSummaryIds = evidence
    .filter((item) => item.sourceType === "public-web")
    .slice(0, 6)
    .map((item) => item.id);

  return `位置：${address}
用户目标品类：${CATEGORY_CONFIG[category].label}

同类门店：
${JSON.stringify(competitorData)}

周边需求设施：
${JSON.stringify(anchorData)}

证据台账：
${JSON.stringify(ledger)}

分析要求：
1. 只写中文，只依据证据；不得生成客流、销量、销售额、人口占比、利润率。
2. 指定品类后不得改推其他品类；不要使用模板句和行业行话。
3. analysisSummary 用2至3句话说明门店、价格、周边地点如何共同导向经营选择，不要逐项复述数字。
4. 五条经营建议分别覆盖定位、产品、价格、时段、渠道。每条写清具体动作和一周内可记录的指标。
5. evidenceSummaries 只处理这些 ID：${evidenceSummaryIds.join("、") || "无"}。删除网站导航、电话和版权文字；summary 40至90字，highlights 1至2条。
6. 输出严格 JSON，不要 Markdown：
7. 面向普通开店用户，使用“同类门店”“周边地点”等日常说法，不要写 POI、代理观察或数据流水线等术语。
{
  "analysisSummary": "2至3句分析，说明证据如何导向结论",
  "recommendations": [{"area":"定位|产品|价格|时段|渠道","title":"...","detail":"...","verification":"...","evidenceIds":["..."]}],
  "evidenceSummaries": [{"id":"W...","summary":"...","highlights":["..."]}]
}`;
}

export async function buildLiveReport({ address, mode, category }) {
  const center = await geocodeAddress(address);
  const [broadPoisResult, anchorsResult] = await Promise.allSettled([
    fetchRestaurantPois(center),
    fetchDemandAnchors(center),
  ]);

  if (broadPoisResult.status === "rejected") {
    throw new Error(broadPoisResult.reason?.message || "周边同类门店检索失败");
  }

  const broadPois = broadPoisResult.value;
  const anchors = anchorsResult.status === "fulfilled" ? anchorsResult.value : [];
  const grouped = Object.fromEntries(
    categories.map((key) => [key, broadPois.filter((poi) => matchesCategory(poi, key))]),
  );
  const ranking = calculateRanking(grouped, anchors.length);
  let selectedCategory =
    mode === "targeted" && CATEGORY_CONFIG[category] ? category : null;

  if (!selectedCategory) {
    selectedCategory = [...ranking].sort((a, b) => b.score - a.score)[0].category;
  }

  let candidates = grouped[selectedCategory];
  if (candidates.length < 3 && mode === "targeted") {
    try {
      const targeted = await fetchCategoryPois(
        center,
        CATEGORY_CONFIG[selectedCategory],
      );
      candidates = [...candidates, ...targeted.filter((poi) => matchesCategory(poi, selectedCategory))];
    } catch {
      // Broader POI results remain usable even if the targeted query fails.
    }
  }

  const uniqueCandidates = [
    ...new Map(
      candidates.map((poi) => [
        `${poi.name}|${poi.address}|${poi.lat.toFixed(4)}|${poi.lng.toFixed(4)}`,
        poi,
      ]),
    ).values(),
  ].sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity));

  const evidence = [
    {
      id: "G01",
      title: "经营位置地址解析",
      source: "高德地图 Web 服务 API",
      sourceType: "map-api",
      capturedAt: nowLabel(),
      grade: "A",
      excerpt: `地址“${address}”解析为“${center.label}”，坐标为 ${center.lng},${center.lat}。`,
      field: "地址与坐标",
      synthetic: false,
    },
  ];
  const anchorData = anchorEvidence(anchors, evidence);
  const { competitors, webEvidenceCount } = await enrichCompetitors(
    uniqueCandidates,
    selectedCategory,
    evidence,
  );
  applyDeterministicEvidenceSummaries(evidence);

  const coverage = competitors.length
    ? Math.round(
        competitors.reduce((total, item) => total + item.completeness, 0) /
          competitors.length,
      )
    : 0;
  const detailedCount = competitors.filter(
    (item) => item.completeness >= 65,
  ).length;
  const webCoveredCount = competitors.filter((item) =>
    item.evidenceIds.some((id) => id.startsWith("W")),
  ).length;
  const priceCoveredCount = competitors.filter((item) => item.priceBand).length;
  const anchorBoost = Math.min(14, anchors.length * 1.5);
  const score = clamp(
    Math.round(
      32 +
        Math.min(20, detailedCount * 3) +
        Math.min(15, webCoveredCount * 2.5) +
        Math.min(12, priceCoveredCount * 2) +
        anchorBoost,
    ),
    30,
    88,
  );
  const opportunity = classifyMarketOpportunity({
    directCompetitorCount: competitors.length,
    coverage,
    anchorCount: anchors.length,
  });
  const profileTemplate = CATEGORY_CONFIG[selectedCategory];
  const fallback = fallbackAnalysis({
    category: selectedCategory,
    competitors,
    anchors: anchorData,
    coverage,
    score,
    opportunity,
  });

  let analysis = fallback;
  try {
    const raw = await deepseekJson(
      "你是严谨的餐饮市场研究员。只依据证据台账输出JSON，绝不补造经营数据或来源。",
      buildLlmPrompt({
        address: center.label,
        category: selectedCategory,
        competitors,
        anchors: anchorData,
        evidence,
        score,
        coverage,
      }),
    );
    analysis = sanitizeAnalysis(
      raw,
      fallback,
      evidence.map((item) => item.id),
      evidence,
    );
    applyLlmEvidenceSummaries(raw, evidence);
  } catch (error) {
    console.warn(
      "LLM analysis failed, using deterministic fallback:",
      error?.message || error,
    );
  }

  const priceValues = competitors.flatMap((item) =>
    [...String(item.priceBand || "").matchAll(/\d+/g)].map((match) =>
      Number(match[0]),
    ),
  );
  const priceBand = priceValues.length
    ? `${Math.min(...priceValues)}–${Math.max(...priceValues)} 元`
    : profileTemplate.defaultPriceBand;
  const hourCounts = new Map();
  for (const item of competitors) {
    if (item.hours) {
      hourCounts.set(item.hours, (hourCounts.get(item.hours) || 0) + 1);
    }
  }
  const commonHours =
    [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
    profileTemplate.defaultHours;
  const potentialScore = potentialScoreFor(score, opportunity, {
    competitorCount: competitors.length,
    anchorCount: anchorData.ids.length,
    coverage,
  });

  const profile = {
    category: selectedCategory,
    label: profileTemplate.label,
    shortLabel: profileTemplate.shortLabel,
    score,
    potentialScore,
    decisionLabel: decisionForPotential(potentialScore),
    headline: fallback.headline,
    summary: fallback.summary,
    categoryBoundary: profileTemplate.categoryBoundary,
    coverage,
    priceBand,
    openingHint: commonHours,
    opportunity,
    opportunityTitle: analysis.opportunities[0].title,
    opportunitySummary: analysis.opportunities[0].summary,
    opportunityCaution: analysis.opportunities[0].caution,
    recommendation: {
      positioning:
        analysis.recommendations.find((item) => item.area === "定位")?.detail ||
        profileTemplate.positioning,
      product:
        analysis.recommendations.find((item) => item.area === "产品")?.detail ||
        profileTemplate.product,
      price:
        analysis.recommendations.find((item) => item.area === "价格")?.detail ||
        profileTemplate.price,
      hours:
        analysis.recommendations.find((item) => item.area === "时段")?.detail ||
        profileTemplate.hours,
      channel:
        analysis.recommendations.find((item) => item.area === "渠道")?.detail ||
        profileTemplate.channel,
    },
  };

  return {
    id: `LIVE-${Date.now()}`,
    version: "MVP 0.2",
    dataMode: "live",
    sample: false,
    generatedAt: nowLabel(),
    analysisSummary: analysis.analysisSummary || fallback.analysisSummary,
    input: {
      address,
      mode,
      category: mode === "targeted" ? selectedCategory : undefined,
    },
    category: selectedCategory,
    profile,
    center: {
      lat: center.lat,
      lng: center.lng,
      label: center.label,
      precisionNote: center.precisionNote,
    },
    radii: { core: 800, max: 3000 },
    coverage,
    competitors,
    landmarks: [...anchorData.groups.entries()].map(([type, items], index) => ({
      type,
      count: items.length,
      nearestM: Math.min(...items.map((item) => item.distanceM ?? 9999)),
      names: items.slice(0, 3).map((item) => item.name),
      evidenceId: anchorData.ids[index],
    })),
    segments: analysis.segments,
    facts: analysis.facts,
    opportunities: analysis.opportunities,
    recommendations: analysis.recommendations,
    ranking,
    evidence,
    limitations: [
      ...analysis.limitations,
      `本次共找到 ${broadPois.length} 个公开餐饮地点、${competitors.length} 家同类门店、${webEvidenceCount} 组公开网页线索。`,
    ],
    diagnostics: {
      broadPoiCount: broadPois.length,
      directCompetitorCount: competitors.length,
      webEvidenceCount,
      priceCoveredCount,
      anchorCount: anchors.length,
    },
  };
}
