import { Canvas } from "@react-three/fiber";

function ControlRoomShell() {
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

      {[-2.6, 0, 2.6].map((x) => (
        <mesh key={x} position={[x, 1.72, -2.3]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[1.6, 0.06, 0.08]} />
          <meshStandardMaterial
            color="#78f7d1"
            emissive="#1ce7aa"
            emissiveIntensity={1.3}
          />
        </mesh>
      ))}
    </group>
  );
}

function ComputerFrame() {
  return (
    <group position={[0, -0.28, 0]} rotation={[-0.08, 0, 0]}>
      <mesh position={[0, 0, -0.08]}>
        <boxGeometry args={[3.9, 2.35, 0.2]} />
        <meshStandardMaterial color="#111a1c" roughness={0.55} metalness={0.7} />
      </mesh>

      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[3.45, 1.88, 0.05]} />
        <meshStandardMaterial
          color="#081414"
          emissive="#0f4b46"
          emissiveIntensity={0.55}
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

function PlaceholderScene() {
  return (
    <>
      <color attach="background" args={["#020606"]} />
      <ambientLight intensity={0.45} />
      <pointLight position={[0, 2.4, 2]} intensity={7} color="#8fffe0" />
      <pointLight position={[-3, 1, 1]} intensity={2.5} color="#ff5a42" />
      <ControlRoomShell />
      <ComputerFrame />
      <ConsoleDeck />
    </>
  );
}

export function SpaceshipComputerScene() {
  return (
    <Canvas camera={{ position: [0, 0.4, 5.2], fov: 42 }} dpr={[1, 1.8]}>
      <PlaceholderScene />
    </Canvas>
  );
}
