export default function LoadingScreen({ progress, status, error, onRetry }) {
  return (
    <div className="app-loader" aria-live="polite">
      <div className="loader-orb"><span>⚡</span></div>
      <div className="loader-brand">POKÉDEX ARENA</div>
      <div className="loader-bar"><span style={{ width: `${progress}%` }} /></div>
      <p>{error || status}</p>
      {error && <button className="primary-btn" onClick={onRetry}>Retry</button>}
    </div>
  );
}
