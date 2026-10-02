/**
 * Lumion Material Factory — Three.js shader & material construction.
 * Groups: custom, indoor, outdoor, nature.
 * Now with REAL texture maps from local texture library.
 */

import * as THREE from 'three';
import * as Procedural from './proceduralTextures';
import { loadTexture, loadBumpTexture } from './textureLoader';

export interface UpdatableMaterial {
  material: THREE.Material;
  update: (time: number) => void;
  dispose: () => void;
}

/**
 * Creates dynamic high compatibility Lumion materials inside Three.js.
 * Now with REAL texture maps loaded from public/textures/
 */
export function createThreeMaterial(
  id: string,
  envMap: THREE.CubeTexture | null,
  customProps?: any
): UpdatableMaterial {
  const disposables: { dispose: () => void }[] = [];
  let updateFn = (_time: number) => {};

  let material: THREE.Material;

  // Generate reusable procedural bumps & textures
  const scratchMap = Procedural.generateBrushedBrushed();
  const rustMaps = Procedural.generateRustMaps();
  const carbonMap = Procedural.generateCarbonFiber();
  const neutralEnvMap = Procedural.generateNeutralEnvMap();
  disposables.push(scratchMap, rustMaps.color, rustMaps.bump, carbonMap, neutralEnvMap);

  switch (id) {
    // =============================================
    // --- CUSTOM MATERIALS ---
    // =============================================
    case 'custom_shader': {
      const colorVal = customProps?.diffuse || '#ffffff';
      const isTrans = !!customProps?.transparent;
      const opVal = customProps?.opacity !== undefined ? customProps.opacity : 1.0;
      const refVal = customProps?.refraction !== undefined ? customProps.refraction : 1.0;

      const glossyVal = customProps?.glossy !== undefined ? customProps.glossy : 0.0;
      const roughnessVal = customProps?.roughness !== undefined ? customProps.roughness : (1.0 - glossyVal);
      const metalnessVal = customProps?.metalness !== undefined ? customProps.metalness : (customProps?.reflection !== undefined ? customProps.reflection : 0.0);

      const emissiveVal = customProps?.emissive || '#000000';
      const emissiveIntensityVal = customProps?.emissive_intensity !== undefined ? customProps.emissive_intensity : (customProps?.emissiveIntensity !== undefined ? customProps.emissiveIntensity : 0.0);

      const matParams: THREE.MeshPhysicalMaterialParameters = {
        color: new THREE.Color(colorVal),
        metalness: metalnessVal,
        roughness: roughnessVal,
        transparent: isTrans,
        opacity: opVal,
        envMap: envMap,
        envMapIntensity: 1.2,
      };

      if (isTrans) {
        matParams.transmission = 1.0 - opVal;
        matParams.thickness = 1.5;
        matParams.ior = refVal;
      }

      if (emissiveVal !== '#000000' && emissiveIntensityVal > 0) {
        matParams.emissive = new THREE.Color(emissiveVal);
        matParams.emissiveIntensity = emissiveIntensityVal;
      }

      if (customProps?.bump) {
        const nameLower = (customProps.name || '').toLowerCase();
        let bumpTex: THREE.Texture | null = null;
        if (nameLower.includes('inox') || nameLower.includes('xước') || nameLower.includes('brushed')) {
          bumpTex = scratchMap;
        } else if (
          nameLower.includes('sắt') || nameLower.includes('steel') || nameLower.includes('thép') ||
          nameLower.includes('hộp') || nameLower.includes('fomex') || nameLower.includes('vải') ||
          nameLower.includes('bạt') || nameLower.includes('canvas')
        ) {
          bumpTex = rustMaps.bump;
        }
        if (bumpTex) {
          matParams.bumpMap = bumpTex;
          matParams.bumpScale = 0.05;
        }
      }

      material = new THREE.MeshPhysicalMaterial(matParams);
      break;
    }

    case 'lumion_standard': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0xcccccc,
        metalness: 0.2,
        roughness: 0.35,
        envMap: envMap,
        envMapIntensity: 1.2,
        clearcoat: 0.1,
        clearcoatRoughness: 0.1,
      });
      break;
    }

    case 'lumion_color': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0xe53e3e,
        metalness: 0.1,
        roughness: 0.1,
        envMap: envMap,
        envMapIntensity: 1.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
      });
      break;
    }

    case 'lumion_glass': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.0,
        roughness: 0.02,
        transmission: 0.95,
        thickness: 1.5,
        ior: 1.52,
        envMap: envMap,
        envMapIntensity: 2.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
      });
      break;
    }

    case 'lumion_water': {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      const waterTex = new THREE.CanvasTexture(canvas);
      waterTex.wrapS = THREE.RepeatWrapping;
      waterTex.wrapT = THREE.RepeatWrapping;
      waterTex.repeat.set(2, 2);
      disposables.push(waterTex);

      material = new THREE.MeshPhysicalMaterial({
        color: 0x4299e1,
        roughness: 0.08,
        metalness: 0.1,
        normalMap: waterTex,
        normalScale: new THREE.Vector2(0.25, 0.25),
        transmission: 0.7,
        thickness: 2.0,
        ior: 1.333,
        envMap: envMap,
        envMapIntensity: 1.8,
      });

      updateFn = (time: number) => {
        ctx.fillStyle = '#8080ff';
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2.5;
        for (let j = 0; j < 5; j++) {
          const shift = (time * 45 + j * 50) % size;
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, shift, 0, Math.PI * 2);
          ctx.stroke();
        }
        waterTex.needsUpdate = true;
      };
      break;
    }

    case 'lumion_waterfall': {
      const size = 128;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      const wfTex = new THREE.CanvasTexture(canvas);
      wfTex.wrapS = THREE.RepeatWrapping;
      wfTex.wrapT = THREE.RepeatWrapping;
      disposables.push(wfTex);

      material = new THREE.MeshPhysicalMaterial({
        map: wfTex,
        roughness: 0.1,
        metalness: 0.2,
        emissiveMap: wfTex,
        emissive: 0xffffff,
        emissiveIntensity: 0.8,
        envMap: envMap,
        envMapIntensity: 1.5,
      });

      updateFn = (time: number) => {
        ctx.fillStyle = '#2b6cb0';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#ffffff';
        for (let idx = 0; idx < 12; idx++) {
          const yPos = (idx * 16 + time * 120) % size;
          ctx.fillRect(0, yPos, size, 4 + Math.sin(time * 5 + idx) * 2);
        }
        wfTex.needsUpdate = true;
      };
      break;
    }

    case 'lumion_billboard': {
      material = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(0x319795) },
          uGlowIntensity: { value: 1.5 }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying vec3 vWorldPosition;
          varying vec2 vUv;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vUv = uv;
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPos.xyz;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColor;
          uniform float uGlowIntensity;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying vec3 vWorldPosition;
          varying vec2 vUv;

          void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
            float fGlow = pow(fresnel, 2.0) * uGlowIntensity;

            float gridScale = 16.0;
            vec2 grid = abs(fract(vUv * gridScale - 0.5) - 0.5) / fwidth(vUv * gridScale);
            float line = min(grid.x, grid.y);
            float gridPattern = 1.0 - min(line, 1.0);

            float scanline = sin(vWorldPosition.y * 15.0 - uTime * 8.0) * 0.5 + 0.5;
            scanline = pow(scanline, 5.0) * 0.5;

            float finalAlpha = fGlow + (gridPattern * 0.5) + scanline;
            vec3 finalColor = uColor * (fGlow * 1.2 + gridPattern * 1.5 + scanline * 2.0 + 0.3);

            gl_FragColor = vec4(finalColor, finalAlpha * 0.7);
          }
        `
      });

      updateFn = (time: number) => {
        (material as THREE.ShaderMaterial).uniforms.uTime.value = time;
      };
      break;
    }

    case 'lumion_invisible': {
      material = new THREE.MeshBasicMaterial({
        color: 0x4a5568,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      });
      break;
    }

    case 'lumion_landscape': {
      const grassTex = loadTexture('nature_grass.jpg', 2, 2);
      disposables.push(grassTex);
      material = new THREE.MeshStandardMaterial({
        map: grassTex,
        color: 0x55885a,
        roughness: 0.85,
        metalness: 0.05,
        bumpMap: loadBumpTexture('nature_grass.jpg', 2, 2),
        bumpScale: 0.02,
      });
      break;
    }

    case 'lumion_lightmap': {
      material = new THREE.MeshStandardMaterial({
        color: 0x2d3748,
        roughness: 0.6,
        emissive: 0xecc94b,
        emissiveIntensity: 1.2,
      });
      break;
    }

    case 'lumion_carbon': {
      material = new THREE.MeshPhysicalMaterial({
        map: carbonMap,
        color: 0x222222,
        metalness: 0.6,
        roughness: 0.15,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        envMap: envMap,
        envMapIntensity: 1.8,
      });
      break;
    }

    case 'lumion_mirror': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 1.0,
        roughness: 0.0,
        envMap: neutralEnvMap,
        envMapIntensity: 3.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
      });
      break;
    }

    case 'lumion_neon_glow': {
      material = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 2.5,
        roughness: 0.2,
        metalness: 0.1,
      });

      updateFn = (time: number) => {
        const pulse = Math.sin(time * 3.0) * 0.5 + 0.5;
        const hue = (time * 0.1) % 1.0;
        const mat = material as THREE.MeshStandardMaterial;
        mat.emissive.setHSL(hue, 1.0, 0.5);
        mat.color.setHSL(hue, 1.0, 0.5);
        mat.emissiveIntensity = 1.5 + pulse * 2.0;
      };
      break;
    }

    // =============================================
    // --- INDOOR MATERIALS (with real textures) ---
    // =============================================
    case 'lumion_fabric': {
      const fabricTex = loadTexture('fabric_sofa.jpg', 2, 2);
      disposables.push(fabricTex);
      material = new THREE.MeshPhysicalMaterial({
        map: fabricTex,
        roughness: 0.9,
        metalness: 0.0,
        bumpMap: loadBumpTexture('fabric_sofa.jpg', 2, 2),
        bumpScale: 0.008,
        sheenColor: new THREE.Color(0xffffff),
        sheen: 0.8,
        sheenRoughness: 0.5,
      });
      break;
    }

    case 'lumion_indoor_glass': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0x90cdfa,
        roughness: 0.3,
        transmission: 0.85,
        thickness: 0.8,
        ior: 1.45,
        envMap: envMap,
        envMapIntensity: 1.2,
      });
      break;
    }

    case 'lumion_leather': {
      const leatherTex = loadTexture('leather_diffuse.jpg', 2, 2);
      disposables.push(leatherTex);
      material = new THREE.MeshPhysicalMaterial({
        map: leatherTex,
        roughness: 0.65,
        metalness: 0.05,
        bumpMap: loadBumpTexture('leather_diffuse.jpg', 2, 2),
        bumpScale: 0.015,
        clearcoat: 0.15,
        clearcoatRoughness: 0.4,
      });
      break;
    }

    case 'lumion_indoor_metal': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0x666666,
        metalness: 1.0,
        roughness: 0.12,
        bumpMap: scratchMap,
        bumpScale: 0.002,
        envMap: neutralEnvMap,
        envMapIntensity: 2.5,
        clearcoat: 0.6,
        clearcoatRoughness: 0.03,
      });
      break;
    }

    case 'lumion_plaster': {
      const plasterTex = loadTexture('plaster_detail.jpg', 3, 3);
      disposables.push(plasterTex);
      material = new THREE.MeshStandardMaterial({
        map: plasterTex,
        color: 0xedf2f7,
        roughness: 0.95,
        metalness: 0.0,
        bumpMap: loadBumpTexture('plaster_detail.jpg', 3, 3),
        bumpScale: 0.006,
      });
      break;
    }

    case 'lumion_plastic': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0x2d3748,
        roughness: 0.12,
        metalness: 0.05,
        clearcoat: 0.4,
        clearcoatRoughness: 0.1,
        envMap: envMap,
      });
      break;
    }

    case 'lumion_indoor_stone': {
      const marbleTex = loadTexture('marble_grey.jpg', 1, 1);
      disposables.push(marbleTex);
      material = new THREE.MeshPhysicalMaterial({
        map: marbleTex,
        roughness: 0.08,
        metalness: 0.0,
        envMap: envMap,
        envMapIntensity: 1.4,
        clearcoat: 0.8,
        clearcoatRoughness: 0.02,
      });
      break;
    }

    case 'lumion_tiles': {
      const tileTex = loadTexture('tile_bianco.jpg', 2, 2);
      disposables.push(tileTex);
      material = new THREE.MeshPhysicalMaterial({
        map: tileTex,
        roughness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.05,
        envMap: envMap,
        envMapIntensity: 1.0,
      });
      break;
    }

    case 'lumion_indoor_wood': {
      const woodTex = loadTexture('wood_clara_beige.jpg', 3, 3);
      disposables.push(woodTex);
      material = new THREE.MeshPhysicalMaterial({
        map: woodTex,
        roughness: 0.25,
        metalness: 0.0,
        bumpMap: loadBumpTexture('wood_clara_beige.jpg', 3, 3),
        bumpScale: 0.005,
        clearcoat: 0.8,
        clearcoatRoughness: 0.08,
        envMap: envMap,
        envMapIntensity: 0.6,
      });
      break;
    }

    case 'lumion_carpet': {
      const carpetTex = loadTexture('fabric_carpet.jpg', 2, 2);
      disposables.push(carpetTex);
      material = new THREE.MeshStandardMaterial({
        map: carpetTex,
        roughness: 0.95,
        metalness: 0.0,
        bumpMap: loadBumpTexture('fabric_carpet.jpg', 2, 2),
        bumpScale: 0.01,
      });
      break;
    }

    case 'lumion_parquet': {
      const parquetTex = loadTexture('wood_parquet.jpg', 4, 4);
      disposables.push(parquetTex);
      material = new THREE.MeshPhysicalMaterial({
        map: parquetTex,
        roughness: 0.3,
        metalness: 0.0,
        bumpMap: loadBumpTexture('wood_parquet.jpg', 4, 4),
        bumpScale: 0.004,
        clearcoat: 0.6,
        clearcoatRoughness: 0.1,
        envMap: envMap,
        envMapIntensity: 0.4,
      });
      break;
    }

    case 'lumion_walnut': {
      const walnutTex = loadTexture('wood_walnut_dark.jpg', 3, 3);
      disposables.push(walnutTex);
      material = new THREE.MeshPhysicalMaterial({
        map: walnutTex,
        roughness: 0.2,
        metalness: 0.0,
        bumpMap: loadBumpTexture('wood_walnut_dark.jpg', 3, 3),
        bumpScale: 0.005,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMap: envMap,
        envMapIntensity: 0.5,
      });
      break;
    }

    case 'lumion_ceramic': {
      const ceramicTex = loadTexture('tile_venato.jpg', 1, 1);
      disposables.push(ceramicTex);
      material = new THREE.MeshPhysicalMaterial({
        map: ceramicTex,
        roughness: 0.05,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMap: envMap,
        envMapIntensity: 1.6,
      });
      break;
    }

    case 'lumion_chrome': {
      const steelTex = loadTexture('metal_steel.jpg', 2, 2);
      disposables.push(steelTex);
      material = new THREE.MeshPhysicalMaterial({
        map: steelTex,
        color: 0xdddddd,
        metalness: 1.0,
        roughness: 0.02,
        envMap: neutralEnvMap,
        envMapIntensity: 2.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
      });
      break;
    }

    // =============================================
    // --- OUTDOOR MATERIALS (with real textures) ---
    // =============================================
    case 'lumion_asphalt': {
      const asphaltTex = loadTexture('asphalt_pave.jpg', 2, 2);
      disposables.push(asphaltTex);
      material = new THREE.MeshStandardMaterial({
        map: asphaltTex,
        roughness: 0.9,
        metalness: 0.0,
        bumpMap: loadBumpTexture('asphalt_pave.jpg', 2, 2),
        bumpScale: 0.03,
      });
      break;
    }

    case 'lumion_brick': {
      const brickTex = loadTexture('brick_red.jpg', 2, 2);
      disposables.push(brickTex);
      material = new THREE.MeshStandardMaterial({
        map: brickTex,
        roughness: 0.85,
        metalness: 0.0,
        bumpMap: loadBumpTexture('brick_red.jpg', 2, 2),
        bumpScale: 0.02,
      });
      break;
    }

    case 'lumion_concrete': {
      const concreteTex = loadTexture('concrete_rough.jpg', 2, 2);
      disposables.push(concreteTex);
      material = new THREE.MeshStandardMaterial({
        map: concreteTex,
        roughness: 0.8,
        metalness: 0.0,
        bumpMap: loadBumpTexture('concrete_rough.jpg', 2, 2),
        bumpScale: 0.025,
      });
      break;
    }

    case 'lumion_outdoor_glass': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0xbbeef7,
        metalness: 0.8,
        roughness: 0.05,
        transmission: 0.6,
        ior: 1.6,
        envMap: envMap,
        envMapIntensity: 2.2,
        clearcoat: 1.0,
      });
      break;
    }

    case 'lumion_outdoor_metal': {
      const metalTex = loadTexture('metal_steel.jpg', 2, 2);
      disposables.push(metalTex);
      material = new THREE.MeshPhysicalMaterial({
        map: metalTex,
        color: 0x888888,
        metalness: 0.9,
        roughness: 0.45,
        bumpMap: loadBumpTexture('metal_steel.jpg', 2, 2),
        bumpScale: 0.015,
        envMap: envMap,
        envMapIntensity: 1.2,
      });
      break;
    }

    case 'lumion_outdoor_plaster': {
      const plasterOutTex = loadTexture('concrete_dark.jpg', 2, 2);
      disposables.push(plasterOutTex);
      material = new THREE.MeshStandardMaterial({
        map: plasterOutTex,
        color: 0xcbd5e0,
        roughness: 0.92,
        metalness: 0.0,
        bumpMap: loadBumpTexture('concrete_dark.jpg', 2, 2),
        bumpScale: 0.04,
      });
      break;
    }

    case 'lumion_roofing': {
      const roofTex = loadTexture('roof_red.jpg', 3, 3);
      disposables.push(roofTex);
      material = new THREE.MeshStandardMaterial({
        map: roofTex,
        roughness: 0.75,
        metalness: 0.0,
        bumpMap: loadBumpTexture('roof_red.jpg', 3, 3),
        bumpScale: 0.015,
      });
      break;
    }

    case 'lumion_outdoor_stone': {
      const stoneTex = loadTexture('brick_natural.jpg', 2, 2);
      disposables.push(stoneTex);
      material = new THREE.MeshStandardMaterial({
        map: stoneTex,
        roughness: 0.9,
        metalness: 0.0,
        bumpMap: loadBumpTexture('brick_natural.jpg', 2, 2),
        bumpScale: 0.035,
      });
      break;
    }

    case 'lumion_outdoor_wood': {
      const woodOutTex = loadTexture('wood_plank.jpg', 3, 3);
      disposables.push(woodOutTex);
      material = new THREE.MeshStandardMaterial({
        map: woodOutTex,
        roughness: 0.75,
        metalness: 0.0,
        bumpMap: loadBumpTexture('wood_plank.jpg', 3, 3),
        bumpScale: 0.02,
      });
      break;
    }

    case 'lumion_cobblestone': {
      const cobbleTex = loadTexture('asphalt_pave.jpg', 3, 3);
      disposables.push(cobbleTex);
      material = new THREE.MeshStandardMaterial({
        map: cobbleTex,
        roughness: 0.88,
        metalness: 0.0,
        bumpMap: loadBumpTexture('asphalt_pave.jpg', 3, 3),
        bumpScale: 0.045,
      });
      break;
    }

    case 'lumion_granite': {
      const graniteTex = loadTexture('marble_grey.jpg', 2, 2);
      disposables.push(graniteTex);
      material = new THREE.MeshPhysicalMaterial({
        map: graniteTex,
        roughness: 0.4,
        metalness: 0.05,
        bumpMap: loadBumpTexture('marble_grey.jpg', 2, 2),
        bumpScale: 0.01,
        envMap: envMap,
        envMapIntensity: 0.6,
      });
      break;
    }

    case 'lumion_corten': {
      const cortenTex = loadTexture('metal_rust.jpg', 3, 3);
      disposables.push(cortenTex);
      material = new THREE.MeshStandardMaterial({
        map: cortenTex,
        color: 0xbb6633,
        roughness: 0.85,
        metalness: 0.4,
        bumpMap: loadBumpTexture('metal_rust.jpg', 3, 3),
        bumpScale: 0.03,
      });
      break;
    }

    case 'lumion_slate_roof': {
      const slateTex = loadTexture('roof_blue.jpg', 3, 3);
      disposables.push(slateTex);
      material = new THREE.MeshStandardMaterial({
        map: slateTex,
        roughness: 0.7,
        metalness: 0.0,
        bumpMap: loadBumpTexture('roof_blue.jpg', 3, 3),
        bumpScale: 0.015,
      });
      break;
    }

    case 'lumion_stucco': {
      const stuccoTex = loadTexture('metal_galvanized.jpg', 3, 3);
      disposables.push(stuccoTex);
      material = new THREE.MeshStandardMaterial({
        map: stuccoTex,
        color: 0xe8dfd0,
        roughness: 0.92,
        metalness: 0.0,
        bumpMap: loadBumpTexture('metal_galvanized.jpg', 3, 3),
        bumpScale: 0.02,
      });
      break;
    }

    // =============================================
    // --- NATURE MATERIALS (with real textures) ---
    // =============================================
    case 'lumion_3d_grass': {
      const grassTex = loadTexture('nature_grass.jpg', 3, 3);
      disposables.push(grassTex);
      material = new THREE.MeshStandardMaterial({
        map: grassTex,
        roughness: 0.9,
        metalness: 0.0,
        bumpMap: loadBumpTexture('nature_grass.jpg', 3, 3),
        bumpScale: 0.03,
      });
      break;
    }

    case 'lumion_leaves': {
      const leavesTex = loadTexture('nature_leaves.jpg', 2, 2);
      disposables.push(leavesTex);
      material = new THREE.MeshPhysicalMaterial({
        map: leavesTex,
        roughness: 0.6,
        metalness: 0.0,
        transmission: 0.2,
        thickness: 0.5,
        envMap: envMap,
        envMapIntensity: 0.5,
      });
      break;
    }

    case 'lumion_rock': {
      const rockTex = loadTexture('concrete_dark.jpg', 2, 2);
      disposables.push(rockTex);
      material = new THREE.MeshStandardMaterial({
        map: rockTex,
        color: 0x666666,
        roughness: 0.9,
        metalness: 0.0,
        bumpMap: loadBumpTexture('concrete_dark.jpg', 2, 2),
        bumpScale: 0.06,
      });
      break;
    }

    case 'lumion_soil': {
      const soilTex = loadTexture('asphalt_road.jpg', 2, 2);
      disposables.push(soilTex);
      material = new THREE.MeshStandardMaterial({
        map: soilTex,
        color: 0x8b7355,
        roughness: 0.98,
        metalness: 0.0,
        bumpMap: loadBumpTexture('asphalt_road.jpg', 2, 2),
        bumpScale: 0.045,
      });
      break;
    }

    case 'lumion_nature_water': {
      const size1 = 128;
      const canvas1 = document.createElement('canvas');
      canvas1.width = size1;
      canvas1.height = size1;
      const ctx1 = canvas1.getContext('2d')!;

      const lakeTex = new THREE.CanvasTexture(canvas1);
      lakeTex.wrapS = THREE.RepeatWrapping;
      lakeTex.wrapT = THREE.RepeatWrapping;
      disposables.push(lakeTex);

      material = new THREE.MeshPhysicalMaterial({
        color: 0x2c5282,
        roughness: 0.05,
        transmission: 0.8,
        thickness: 4.0,
        normalMap: lakeTex,
        normalScale: new THREE.Vector2(0.3, 0.3),
        envMap: envMap,
        envMapIntensity: 2.0,
      });

      updateFn = (time: number) => {
        ctx1.fillStyle = '#8080ff';
        ctx1.fillRect(0, 0, size1, size1);
        ctx1.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx1.lineWidth = 3;

        for (let j = 0; j < 3; j++) {
          const shift = (time * 20 + j * 40) % size1;
          ctx1.beginPath();
          ctx1.moveTo(0, shift);
          ctx1.bezierCurveTo(size1 / 3, shift + 10 * Math.sin(time), size1 * 0.66, shift - 10 * Math.sin(time), size1, shift);
          ctx1.stroke();
        }
        lakeTex.needsUpdate = true;
      };
      break;
    }

    case 'lumion_fur': {
      const fabricFurTex = loadTexture('fabric_modern_carpet.jpg', 3, 3);
      disposables.push(fabricFurTex);
      material = new THREE.MeshPhysicalMaterial({
        map: fabricFurTex,
        roughness: 0.98,
        metalness: 0.0,
        bumpMap: loadBumpTexture('fabric_modern_carpet.jpg', 3, 3),
        bumpScale: 0.04,
        sheenColor: new THREE.Color(0xffffff),
        sheen: 1.0,
        sheenRoughness: 0.9,
      });
      break;
    }

    case 'lumion_moss': {
      const mossTex = loadTexture('nature_leaves.jpg', 4, 4);
      disposables.push(mossTex);
      material = new THREE.MeshStandardMaterial({
        map: mossTex,
        color: 0x2d6633,
        roughness: 0.95,
        metalness: 0.0,
        bumpMap: loadBumpTexture('nature_leaves.jpg', 4, 4),
        bumpScale: 0.035,
      });
      break;
    }

    case 'lumion_gravel': {
      const gravelTex = loadTexture('concrete_dark.jpg', 4, 4);
      disposables.push(gravelTex);
      material = new THREE.MeshStandardMaterial({
        map: gravelTex,
        color: 0x999999,
        roughness: 0.92,
        metalness: 0.0,
        bumpMap: loadBumpTexture('concrete_dark.jpg', 4, 4),
        bumpScale: 0.05,
      });
      break;
    }

    case 'lumion_bark': {
      const barkTex = loadTexture('wood_plank.jpg', 2, 2);
      disposables.push(barkTex);
      material = new THREE.MeshStandardMaterial({
        map: barkTex,
        color: 0x5c3a21,
        roughness: 0.95,
        metalness: 0.0,
        bumpMap: loadBumpTexture('wood_plank.jpg', 2, 2),
        bumpScale: 0.06,
      });
      break;
    }

    case 'lumion_snow': {
      material = new THREE.MeshPhysicalMaterial({
        color: 0xf0f5ff,
        roughness: 0.3,
        metalness: 0.0,
        clearcoat: 0.6,
        clearcoatRoughness: 0.1,
        bumpMap: scratchMap,
        bumpScale: 0.002,
        envMap: envMap,
        envMapIntensity: 0.8,
        sheenColor: new THREE.Color(0xaaccff),
        sheen: 0.5,
        sheenRoughness: 0.3,
      });
      break;
    }

    default: {
      material = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.5,
        metalness: 0.2,
      });
      break;
    }
  }

  return {
    material,
    update: updateFn,
    dispose: () => {
      material.dispose();
      disposables.forEach((item) => item.dispose());
    }
  };
}
