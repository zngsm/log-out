import { SpaceshipComputerScene } from "./game/SpaceshipComputerScene";

function App() {
  return (
    <main className="scene-shell">
      <section className="scene-stage" aria-label="Hermes control room 3D placeholder">
        <SpaceshipComputerScene />
        <div className="hermes-screen">
          <p className="eyebrow">HERMES OS / PLACEHOLDER DISPLAY</p>
          <h1>LOG_OUT</h1>
          <p className="summary">
            R3F 기반 우주선 통제실과 컴퓨터 프레임 placeholder입니다. Hermes OS는
            이 모니터 영역에 2D 인터페이스로 합쳐집니다.
          </p>
          <div className="screen-grid">
            <span>O₂ 100%</span>
            <span>POWER 100%</span>
            <span>ECHO LOCKDOWN</span>
          </div>
        </div>
      </section>

      <section className="scene-brief">
        <p className="eyebrow">FEAT-009 SCOPE</p>
        <h2>Spaceship Computer Scene</h2>
        <p>
          Final GLB asset 없이 placeholder geometry와 material만 사용해 통제실,
          컴퓨터, 콘솔, 조명 방향성을 잡습니다.
        </p>
        <div className="brief-list">
          <span>R3F Canvas</span>
          <span>3D monitor frame</span>
          <span>2D OS overlay zone</span>
          <span>No rigged hands</span>
        </div>
      </section>
    </main>
  );
}

export default App;
