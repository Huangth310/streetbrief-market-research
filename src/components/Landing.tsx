import { FormEvent, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDot,
  Crosshair,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Brand } from "./Brand";
import {
  categoryProfiles,
  DEMO_ADDRESS,
} from "../data/demo";
import type {
  AnalysisInput,
  AnalysisMode,
  CategoryKey,
} from "../types";

interface LandingProps {
  initialError: string;
  initialInput: AnalysisInput | null;
  onAnalyze: (input: AnalysisInput, useDemo?: boolean) => void;
}

const previewMarkers = [
  { x: 39, y: 31, complete: true },
  { x: 68, y: 25, complete: true },
  { x: 70, y: 59, complete: false },
  { x: 28, y: 67, complete: true },
  { x: 56, y: 75, complete: false },
];

const ADDRESS_HISTORY_KEY = "streetbrief-address-history";
const categoryOrder: CategoryKey[] = [
  "coffee",
  "tea",
  "light",
  "bakery",
  "snack",
];

function readAddressHistory() {
  try {
    const saved = window.localStorage.getItem(ADDRESS_HISTORY_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

export function Landing({
  initialError,
  initialInput,
  onAnalyze,
}: LandingProps) {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE !== "false";
  const [address, setAddress] = useState(initialInput?.address ?? "");
  const [mode, setMode] = useState<AnalysisMode>(
    initialInput?.mode ?? "targeted",
  );
  const [category, setCategory] = useState<CategoryKey>(
    initialInput?.category ?? "coffee",
  );
  const [error, setError] = useState(initialError);
  const [history, setHistory] = useState<string[]>(readAddressHistory);

  function rememberAddress(value: string) {
    const next = [value, ...history.filter((item) => item !== value)].slice(
      0,
      5,
    );
    setHistory(next);
    try {
      window.localStorage.setItem(
        ADDRESS_HISTORY_KEY,
        JSON.stringify(next),
      );
    } catch {
      // History is a convenience; analysis can continue without storage.
    }
  }

  function removeAddress(value: string) {
    const next = history.filter((item) => item !== value);
    setHistory(next);
    try {
      window.localStorage.setItem(
        ADDRESS_HISTORY_KEY,
        JSON.stringify(next),
      );
    } catch {
      // The current session still keeps the updated list.
    }
  }

  function currentInput(): AnalysisInput {
    return {
      address: address.trim(),
      mode,
      category: mode === "targeted" ? category : undefined,
    };
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!address.trim()) {
      setError("先输入要观察的位置，或使用珠海校区演示案例。");
      return;
    }

    setError("");
    const nextAddress = address.trim();
    rememberAddress(nextAddress);
    onAnalyze(currentInput());
  }

  function openDemoReport() {
    if (!address.trim()) {
      setError("先输入位置，再查看对应的演示报告。");
      return;
    }
    onAnalyze(currentInput(), true);
  }

  function useDemoAddress() {
    setAddress(DEMO_ADDRESS);
    setError("");
  }

  return (
    <main className="landing-shell">
      <header className="site-header">
        <Brand />
        <div className="site-header-meta">
          <span className="status-dot" aria-hidden="true" />
          <span>{isDemoMode ? "演示数据已就绪" : "公开数据服务已就绪"}</span>
          <span className="header-divider" />
          <span>3 公里调研范围</span>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span>开店观察</span>
            <span>周边餐饮市场调研</span>
          </div>
          <h1>
            开店之前，
            <br />
            先把这条街<span className="headline-mark">看清楚。</span>
          </h1>
          <p className="hero-intro">
            输入一个位置，查看附近的同类门店、公开价格和消费场景。
            每条结论都附有来源，方便你继续核对。
          </p>

          <div className="hero-metrics" aria-label="产品能力摘要">
            <div>
              <strong>3 KM</strong>
              <span>调查范围</span>
            </div>
            <div>
              <strong>同类门店</strong>
              <span>位置与公开资料</span>
            </div>
            <div>
              <strong>来源可查</strong>
              <span>每条判断附依据</span>
            </div>
          </div>
        </div>

        <div className="district-preview" aria-label="街区市场分析示意">
          <div className="district-preview-head">
            <span>ZH / 22.3484°N</span>
            <span>113.5842°E</span>
          </div>
          <div className="district-grid">
            <div className="district-ring ring-outer" />
            <div className="district-ring ring-inner" />
            <div className="district-cross district-cross-x" />
            <div className="district-cross district-cross-y" />
            <div className="district-center">
              <Crosshair size={19} />
              <span>观察点</span>
            </div>
            {previewMarkers.map((marker, index) => (
              <button
                className={`preview-marker ${
                  marker.complete ? "is-complete" : "is-sparse"
                }`}
                type="button"
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                key={`${marker.x}-${marker.y}`}
                tabIndex={-1}
                aria-hidden="true"
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
              </button>
            ))}
            <div className="evidence-callout callout-one">
              <span className="callout-line" />
              <span>
                <b>营业时段</b>
                门店公开时间
              </span>
            </div>
            <div className="evidence-callout callout-two">
              <span className="callout-line" />
              <span>
                <b>产品组合</b>
                菜单与价格
              </span>
            </div>
          </div>
          <div className="district-preview-foot">
            <span>
              <Check size={13} /> 附近范围
            </span>
            <span>
              <Check size={13} /> 门店位置
            </span>
            <span>
              <Check size={13} /> 公开资料
            </span>
          </div>
        </div>
      </section>

      <section className="brief-panel" id="start">
        <div className="brief-panel-intro">
          <h2 className="location-question-title">您想调研哪个位置？</h2>
          <p>填写位置和你准备经营的品类，就可以开始。</p>
          <div className="location-intro-art" aria-hidden="true">
            <div className="location-art-card">
              <span className="location-art-label">街区观察</span>
              <strong>3 km</strong>
              <span className="location-art-caption">从位置出发，把附近看清楚</span>
            </div>
            <svg viewBox="0 0 360 230">
              <path
                className="location-art-road"
                d="M-20 174 C66 121 114 145 168 108 S283 28 391 64"
              />
              <path
                className="location-art-path"
                d="M58 208 C84 154 105 127 139 111 S202 88 226 42"
              />
              <circle className="location-art-ring" cx="184" cy="118" r="78" />
              <circle className="location-art-ring is-small" cx="184" cy="118" r="42" />
              <circle className="location-art-center" cx="184" cy="118" r="18" />
              <g className="location-art-pin pin-one" transform="translate(236 63)">
                <path d="M0 23C0 13 18 13 18 23C18 33 9 40 9 40C9 40 0 33 0 23Z" />
                <circle cx="9" cy="23" r="3.5" />
              </g>
              <g className="location-art-pin pin-two" transform="translate(103 148)">
                <path d="M0 23C0 13 18 13 18 23C18 33 9 40 9 40C9 40 0 33 0 23Z" />
                <circle cx="9" cy="23" r="3.5" />
              </g>
              <g className="location-art-pin pin-three" transform="translate(256 157)">
                <path d="M0 23C0 13 18 13 18 23C18 33 9 40 9 40C9 40 0 33 0 23Z" />
                <circle cx="9" cy="23" r="3.5" />
              </g>
            </svg>
            <div className="location-art-tags">
              <span>同类门店</span>
              <span>周边客群</span>
              <span>价格与时段</span>
            </div>
          </div>
        </div>

        <form className="analysis-form" onSubmit={submit}>
          <label className="field-label" htmlFor="address">
            经营位置
          </label>
          <div className="address-field">
            <span className="address-icon" aria-hidden="true">
              <MapPin size={18} />
            </span>
            <span className="address-prefix">位置</span>
            <input
              id="address"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                setError("");
              }}
              placeholder="输入地址、地标或商圈，例如：中山大学珠海校区东门"
              autoComplete="street-address"
            />
            <button
              type="button"
              className="demo-fill"
              onClick={useDemoAddress}
            >
              填入示例位置
            </button>
          </div>
          {history.length > 0 && (
            <div className="address-history" aria-label="最近输入的位置">
              <span className="address-history-label">最近输入</span>
              {history.map((item) => (
                <span className="address-history-item" key={item}>
                  <button
                    type="button"
                    className="address-history-select"
                    onClick={() => {
                      setAddress(item);
                      setError("");
                    }}
                  >
                    {item}
                  </button>
                  <button
                    type="button"
                    className="address-history-remove"
                    onClick={() => removeAddress(item)}
                    aria-label={`删除搜索记录：${item}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="form-row">
            <div className="form-group mode-group">
              <span className="field-label">当前状态</span>
              <div className="segmented-control" role="group" aria-label="分析模式">
                <button
                  type="button"
                  className={mode === "targeted" ? "is-active" : ""}
                  onClick={() => setMode("targeted")}
                >
                  我有明确方向
                </button>
                <button
                  type="button"
                  className={mode === "discover" ? "is-active" : ""}
                  onClick={() => setMode("discover")}
                >
                  还没定品类
                </button>
              </div>
            </div>

            {mode === "targeted" ? (
              <div className="form-group category-group">
                <label className="field-label" htmlFor="category">
                  想做什么
                </label>
                <div className="select-wrap">
                  <select
                    id="category"
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value as CategoryKey)
                    }
                  >
                    {categoryOrder.map((key) => {
                      const profile = categoryProfiles[key];
                      return (
                        <option value={profile.category} key={profile.category}>
                          {profile.label}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown size={17} aria-hidden="true" />
                </div>
              </div>
            ) : (
              <div className="discover-note">
                <Sparkles size={18} />
                  <span>从附近已经找到公开资料的小餐饮方向里帮你筛选。</span>
              </div>
            )}
          </div>

          {error && (
            <div className="form-error-wrap" role="alert">
              <p className="form-error">{error}</p>
              {address.trim() && (
                <button
                  type="button"
                  className="demo-report-action"
                  onClick={openDemoReport}
                >
                  查看演示报告
                </button>
              )}
            </div>
          )}

          <button className="primary-action" type="submit">
            <Search size={18} />
            开始调研
            <ArrowRight size={18} />
          </button>

          <p className="form-caption">
            <CircleDot size={13} />
            {isDemoMode
              ? "当前使用珠海校区演示数据，报告里会标明数据日期。"
              : "优先读取实时公开资料；取不到时会标明改用哪份数据。"}
          </p>
        </form>
      </section>

      <section className="method-strip" aria-label="分析方法">
        <div>
          <span>门店事实</span>
          <p>门店位置、价格、营业时间与公开菜单。</p>
        </div>
        <div>
          <span>街区观察</span>
          <p>附近的学校、办公楼、住宅和同类门店。</p>
        </div>
        <div>
          <span>经营建议</span>
          <p>适合测试的客群、产品、价格与营业时段。</p>
        </div>
      </section>

      <footer className="landing-footer">
        <span>街研 / 周边市场调研</span>
        <span>每次分析都会标明实时、缓存或演示状态</span>
      </footer>
    </main>
  );
}
