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
          <h2 id="snapshot-title">从附近地点到开店判断</h2>
        </div>
        <p>
          {report.profile.categoryBoundary ||
            "直接竞品按门店主要产品分别统计，相近品类只用于理解消费场景。"}
        </p>
      </div>

      <div className="snapshot-flow">
        <div className="snapshot-map" aria-label="附近竞品位置示意">
          <span className="snapshot-ring ring-a" />
          <span className="snapshot-ring ring-b" />
          <span className="snapshot-center">
            <MapPinned size={16} />
          </span>
          {competitors.map((item, index) => {
            const latOffset = (item.lat - report.center.lat) * 111;
            const lngOffset =
              (item.lng - report.center.lng) *
              111 *
              Math.cos((report.center.lat * Math.PI) / 180);
            return (
              <span
                className="snapshot-store"
                style={{
                  left: `${clamp(50 + (lngOffset / maxOffset) * 34, 12, 88)}%`,
                  top: `${clamp(50 - (latOffset / maxOffset) * 34, 12, 88)}%`,
                }}
                key={item.id}
              >
                <b>{index + 1}</b>
              </span>
            );
          })}
          <span className="snapshot-caption">竞品与观察点</span>
        </div>

        <div className="snapshot-metrics">
          <div>
            <Store size={16} />
            <span>直接竞品</span>
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
