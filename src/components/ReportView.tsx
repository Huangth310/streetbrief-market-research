import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeInfo,
  Check,
  ChevronRight,
  CircleAlert,
  Database,
  ExternalLink,
  FileSearch,
  Filter,
  MapPin,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Brand } from "./Brand";
import { EvidenceDrawer } from "./EvidenceDrawer";
import { MapPanel } from "./MapPanel";
import { MarketSnapshot } from "./MarketSnapshot";
import { SummaryModal } from "./SummaryModal";
import { buildDemoReport } from "../lib/analysis";
import {
  potentialMeta,
  scoreToPotentialScore,
} from "../lib/potential";
import type {
  AnalysisInput,
  CategoryKey,
  Competitor,
  Evidence,
  OpportunityType,
  Report,
} from "../types";

interface ReportViewProps {
  initialReport: Report;
  onRestart: () => void;
  onReanalyze: (input: AnalysisInput) => void;
  onEvidenceError: (message: string) => void;
}

type DistanceFilter = "all" | "core" | "near" | "outer";
type CompletenessFilter = "all" | "deep";

const opportunityLabels: Record<OpportunityType, string> = {
  gap: "细分空位",
  mature_entry: "已有竞争",
  insufficient: "资料不足",
};

function EvidenceLinks({
  ids,
  onOpen,
}: {
  ids: string[];
  onOpen: (ids: string[]) => void;
}) {
  return (
    <button
      type="button"
      className="evidence-links"
      onClick={() => onOpen(ids)}
    >
      <FileSearch size={13} />
      查看 {ids.length} 条依据
    </button>
  );
}

export function ReportView({
  initialReport,
  onRestart,
  onReanalyze,
  onEvidenceError,
}: ReportViewProps) {
  const [report, setReport] = useState(initialReport);
  const [distanceFilter, setDistanceFilter] =
    useState<DistanceFilter>("all");
  const [completenessFilter, setCompletenessFilter] =
    useState<CompletenessFilter>("all");
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<
    string | null
  >(null);
  const [evidenceForDrawer, setEvidenceForDrawer] = useState<Evidence[] | null>(
    null,
  );
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [startedOpen, setStartedOpen] = useState(
    initialReport.input.mode === "discover",
  );
  const isDiscoveryMode = report.input.mode === "discover";
  const recommendationRank =
    report.ranking.findIndex((item) => item.category === report.category) + 1;
  const recommendationItem = report.ranking[recommendationRank - 1];
  const activeRadius =
    distanceFilter === "core"
      ? 800
      : distanceFilter === "near"
        ? 1500
        : distanceFilter === "outer"
          ? 3000
          : null;

  const filteredCompetitors = useMemo(() => {
    const distanceLimit =
      distanceFilter === "core"
        ? 800
        : distanceFilter === "near"
          ? 1500
          : distanceFilter === "outer"
            ? 3000
            : Number.POSITIVE_INFINITY;

    return report.competitors.filter((item) => {
      const withinDistance = item.distanceM <= distanceLimit;
      const isDeep =
        completenessFilter === "all" || item.completeness >= 60;
      return withinDistance && isDeep;
    });
  }, [report.competitors, distanceFilter, completenessFilter]);

  const selectedCompetitor =
    report.competitors.find((item) => item.id === selectedCompetitorId) ?? null;

  function openEvidence(ids: string[]) {
    const evidence = report.evidence.filter((item) => ids.includes(item.id));
    if (evidence.length === 0) {
      onEvidenceError("当前结论没有可打开的资料来源，请重新开始调研。");
      return;
    }
    setEvidenceForDrawer(evidence);
  }

  function selectCategory(category: CategoryKey) {
    if (report.dataMode === "live") {
      onReanalyze({
        ...report.input,
        mode: "targeted",
        category,
      });
      return;
    }

    const nextReport = buildDemoReport({
      ...report.input,
      mode: "targeted",
      category,
    });
    setReport(nextReport);
    setSelectedCompetitorId(null);
    setDistanceFilter("all");
    setCompletenessFilter("all");
    document
      .getElementById("report-main")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const verdictEvidenceIds = Array.from(
    new Set(
      report.opportunities[0]?.evidenceIds?.length
        ? report.opportunities[0].evidenceIds
        : report.facts.flatMap((fact) => fact.evidenceIds),
    ),
  ).slice(0, 5);
  const knownPriceCount = report.competitors.filter(
    (item) => item.priceBand,
  ).length;
  const coreCompetitorCount = report.competitors.filter(
    (item) => item.distanceM <= report.radii.core,
  ).length;
  const visibleOpportunities = report.opportunities.slice(0, 1);
  const landmarkEvidenceIds =
    report.landmarks?.map((item) => item.evidenceId).slice(0, 4) ?? [];
  const competitorEvidenceIds = report.competitors
    .slice(0, 4)
    .flatMap((item) => item.evidenceIds.slice(0, 1));
  const potentialEvidenceIds =
    report.segments[0]?.evidenceIds.slice(0, 4) ?? [];
  const potentialScore =
    report.profile.potentialScore ??
    scoreToPotentialScore(
      report.profile.score,
      report.profile.opportunity,
    );
  const potential = potentialMeta[potentialScore];

  function selectCompetitor(competitor: Competitor) {
    setSelectedCompetitorId((current) =>
      current === competitor.id ? null : competitor.id,
    );
  }

  return (
    <div className="report-shell">
      <header className="report-header no-print">
        <Brand compact onHome={onRestart} />
        <div className="report-header-center">
          <span>本次调研</span>
          <strong>
            {report.input.category ? report.profile.label : "未指定品类"} ·{" "}
            {report.input.address}
          </strong>
        </div>
        <div className="report-actions">
          <button type="button" onClick={onRestart}>
            <ArrowLeft size={16} />
            新调研
          </button>
          <button type="button" onClick={() => setSummaryOpen(true)}>
            <Printer size={16} />
            一页分析
          </button>
        </div>
      </header>

      <main className="report-page" id="report-main">
        <section className="report-cover">
          <div className="report-cover-copy">
            <div className="report-breadcrumb">
              <span>{isDiscoveryMode ? "经营方向推荐" : "周边市场调研"}</span>
              <ChevronRight size={13} />
              <span>
                {isDiscoveryMode ? "五类方向比较" : report.profile.label}
              </span>
              <span className="sample-pill">
                <Database size={12} />
                {report.sample
                  ? "演示缓存"
                  : report.cacheHit
                    ? "实时结果 · 缓存命中"
                    : "本次实时调研"}
              </span>
              <span className="report-data-date">
                {report.generatedAt} 更新
              </span>
            </div>
            <h1>
              {isDiscoveryMode ? (
                <>
                  优先验证
                  <br />
                  <span className="recommendation-highlight">
                    {report.profile.label}
                  </span>
                </>
              ) : (
                report.profile.headline
              )}
            </h1>
            <p className="report-address">
              <MapPin size={16} />
              {report.input.address}
            </p>
            {report.center.precisionNote && (
              <p className="location-precision-note">
                {report.center.precisionNote}
              </p>
            )}
            <p className="report-summary">
              {isDiscoveryMode
                ? `在五类经营方向中排第 ${recommendationRank || 1}。${recommendationItem?.note || "公开资料相对更完整。"}接下来建议：${report.profile.opportunityTitle}。这是首轮验证顺序，不代表销量或盈利预测。`
                : report.profile.summary}
            </p>
            <div className="report-cover-meta">
              <span>
                <b>{report.competitors.length}</b>
                同类门店
              </span>
              <span>
                <b>{report.profile.priceBand}</b>
                公开价格
              </span>
              <span>
                <b>{coreCompetitorCount}</b>
                800 米内
              </span>
            </div>
          </div>
          <div className="report-verdict">
            <span className="verdict-type">
              {isDiscoveryMode ? "方向优先度" : "开店潜力"}
            </span>
            <div
              className="potential-meter"
              aria-label={`开店潜力 ${potentialScore} 分，满分 5 分`}
            >
              {[1, 2, 3, 4, 5].map((score) => (
                <i
                  className={
                    score <= potentialScore ? "is-filled" : ""
                  }
                  key={score}
                />
              ))}
            </div>
            <div className="potential-heading">
              <strong>{potentialScore}/5</strong>
              <span>{potential.label}</span>
            </div>
            <p className="potential-decision">{report.profile.decisionLabel}</p>
            <small className="potential-scale">1 代表潜力低，5 代表潜力高</small>
            <button
              type="button"
              className="text-link"
              onClick={() => openEvidence(verdictEvidenceIds)}
            >
              查看判断依据
              <ArrowRight size={14} />
            </button>
          </div>
        </section>

        {startedOpen && (
          <section className="report-section ranking-section">
            <div className="section-heading-row">
              <div>
                <span className="section-index">方向排序</span>
                <h2>五个方向，谁更值得先试</h2>
              </div>
              <p className="heading-note">
                排序依据是公开门店数量、资料完整度与周边人群，不代表销量预测。
              </p>
            </div>
            <div className="ranking-list">
              {report.ranking.map((item, index) => (
                <button
                  type="button"
                  className={`ranking-row ${
                    item.category === report.category ? "is-current" : ""
                  }`}
                  key={item.category}
                  onClick={() => selectCategory(item.category)}
                >
                  <span className="ranking-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="ranking-main">
                    <div>
                      <strong>{item.label}</strong>
                      <span className="potential-mini">
                        优先度 {item.potentialScore}/5
                      </span>
                    </div>
                    <p>{item.note}</p>
                    {item.category === report.category && (
                      <span className="ranking-recommendation">
                        当前建议先验证
                      </span>
                    )}
                  </div>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
          </section>
        )}

        <MarketSnapshot report={report} />

        <section className="report-section area-overview-section">
          <div className="section-heading-row">
            <div>
              <span className="section-index">附近概况</span>
              <h2>这条街的基本情况</h2>
            </div>
            <button
              type="button"
              className="outline-button"
              onClick={() =>
                openEvidence(
                  Array.from(
                    new Set([
                      ...landmarkEvidenceIds,
                      ...competitorEvidenceIds,
                      ...potentialEvidenceIds,
                    ]),
                  ),
                )
              }
            >
              <FileSearch size={16} />
              查看全部资料
            </button>
          </div>

          <div className="area-overview-grid">
            <article className="area-overview-card">
              <span className="overview-label">街区概况</span>
              <h3>附近能识别到的地点</h3>
              <div className="overview-list">
                {(report.landmarks ?? []).map((landmark) => (
                  <div key={landmark.type}>
                    <span>{landmark.type}</span>
                    <strong>
                      {landmark.names.slice(0, 2).join("、")}
                      {landmark.count > 2 ? "等" : ""}
                    </strong>
                    <small>
                      共 {landmark.count} 处，最近 {landmark.nearestM} 米
                    </small>
                  </div>
                ))}
              </div>
              <EvidenceLinks
                ids={landmarkEvidenceIds}
                onOpen={openEvidence}
              />
            </article>

            <article className="area-overview-card">
              <span className="overview-label">门店概况</span>
              <h3>{report.competitors.length} 家同类门店</h3>
              <p>
                {report.competitors
                  .slice(0, 3)
                  .map((item) => `${item.name}（${item.distanceM} 米）`)
                  .join("、") || "附近暂未找到同类门店"}
              </p>
              <div className="overview-facts">
                <span>
                  公开价格 <b>{report.profile.priceBand}</b>
                </span>
                <span>
                  常见营业时间 <b>{report.profile.openingHint}</b>
                </span>
              </div>
              <EvidenceLinks
                ids={competitorEvidenceIds}
                onOpen={openEvidence}
              />
            </article>

            <article className="area-overview-card">
              <span className="overview-label">潜力概况</span>
              <h3>可能来的客群</h3>
              <div className="overview-segment-list">
                {report.segments.map((segment) => (
                  <div key={segment.id}>
                    <span>
                      {segment.level === "core"
                        ? "主要"
                        : segment.level === "secondary"
                          ? "其次"
                          : "潜在"}
                    </span>
                    <strong>{segment.title}</strong>
                    <p>{segment.description}</p>
                  </div>
                ))}
              </div>
              <EvidenceLinks
                ids={potentialEvidenceIds}
                onOpen={openEvidence}
              />
            </article>
          </div>
        </section>

        <section className="report-section map-section">
          <div className="section-heading-row">
            <div>
              <span className="section-index">周边门店</span>
              <h2>周边同类门店</h2>
            </div>
            <span className="heading-note">
              共 {report.competitors.length} 家，点地图或列表查看详情
            </span>
          </div>

          <div className="map-toolbar">
            <div className="toolbar-group" aria-label="按距离筛选">
              <span>
                <Filter size={14} />
                距离
              </span>
              {[
                ["all", "全部"],
                ["core", "800m"],
                ["near", "1.5km"],
                ["outer", "3km"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  className={distanceFilter === value ? "is-active" : ""}
                  key={value}
                  onClick={() => setDistanceFilter(value as DistanceFilter)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="toolbar-group" aria-label="按资料完整度筛选">
              <button
                type="button"
                className={completenessFilter === "all" ? "is-active" : ""}
                onClick={() => setCompletenessFilter("all")}
              >
                全部资料
              </button>
              <button
                type="button"
                className={completenessFilter === "deep" ? "is-active" : ""}
                onClick={() => setCompletenessFilter("deep")}
              >
                资料齐全
              </button>
            </div>
          </div>

          <div className="map-list-layout">
            <MapPanel
              report={report}
              competitors={filteredCompetitors}
              activeRadius={activeRadius}
              selectedId={selectedCompetitorId}
              onSelect={selectCompetitor}
              onClearSelection={() => setSelectedCompetitorId(null)}
              onEvidence={openEvidence}
            />

            <div className="competitor-panel">
              <div className="competitor-panel-head">
                <span>显示 {filteredCompetitors.length} 家</span>
                <span>按距离排序</span>
              </div>
              <div className="competitor-list">
                {filteredCompetitors.map((competitor) => (
                  <button
                    type="button"
                    className={`competitor-row ${
                      selectedCompetitorId === competitor.id
                        ? "is-selected"
                        : ""
                    }`}
                    key={competitor.id}
                    onClick={() => selectCompetitor(competitor)}
                  >
                    <span
                      className={`completeness-dot ${
                        competitor.completeness >= 60 ? "is-deep" : "is-sparse"
                      }`}
                    />
                    <div className="competitor-main">
                      <div>
                        <strong>{competitor.name}</strong>
                        <span>{competitor.distanceM}m</span>
                      </div>
                      <p>{competitor.concept}</p>
                      <small>
                        {competitor.hours ?? "营业时间未获取"}
                        {competitor.priceBand &&
                          ` · ${competitor.priceBand}`}
                      </small>
                    </div>
                    <span className="completeness-score">
                      {competitor.completeness >= 60
                        ? "资料齐全"
                        : "资料待补"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="map-range-note">
            圆环显示当前距离筛选范围，不代表精确步行等时圈。
          </p>

          {selectedCompetitor && (
            <div className="competitor-detail-strip">
              <div>
                <span className="section-index">门店详情</span>
                <h3>{selectedCompetitor.name}</h3>
                <p>
                  {selectedCompetitor.concept}
                  {selectedCompetitor.reviewCount
                    ? ` · ${selectedCompetitor.reviewCount} 条公开评价`
                    : ""}
                </p>
              </div>
              <div className="tactic-list">
                {selectedCompetitor.tactics.map((tactic) => (
                  <span key={tactic}>
                    <Check size={13} />
                    {tactic}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="outline-button"
                onClick={() => openEvidence(selectedCompetitor.evidenceIds)}
              >
                <FileSearch size={16} />
                查看资料
              </button>
            </div>
          )}

          {filteredCompetitors.some((item) => item.completeness < 60) && (
            <p className="inline-warning">
              <CircleAlert size={15} />
              资料较少的门店只出现在总览，不参与价格比较。
            </p>
          )}
        </section>

        <section className="report-section opportunity-section">
          <div className="section-heading-row">
            <div>
              <span className="section-index">经营机会</span>
              <h2>适合先测试的方向</h2>
            </div>
          </div>
          <div className="opportunity-stack">
            {visibleOpportunities.map((opportunity) => (
              <article
                className={`opportunity-card opportunity-${opportunity.type}`}
                key={opportunity.id}
              >
                <div className="opportunity-tag">
                  {opportunity.type === "gap" ? (
                    <Sparkles size={16} />
                  ) : opportunity.type === "mature_entry" ? (
                    <ShieldCheck size={16} />
                  ) : (
                    <BadgeInfo size={16} />
                  )}
                  {opportunityLabels[opportunity.type]}
                </div>
                <div className="opportunity-copy">
                  <h3>{opportunity.title}</h3>
                  <p>{opportunity.summary}</p>
                </div>
                <div className="opportunity-rationale">
                  <div>
                    <span>依据资料</span>
                    <p>{opportunity.rationale}</p>
                  </div>
                  <div>
                    <span>注意事项</span>
                    <p>{opportunity.caution}</p>
                  </div>
                </div>
                <div className="opportunity-foot">
                  <EvidenceLinks
                    ids={opportunity.evidenceIds}
                    onOpen={openEvidence}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="report-section strategy-section">
          <div className="section-heading-row">
            <div>
              <span className="section-index">经营策略</span>
              <h2>具体怎么做</h2>
            </div>
            <button
              type="button"
              className="outline-button"
              onClick={() => setSummaryOpen(true)}
            >
              <Printer size={16} />
              一页分析
            </button>
          </div>
          <div className="strategy-list">
            {report.recommendations.map((item, index) => (
              <article className="strategy-row" key={item.id}>
                <div className="strategy-index-wrap">
                  <strong>{index + 1}</strong>
                  <span className="strategy-area">{item.area}</span>
                </div>
                <div className="strategy-main">
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                  <div className="verification-line">
                    <Search size={14} />
                    <span>观察指标：{item.verification}</span>
                  </div>
                </div>
                <EvidenceLinks
                  ids={item.evidenceIds}
                  onOpen={openEvidence}
                />
              </article>
            ))}
          </div>
        </section>

        <section className="report-section evidence-summary-section">
          <div className="section-heading-row">
            <div>
              <span className="section-index">资料来源</span>
              <h2>资料来源</h2>
            </div>
            <button
              type="button"
              className="outline-button"
              onClick={() =>
                openEvidence(report.evidence.map((item) => item.id))
              }
            >
              <FileSearch size={16} />
              打开完整底稿
            </button>
          </div>
          <div className="evidence-ledger">
            {report.evidence.slice(0, 6).map((evidence) => (
              <button
                type="button"
                className="ledger-row"
                key={evidence.id}
                onClick={() => openEvidence([evidence.id])}
              >
                <span className="ledger-id">{evidence.id}</span>
                <span className="ledger-copy">
                  <strong>{evidence.title}</strong>
                  <small>
                    {evidence.summary || evidence.excerpt.slice(0, 100)}
                  </small>
                </span>
                <ExternalLink size={14} />
              </button>
            ))}
          </div>
          <div className="limitations">
            <span>
              <CircleAlert size={15} />
              数据说明
            </span>
            <p>{report.limitations[0]}</p>
            {report.limitations.length > 1 && (
              <details>
                <summary>查看其他说明</summary>
                <ul>
                  {report.limitations.slice(1).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </section>

        <section className="report-end no-print">
          <div>
            <span>换一个位置，再做一次调研。</span>
            <h2>看看另一条街。</h2>
          </div>
          <button type="button" className="primary-action" onClick={onRestart}>
            新建调研
            <ArrowRight size={18} />
          </button>
        </section>
      </main>

      {evidenceForDrawer && (
        <EvidenceDrawer
          evidence={evidenceForDrawer}
          onClose={() => setEvidenceForDrawer(null)}
        />
      )}
      {summaryOpen && (
        <SummaryModal report={report} onClose={() => setSummaryOpen(false)} />
      )}
    </div>
  );
}
