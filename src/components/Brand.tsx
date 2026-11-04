interface BrandProps {
  compact?: boolean;
  onHome?: () => void;
}

export function Brand({ compact = false, onHome }: BrandProps) {
  const content = (
    <>
      <span
        className={`brand-symbol ${compact ? "is-compact" : ""}`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 256 256">
          <path
            className="brand-scan-ring"
            d="M205 70A94 94 0 1 0 220 146"
            fill="none"
            stroke="currentColor"
            strokeWidth="24"
            strokeLinecap="round"
          />
          <circle
            className="brand-scan-core"
            cx="128"
            cy="128"
            r="23"
            fill="currentColor"
          />
          <path
            className="brand-scan-handle"
            d="M154 154 205 205"
            fill="none"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <circle
            className="brand-scan-handle-dot"
            cx="207"
            cy="207"
            r="11"
          />
        </svg>
      </span>
      <span className="brand-copy">
        <strong>街研</strong>
        {!compact && <span>STREETBRIEF</span>}
      </span>
    </>
  );

  if (onHome) {
    return (
      <button className="brand brand-button" type="button" onClick={onHome}>
        {content}
      </button>
    );
  }

  return <div className="brand">{content}</div>;
}
