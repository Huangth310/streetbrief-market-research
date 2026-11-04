import { useState } from "react";
import { Landing } from "./components/Landing";
import { LoadingReport } from "./components/LoadingReport";
import { ReportView } from "./components/ReportView";
import { analyzeMarket } from "./lib/analysis";
import type { AnalysisInput, Report } from "./types";

type ViewState = "landing" | "loading" | "report";

export default function App() {
  const [view, setView] = useState<ViewState>("landing");
  const [pendingInput, setPendingInput] = useState<AnalysisInput | null>(null);
  const [pendingDemo, setPendingDemo] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");

  async function handleAnalyze(input: AnalysisInput, useDemo = false) {
    setError("");
    setPendingInput(input);
    setPendingDemo(useDemo);
    setView("loading");

    try {
      const [nextReport] = await Promise.all([
        analyzeMarket(input, useDemo),
        new Promise((resolve) => window.setTimeout(resolve, 1900)),
      ]);
      setReport(nextReport);
      setView("report");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (analysisError) {
      setError(
        `没有取得实时数据：${
          analysisError instanceof Error
            ? analysisError.message
            : "请检查地址或服务连接"
        }。你可以稍后重试，或先查看演示报告。`,
      );
      setView("landing");
    }
  }

  function handleRestart() {
    setReport(null);
    setPendingInput(null);
    setPendingDemo(false);
    setError("");
    setView("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (view === "loading" && pendingInput) {
    return <LoadingReport input={pendingInput} forceDemo={pendingDemo} />;
  }

  if (view === "report" && report) {
    return (
      <ReportView
        initialReport={report}
        onRestart={handleRestart}
        onReanalyze={handleAnalyze}
        onEvidenceError={setError}
      />
    );
  }

  return (
    <Landing
      initialError={error}
      initialInput={pendingInput}
      onAnalyze={handleAnalyze}
    />
  );
}
