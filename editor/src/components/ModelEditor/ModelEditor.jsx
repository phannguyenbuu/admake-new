import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

import "./ModelEditor.css";

/* =========================
   MODEL PREVIEW
========================= */
function GLBModel({ modelPath, materials }) {
  const { scene } = useGLTF(modelPath);

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh && Array.isArray(obj.material)) {
        obj.material = obj.material.map((mat, i) =>
          materials[i] ? materials[i] : mat
        );
      } else if (obj.isMesh && materials[0]) {
        obj.material = materials[0];
      }
    });
  }, [scene, materials]);

  return (
    <primitive
      object={scene}
      rotation={[0, Math.PI, 0]}
      scale={1}
    />
  );
}

/* =========================
   MAIN EDITOR
========================= */
export default function ModelEditor({
  modelPath,
  materialsPath,
  previewOnly = false,
  selectedMaterial = null,
}) {
  const [materialSlots, setMaterialSlots] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [activeSlot, setActiveSlot] = useState(
    selectedMaterial !== null ? Number(selectedMaterial) : 0
  );

  /* =========================
     LOAD MATERIAL SLOTS
  ========================= */
  useEffect(() => {
    fetch(materialsPath)
      .then((r) => r.json())
      .then((data) => {
        setMaterialSlots(data.slots || []);
        setMaterials(
          data.slots.map(
            () =>
              new THREE.MeshStandardMaterial({
                color: "#cccccc",
              })
          )
        );
      });
  }, [materialsPath]);

  /* =========================
     UPDATE MATERIAL
  ========================= */
  const updateMaterial = (key, value) => {
    setMaterials((prev) =>
      prev.map((mat, i) => {
        if (i !== activeSlot) return mat;

        const clone = mat.clone();
        clone[key] = value;
        clone.needsUpdate = true;
        return clone;
      })
    );
  };

  const activeMaterial = materials[activeSlot];

  return (
    <div className="model-editor">
      {/* ================= LEFT: SLOT LIST ================= */}
      {!previewOnly && (
        <div className="editor-left">
          <h3>Material Slots</h3>
          {materialSlots.map((slot, i) => (
            <div
              key={i}
              className={`slot ${i === activeSlot ? "active" : ""}`}
              onClick={() => setActiveSlot(i)}
            >
              #{i} – {slot.name || "Material"}
            </div>
          ))}
        </div>
      )}

      {/* ================= CENTER: PREVIEW ================= */}
      <div className="editor-center">
        <Canvas camera={{ position: [0, 1.5, 3], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[3, 5, 3]} intensity={1.2} />
          <Environment preset="studio" />

          <GLBModel
            modelPath={modelPath}
            materials={materials}
            selectedSlot={activeSlot}
          />

          <OrbitControls />
        </Canvas>
      </div>

      {/* ================= RIGHT: MATERIAL EDITOR ================= */}
      {!previewOnly && activeMaterial && (
        <div className="editor-right">
          <h3>Material #{activeSlot}</h3>

          <label>
            Color
            <input
              type="color"
              value={`#${activeMaterial.color.getHexString()}`}
              onChange={(e) =>
                updateMaterial("color", new THREE.Color(e.target.value))
              }
            />
          </label>

          <label>
            Roughness
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={activeMaterial.roughness}
              onChange={(e) =>
                updateMaterial("roughness", Number(e.target.value))
              }
            />
          </label>

          <label>
            Metalness
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={activeMaterial.metalness}
              onChange={(e) =>
                updateMaterial("metalness", Number(e.target.value))
              }
            />
          </label>
        </div>
      )}
    </div>
  );
}
