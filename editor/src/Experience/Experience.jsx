import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import gsap from "gsap";

import Scene from "./Scene";
import ModifyControls from "../components/ModifyControl";
import WorkspaceConfig from "../components/WorkspaceConfig";
import { useToggleRoomStore } from "../stores/toggleRoomStore";
import { useResponsiveStore } from "../stores/useResponsiveStore";
import { useExperienceStore } from "../stores/experienceStore";

function SaveScreenshotButton({ capture, setCapture }) {
  const { gl, scene, camera } = useThree();

  const handleSave = useCallback(() => {
    gl.render(scene, camera);
    const imgData = gl.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imgData;
    link.download = "screenshot.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [gl, scene, camera]);

  useEffect(() => {
    if (!capture) return;
    handleSave();
    setCapture(false);
  }, [capture, handleSave, setCapture]);

  return null;
}

const Experience = () => {
  const cameraRef = useRef();
  const pointerRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef({
    default: 80,
    animation: 110,
  });

  const { isExperienceReady } = useExperienceStore();
  const { isMobile } = useResponsiveStore();
  const { isDarkRoom, setIsBeforeZooming, setIsTransitioning } =
    useToggleRoomStore();

  const [capture, setCapture] = useState(false);

  const cameraPositions = useMemo(
    () => ({
      dark: { position: [12, 10, 10] },
      light: { position: [3.2, 16.2, 21.6] },
    }),
    []
  );

  useEffect(() => {
    if (!cameraRef.current) return;

    zoomRef.current = {
      default: isMobile ? 74 : 135,
      animation: isMobile ? 65 : 110,
    };

    cameraRef.current.zoom = zoomRef.current.default;
    cameraRef.current.updateProjectionMatrix();
  }, [isMobile]);

  useEffect(() => {
    if (!cameraRef.current || !isExperienceReady) return;

    const targetPosition = isDarkRoom
      ? cameraPositions.dark.position
      : cameraPositions.light.position;

    gsap.set(cameraRef.current.position, {
      x: targetPosition[0],
      y: targetPosition[1],
      z: targetPosition[2],
    });
  }, [cameraPositions, isDarkRoom, isExperienceReady]);

  useEffect(() => {
    if (!cameraRef.current) return;

    const targetPosition = isDarkRoom
      ? cameraPositions.dark.position
      : cameraPositions.light.position;

    const t1 = gsap.timeline({
      onComplete: () => {
        setIsTransitioning(false);
      },
    });

    t1.to(cameraRef.current, {
      zoom: zoomRef.current.animation,
      duration: 1,
      ease: "power3.out",
      onStart: () => {
        setIsTransitioning(true);
        setIsBeforeZooming(true);
      },
      onUpdate: () => {
        cameraRef.current.updateProjectionMatrix();
      },
    })
      .to(cameraRef.current.position, {
        x: targetPosition[0],
        y: targetPosition[1],
        z: targetPosition[2],
        duration: 1.5,
        ease: "power3.out",
      })
      .to(cameraRef.current, {
        zoom: zoomRef.current.default,
        duration: 1,
        ease: "power3.out",
        onStart: () => {
          setIsBeforeZooming(false);
        },
        onUpdate: () => {
          cameraRef.current.updateProjectionMatrix();
        },
      });
  }, [cameraPositions, isDarkRoom, setIsBeforeZooming, setIsTransitioning]);

  useEffect(() => {
    const onTouchMove = (e) => {
      if (e.touches.length === 1) {
        pointerRef.current.x =
          (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        pointerRef.current.y =
          -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    };

    window.addEventListener("touchmove", onTouchMove);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <>
      <Canvas
        style={{ position: "fixed", zIndex: 1, top: 0, left: 0 }}
        shadows
        gl={{ preserveDrawingBuffer: true }}
      >
        <Environment
          preset="city"
          background={false}
          environmentIntensity={1}
        />

        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={[10, 6, 6]}
          rotation={[-0.4, -0.9, 0]}
          fov={55}
          near={0.1}
          far={1000}
        />

        <OrbitControls />
        <Scene pointerRef={pointerRef} />

        <SaveScreenshotButton capture={capture} setCapture={setCapture} />
      </Canvas>

      <div style={{ position: "fixed", left: 20, top: 200, color: "black", zIndex: 9 }}>
        <ModifyControls setCapture={setCapture} />
      </div>

      <WorkspaceConfig />
    </>
  );
};

export default Experience;
