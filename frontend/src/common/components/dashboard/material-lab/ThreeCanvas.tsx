import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createThreeMaterial } from './materialsData';
import type { UpdatableMaterial } from './materialsData';
import { generateProceduralEnvMap } from './proceduralTextures';

function getGeometryForMaterial(item: any): { geom: THREE.BufferGeometry; posY: number; rotX?: number; rotY?: number; rotZ?: number } {
  if (!item) {
    return {
      geom: new THREE.IcosahedronGeometry(1.0, 5),
      posY: 0.0
    };
  }
  
  const nameLower = (item.name || '').toLowerCase();
  const unitLower = (item.unit || '').toLowerCase();
  const specLower = (item.specification || '').toLowerCase();
  
  // 1. Sheet (Tấm) for "tấm", alu, mica, fomex, pima, poly, tôn, bạt
  if (
    nameLower.includes('tấm') ||
    unitLower.includes('tấm') ||
    nameLower.includes('alu') ||
    nameLower.includes('mica') ||
    nameLower.includes('fomex') ||
    nameLower.includes('pima') ||
    nameLower.includes('poly') ||
    nameLower.includes('tôn') ||
    nameLower.includes('bạt')
  ) {
    const width = 1.22;
    const length = 2.44;
    const thickness = 0.018;
    const geom = new THREE.BoxGeometry(width, thickness, length);
    return {
      geom,
      posY: 0.0,
    };
  }

  // 2. Hollow box/tube for "hộp" (Sắt hộp)
  if (nameLower.includes('hộp') || specLower.includes('hộp') || nameLower.includes('sắt hộp')) {
    let widthVal = 25;
    let heightVal = 25;
    const match = (nameLower + ' ' + specLower).match(/(\d+)\s*x\s*(\d+)/);
    if (match) {
      widthVal = parseInt(match[1]);
      heightVal = parseInt(match[2]);
    }
    const w = (widthVal * 10) / 1000; // scaled 10x
    const h = (heightVal * 10) / 1000; // scaled 10x
    const t = 0.0014 * 10; // thickness scaled 10x
    const length = 1.0; // 1 meter long
    
    const shape = new THREE.Shape();
    shape.moveTo(-w/2, -h/2);
    shape.lineTo(w/2, -h/2);
    shape.lineTo(w/2, h/2);
    shape.lineTo(-w/2, h/2);
    shape.lineTo(-w/2, -h/2);
    
    const hole = new THREE.Path();
    const iw = w - 2 * t;
    const ih = h - 2 * t;
    hole.moveTo(-iw/2, -ih/2);
    hole.lineTo(-iw/2, ih/2);
    hole.lineTo(iw/2, ih/2);
    hole.lineTo(iw/2, -ih/2);
    hole.lineTo(-iw/2, -ih/2);
    shape.holes.push(hole);
    
    const extrudeSettings = {
      depth: length,
      bevelEnabled: false,
    };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    
    return {
      geom,
      posY: 0.0,
      rotX: Math.PI / 12,
      rotY: Math.PI / 6,
      rotZ: 0
    };
  }
  
  // 3. Cylinder for "dây điện", "keo sữa", "keo", "silicon", "mực"
  if (
    nameLower.includes('dây điện') ||
    nameLower.includes('keo') ||
    nameLower.includes('silicon') ||
    nameLower.includes('mực') ||
    unitLower.includes('cuộn') ||
    unitLower.includes('chai') ||
    unitLower.includes('lít')
  ) {
    const radius = 0.15;
    const height = 0.6;
    const geom = new THREE.CylinderGeometry(radius, radius, height, 32);
    return {
      geom,
      posY: 0.0,
    };
  }

  // 4. Default geosphere
  return {
    geom: new THREE.IcosahedronGeometry(1.0, 5),
    posY: 0.0
  };
}

interface ThreeCanvasProps {
  materialId: string;
  materialProps?: any;
  lightingPreset: string;
  autoRotateSpeed: number;
  lightOrbitSpeed: number;
  showWireframe: boolean;
  modelType: 'geosphere' | 'torusknot' | 'reactor';
  isGlowPulseActive: boolean;
  backgroundColor: string;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  materialId,
  materialProps,
  lightingPreset,
  autoRotateSpeed,
  lightOrbitSpeed,
  showWireframe,
  modelType,
  isGlowPulseActive,
  backgroundColor,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Ref to hold update variables for the animation loop
  const stateRef = useRef({
    materialId,
    materialProps,
    lightingPreset,
    autoRotateSpeed,
    lightOrbitSpeed,
    showWireframe,
    modelType,
    isGlowPulseActive,
    backgroundColor,
    time: 0,
  });

  // Track FPS and active render state for diagnostic overlays
  const [fps, setFps] = useState<number>(60);

  // Sync props to stateRef to avoid re-triggering useEffect and causing canvas flicker
  useEffect(() => {
    stateRef.current.materialId = materialId;
    stateRef.current.materialProps = materialProps;
    stateRef.current.lightingPreset = lightingPreset;
    stateRef.current.autoRotateSpeed = autoRotateSpeed;
    stateRef.current.lightOrbitSpeed = lightOrbitSpeed;
    stateRef.current.showWireframe = showWireframe;
    stateRef.current.modelType = modelType;
    stateRef.current.isGlowPulseActive = isGlowPulseActive;
    stateRef.current.backgroundColor = backgroundColor;
  }, [materialId, materialProps, lightingPreset, autoRotateSpeed, lightOrbitSpeed, showWireframe, modelType, isGlowPulseActive, backgroundColor]);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Initial WebGL Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Physical-accuracy values for r150+ output
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // 2. Camera & Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060813); // Deep cosmic navy/black
    scene.fog = new THREE.FogExp2(0x060813, 0.04);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 2.2, 5.0);

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.15; // prevent going too far below base stand
    controls.minDistance = 2.5;
    controls.maxDistance = 10.0;

    // 4. Generate Procedural Environment Mapping for metallic reflections
    const reflectiveEnvMap = generateProceduralEnvMap(renderer);
    scene.environment = reflectiveEnvMap;

    // 5. Create Light Rig (Extreme Theme Setup)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    // Create shadow-casting primary direction light
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(4, 5, 4);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    dirLight1.shadow.bias = -0.001;
    scene.add(dirLight1);

    // Create second colored filler light
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight2.position.set(-4, 3, -4);
    scene.add(dirLight2);

    // Create glowing physical orbital plasma orbs + point lights
    const orb1Group = new THREE.Group();
    const orb1Mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff00bb })
    );
    const orb1Light = new THREE.PointLight(0xff00bb, 3.5, 6.0, 1.5);
    // Mesh indicators removed per user request so the visual spheres are invisible, leaving only the soft lighting
    orb1Group.add(orb1Light);
    scene.add(orb1Group);

    const orb2Group = new THREE.Group();
    const orb2Mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ffcc })
    );
    const orb2Light = new THREE.PointLight(0x00ffcc, 3.5, 6.0, 1.5);
    // Mesh indicators removed per user request so the visual spheres are invisible, leaving only the soft lighting
    orb2Group.add(orb2Light);
    scene.add(orb2Group);

    // A volumetric-like background glow disk to highlight silhouette curves
    const backdropGeo = new THREE.PlaneGeometry(8, 8);
    const backdropMat = new THREE.MeshBasicMaterial({
      color: 0x11163a,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const backdrop = new THREE.Mesh(backdropGeo, backdropMat);
    backdrop.position.set(0, 0, -3.5);
    // Removed backdrop plane standing in the scene per user request (bỏ tấm plane đứng trong scene)

    // 6. Floor Grid and Ground Plane
    const groundGeo = new THREE.PlaneGeometry(15, 15);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111322,
      roughness: 0.65,
      metalness: 0.2,
      flatShading: false,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -1.2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Technical grid overlay
    const gridHelper = new THREE.GridHelper(15, 30, 0x1d244a, 0x10142b);
    gridHelper.position.y = -1.19;
    scene.add(gridHelper);

    // -------------------------------------------------------------
    // 7. Core Object Construction (Modular geometries)
    // -------------------------------------------------------------
    const materialBallGroup = new THREE.Group();
    scene.add(materialBallGroup);

    // Stand - Static (doesn't rotate with material, matches image)
    const standGroup = new THREE.Group();
    standGroup.position.y = -1.19;
    // scene.add(standGroup); // Hidden as requested

    const standBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.45, 0.15, 32),
      new THREE.MeshStandardMaterial({ color: 0x1c2135, roughness: 0.5, metalness: 0.8 })
    );
    standBase.receiveShadow = true;
    standBase.castShadow = true;
    standGroup.add(standBase);

    const standCoreDisk = new THREE.Mesh(
      new THREE.TorusGeometry(1.0, 0.08, 16, 40),
      new THREE.MeshStandardMaterial({ color: 0x313953, roughness: 0.3, metalness: 0.9 })
    );
    standCoreDisk.rotation.x = Math.PI / 2;
    standCoreDisk.position.y = 0.08;
    standGroup.add(standCoreDisk);

    const standStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.7, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x1c2135, roughness: 0.4, metalness: 0.7 })
    );
    standStem.position.y = 0.2;
    standGroup.add(standStem);

    // -------------------------------------------------------------
    // Hot Swap material reference state trackers
    // -------------------------------------------------------------
    let currentGeoType = stateRef.current.modelType;
    let lastAppliedMaterialId = stateRef.current.materialId;
    let lastAppliedMaterialProps = stateRef.current.materialProps;
    let updatableMat: UpdatableMaterial | null = null;
    let materialObj: THREE.Material | null = null;

    // Outer component reference for active model mesh
    let singleObjMesh: THREE.Mesh | null = null;

    function rebuildGeometry() {
      if (singleObjMesh) materialBallGroup.remove(singleObjMesh);

      const activeMaterial = materialObj || new THREE.MeshStandardMaterial({ color: 0xffffff });

      const { geom, posY, rotX, rotY, rotZ } = getGeometryForMaterial(stateRef.current.materialProps);

      singleObjMesh = new THREE.Mesh(geom, activeMaterial);
      singleObjMesh.castShadow = true;
      singleObjMesh.receiveShadow = true;

      // Position and rotate the mesh so it sits beautifully on the stand/ground
      singleObjMesh.position.set(0, posY, 0);
      singleObjMesh.rotation.set(rotX || 0, rotY || 0, rotZ || 0);

      materialBallGroup.add(singleObjMesh);
      currentGeoType = stateRef.current.modelType;
    }

    function updateAppliedMaterial() {
      // Clean up previous material
      if (updatableMat) {
        updatableMat.dispose();
      }

      const mId = stateRef.current.materialId;
      updatableMat = createThreeMaterial(mId, reflectiveEnvMap, stateRef.current.materialProps);
      materialObj = updatableMat.material;

      // Apply to active geometries
      if (singleObjMesh) {
        singleObjMesh.material = materialObj;
        singleObjMesh.material.needsUpdate = true;
      }
    }

    // Initialize geometry & material setups
    updateAppliedMaterial();
    rebuildGeometry();

    // Position of the whole interactive material ball in center space
    materialBallGroup.position.set(0, 0, 0);

    // -------------------------------------------------------------
    // 8. Dynamic Lighting Configurator (Calculates preset states)
    // -------------------------------------------------------------
    function updateLightingVibe(time: number) {
      const preset = stateRef.current.lightingPreset;
      const pulseFactor = stateRef.current.isGlowPulseActive ? Math.sin(time * 5.0) * 0.25 + 1.0 : 1.0;

      switch (preset) {
        case 'studio':
          dirLight1.color.setHex(0xffffff);
          dirLight1.intensity = 2.0;
          dirLight2.color.setHex(0xaaaaaa);
          dirLight2.intensity = 1.0;
          ambientLight.color.setHex(0xffffff);
          ambientLight.intensity = 0.2;
          
          orb1Mesh.visible = false;
          orb1Light.intensity = 0;
          orb2Mesh.visible = false;
          orb2Light.intensity = 0;
          scene.background = new THREE.Color(0x0a0c16);
          scene.fog!.color = new THREE.Color(0x0a0c16);
          backdropMat.color.setHex(0x19213c);
          backdropMat.opacity = 0.3;
          break;

        case 'neon':
          dirLight1.color.setHex(0xff005d); // Neon Pink
          dirLight1.intensity = 2.5 * pulseFactor;
          dirLight2.color.setHex(0x00f0ff); // Electric Cyan
          dirLight2.intensity = 2.0 * pulseFactor;
          ambientLight.color.setHex(0x310066); // Dark violet
          ambientLight.intensity = 0.4;

          orb1Mesh.visible = true;
          orb1Light.color.setHex(0xff00bb);
          orb1Light.intensity = 5.0;
          orb1Mesh.material = new THREE.MeshBasicMaterial({ color: 0xff00bb });

          orb2Mesh.visible = true;
          orb2Light.color.setHex(0x00ffcc);
          orb2Light.intensity = 5.0;
          orb2Mesh.material = new THREE.MeshBasicMaterial({ color: 0x00ffcc });

          scene.background = new THREE.Color(0x05010a);
          scene.fog!.color = new THREE.Color(0x05010a);
          backdropMat.color.setHex(0x6b007a);
          backdropMat.opacity = 0.65;
          break;

        case 'solar':
          dirLight1.color.setHex(0xff7700); // Solar Orange
          dirLight1.intensity = 3.5 * pulseFactor;
          dirLight2.color.setHex(0xffcc00); // Sun Yellow
          dirLight2.intensity = 2.0 * pulseFactor;
          ambientLight.color.setHex(0x220900); // Hot cinder
          ambientLight.intensity = 0.3;

          orb1Mesh.visible = true;
          orb1Light.color.setHex(0xff3300);
          orb1Light.intensity = 6.0;
          orb1Mesh.material = new THREE.MeshBasicMaterial({ color: 0xff3300 });

          orb2Mesh.visible = true;
          orb2Light.color.setHex(0xffaa00);
          orb2Light.intensity = 4.0;
          orb2Mesh.material = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

          scene.background = new THREE.Color(0x0b0200);
          scene.fog!.color = new THREE.Color(0x0b0200);
          backdropMat.color.setHex(0xa32a00);
          backdropMat.opacity = 0.75;
          break;

        case 'toxic':
          dirLight1.color.setHex(0x2dff14); // Slime neon green
          dirLight1.intensity = 3.0 * pulseFactor;
          dirLight2.color.setHex(0xd4ff00); // Uranium yellow
          dirLight2.intensity = 1.8 * pulseFactor;
          ambientLight.color.setHex(0x011c03);
          ambientLight.intensity = 0.4;

          orb1Mesh.visible = true;
          orb1Light.color.setHex(0x39ff14);
          orb1Light.intensity = 6.0;
          orb1Mesh.material = new THREE.MeshBasicMaterial({ color: 0x39ff14 });

          orb2Mesh.visible = true;
          orb2Light.color.setHex(0x00ffff);
          orb2Light.intensity = 3.0;
          orb2Mesh.material = new THREE.MeshBasicMaterial({ color: 0x00ffff });

          scene.background = new THREE.Color(0x000602);
          scene.fog!.color = new THREE.Color(0x000602);
          backdropMat.color.setHex(0x056b1a);
          backdropMat.opacity = 0.55;
          break;

        case 'frozen':
          dirLight1.color.setHex(0x00bfff); // Ice Blue
          dirLight1.intensity = 2.5 * pulseFactor;
          dirLight2.color.setHex(0xffffff); // Crisp snow white
          dirLight2.intensity = 2.2 * pulseFactor;
          ambientLight.color.setHex(0x061122);
          ambientLight.intensity = 0.5;

          orb1Mesh.visible = true;
          orb1Light.color.setHex(0xddf7ff);
          orb1Light.intensity = 4.0;
          orb1Mesh.material = new THREE.MeshBasicMaterial({ color: 0xddf7ff });

          orb2Mesh.visible = true;
          orb2Light.color.setHex(0x0066ff);
          orb2Light.intensity = 6.0;
          orb2Mesh.material = new THREE.MeshBasicMaterial({ color: 0x0066ff });

          scene.background = new THREE.Color(0x020814);
          scene.fog!.color = new THREE.Color(0x020814);
          backdropMat.color.setHex(0x0c4b75);
          backdropMat.opacity = 0.7;
          break;

        case 'abyss':
          dirLight1.color.setHex(0x8a00ff); // Dark violet
          dirLight1.intensity = 1.5;
          dirLight2.color.setHex(0x221155); // Dim indigo
          dirLight2.intensity = 0.8;
          ambientLight.color.setHex(0x020108);
          ambientLight.intensity = 0.15;

          orb1Mesh.visible = true;
          orb1Light.color.setHex(0x8a00ff);
          orb1Light.intensity = 8.0; // bright contrasting spot inside darkness
          orb1Mesh.material = new THREE.MeshBasicMaterial({ color: 0x8a00ff });

          orb2Mesh.visible = false;
          orb2Light.intensity = 0;

          scene.background = new THREE.Color(0x020105);
          scene.fog!.color = new THREE.Color(0x020105);
          backdropMat.color.setHex(0x32014c);
          backdropMat.opacity = 0.45;
          break;

        default:
          break;
      }

      // Override background and fog colors dynamically with the React-controlled custom background choice
      const customBgColor = new THREE.Color(stateRef.current.backgroundColor);
      scene.background = customBgColor;
      if (scene.fog) {
        scene.fog.color = customBgColor;
      }
    }

    // -------------------------------------------------------------
    // 9. Interactive Frame Loop & Event Handlers
    // -------------------------------------------------------------
    let lastTime = 0;
    let frames = 0;
    let lastFpsUpdate = 0;
    let animationFrameId: number;

    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      stateRef.current.time = elapsed;

      // Swap out resources on-the-fly dynamically if reactive states changed
      if (
        stateRef.current.materialId !== lastAppliedMaterialId ||
        stateRef.current.materialProps !== lastAppliedMaterialProps
      ) {
        updateAppliedMaterial();
        rebuildGeometry();
        lastAppliedMaterialId = stateRef.current.materialId;
        lastAppliedMaterialProps = stateRef.current.materialProps;
      }
      if (stateRef.current.modelType !== currentGeoType) {
        rebuildGeometry();
      }

      // Sync wireframe rendering
      if (materialObj && 'wireframe' in materialObj) {
        (materialObj as any).wireframe = stateRef.current.showWireframe;
      }

      // Auto rotation of the main material mesh
      if (stateRef.current.autoRotateSpeed > 0) {
        materialBallGroup.rotation.y += delta * 0.25 * stateRef.current.autoRotateSpeed;
      }

      // Keep the extreme light assemblies static per user request (ánh sáng đứng yên)
      const angle1 = Math.PI / 4; // Nice fixed angle
      const angle2 = Math.PI * 1.25; // Opposite angle for balanced key and fill lighting

      // Orb 1 coordinates (Static horizontally placed)
      orb1Group.position.x = Math.sin(angle1) * 1.8;
      orb1Group.position.z = Math.cos(angle1) * 1.8;
      orb1Group.position.y = 0.35; // Fixed height

      // Orb 2 coordinates (Static diagonally high)
      orb2Group.position.x = Math.cos(angle2) * 1.9;
      orb2Group.position.z = Math.sin(angle2) * 1.2;
      orb2Group.position.y = 0.8; // Fixed height

      // Static position for key directional light
      dirLight1.position.x = 2.8;
      dirLight1.position.z = 2.8;

      // Trigger material updates (e.g. advance procedural flow inside shaders/lava)
      if (updatableMat) {
        updatableMat.update(elapsed);
      }

      // Update active light preset options
      updateLightingVibe(elapsed);

      // Perform control dampening smoothings
      controls.update();

      // Finally, paint frame
      renderer.render(scene, camera);

      // FPS tracking logic safely
      frames++;
      const now = performance.now();
      if (now - lastFpsUpdate > 1000) {
        setFps(Math.round((frames * 1000) / (now - lastFpsUpdate)));
        frames = 0;
        lastFpsUpdate = now;
      }
    };

    animate();

    // -------------------------------------------------------------
    // 10. Clean-up & Resize management
    // -------------------------------------------------------------
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (updatableMat) {
        updatableMat.dispose();
      }
      standBase.geometry.dispose();
      (standBase.material as THREE.Material).dispose();
      standCoreDisk.geometry.dispose();
      (standCoreDisk.material as THREE.Material).dispose();
      standStem.geometry.dispose();
      (standStem.material as THREE.Material).dispose();
      
      orb1Mesh.geometry.dispose();
      (orb1Mesh.material as THREE.Material).dispose();
      orb2Mesh.geometry.dispose();
      (orb2Mesh.material as THREE.Material).dispose();
      
      backdropGeo.dispose();
      backdropMat.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      gridHelper.dispose();
      reflectiveEnvMap.dispose();

      if (singleObjMesh) {
        singleObjMesh.geometry.dispose();
      }

      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Scene created once, material hot-swapped via stateRef

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor }}
    >
      {/* 3D Container viewport */}
      <div id="three-stage" ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />


    </div>
  );
};

export const ThreeCanvasMemo = React.memo(ThreeCanvas);
