import { Canvas, useFrame, useThree } from "@react-three/fiber";

export type SpaceshipSceneMode =
  | "menu"
  | "transition"
  | "opening"
  | "gameplay"
  | "ending"
  | "failure"
  | "blackout";

const cameraTargets: Record<
  SpaceshipSceneMode,
  { position: [number, number, number]; lookAt: [number, number, number]; fov: number }
> = {
  menu: { position: [2.8, 0.85, 5.8], lookAt: [0, -0.18, -0.2], fov: 46 },
  transition: { position: [1.1, 0.55, 4.4], lookAt: [0, -0.18, -0.1], fov: 42 },
  opening: { position: [0.35, 0.35, 4.15], lookAt: [0, -0.18, -0.2], fov: 39 },
  gameplay: { position: [0, 0.1, 3.25], lookAt: [0, -0.08, 0], fov: 35 },
  ending: { position: [-1.9, 0.6, 4.6], lookAt: [0, 0, -2.8], fov: 44 },
  failure: { position: [0, 0.2, 3.6], lookAt: [0, -0.1, 0], fov: 42 },
  blackout: { position: [0.15, 0.05, 3.4], lookAt: [0, -0.08, 0], fov: 38 },
};

function SceneCamera({ mode }: { mode: SpaceshipSceneMode }) {
  const { camera } = useThree();
  const target = cameraTargets[mode];

  useFrame((_, delta) => {
    const positionEase = Math.min(delta * 1.5, 1);
    const fovEase = Math.min(delta * 1.8, 1);

    camera.position.x += (target.position[0] - camera.position.x) * positionEase;
    camera.position.y += (target.position[1] - camera.position.y) * positionEase;
    camera.position.z += (target.position[2] - camera.position.z) * positionEase;
    camera.fov += (target.fov - camera.fov) * fovEase;
    camera.updateProjectionMatrix();
    camera.lookAt(...target.lookAt);
  });

  return null;
}

function ControlRoomShell({ alert }: { alert: boolean }) {
  return (
    <group>
      <mesh position={[0, -1.8, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 8]} />
        <meshStandardMaterial color="#0b1618" roughness={0.85} metalness={0.3} />
      </mesh>

      <mesh position={[0, 1.9, -2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 8]} />
        <meshStandardMaterial color="#101718" roughness={0.8} metalness={0.25} />
      </mesh>

      <mesh position={[-4.4, 0, -2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[8, 4.2]} />
        <meshStandardMaterial color="#071012" roughness={0.9} metalness={0.2} />
      </mesh>

      <mesh position={[4.4, 0, -2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[8, 4.2]} />
        <meshStandardMaterial color="#071012" roughness={0.9} metalness={0.2} />
      </mesh>

      <mesh position={[-2.35, 0.15, -4.15]}>
        <boxGeometry args={[1.65, 1.4, 0.08]} />
        <meshStandardMaterial
          color="#05090f"
          emissive="#153a61"
          emissiveIntensity={alert ? 0.2 : 0.48}
        />
      </mesh>

      <mesh position={[0, -0.1, -4.05]}>
        <boxGeometry args={[2.25, 2.55, 0.22]} />
        <meshStandardMaterial
          color={alert ? "#2d1713" : "#293639"}
          roughness={0.7}
          metalness={0.55}
        />
      </mesh>

      <mesh position={[0, 1.24, -3.88]}>
        <boxGeometry args={[1.4, 0.1, 0.08]} />
        <meshStandardMaterial
          color={alert ? "#ff5a42" : "#8fffe0"}
          emissive={alert ? "#ff2b17" : "#1ce7aa"}
          emissiveIntensity={alert ? 1.8 : 0.9}
        />
      </mesh>

      {[-2.6, 0, 2.6].map((x) => (
        <mesh key={x} position={[x, 1.72, -2.3]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[1.6, 0.06, 0.08]} />
          <meshStandardMaterial
            color={alert ? "#ff7a58" : "#78f7d1"}
            emissive={alert ? "#ff2b17" : "#1ce7aa"}
            emissiveIntensity={alert ? 1.6 : 1.3}
          />
        </mesh>
      ))}
    </group>
  );
}

function ComputerFrame({ mode }: { mode: SpaceshipSceneMode }) {
  const isMenu = mode === "menu" || mode === "transition";
  const isOpening = mode === "opening";

  return (
    <group position={[0, -0.28, 0]} rotation={[-0.08, 0, 0]}>
      <mesh position={[0, 0, -0.08]}>
        <boxGeometry args={[3.9, 2.35, 0.2]} />
        <meshStandardMaterial color="#111a1c" roughness={0.55} metalness={0.7} />
      </mesh>

      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[3.45, 1.88, 0.05]} />
        <meshStandardMaterial
          color={isMenu ? "#10252a" : "#081414"}
          emissive={isMenu ? "#e98d42" : isOpening ? "#46221e" : "#0f4b46"}
          emissiveIntensity={isMenu ? 0.95 : isOpening ? 0.75 : 0.55}
        />
      </mesh>

      <mesh position={[0, -1.35, -0.18]}>
        <boxGeometry args={[0.7, 0.55, 0.26]} />
        <meshStandardMaterial color="#0d1517" roughness={0.6} metalness={0.65} />
      </mesh>

      <mesh position={[0, -1.72, -0.34]}>
        <boxGeometry args={[2.45, 0.16, 1.2]} />
        <meshStandardMaterial color="#111719" roughness={0.7} metalness={0.55} />
      </mesh>
    </group>
  );
}

function ConsoleDeck() {
  return (
    <group position={[0, -1.48, 0.72]}>
      <mesh rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[4.6, 0.18, 1.35]} />
        <meshStandardMaterial color="#10181a" roughness={0.65} metalness={0.5} />
      </mesh>

      {[-1.6, -0.8, 0, 0.8, 1.6].map((x) => (
        <mesh key={x} position={[x, 0.12, -0.12]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.36, 0.04, 0.16]} />
          <meshStandardMaterial
            color="#d9ff84"
            emissive="#d9ff84"
            emissiveIntensity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

function DeskProps({ showHands }: { showHands: boolean }) {
  return (
    <group position={[0, -1.18, 1.18]}>
      <mesh position={[-1.35, -0.03, -0.08]} rotation={[-0.16, 0.06, -0.02]}>
        <boxGeometry args={[0.68, 0.03, 0.9]} />
        <meshStandardMaterial color="#d4d0bd" roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh position={[-2.12, 0.07, -0.16]}>
        <cylinderGeometry args={[0.16, 0.16, 0.28, 24]} />
        <meshStandardMaterial color="#d8fff4" roughness={0.62} metalness={0.1} />
      </mesh>
      <mesh position={[1.35, 0.03, -0.08]}>
        <boxGeometry args={[0.52, 0.06, 0.34]} />
        <meshStandardMaterial color="#151b1d" roughness={0.75} metalness={0.45} />
      </mesh>
      {showHands
        ? [-0.38, 0.38].map((x) => (
            <mesh key={x} position={[x, 0.18, 0.04]} rotation={[0.18, 0, x * 0.15]}>
              <capsuleGeometry args={[0.11, 0.5, 4, 12]} />
              <meshStandardMaterial color="#c7957d" roughness={0.82} metalness={0.02} />
            </mesh>
          ))
        : null}
    </group>
  );
}

function SideConsoles({ alert }: { alert: boolean }) {
  return (
    <group>
      {[-3.55, 3.55].map((x) => (
        <group key={x} position={[x, -0.95, -1.55]} rotation={[0, x > 0 ? -0.48 : 0.48, 0]}>
          <mesh>
            <boxGeometry args={[1.05, 0.48, 1.75]} />
            <meshStandardMaterial color="#131c1f" roughness={0.68} metalness={0.5} />
          </mesh>
          {[0.38, 0, -0.38].map((z, index) => (
            <mesh key={z} position={[0, 0.28, z]}>
              <boxGeometry args={[0.52, 0.04, 0.18]} />
              <meshStandardMaterial
                color={alert && index === 1 ? "#ff755a" : "#80d8ff"}
                emissive={alert && index === 1 ? "#ff2b17" : "#2ca8ff"}
                emissiveIntensity={0.8}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Starfield() {
  return (
    <group position={[-2.35, 0.15, -4.08]}>
      {Array.from({ length: 28 }, (_, index) => {
        const x = -0.68 + (index % 7) * 0.22;
        const y = -0.52 + Math.floor(index / 7) * 0.28;

        return (
          <mesh key={index} position={[x, y, 0.08]}>
            <sphereGeometry args={[index % 5 === 0 ? 0.014 : 0.008, 8, 8]} />
            <meshStandardMaterial color="#e7fff8" emissive="#9fdcff" emissiveIntensity={1.4} />
          </mesh>
        );
      })}
    </group>
  );
}

function PlaceholderScene({ mode }: { mode: SpaceshipSceneMode }) {
  const alert = mode === "opening" || mode === "blackout" || mode === "failure";
  const showHands = mode === "opening";

  return (
    <>
      <color attach="background" args={["#020606"]} />
      <ambientLight intensity={alert ? 0.26 : 0.45} />
      <pointLight
        position={[0, 2.4, 2]}
        intensity={alert ? 4 : 7}
        color={alert ? "#ff7a58" : "#8fffe0"}
      />
      <pointLight
        position={[-3, 1, 1]}
        intensity={alert ? 5 : 2.5}
        color={alert ? "#ff3e26" : "#ff5a42"}
      />
      <pointLight position={[2.8, 0.8, -1.6]} intensity={2.2} color="#80d8ff" />
      <SceneCamera mode={mode} />
      <ControlRoomShell alert={alert} />
      <Starfield />
      <SideConsoles alert={alert} />
      <ComputerFrame mode={mode} />
      <ConsoleDeck />
      <DeskProps showHands={showHands} />
    </>
  );
}

export function SpaceshipComputerScene({ mode = "gameplay" }: { mode?: SpaceshipSceneMode }) {
  return (
    <Canvas camera={{ position: cameraTargets[mode].position, fov: cameraTargets[mode].fov }} dpr={[1, 1.8]}>
      <PlaceholderScene mode={mode} />
    </Canvas>
  );
}
