function App() {
  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">HERMES CONTROL ROOM</p>
        <h1>log-out</h1>
        <p className="summary">
          게임 프로젝트 기본 셋업이 준비되었습니다. 다음 단계에서는 파일 탐색기,
          AI 대화 패널, HUD를 이 기반 위에 확장합니다.
        </p>
      </section>

      <section className="status-panel">
        <div className="status-card">
          <span className="label">Project Status</span>
          <strong>Bootstrap Ready</strong>
        </div>
        <div className="status-card">
          <span className="label">Next Task</span>
          <strong>feat-002</strong>
        </div>
        <div className="status-card">
          <span className="label">Tech Stack</span>
          <strong>Vite + React + TypeScript</strong>
        </div>
      </section>
    </main>
  );
}

export default App;

