import { useSelection, usePointer } from "../stores/selectionStore";
import * as THREE from "three";

import React, { useMemo, useState, useRef, useEffect } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, Box, useGLTF, ContactShadows, useTexture, Decal } from '@react-three/drei';

const PointerHighlight = React.forwardRef(({data, isMoving, setMovingId, isSelected}, ref) => {
  
    // {data.id, , pointer,  data.modelFile, data.rotationIndex }

  const meshRef = ref || React.useRef();
  const [isHovered, setIsHovered] = React.useState(false);
  const {currentSelection, setCurrentSelection} = useSelection();
  // const { setPointer } = usePointer();
  // const [isMoving, setIsMoving] = useState(false);
  const {addedHighlights, setAddedHighlights, setMessage} = usePointer();
  // console.log('model', data);
  const model = data.modelFile ? useGLTF(data.modelFile) : null;
  
  const onClickHighlight = () => {
    if (isMoving) {
      setMovingId(null);    // dừng di chuyển nếu đang moving
    } else {
      setMovingId(data.id);
      setMessage(`Bạn đang chọn ${data.name} click tiếp để đặt vật dụng`)
      setCurrentSelection(data.id);
    }
  };

  const [bboxSize, setBboxSize] = React.useState([1, 1]);

  useEffect(() => {
    if (meshRef.current) {
      const box = new THREE.Box3().setFromObject(meshRef.current);
      const size = new THREE.Vector3();
      box.getSize(size);
      setBboxSize([size.x, size.y]); // Lưu kích thước width, height của group
    }
  }, [model]);

  useFrame(({ pointer, raycaster, camera }) => {
    if (isMoving && meshRef.current) {
      raycaster.setFromCamera(pointer, camera);
      const planeZ = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(planeZ, intersectPoint);

      meshRef.current.position.x = intersectPoint.x;
      meshRef.current.position.z = intersectPoint.z;

      
      setCurrentSelection(data.id);
    }
  });


  useEffect(()=>{
    if (!meshRef.current) return;

    setAddedHighlights(prevHighlights => 
      prevHighlights.map(item => 
        item.id === data.id // điều kiện xác định item cần update
          ? { ...item, position: [meshRef.current.position.x, item.position[1], meshRef.current.position.z] }
          : item
      )
    );

  },[isMoving]);


  return (
    <group ref={meshRef} rotation={[0, data.rotationIndex * Math.PI / 2, 0]} 
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
      onClick={onClickHighlight}
      position={data.position}
      // raycast={(...args) => THREE.Mesh.prototype.raycast.apply(this, args)} // đảm bảo raycast
      >
      
      {model ? (
        Object.values(model.nodes).map((node, index) => (
          node.geometry && (
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
          )
        ))
      ) : (
        <mesh>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      )}
    </group>
  );
});

export default PointerHighlight;