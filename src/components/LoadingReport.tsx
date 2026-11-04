import { useEffect, useState } from "react";
import { Crosshair, Search } from "lucide-react";
import { Brand } from "./Brand";
import type { AnalysisInput } from "../types";

const stages = [
  "确认位置和调查范围",
  "查找附近同类门店",
  "整理公开资料",
  "生成经营建议",
];

export function LoadingReport({
  input,
  forceDemo,
}: {
  input: AnalysisInput;
  forceDemo: boolean;
}) {
  const isDemoMode =
    forceDemo || import.meta.env.VITE_DEMO_MODE !== "false";
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStage((current) => Math.min(current + 1, stages.length));
    }, 420);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="loading-screen">
      <header className="loading-header">
        <Brand />
        <span>ANALYSIS IN PROGRESS</span>
      </header>
      <div className="loading-stage">
        <div className="loading-map">
          <div className="loading-radar radar-one" />
          <div className="loading-radar radar-two" />
          <div className="loading-radar radar-three" />
          <div className="radar-sweep" />
          <Crosshair className="loading-crosshair" size={46} />
          <Search className="loading-scanner" size={30} strokeWidth={2.6} />
        </div>

        <div className="loading-copy">
          <h1>
            正在调研
            <br />
            附近区域……
          </h1>
          <p>{input.address}</p>
          <div className="stage-list">
            {stages.map((stage, index) => (
              <div
                className={`stage-item ${
                  index < activeStage
                    ? "is-done"
                    : index === activeStage
                      ? "is-active"
                      : ""
                }`}
                key={stage}
              >
                <span>{index < activeStage ? "✓" : `0${index + 1}`}</span>
                <p>{stage}</p>
                <i />
              </div>
            ))}
          </div>
          <small>
            {isDemoMode
              ? "当前读取珠海校区的演示资料。"
              : "公开资料较多时需要一点时间；如果响应过慢，会改用已保存的数据并标明。"}
          </small>
        </div>
      </div>
    </main>
  );
}
