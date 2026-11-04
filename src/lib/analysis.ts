import {
  buildDemoCompetitors,
  buildDemoEvidence,
  categoryProfiles,
  categoryRanking,
  DEMO_CENTER,
  sharedEvidenceIds,
} from "../data/demo";
import type {
  AnalysisInput,
  CategoryKey,
  Report,
} from "../types";

const supportedCategories: CategoryKey[] = [
  "coffee",
  "light",
  "tea",
  "bakery",
  "snack",
];

export function isCategoryKey(value: string): value is CategoryKey {
  return supportedCategories.includes(value as CategoryKey);
}

export function buildDemoReport(input: AnalysisInput): Report {
  const category = input.category ?? "coffee";
  const profile = categoryProfiles[category];
  const competitors = buildDemoCompetitors(category);
  const evidence = buildDemoEvidence(category);
  const analysisSummary =
    profile.opportunity === "insufficient"
      ? `${profile.opportunitySummary} 当前资料还不足以支持直接投入，先补充周边到店和价格信息。`
      : `${profile.opportunitySummary} 结合已记录的价格与营业时间，首店应先验证一个主要消费时段，再决定产品宽度和座位配置。`;

  return {
    id: `DEMO-${category.toUpperCase()}-${Date.now()}`,
    version: "MVP 0.1",
    dataMode: "demo",
    generatedAt: "2026-11-03 09:20",
    analysisSummary,
    input,
    category,
    profile,
    center: {
      ...DEMO_CENTER,
      label: input.address || DEMO_CENTER.label,
    },
    radii: {
      core: 800,
      max: 3000,
    },
    coverage: profile.coverage,
    competitors,
    landmarks: [
      {
        type: "教育设施",
        count: 2,
        nearestM: 260,
        names: ["样例·教学楼", "样例·图书馆"],
        evidenceId: "E01",
      },
      {
        type: "办公设施",
        count: 3,
        nearestM: 410,
        names: ["样例·创新中心", "样例·行政楼"],
        evidenceId: "E04",
      },
      {
        type: "居住设施",
        count: 2,
        nearestM: 520,
        names: ["样例·学生公寓", "样例·社区住宅"],
        evidenceId: "E06",
      },
    ],
    evidence,
    ranking: categoryRanking,
    segments: [
      {
        id: "S1",
        level: "core",
        title: "校区学生与教职员工",
        description:
          "距离、公开营业时段和评价中的“课间快取/早间方便”共同指向高频日常消费。",
        evidenceIds: ["E01", "E02", "E21"],
      },
      {
        id: "S2",
        level: "secondary",
        title: "周边办公与社区居民",
        description:
          "演示资料记录了周边办公与居住地点，公开营业时间覆盖午间和晚间。",
        evidenceIds: ["E04", "E20"],
      },
      {
        id: "S3",
        level: "potential",
        title: "晚间到店与回校人群",
        description:
          "演示样本中只有少数门店公开营业超过 22:00，20:00 后的订单与到店人数没有记录。",
        evidenceIds: ["E06", "E22"],
      },
    ],
    facts: [
      {
        id: "F1",
        layer: "fact",
        title: "1 公里内有 4 家演示同类门店",
        detail:
          "最近一家约 120 米，3 家位于 800 米内。公开时间最早从 07:30 开始。",
        implication:
          "附近顾客已经有可以比较的同类门店，新店需要把产品、速度或停留体验做出清楚区别。",
        confidence: "medium",
        evidenceIds: ["E01", "E02", "E03", "E08"],
      },
      {
        id: "F2",
        layer: "proxy",
        title: "公开摘要反复提到出餐速度和排队",
        detail:
          "演示短摘录里，顾客同时提到“出餐快”“高峰排队”和“座位少”，也提到价格与停留体验。",
        implication:
          "菜单数量与动线会直接影响高峰时段体验，门店需要提前安排出杯和取餐位置。",
        confidence: "medium",
        evidenceIds: ["E21", "E01", "E02"],
      },
      {
        id: "F3",
        layer: "inference",
        title: "有门店营业到 22:30，但缺少停留人数记录",
        detail:
          "演示样本中，一家门店公开营业至 22:30，另一家营业至 23:00；没有门店的真实停留时长或下午进店人数。",
        implication:
          "可以先保留少量座位，记录下午进店、停留和离店时间，再决定是否扩大堂食面积。",
        confidence: "low",
        evidenceIds: ["E04", "E21", "E22"],
      },
    ],
    opportunities: [
      {
        id: "O1",
        type: profile.opportunity,
        title: profile.opportunityTitle,
        summary: profile.opportunitySummary,
        rationale:
          `800 米内有 3 家同类门店，公开价格覆盖 ${profile.priceBand}；周边可以看到校区、办公和居住地点。`,
        caution: profile.opportunityCaution,
        confidence:
          profile.opportunity === "insufficient"
            ? "low"
            : profile.coverage >= 70
              ? "medium"
              : "low",
        evidenceIds: sharedEvidenceIds,
      },
      {
        id: "O2",
        type: "mature_entry",
        title: "直接竞争已经形成基本门槛",
        summary:
          "近端玩家通过稳定营业、基础产品与快取效率争夺日常复购；进入者需要明确自己的主场景。",
        rationale:
          "同类门店数量、公开营业时段与评价中的效率主题相互印证。",
        caution:
          "同类门店多不等于一定饱和；当前只能说明顾客有选择，不能证明每一家都经营良好。",
        confidence: "medium",
        evidenceIds: ["E01", "E02", "E04", "E21"],
      },
      {
        id: "O3",
        type: "insufficient",
        title: "夜间与真实客流无法可靠判断",
        summary:
          "公开页面能观察营业时间，但看不到真实到店人数、订单和销售。",
        rationale:
          "缺少可靠的夜间客流、销量和消费频次数据，不能把晚营业样本外推成夜间机会。",
        caution:
          "需要线下时段观察或用户自有经营数据补证，P0 不输出夜间进入建议。",
        confidence: "low",
        evidenceIds: ["E22", "E21"],
      },
    ],
    recommendations: [
      {
        id: "R1",
        area: "定位",
        title: "先服务校区学生与教职员工的日常快取",
        detail: profile.recommendation.positioning,
        verification:
          "开业前用 3 个工作日观察 11:30–13:30 与 14:00–17:00 的进店和停留行为。",
        evidenceIds: ["E01", "E02", "E21"],
      },
      {
        id: "R2",
        area: "产品",
        title: "首批保留 6 至 8 个单品",
        detail: profile.recommendation.product,
        verification:
          "试营业只保留核心 SKU，记录售罄时间与复购，不先靠长菜单覆盖所有客群。",
        evidenceIds: ["E20", "E21"],
      },
      {
        id: "R3",
        area: "价格",
        title: `公开可比价格带指向 ${profile.priceBand}`,
        detail: profile.recommendation.price,
        verification:
          "上线后分别观察基础款、主推款和组合款的占比，避免只用引流价判断需求。",
        evidenceIds: ["E20", "E01", "E02"],
      },
      {
        id: "R4",
        area: "时段",
        title: "营业时间先覆盖 07:30 至 20:30",
        detail: profile.recommendation.hours,
        verification:
          "根据公开营业时段设置对照，至少连续一周记录不同时段的真实订单与出品压力。",
        evidenceIds: ["E08", "E22"],
      },
      {
        id: "R5",
        area: "渠道",
        title: "首周分开记录到店、外卖和团购订单",
        detail: profile.recommendation.channel,
        verification:
          "分别记录到店、提前点单、团购与外卖来源，避免把一次性低价订单算作复购。",
        evidenceIds: ["E06", "E20", "E21"],
      },
    ],
    limitations: [
      "当前报告使用内置演示样本，不代表真实商户、真实客流或真实销售。",
      "地图只展示近似 800 米核心圈与 3 公里上限，不代表精确步行等时圈。",
      "缺少公开菜单的同类门店只保留在总览，不进入价格对比。",
      "公开评价主题是代理信号，无法替代真实访谈、到店观察或经营数据。",
    ],
    sample: true,
  };
}

export async function analyzeMarket(
  input: AnalysisInput,
  forceDemo = false,
): Promise<Report> {
  const demoMode = import.meta.env.VITE_DEMO_MODE !== "false";
  if (!demoMode && !forceDemo) {
    const configuredBase = String(
      import.meta.env.VITE_ANALYSIS_API_URL || "",
    ).replace(/\/+$/, "");
    const apiBase =
      configuredBase && !configuredBase.includes("localhost:8787")
        ? configuredBase
        : "";

    async function requestReport() {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 75_000);
      try {
        const response = await fetch(`${apiBase}/api/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
          signal: controller.signal,
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          const error = new Error(
            body.error ||
              (response.status >= 500
                ? "调研服务刚刚启动，暂时没有响应"
                : `调研服务返回 ${response.status}`),
          ) as Error & { retryable?: boolean };
          error.retryable = [500, 502, 503, 504].includes(response.status);
          throw error;
        }
        return (await response.json()) as Report;
      } catch (error) {
        if (controller.signal.aborted) {
          throw new Error("这次调研用时过长，请换一个更具体的地址后重试");
        }
        if (error instanceof TypeError) {
          error.message = "网络连接暂时不稳定";
          (error as Error & { retryable?: boolean }).retryable = true;
        }
        throw error;
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await requestReport();
      } catch (error) {
        const canRetry =
          attempt === 0 &&
          error instanceof Error &&
          (error as Error & { retryable?: boolean }).retryable;
        if (!canRetry) throw error;
        await new Promise((resolve) => window.setTimeout(resolve, 1_200));
      }
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 460));
  return buildDemoReport(input);
}
