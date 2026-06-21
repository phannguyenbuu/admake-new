/**
 * Procedural Texture Generators in canvas format to keep download sizes zero while
 * creating highly detailed, customizable 3D visuals.
 */

import * as THREE from 'three';

// -------------------------------------------------------------
// 1. Simple 2D Noise Helper (Value Noise with Fractal Octaves)
// -------------------------------------------------------------
function createNoiseGenerator() {
  const size = 256;
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    p[i] = Math.floor(Math.random() * 256);
  }
  
  function noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    
    // Smoothstep curves
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    
    const n00 = p[(X + p[Y]) & 255];
    const n10 = p[(X + 1 + p[Y]) & 255];
    const n01 = p[(X + p[(Y + 1) & 255]) & 255];
    const n11 = p[(X + 1 + p[(Y + 1) & 255]) & 255];
    
    // Interpolate
    const x1 = n00 + u * (n10 - n00);
    const x2 = n01 + u * (n11 - n01);
    
    return (x1 + v * (x2 - x1)) / 255;
  }

  function fbm(x: number, y: number, octaves = 4): number {
    let value = 0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      value += noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    
    return value / maxValue;
  }

  return { fbm, noise };
}

const generator = createNoiseGenerator();

// -------------------------------------------------------------
// 2. Procedural Canvas Generators
// -------------------------------------------------------------

/**
 * Carbon Fiber Texture
 * Generates a seamless carbon-fiber twill pattern
 */
export function generateCarbonFiber(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, 32, 32);

  // Twill woven layers
  ctx.fillStyle = '#1f1f21';
  for (let i = 0; i < 32; i += 8) {
    for (let j = 0; j < 32; j += 8) {
      if ((i + j) % 16 === 0) {
        ctx.fillRect(i, j, 8, 4);
        ctx.fillRect(i + 4, j + 4, 4, 4);
      } else {
        ctx.fillRect(i + 4, j, 4, 4);
        ctx.fillRect(i, j + 4, 4, 4);
      }
    }
  }

  // Draw delicate diagonal weaves in white/black overlay
  ctx.fillStyle = '#2d2d31';
  for (let x = 0; x < 32; x += 4) {
    ctx.fillRect(x, x, 2, 2);
    ctx.fillRect(x + 2, (x + 16) % 32, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  return texture;
}

/**
 * Brushed Metal Scratch Mapping
 * Vertical/horizontal fine lines for anisotropic-like highlights
 */
export function generateBrushedBrushed(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080'; // Neutral bump height
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;

  // Horizontal scratches
  for (let i = 0; i < 400; i++) {
    const y = Math.random() * 512;
    const len = 30 + Math.random() * 200;
    const x = Math.random() * 512;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();

    // Secondary overlapping darker scratches
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.beginPath();
    ctx.moveTo(x - len / 2, (y + 1) % 512);
    ctx.lineTo(x + len / 2, (y + 1) % 512);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  }

  // Soft overall noise
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noiseVal = (Math.random() - 0.5) * 8;
    data[i] = Math.min(255, Math.max(0, data[i] + noiseVal));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noiseVal));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noiseVal));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

/**
 * Rusty Iron Texture
 * Outputs a beautiful color map with copper/rusty patches and deep pitted black metal
 */
export function generateRustMaps(): { color: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const width = 512;
  const height = 512;
  
  const canvasColor = document.createElement('canvas');
  canvasColor.width = width;
  canvasColor.height = height;
  const ctxColor = canvasColor.getContext('2d')!;

  const canvasBump = document.createElement('canvas');
  canvasBump.width = width;
  canvasBump.height = height;
  const ctxBump = canvasBump.getContext('2d')!;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Fractal noise
      const n = generator.fbm(x * 0.03, y * 0.03, 5);
      
      // Base iron values (metallic dark gray)
      let r = 70, g = 74, b = 77;
      let bumpVal = 128; // flat height

      if (n > 0.55) {
        // High intensity rust patches (reddish brown to orange)
        const factor = (n - 0.55) / 0.45;
        r = Math.floor(130 + factor * 90);
        g = Math.floor(55 + factor * 50);
        b = Math.floor(15 + factor * 15);
        bumpVal = Math.floor(128 + (n - 0.5) * 80); // higher, rougher
      } else if (n < 0.45) {
        // Pitted/dark decayed metal cracks
        const factor = n / 0.45;
        r = Math.floor(30 + factor * 40);
        g = Math.floor(32 + factor * 42);
        b = Math.floor(34 + factor * 43);
        bumpVal = Math.floor(60 + factor * 68); // sunken craters
      } else {
        // Moderately clean metal with slight brown staining
        const staining = (n - 0.45) / 0.1;
        r = Math.floor(70 + staining * 20);
        g = Math.floor(74 + staining * 8);
        b = Math.floor(77 - staining * 10);
      }

      ctxColor.fillStyle = `rgb(${r},${g},${b})`;
      ctxColor.fillRect(x, y, 1, 1);

      ctxBump.fillStyle = `rgb(${bumpVal},${bumpVal},${bumpVal})`;
      ctxBump.fillRect(x, y, 1, 1);
    }
  }

  // Create standard textures
  const colorTex = new THREE.CanvasTexture(canvasColor);
  colorTex.wrapS = THREE.RepeatWrapping;
  colorTex.wrapT = THREE.RepeatWrapping;

  const bumpTex = new THREE.CanvasTexture(canvasBump);
  bumpTex.wrapS = THREE.RepeatWrapping;
  bumpTex.wrapT = THREE.RepeatWrapping;

  return { color: colorTex, bump: bumpTex };
}

/**
 * Lava Core Animated Texture Base
 * Creates highly vibrant flowing hot spot maps.
 * Returns a drawing canvas context so we can animate it over time!
 */
export function drawLavaFrame(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      // Distort coordinates dynamically using time to simulate slow convective flow
      const flowX = x * 0.02 + Math.sin(time * 0.8 + y * 0.05) * 0.3;
      const flowY = y * 0.02 + time * 0.5 + Math.cos(time * 0.6 + x * 0.05) * 0.3;

      const nVal = generator.fbm(flowX, flowY, 4);

      let r = 0, g = 0, b = 0;

      if (nVal > 0.48) {
        // Hot molten gold yellow/fire orange
        const heat = (nVal - 0.48) / 0.52;
        r = Math.floor(180 + heat * 75);
        g = Math.floor(50 + heat * 170);
        b = Math.floor(5 + heat * 20);
      } else if (nVal > 0.35) {
        // Semi-cooled glowing dark crimson
        const heat = (nVal - 0.35) / 0.13;
        r = Math.floor(70 + heat * 110);
        g = Math.floor(5 + heat * 45);
        b = Math.floor(2);
      } else {
        // Cooled volcanic black obsidian rock crust
        const crust = nVal / 0.35;
        r = Math.floor(12 + crust * 25);
        g = Math.floor(10 + crust * 6);
        b = Math.floor(12 + crust * 4);
      }

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
}

/**
 * Matrix Grid / Binary Falling Codes
 * Draws falling stream of lines. Return draw canvas interface for loop updating.
 */
export function drawMatrixFrame(ctx: CanvasRenderingContext2D, width: number, height: number, colHeights: number[], time: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)'; // trail fade in matrix style
  ctx.fillRect(0, 0, width, height);

  ctx.font = 'bold 9px monospace';
  const numColumns = colHeights.length;

  for (let i = 0; i < numColumns; i++) {
    // Generate organic cyber binary code streaming
    const char = Math.random() > 0.5 ? '1' : '0';
    const x = i * (width / numColumns) + 2;
    const y = colHeights[i];

    // Leading glowing pixel
    ctx.fillStyle = '#ffffff';
    ctx.fillText(char, x, y);

    // Standard matrix green trail
    ctx.fillStyle = 'rgba(16, 255, 64, 0.9)';
    ctx.fillText(char, x, y - 10);
    
    // Deeper green faint tail
    ctx.fillStyle = 'rgba(5, 120, 25, 0.7)';
    ctx.fillText(Math.random() > 0.5 ? ']' : '[', x, y - 20);

    // Increment vertical position randomly
    colHeights[i] += 8 + Math.floor(Math.random() * 5);
    
    // Reset if it goes off bottom randomly
    if (colHeights[i] > height && Math.random() > 0.96) {
      colHeights[i] = 0;
    }
  }
}

/**
 * Generate Procedural Neon Gradient Cube EnvMap
 * Makes metal materials reflect gorgeous electric purple/cyan skies
 * and bright lights rather than dull, flat colors!
 */
export function generateProceduralEnvMap(renderer: THREE.WebGLRenderer): THREE.CubeTexture {
  const faces = 6;
  const size = 128;
  const urls: string[] = [];
  const canvases: HTMLCanvasElement[] = [];

  // Define color gradients for six directions
  // PositiveX, NegativeX, PositiveY, NegativeY, PositiveZ, NegativeZ
  const configurations = [
    { bg: '#03030f', c1: '#ff0055', c2: '#00ffff', cx: 30, cy: 30, r: 50 },  // Right
    { bg: '#03030f', c1: '#ffcc00', c2: '#3300ff', cx: 90, cy: 30, r: 60 },  // Left
    { bg: '#05051a', c1: '#00ff66', c2: '#ff3300', cx: 64, cy: 64, r: 80 },  // Top (sky glow)
    { bg: '#010103', c1: '#444444', c2: '#111111', cx: 64, cy: 64, r: 40 },  // Bottom (dark ground)
    { bg: '#03030f', c1: '#9900ff', c2: '#00ffee', cx: 20, cy: 90, r: 50 },  // Front
    { bg: '#03030f', c1: '#ff00bb', c2: '#22ff00', cx: 100, cy: 100, r: 70 }  // Back
  ];

  const images: HTMLImageElement[] = [];

  for (let i = 0; i < faces; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    const config = configurations[i];

    // Background base
    ctx.fillStyle = config.bg;
    ctx.fillRect(0, 0, size, size);

    // Glowing nebulous circle 1
    const grad1 = ctx.createRadialGradient(config.cx, config.cy, 5, config.cx, config.cy, config.r);
    grad1.addColorStop(0, config.c1);
    grad1.addColorStop(0.3, 'rgba(' + hexToRgbStr(config.c1) + ', 0.5)');
    grad1.addColorStop(1, 'rgba(' + hexToRgbStr(config.c1) + ', 0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, size, size);

    // Glowing nebulous circle 2 (secondary counter balance)
    const oppX = size - config.cx;
    const oppY = size - config.cy;
    const grad2 = ctx.createRadialGradient(oppX, oppY, 2, oppX, oppY, config.r * 0.8);
    grad2.addColorStop(0, config.c2);
    grad2.addColorStop(0.5, 'rgba(' + hexToRgbStr(config.c2) + ', 0.3)');
    grad2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, size, size);

    // Dynamic horizontal "light stripe" for high-contrast metals
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, size * 0.45, size, size * 0.1);

    canvases.push(canvas);
  }

  // Convert canvases to an array of images or let CubeTexture process canvas immediately
  const cubeTexture = new THREE.CubeTexture(canvases);
  cubeTexture.needsUpdate = true;
  return cubeTexture;
}

// Helper to convert hex strings to raw RGB numbers
function hexToRgbStr(hex: string): string {
  // Remove hash if exists
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

/**
 * Generate a neutral studio-style CubeTexture EnvMap
 * Clean white/gray gradients — perfect for chrome & silver materials
 */
export function generateNeutralEnvMap(): THREE.CubeTexture {
  const size = 128;
  const canvases: HTMLCanvasElement[] = [];

  // 6 faces: all neutral gray gradients with soft white highlights
  const configs = [
    { top: '#888888', bottom: '#333333', highlight: 0.3 },  // Right
    { top: '#777777', bottom: '#2a2a2a', highlight: 0.35 }, // Left
    { top: '#ffffff', bottom: '#aaaaaa', highlight: 0.6 },  // Top (bright sky)
    { top: '#222222', bottom: '#111111', highlight: 0.0 },  // Bottom (dark ground)
    { top: '#999999', bottom: '#444444', highlight: 0.25 }, // Front
    { top: '#888888', bottom: '#333333', highlight: 0.3 },  // Back
  ];

  for (let i = 0; i < 6; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const cfg = configs[i];

    // Vertical gradient
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, cfg.top);
    grad.addColorStop(1, cfg.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Soft white highlight stripe (studio light reflection)
    if (cfg.highlight > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${cfg.highlight})`;
      ctx.fillRect(0, size * 0.4, size, size * 0.12);
      // Secondary softer stripe
      ctx.fillStyle = `rgba(255, 255, 255, ${cfg.highlight * 0.4})`;
      ctx.fillRect(0, size * 0.2, size, size * 0.08);
    }

    canvases.push(canvas);
  }

  const cubeTexture = new THREE.CubeTexture(canvases);
  cubeTexture.needsUpdate = true;
  return cubeTexture;
}
