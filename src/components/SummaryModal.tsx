import { useEffect, useRef } from "react";
import { ArrowRight, Printer, X } from "lucide-react";
import { potentialMeta, scoreToPotentialScore } from "../lib/potential";
import type { Report } from "../types";

interface SummaryModalProps {
  report: Report;
  onClose: () => void;
}

function evidenceLabel(ids: string[]) {
  return `${ids.length} 条资料`;
}

export function SummaryModal({ report, onClose }: SummaryModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const potentialScore =
    report.profile.potentialScore ??
    scoreToPotentialScore(
      report.profile.score,
      report.profile.opportunity,
    );

  useEffect(() => {
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="overlay-layer summary-overlay" onMouseDown={onClose}>
      <div
        className="summary-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="summary-toolbar no-print">
          <span>一页分析</span>
          <div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => window.print()}
            >
              <Printer size={16} />
              打印
            </button>
            <button
              ref={closeRef}
              type="button"
              className="icon-button"
              onClick={onClose}
              aria-label="关闭分析摘要"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <div className="print-sheet">
          <header className="print-sheet-head">
            <div>
              <span>街研 / 开店调研</span>
              <h2 id="summary-title">{report.profile.headline}</h2>
            </div>
            <div className="summary-verdict">
              <span>开店潜力</span>
              <strong>
                {potentialScore}
                <small>/5</small>
              </strong>
              <div
                className="potential-meter"
                aria-label={`开店潜力 ${potentialScore} 分，满分 5 分`}
              >
                {[1, 2, 3, 4, 5].map((score) => (
                  <i
                    className={
                      score <= potentialScore
                        ? "is-filled"
                        : ""
                    }
                    key={score}
                  />
                ))}
              </div>
              <p>
                {potentialMeta[potentialScore].label}，
                {report.profile.decisionLabel}
              </p>
            </div>
          </header>

          <div className="summary-meta">
            <span>{report.input.address}</span>
            <span>{report.profile.label}</span>
            <span>
              {report.sample ? "演示样本" : "实时分析"} · {report.generatedAt}
            </span>
          </div>

          <p className="summary-lead">
            {report.analysisSummary || report.profile.summary}
          </p>

          <section className="summary-evidence-section">
            <h3>判断依据</h3>
            <ol>
              {report.facts.map((fact) => (
                <li key={fact.id}>
                  <strong>{fact.title}</strong>
                  <span>{fact.implication}</span>
                  <small>{evidenceLabel(fact.evidenceIds)}</small>
                </li>
              ))}
            </ol>
          </section>

          <section className="summary-strategy-section">
            <h3>经营策略</h3>
            <div className="summary-strategy-list">
              {report.recommendations.slice(0, 5).map((item, index) => (
                <article key={item.id}>
                  <span className="summary-strategy-number">{index + 1}</span>
                  <div>
                    <span className="strategy-area">{item.area}</span>
                    <h4>{item.title}</h4>
                    <p>{item.detail}</p>
                    <small>观察指标：{item.verification}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <p className="summary-caution">
            {report.opportunities[0]?.caution ||
              "报告没有使用真实客流、销售额或销量数据。"}
          </p>

          <footer className="summary-footer">
            <span>
              {report.sample
                ? "这是演示缓存，不含真实客流、销售额或利润数据。"
                : "本报告不含真实客流、销售额或利润预测，关键事实可在完整报告中核对。"}
            </span>
            <span>
              查看完整报告
              <ArrowRight size={14} />
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}
