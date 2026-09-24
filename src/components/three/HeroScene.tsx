"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * HeroScene — the WebGL centrepiece.
 *
 * CONCEPT
 * A receding lattice of panel outlines suspended in dark space. It is on-brand
 * (this is a panel platform), it is genuinely three-dimensional rather than a
 * picture of 3D, and it is achromatic — the reference art direction keeps
 * colour in the imagery and the interface monochrome, so the scene is white
 * hairlines on near-black with the single accent used sparingly.
 *
 * WHY A LINE LATTICE RATHER THAN GLOSSY GEOMETRY
 * Glossy meshes with environment maps are the default "3D hero" and they read as
 * generic. Both reference sites are graphic and technical rather than rendered
 * and material. A wireframe lattice is also far cheaper: every panel outline in
 * the field lives in ONE BufferGeometry and therefore costs ONE draw call.
 *
 * THE PANELS FACE THE CAMERA AND THE CAMERA MOVES.
 * Rotating the field would turn panels edge-on and make the whole thing
 * illegible. Instead the panels stay frontal and the camera orbits on a short
 * arc (pointer) and dollies forward (scroll), which produces real parallax and
 * real depth while keeping every panel readable.
 *
 * Performance is handled by the caller — this module is only ever mounted after
 * the device has been judged capable. See HeroCanvas.
 */

/* ── Field dimensions ─────────────────────────────────────────────────────── */
const COLS = 13;
const ROWS = 11;
const SPACING_X = 1.42;
const SPACING_Z = 1.95;
const PANEL_HALF_W = 0.46;
const PANEL_HALF_H = 0.66;

/** Indices of panels that receive the accent fill. Chosen to read as scattered
 *  rather than as a pattern, so the eye does not try to decode them. */
const ACCENT_CELLS = new Set(["4:2", "7:4", "9:1", "2:6", "11:5", "6:8"]);

/** Vertical offset so the field undulates instead of sitting on a flat plane. */
function panelY(ix: number, iz: number) {
  return Math.sin(ix * 0.62 + iz * 0.44) * 0.26 + Math.cos(iz * 0.31) * 0.14;
}

function panelX(ix: number) {
  return (ix - (COLS - 1) / 2) * SPACING_X;
}

function panelZ(iz: number) {
  return -iz * SPACING_Z;
}

/**
 * Build every panel outline as one LineSegments geometry.
 *
 * Each panel contributes four edges (eight vertices). With a 13×11 field that is
 * 1144 vertices in a single buffer — one draw call for the entire scene.
 */
function buildOutlineGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];

  for (let ix = 0; ix < COLS; ix += 1) {
    for (let iz = 0; iz < ROWS; iz += 1) {
      const cx = panelX(ix);
      const cy = panelY(ix, iz);
      const cz = panelZ(iz);

      const corners: [number, number, number][] = [
        [cx - PANEL_HALF_W, cy - PANEL_HALF_H, cz],
        [cx + PANEL_HALF_W, cy - PANEL_HALF_H, cz],
        [cx + PANEL_HALF_W, cy + PANEL_HALF_H, cz],
        [cx - PANEL_HALF_W, cy + PANEL_HALF_H, cz],
      ];

      for (let c = 0; c < 4; c += 1) {
        const a = corners[c];
        const b = corners[(c + 1) % 4];
        positions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

/** Long vertical ribs running into the distance — the "engineered" cue. */
function buildRibGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  const count = 9;
  const spanX = (COLS - 1) * SPACING_X;
  const zStart = SPACING_Z * 0.6;
  const zEnd = -ROWS * SPACING_Z;

  for (let i = 0; i < count; i += 1) {
    const x = -spanX / 2 + (spanX / (count - 1)) * i;
    positions.push(x, -2.6, zStart, x, -2.6, zEnd);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

/* ── Scene contents ───────────────────────────────────────────────────────── */

interface SceneProps {
  /** Hairline colour — theme aware, supplied by the caller. */
  lineColor: string;
  /** The single accent, used only for a handful of fills and the scan bar. */
  accentColor: string;
  /** Multiplier on all motion. The caller passes 0 to freeze the scene. */
  motion: number;
}

function Lattice({ lineColor, accentColor, motion }: SceneProps) {
  const group = React.useRef<THREE.Group>(null);
  const scan = React.useRef<THREE.Mesh>(null);

  const outlineGeometry = React.useMemo(() => buildOutlineGeometry(), []);
  const ribGeometry = React.useMemo(() => buildRibGeometry(), []);

  /* Released explicitly — R3F disposes what it creates, but these are built by
     hand in useMemo and would otherwise leak on unmount. */
  React.useEffect(() => {
    return () => {
      outlineGeometry.dispose();
      ribGeometry.dispose();
    };
  }, [outlineGeometry, ribGeometry]);

  /* Scroll drives a camera dolly. Read from a ref rather than React state so a
     scroll never triggers a render. */
  const scrollRef = React.useRef(0);
  React.useEffect(() => {
    if (motion === 0) return;
    const onScroll = () => {
      scrollRef.current = window.scrollY / Math.max(1, window.innerHeight);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [motion]);

  useFrame((state, delta) => {
    if (!group.current) return;

    const t = state.clock.elapsedTime;
    const ease = Math.min(1, delta * 1.6);

    /*
      The SCENE moves and the camera stays fixed.

      The obvious implementation is to orbit the camera, but `camera` comes back
      from `useThree()` and mutating a hook return value is both flagged by
      `react-hooks/immutability` and easy to get wrong. Translating the group
      produces the same parallax from a fixed viewpoint, keeps every panel
      frontal, and leaves the camera as a plain declarative prop on <Canvas>.

      Pointer values arrive already normalised to -1..1 by R3F.
    */
    const targetX = -state.pointer.x * 1.05 * motion;
    const targetY = state.pointer.y * 0.45 * motion;

    group.current.position.x += (targetX - group.current.position.x) * ease;
    group.current.position.y +=
      (targetY + Math.sin(t * 0.22) * 0.1 * motion - group.current.position.y) * ease;
    /* Scroll dollies the field past the camera. */
    group.current.position.z += (scrollRef.current * 2.4 - group.current.position.z) * ease;
    /* A trace of yaw so the field is unmistakably three-dimensional. */
    group.current.rotation.y += (state.pointer.x * 0.045 * motion - group.current.rotation.y) * ease;

    /* A single accent bar sweeps the field, once every ~7s. This is the accent's
       one moment in the hero — everything else in the scene is achromatic. */
    if (scan.current) {
      const cycle = (t % 7) / 7;
      scan.current.position.z = SPACING_Z * 0.6 - cycle * ROWS * SPACING_Z;
      const fade = Math.sin(cycle * Math.PI);
      const material = scan.current.material as THREE.MeshBasicMaterial;
      material.opacity = fade * 0.5 * (motion > 0 ? 1 : 0);
    }
  });

  return (
    <group ref={group}>
      {/* Panel outlines — the entire field in one draw call */}
      <lineSegments geometry={outlineGeometry}>
        <lineBasicMaterial
          color={lineColor}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </lineSegments>

      {/* Ribs receding to the horizon */}
      <lineSegments geometry={ribGeometry}>
        <lineBasicMaterial color={lineColor} transparent opacity={0.24} depthWrite={false} />
      </lineSegments>

      {/* Accent fills — a handful of panels, deliberately few */}
      {Array.from(ACCENT_CELLS).map((key) => {
        const [ix, iz] = key.split(":").map(Number);
        return (
          <mesh
            key={key}
            position={[panelX(ix), panelY(ix, iz), panelZ(iz)]}
          >
            <planeGeometry args={[PANEL_HALF_W * 2, PANEL_HALF_H * 2]} />
            <meshBasicMaterial
              color={accentColor}
              transparent
              opacity={0.13}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {/* The sweeping accent bar */}
      <mesh ref={scan} position={[0, 0, 0]}>
        <planeGeometry args={[(COLS - 1) * SPACING_X + 2, 0.012]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* ── Canvas ───────────────────────────────────────────────────────────────── */

export type HeroSceneProps = SceneProps;

export default function HeroScene(props: HeroSceneProps) {
  return (
    <Canvas
      /* A capped DPR keeps the cost bounded on high-density displays, where an
         uncapped ratio would quadruple the fragment work for no visible gain. */
      dpr={[1, 1.75]}
      camera={{ position: [0, 2.6, 8], fov: 44, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Lattice {...props} />
    </Canvas>
  );
}
