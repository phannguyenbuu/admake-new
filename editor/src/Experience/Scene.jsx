import React, { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";

import CustomRoom from "./models/light/CustomRoom.jsx";
import GridPlanes from "./GridPlanes.jsx";
import DirectionArrow from "./models/light/DirectionArrow";
import { useToggleRoomStore } from "../stores/toggleRoomStore";
import { usePointer } from "../stores/selectionStore";

const Scene = ({ pointerRef }) => {
  const darkGroupRef = useRef();
  const lightGroupRef = useRef();
  const gridPlanesRef = useRef();
  const darkRoomGroupPosition = new THREE.Vector3(0, 0, 0);
  const lightRoomGroupPosition = new THREE.Vector3(24, 0, 3.5);
  const groupRotationRef = useRef(0);
  const { isDarkRoom } = useToggleRoomStore();
  const { directionAxis } = usePointer();

  useEffect(() => {
    if (!gridPlanesRef.current) return;

    const targetPosition = isDarkRoom
      ? darkRoomGroupPosition
      : lightRoomGroupPosition;

    gsap.to(gridPlanesRef.current.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      delay: 1,
    });
  }, [isDarkRoom]);

  useFrame(() => {
    if (
      !darkGroupRef.current ||
      !lightGroupRef.current ||
      !gridPlanesRef.current
    )
      return;
    // console.log(camera.current.position);
    // console.log(camera.current.rotation);
    // console.log(camera.current.zoom);

    const targetRotation = pointerRef.current.x * Math.PI * 0.032;

    groupRotationRef.current = THREE.MathUtils.lerp(
      groupRotationRef.current,
      targetRotation,
      0.1
    );

    darkGroupRef.current.rotation.y = groupRotationRef.current;
    lightGroupRef.current.rotation.y = groupRotationRef.current;
    gridPlanesRef.current.rotation.y = groupRotationRef.current;
  });

  return (
    <>
      <Suspense>
        <CustomRoom position={[2.5,0,-2]} w={8} h={3.6} l={6}/>
        <DirectionArrow position={[2.5,0,-2]} scale={[0.005,0.005,0.005]} 
            rotation={[0,directionAxis/180 * Math.PI,0]}/>

        <group ref={lightGroupRef} position={lightRoomGroupPosition}>
          {/* <DarkRoomFirst /> */}
          {/* <DarkRoomSecond />
          <DarkRoomThird />
          <DarkRoomFourth />
          <DarkTargets /> */}
        </group>
        <GridPlanes
          position={
            isDarkRoom
              ? [
                  darkRoomGroupPosition.x,
                  darkRoomGroupPosition.y,
                  darkRoomGroupPosition.z,
                ]
              : [
                  lightRoomGroupPosition.x,
                  lightRoomGroupPosition.y,
                  lightRoomGroupPosition.z,
                ]
          }
          ref={gridPlanesRef}
          rows={20}
          columns={20}
          planeWidth={0.5}
          planeDepth={0.5}
          spacing={0}
        />
      </Suspense>
    </>
  );
};

export default Scene;
