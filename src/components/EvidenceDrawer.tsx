import { useEffect, useRef } from "react";
import { ExternalLink, FileText, X } from "lucide-react";
import type { Evidence } from "../types";

interface EvidenceDrawerProps {
  evidence: Evidence[];
  onClose: () => void;
}

function cleanTitle(value: string) {
  const firstSection = value.split(/\s+[|｜]\s+|\s+-\s+/)[0]?.trim();
  return (firstSection || value).slice(0, 72);
}

export function EvidenceDrawer({ evidence, onClose }: EvidenceDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const hasSynthetic = evidence.some((item) => item.synthetic);

  useEffect(() => {
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="overlay-layer" role="presentation" onMouseDown={onClose}>
      <aside
        className="evidence-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <span className="section-index">资料原文</span>
            <h2 id="evidence-title">来源与重点</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            ref={closeRef}
            aria-label="关闭资料来源"
          >
            <X size={19} />
          </button>
        </div>

        <div className="sample-notice">
          <FileText size={17} />
          <p>
            {hasSynthetic
              ? "这些是内置演示资料，只用于检查页面流程，不代表真实商户情况。"
              : "页面先提炼门店、价格、时间等重点，完整来源可在每张卡片底部打开。"}
          </p>
        </div>

        <div className="evidence-list">
          {evidence.map((item) => (
            <article className="evidence-card" key={item.id}>
              <div className="evidence-card-top">
                <span className="evidence-kind">
                  {item.url ? "网页资料" : "地图资料"}
                </span>
              </div>
              <h3>{cleanTitle(item.title)}</h3>
              <p className="evidence-summary">
                {item.summary || item.excerpt.slice(0, 160)}
              </p>
              {item.highlights && item.highlights.length > 0 && (
                <ul className="evidence-highlights">
                  {item.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              )}
              <details className="evidence-source-details">
                <summary>查看原始摘录与来源</summary>
                <p>{item.excerpt}</p>
                <dl>
                  <div>
                    <dt>编号</dt>
                    <dd>{item.id}</dd>
                  </div>
                  <div>
                    <dt>来源</dt>
                    <dd>{item.source}</dd>
                  </div>
                  <div>
                    <dt>日期</dt>
                    <dd>{item.capturedAt}</dd>
                  </div>
                </dl>
              </details>
              <div className="evidence-foot">
                <span>
                  {item.synthetic
                    ? "演示样本"
                    : item.url
                      ? "打开原文核对"
                      : "地图资料"}
                </span>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="打开公开来源"
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                ) : (
                  <ExternalLink size={14} aria-hidden="true" />
                )}
              </div>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}
