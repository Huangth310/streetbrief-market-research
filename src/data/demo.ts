import type {
  CategoryKey,
  CategoryProfile,
  CategoryRank,
  Evidence,
} from "../types";

export const DEMO_ADDRESS = "中山大学珠海校区东门附近";
export const DEMO_CENTER = {
  lat: 22.3484,
  lng: 113.5842,
  label: DEMO_ADDRESS,
};

export const categoryProfiles: Record<CategoryKey, CategoryProfile> = {
  coffee: {
    category: "coffee",
    label: "现萃咖啡",
    shortLabel: "咖啡",
    score: 73,
    potentialScore: 4,
    decisionLabel: "建议筹备开店",
    headline: "800 米内有 3 家咖啡店，早间快取最集中",
    summary:
      "演示资料里，最近的咖啡店约 120 米，3 家位于 800 米内。公开价格覆盖 12 至 22 元，最早 07:30 开门，一家营业到 22:30。",
    categoryBoundary:
      "茶饮和果茶会与咖啡争夺下午提神需求。这里只把以咖啡为主的门店算作同类门店。",
    coverage: 78,
    priceBand: "12–22 元",
    openingHint: "07:30–20:30",
    opportunity: "mature_entry",
    opportunityTitle: "先做稳定快取，再保留少量座位",
    opportunitySummary:
      "近端已有 3 家同类门店。演示资料显示，早晨产品以外带和基础奶咖为主，下午仍有门店营业。新店可以先把出杯速度做稳，再用少量座位承接短暂停留。",
    opportunityCaution:
      "演示资料没有真实客流和订单数据，座位数量与营业时长要用试营业记录调整。",
    recommendation: {
      positioning:
        "以校区与教职员工的日常外带为核心，下午提供少量可停留座位，不做全天候社交咖啡馆。",
      product:
        "咖啡集中为 8–10 个核心 SKU；用 2 个日常奶咖负责复购，用 1 个季节风味款制造新鲜感，搭配 3 个即拿即走的烘焙品。",
      price:
        "主力 16–18 元，外带基础款 12–15 元，季节款不超过 22 元；套餐比单杯组合低 2–3 元。",
      hours:
        "先按 07:30–20:30 营业，下午 14:00 后保留 6–10 个座位；夜间订单稳定出现前不延长到 22:00 后。",
      channel:
        "重点做步行到店与提前点单；公开页面的团购入口只作为辅助，不用低价券替代日常复购。",
    },
  },
  light: {
    category: "light",
    label: "轻食快餐",
    shortLabel: "轻食",
    score: 69,
    potentialScore: 4,
    decisionLabel: "建议筹备开店",
    headline: "轻食店集中在午间，组合价格 24 至 36 元",
    summary:
      "演示样本记录了 8 家轻食店，公开组合价格集中在 24 至 36 元。2 家缺少菜单与价格，午间产品和出餐时间仍有较多未确认信息。",
    categoryBoundary:
      "轻食、简餐和烘焙会共同争夺工作日午餐，但这里只把以轻食或简餐为主的门店算作同类门店。",
    coverage: 61,
    priceBand: "24–36 元",
    openingHint: "10:30–19:30",
    opportunity: "gap",
    opportunityTitle: "午间套餐可以做得更简单",
    opportunitySummary:
      "已有轻食店覆盖 24 至 36 元的组合价格，但在售产品较多。新店可以把主食、配菜和饮品压成清楚的固定组合，缩短点单与出餐时间。",
    opportunityCaution:
      "演示资料没有午间订单量。固定套餐是否有效，要看连续一周的售罄、退款和复购记录。",
    recommendation: {
      positioning:
        "面向校区工作日午餐，做“看得见的组合”与稳定出餐，避免同时强调减脂、社交和高客单。",
      product:
        "用 3 个固定主食碗、2 个热食卷和 2 个汤/小食组成组合；每日增加 1 个轮换款，控制后厨复杂度。",
      price:
        "主套餐 28–32 元，小份 24–26 元，饮品加购 6–8 元；不以 19.9 元长期引流。",
      hours:
        "10:30 备餐，11:30–13:30 主攻午间，17:00–19:00 只保留可提前预订的晚餐组合。",
      channel:
        "班级/办公室预订和步行自取优先；外卖只覆盖 1.5 公里内，避免配送成本吃掉组合利润。",
    },
  },
  tea: {
    category: "tea",
    label: "鲜果茶饮",
    shortLabel: "茶饮",
    score: 58,
    potentialScore: 3,
    decisionLabel: "建议先做小范围测试",
    headline: "茶饮产品重合度高，价格集中在 10 至 18 元",
    summary:
      "演示样本中的茶饮店集中在果茶、基础奶茶和低价外带。公开价格覆盖 10 至 18 元，产品重合度高，门店需要说明自己更适合哪个具体时段。",
    categoryBoundary:
      "果茶和咖啡都能满足提神、外带需求。这里只把以茶饮和果茶为主的门店算作同类门店。",
    coverage: 72,
    priceBand: "10–18 元",
    openingHint: "10:00–21:30",
    opportunity: "mature_entry",
    opportunityTitle: "用早晨或低糖产品做一个清楚的小方向",
    opportunitySummary:
      "现有门店主要表达果茶、奶茶和团购。早晨营业与低糖产品在演示资料里较少，可以先用少量单品测试，不必直接铺完整菜单。",
    opportunityCaution:
      "较少门店表达某个产品，不代表顾客需要它。测试时要同时记录购买、退款和复购。",
    recommendation: {
      positioning:
        "不要以“更便宜”作为主定位。选择一个清晰的小场景，例如早餐后低糖果茶或下午课前快速补给。",
      product:
        "菜单控制在 12 个 SKU 内，突出 2 个茶底和 2 个真实水果款；减少复杂小料与长尾配方。",
      price:
        "主力 12–16 元，鲜果款 16–18 元；把优惠设计成第二杯/加料组合，避免长期全场折扣。",
      hours:
        "先试 10:00–21:30；若早餐场景无公开需求证据，将开始时间后移到 11:00。",
      channel:
        "私域预订、校园拼单和外卖同时观察，但不把团购低价订单计入核心复购。",
    },
  },
  bakery: {
    category: "bakery",
    label: "烘焙包点",
    shortLabel: "烘焙包点",
    score: 64,
    potentialScore: 3,
    decisionLabel: "建议先做小范围测试",
    headline: "烘焙价格从 8 元起，早晨产品信息较少",
    summary:
      "演示样本记录了 8 家烘焙店，单件价格约 8 至 22 元。公开页面更多展示下午甜点和组合产品，早晨现烤与快速带走的信息较少。",
    categoryBoundary:
      "面包和甜点常与轻食、咖啡一起消费，但这里只把以烘焙为主的门店算作同类门店。",
    coverage: 66,
    priceBand: "8–22 元",
    openingHint: "07:30–19:30",
    opportunity: "gap",
    opportunityTitle: "先做早晨便携单品",
    opportunitySummary:
      "已有门店覆盖面包、甜点和组合产品。早晨营业与单件便携产品的公开信息较少，可以用 5 至 7 个单品做一轮小规模测试。",
    opportunityCaution:
      "演示资料没有早晨销量。先控制生产量，记录售罄和当天未售出数量。",
    recommendation: {
      positioning:
        "面向通勤与早课，做小规模、每日现烤、可单手带走的烘焙补给，不承担完整正餐需求。",
      product:
        "保留 2 个经典可颂/面包、2 个咸口早餐件和 1 个当日甜点；把复杂蛋糕放在预订而非常态陈列。",
      price:
        "单件 8–16 元，咖啡加烘焙组合 20–24 元；甜点与礼盒只做补充收入。",
      hours:
        "07:30–09:30 与 16:00–19:00 先作为重点时段，午间根据售出数量决定补货。",
      channel:
        "提前预订自取和晚间折扣清货并行，但需控制折扣对日常价格认知的影响。",
    },
  },
  snack: {
    category: "snack",
    label: "夜宵小吃",
    shortLabel: "夜宵小吃",
    score: 49,
    potentialScore: 1,
    decisionLabel: "暂不建议开店",
    headline: "夜间营业门店较少，现有资料不足以下结论",
    summary:
      "演示样本只记录了少量 20:00 后仍营业的小吃店，没有夜间订单、到店人数或外卖活跃度。可以继续观察，暂不适合直接投入完整夜宵店。",
    categoryBoundary:
      "夜宵与快餐、烧烤等门店可能共享夜间需求，当前只统计名称和分类明确指向小吃或夜宵的店铺。",
    coverage: 43,
    priceBand: "未获取",
    openingHint: "建议先线下观察",
    opportunity: "insufficient",
    opportunityTitle: "先用快闪或预订测试夜间需求",
    opportunitySummary:
      "少量门店营业较晚，只能说明夜间存在供给。先通过快闪、预订或共享时段记录订单，再决定是否延长营业。",
    opportunityCaution:
      "少竞争也可能代表需求不足。没有订单记录前，不把夜间营业当作确定机会。",
    recommendation: {
      positioning:
        "暂不承诺整店夜宵定位；若用户已有资源，可先用快闪、预订或与其他门店共享时段测试。",
      product:
        "如测试，只选择一个高辨识度主食与两个搭配品，不做完整夜宵菜单。",
      price:
        "根据公开价格带暂时无法可靠判断；先通过预售和现场观察收集可接受价位。",
      hours:
        "线下访问 20:30–23:00 的实际消费，再决定是否延长营业。",
      channel:
        "以外卖公开活跃度、夜间预订和校内社群需求作为补证方向。",
    },
  },
};

export const categoryRanking: CategoryRank[] = [
  {
    category: "coffee",
    label: "现萃咖啡",
    score: 73,
    potentialScore: 4,
    breakdown: {
      demand: 22,
      competition: 18,
      scenario: 16,
      differentiation: 9,
      evidence: 8,
    },
    confidence: "medium",
    missingData: ["部分门店菜单与价格", "评价主题覆盖"],
    opportunity: "mature_entry",
    labelText: "已有同类门店",
    note: "8 家演示门店，最近 120 米；常见公开价格 12–22 元。",
  },
  {
    category: "light",
    label: "轻食快餐",
    score: 69,
    potentialScore: 4,
    breakdown: {
      demand: 20,
      competition: 16,
      scenario: 15,
      differentiation: 9,
      evidence: 9,
    },
    confidence: "medium",
    missingData: ["部分门店菜单与价格", "公开评价主题"],
    opportunity: "gap",
    labelText: "已有同类门店",
    note: "8 家演示门店，其中 2 家没有公开价格。",
  },
  {
    category: "bakery",
    label: "烘焙包点",
    score: 64,
    potentialScore: 3,
    breakdown: {
      demand: 18,
      competition: 15,
      scenario: 14,
      differentiation: 9,
      evidence: 8,
    },
    confidence: "low",
    missingData: ["早餐时段真实需求", "部分门店菜单与价格"],
    opportunity: "gap",
    labelText: "已有同类门店",
    note: "8 家演示门店，公开时间覆盖 07:00 至 23:00。",
  },
  {
    category: "tea",
    label: "鲜果茶饮",
    score: 58,
    potentialScore: 3,
    breakdown: {
      demand: 16,
      competition: 19,
      scenario: 12,
      differentiation: 6,
      evidence: 5,
    },
    confidence: "medium",
    missingData: ["公开活动形式", "评价主题覆盖"],
    opportunity: "mature_entry",
    labelText: "已有同类门店",
    note: "8 家演示门店，公开产品集中在果茶和基础奶茶。",
  },
  {
    category: "snack",
    label: "夜宵小吃",
    score: 49,
    potentialScore: 1,
    breakdown: {
      demand: 10,
      competition: 20,
      scenario: 11,
      differentiation: 4,
      evidence: 4,
    },
    confidence: "low",
    missingData: ["夜间真实订单", "夜间到店观察"],
    opportunity: "insufficient",
    labelText: "资料较少",
    note: "演示样本只记录了少量夜间营业门店。",
  },
];

const pointTemplates = [
  { lat: 22.3492, lng: 113.5848, distanceM: 120, rating: 4.6, reviews: 286 },
  { lat: 22.3476, lng: 113.5851, distanceM: 410, rating: 4.4, reviews: 512 },
  { lat: 22.3468, lng: 113.5828, distanceM: 650, rating: 4.3, reviews: 134 },
  { lat: 22.3516, lng: 113.5869, distanceM: 980, rating: 4.7, reviews: 823 },
  { lat: 22.3452, lng: 113.5811, distanceM: 1220, rating: 4.2, reviews: 96 },
  { lat: 22.3428, lng: 113.5896, distanceM: 1680, rating: 4.5, reviews: 367 },
  { lat: 22.3552, lng: 113.5768, distanceM: 2260, rating: 4.1, reviews: 48 },
  { lat: 22.3458, lng: 113.5924, distanceM: 2510, rating: 4.0, reviews: 72 },
] as const;

const nameSets: Record<CategoryKey, string[]> = {
  coffee: [
    "样例·晨光咖啡",
    "样例·豆仓外带",
    "样例·图书馆咖啡站",
    "样例·海风烘焙咖啡",
    "样例·轻醒咖啡",
    "样例·晚岛咖啡",
    "样例·巷口拿铁",
    "样例·校园快取",
  ],
  light: [
    "样例·谷仓轻食",
    "样例·绿碗厨房",
    "样例·午间组合",
    "样例·三明治研究所",
    "样例·沙拉小站",
    "样例·晚风简餐",
    "样例·校门汤饭",
    "样例·轻食快取",
  ],
  tea: [
    "样例·青柚茶社",
    "样例·果粒研究所",
    "样例·课间茶站",
    "样例·山茶便利店",
    "样例·小满果茶",
    "样例·晚风茶铺",
    "样例·巷口柠檬茶",
    "样例·校园茶快取",
  ],
  bakery: [
    "样例·早麦烘焙",
    "样例·黄油面包房",
    "样例·校门面包站",
    "样例·海风甜品室",
    "样例·小炉面包",
    "样例·晚岛甜点",
    "样例·巷口吐司",
    "样例·清晨烘焙",
  ],
  snack: [
    "样例·夜巷小吃",
    "样例·校门炸物",
    "样例·晚归粉面",
    "样例·海风夜宵",
    "样例·灯下小吃",
    "样例·晚岛食堂",
    "样例·巷口串串",
    "样例·校园夜食",
  ],
};

const conceptSets: Record<CategoryKey, string[]> = {
  coffee: [
    "外带快取",
    "日常奶咖",
    "低资料样本",
    "烘焙搭配",
    "低价基础款",
    "晚间停留",
    "社区小店",
    "校园快取",
  ],
  light: [
    "午间组合",
    "沙拉主食",
    "低资料样本",
    "三明治套餐",
    "轻食外带",
    "晚间简餐",
    "汤饭饱腹",
    "校园快取",
  ],
  tea: [
    "鲜果茶",
    "高频外带",
    "低资料样本",
    "茶饮空间",
    "低价果茶",
    "晚间营业",
    "社区茶铺",
    "校园快取",
  ],
  bakery: [
    "早晨现烤",
    "日常面包",
    "低资料样本",
    "甜品礼赠",
    "小炉单品",
    "晚间去化",
    "社区面包",
    "校园早餐",
  ],
  snack: [
    "晚间外带",
    "炸物小吃",
    "低资料样本",
    "夜宵组合",
    "粉面饱腹",
    "深夜营业",
    "社区夜宵",
    "校园晚归",
  ],
};

const prices: Record<CategoryKey, Array<string | null>> = {
  coffee: ["12–22 元", "16–28 元", null, "28–42 元", "11–19 元", "20–32 元", null, "15–22 元"],
  light: ["24–32 元", "28–38 元", null, "26–36 元", "20–28 元", "32–48 元", null, "24–34 元"],
  tea: ["10–18 元", "12–20 元", null, "18–28 元", "8–14 元", "14–24 元", null, "10–18 元"],
  bakery: ["8–18 元", "10–22 元", null, "18–38 元", "9–16 元", "16–30 元", null, "8–20 元"],
  snack: ["12–25 元", "18–32 元", null, "26–45 元", "10–20 元", "22–40 元", null, "15–28 元"],
};

const hours = [
  "07:30–20:30",
  "08:00–22:30",
  "07:00–19:00",
  "09:00–22:00",
  "10:00–21:00",
  "12:00–23:00",
  null,
  "08:00–20:00",
];

const completeness = [92, 96, 58, 94, 70, 88, 35, 76];

const reviewThemes = [
  ["出餐快", "早间方便", "位置近"],
  ["选择稳定", "晚间仍营业", "座位少"],
  ["价格低", "资料不完整"],
  ["环境舒适", "价格偏高", "适合停留"],
  ["外带便宜", "高峰排队"],
  ["夜间营业", "适合聊天", "出餐偏慢"],
  ["公开资料不足"],
  ["课程间隙快取", "高峰排队"],
];

const tacticsByCategory: Record<CategoryKey, string[][]> = {
  coffee: [
    ["强调早间快取", "基础奶咖集中出杯"],
    ["稳定营业至晚间", "座位面积有限"],
    ["公开菜单未找到", "仅能确认地图基础信息"],
    ["环境与烘焙组合形成停留场景"],
    ["低价基础款", "少量外带产品"],
    ["晚间咖啡与社交场景"],
    ["公开信息不足", "不进入价格比较"],
    ["校园快取", "高峰时段排队"],
  ],
  light: [
    ["午间组合餐", "快速自取"],
    ["固定主食碗", "价格透明"],
    ["公开菜单未找到", "仅能确认基础位置"],
    ["堂食空间与套餐结构"],
    ["小份轻食", "价格较低"],
    ["晚间简餐与多人组合"],
    ["公开信息不足", "不进入深度分析"],
    ["课程间隙快取", "午间高峰"],
  ],
  tea: [
    ["鲜果产品", "高频外带"],
    ["稳定营业至晚间", "团购入口"],
    ["公开菜单未找到", "仅能确认基础位置"],
    ["茶饮空间与社交停留"],
    ["低价基础茶饮"],
    ["晚间茶饮与多人场景"],
    ["公开信息不足", "不进入价格比较"],
    ["校园快取", "高峰排队"],
  ],
  bakery: [
    ["早晨现烤", "便携单品"],
    ["日常面包", "营业至晚间"],
    ["公开菜单未找到", "仅能确认基础位置"],
    ["甜品礼赠与停留空间"],
    ["小炉单品", "低价补给"],
    ["晚间折扣去化"],
    ["公开信息不足", "不进入价格比较"],
    ["校园早餐快取", "高峰排队"],
  ],
  snack: [
    ["晚间外带", "夜间营业"],
    ["炸物与主食组合"],
    ["公开菜单未找到", "仅能确认基础位置"],
    ["夜宵组合与堂食"],
    ["低价粉面"],
    ["深夜社交场景"],
    ["公开信息不足", "不进入价格比较"],
    ["晚归快取", "高峰排队"],
  ],
};

export function buildDemoEvidence(category: CategoryKey): Evidence[] {
  const names = nameSets[category];
  const evidence: Evidence[] = names.map((name, index) => ({
    id: `E${String(index + 1).padStart(2, "0")}`,
    title: `${name} · 基础公开画像`,
    source: "演示地图样本 / 2026-11-03",
    sourceType: "map-sample",
    capturedAt: "2026-11-03 09:20",
    grade: completeness[index] >= 80 ? "A" : completeness[index] >= 60 ? "B" : "C",
    excerpt:
      index === 2 || index === 6
        ? "演示样本仅保留了位置、距离和部分基础字段，未提供可信菜单与价格。"
        : `演示样本记录：${names[index]}，距观察点约 ${pointTemplates[index].distanceM} 米，公开营业信息为 ${hours[index] ?? "未获取"}，价格带为 ${prices[category][index] ?? "未获取"}。`,
    field: index === 2 || index === 6 ? "地点基础信息" : "门店公开信息",
    synthetic: true,
  }));

  evidence.push(
    {
      id: "E20",
      title: "近端公开价格与产品覆盖",
      source: "演示公开页样本 / 2026-11-03",
      sourceType: "public-page-sample",
      capturedAt: "2026-11-03 09:20",
      grade: "B",
      excerpt:
        "演示样本中，5 家具备可比价格信息的同类门店集中在低价快取到中价停留之间；仍有 2 家缺少公开菜单，不能进入价格对比。",
      field: "产品与价格",
      synthetic: true,
    },
    {
      id: "E21",
      title: "评价主题聚合",
      source: "演示评价摘要 / 2026-11-03",
      sourceType: "review-sample",
      capturedAt: "2026-11-03 09:20",
      grade: "B",
      excerpt:
        "在可用公开短摘录中，顾客反复提到“出餐快”“高峰排队”“适合停留”和“价格偏高”；这些是代理信号，不代表真实销量。",
      field: "评价主题",
      synthetic: true,
    },
    {
      id: "E22",
      title: "营业时段覆盖",
      source: "演示地图样本 / 2026-11-03",
      sourceType: "map-sample",
      capturedAt: "2026-11-03 09:20",
      grade: "B",
      excerpt:
        "演示样本可确认 5 家门店在 19:00 前营业，晚间公开营业样本明显减少；但没有真实客流数据，不能据此证明夜间需求。",
      field: "营业时间",
      synthetic: true,
    },
  );

  return evidence;
}

export function buildDemoCompetitors(category: CategoryKey) {
  const names = nameSets[category];
  return pointTemplates.map((point, index) => ({
    id: `C${index + 1}`,
    name: names[index],
    categoryLabel: categoryProfiles[category].label,
    lat: point.lat,
    lng: point.lng,
    distanceM: point.distanceM,
    rating: point.rating,
    reviewCount: point.reviews,
    hours: hours[index],
    priceBand: prices[category][index],
    concept: conceptSets[category][index],
    tactics: tacticsByCategory[category][index],
    completeness: completeness[index],
    evidenceIds: [`E${String(index + 1).padStart(2, "0")}`],
  }));
}

export const sharedEvidenceIds = ["E20", "E21", "E22"];
