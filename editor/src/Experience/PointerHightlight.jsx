import * as THREE from "three";
import React, { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useSelection, usePointer } from "../stores/selectionStore";
import { useGLTFWithKTX2 } from "./utils/useGLTFWithKTX2";

const PointerHighlight = React.forwardRef(
  ({ data, isMoving, setMovingId, isSelected }, ref) => {
    const meshRef = ref || useRef();
    const [isHovered, setIsHovered] = useState(false);
    const [shouldLoad, setShouldLoad] = useState(false);
    const { setCurrentSelection } = useSelection();
    const { setAddedHighlights, setMessage } = usePointer();

    if (!data) return null;

    const onClickHighlight = () => {
      if (isMoving) {
        setMovingId(null); // Stop moving if already in move mode.
      } else {
        setMovingId(data.id);
        setMessage(
          `You are selecting ${data.name}. Click again to place the item.`
        );
        setCurrentSelection(data.id);
      }
    };

    useEffect(() => {
      if (data?.preload || isSelected || isMoving) {
        setShouldLoad(true);
      }
    }, [data?.preload, isMoving, isSelected]);

    useEffect(() => {
      if (!meshRef.current || !shouldLoad) return;
      const box = new THREE.Box3().setFromObject(meshRef.current);
      const size = new THREE.Vector3();
      box.getSize(size);
    }, [shouldLoad]);

    useFrame(({ pointer, raycaster, camera }) => {
      if (isMoving && meshRef.current?.position) {
        raycaster.setFromCamera(pointer, camera);
        const planeZ = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(planeZ, intersectPoint);

        meshRef.current.position.x = intersectPoint.x;
        meshRef.current.position.z = intersectPoint.z;

        setCurrentSelection(data.id);
      }
    });

    useEffect(() => {
      const current = meshRef.current;
      if (!current || !current.position) return;
      if (!data?.id) return;

      setAddedHighlights((prevHighlights) =>
        prevHighlights.map((item) => {
          if (!item || item.id !== data?.id) return item;
          const y = Array.isArray(item.position) ? item.position[1] : 0;
          return {
            ...item,
            position: [
              current.position.x,
              y,
              current.position.z,
            ],
          };
        })
      );
    }, [isMoving, data?.id, setAddedHighlights]);

    return (
      <group
        ref={meshRef}
        rotation={[0, (data.rotationIndex || 0) * Math.PI / 2, 0]}
        onPointerOver={() => {
          setIsHovered(true);
          setShouldLoad(true);
        }}
        onPointerOut={() => setIsHovered(false)}
        onClick={onClickHighlight}
        position={Array.isArray(data.position) ? data.position : [0, 0, 0]}
      >
        {shouldLoad && data.modelFile ? (
          <ModelMesh modelFile={data.modelFile} isHovered={isHovered} />
        ) : (
          <mesh>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="orange" />
          </mesh>
        )}
      </group>
    );
  }
);

export default PointerHighlight;

function ModelMesh({ modelFile, isHovered }) {
  const model = useGLTFWithKTX2(modelFile);

  return Object.values(model.nodes).map((node, index) => {
    if (!node.geometry) return null;
    return (
      <mesh
        key={index}
        geometry={node.geometry}
        material={model.materials[node.material?.name] || model.materials.default}
        position={node.position}
        rotation={node.rotation}
        scale={isHovered ? node.scale.clone().multiplyScalar(1.1) : node.scale}
        material-transparent={true}
        material-opacity={isHovered ? 0.7 : 1}
      />
    );
  });
}
