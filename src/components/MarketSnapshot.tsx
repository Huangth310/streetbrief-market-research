import {
  Clock3,
  MapPinned,
  Store,
} from "lucide-react";
import type { Report } from "../types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function MarketSnapshot({ report }: { report: Report }) {
  const competitors = report.competitors.slice(0, 8);
  const maxOffset = Math.max(
    ...competitors.map((item) => Math.abs(item.lat - report.center.lat) * 111),
    ...competitors.map(
      (item) =>
        Math.abs(item.lng - report.center.lng) *
        111 *
        Math.cos((report.center.lat * Math.PI) / 180),
    ),
    0.5,
  );
  const nearest = competitors[0];

  return (
    <section className="market-snapshot" aria-labelledby="snapshot-title">
      <div className="snapshot-head">
        <div>
          <span className="section-index">街区快照</span>
          <h2 id="snapshot-title">从周边门店到开店判断</h2>
        </div>
        <p>
          {report.profile.categoryBoundary ||
            "只统计与你准备经营的方向直接重合的门店，相近方向只用来理解消费场景。"}
        </p>
      </div>

      <div className="snapshot-flow">
        <div className="snapshot-map" aria-label="周边同类门店位置示意">
          <svg
            className="snapshot-map-art"
            viewBox="0 0 800 390"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              className="snapshot-road snapshot-road-main"
              d="M-30 305 C170 238 268 261 430 188 S690 105 830 128"
            />
            <path
              className="snapshot-road snapshot-road-side"
              d="M230 -30 C251 87 301 141 336 219 S376 329 361 420"
            />
            <path
              className="snapshot-road snapshot-road-side"
              d="M613 -20 C590 89 552 153 520 238 S470 335 480 418"
            />
            <path
              className="snapshot-walkway"
              d="M84 75 C225 104 279 114 381 197 S624 316 762 321"
            />
            <rect className="snapshot-block" x="56" y="35" width="125" height="67" />
            <rect className="snapshot-block" x="289" y="55" width="103" height="55" />
            <rect className="snapshot-block" x="603" y="198" width="120" height="61" />
            <rect className="snapshot-block" x="96" y="244" width="97" height="63" />
          </svg>
          <span className="snapshot-ring ring-a" />
          <span className="snapshot-ring ring-b" />
          <span className="snapshot-map-kicker">
            调研位置：{report.input.address} · 3 公里范围
          </span>
          <span className="snapshot-center">
            <span className="snapshot-center-icon">
              <MapPinned size={19} />
            </span>
          </span>
          {competitors.map((item, index) => {
            const latOffset = (item.lat - report.center.lat) * 111;
            const lngOffset =
              (item.lng - report.center.lng) *
              111 *
              Math.cos((report.center.lat * Math.PI) / 180);
            let x = (lngOffset / maxOffset) * 34;
            let y = -(latOffset / maxOffset) * 34;
            const distanceFromCenter = Math.hypot(x, y);
            const minimumDistance = 18;
            if (distanceFromCenter < minimumDistance) {
              const scale =
                distanceFromCenter > 0
                  ? minimumDistance / distanceFromCenter
                  : 1;
              x = distanceFromCenter > 0 ? x * scale : minimumDistance;
              y = distanceFromCenter > 0 ? y * scale : 0;
            }
            const left = clamp(50 + x, 12, 88);
            const top = clamp(50 + y, 14, 86);
            return (
              <span
                className={`snapshot-store ${
                  index < 4 ? "has-label" : ""
                } ${index === 0 ? "is-nearest" : ""} ${
                  left > 58 ? "label-left" : "label-right"
                }`}
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                }}
                key={item.id}
              >
                <span className="snapshot-store-pin">
                  <Store size={13} />
                  <b>{String(index + 1).padStart(2, "0")}</b>
                </span>
                {index < 4 && (
                  <span className="snapshot-store-label">
                    <b>{item.name}</b>
                    <small>{item.distanceM} 米</small>
                  </span>
                )}
              </span>
            );
          })}
          <div className="snapshot-map-legend">
            <span>
              <i className="legend-center" />
              调研位置
            </span>
            <span>
              <i className="legend-store" />
              同类门店
            </span>
            <span>
              <i className="legend-radius" />
              参考范围
            </span>
          </div>
        </div>

        <div className="snapshot-metrics">
          <div>
            <Store size={16} />
            <span>同类门店</span>
            <strong>{report.competitors.length} 家</strong>
            <small>
              {nearest ? `最近 ${nearest.distanceM} 米` : "暂无同类门店"}
            </small>
          </div>
          <div>
            <MapPinned size={16} />
            <span>公开价格</span>
            <strong>{report.profile.priceBand}</strong>
            <small>
              {report.competitors.filter((item) => item.priceBand).length} 家可比
            </small>
          </div>
          <div>
            <Clock3 size={16} />
            <span>常见营业时间</span>
            <strong>{report.profile.openingHint}</strong>
            <small>
              {report.competitors.filter((item) => item.hours).length} 家公开
            </small>
          </div>
        </div>

      </div>
    </section>
  );
}
