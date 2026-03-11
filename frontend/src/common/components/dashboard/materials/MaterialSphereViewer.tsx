import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type ViewerProps = {
  baseColor: string;
  roughness: number;
  metalness: number;
  emissive?: string;
  emissiveIntensity?: number;
  transmission?: number;
  ior?: number;
};

const MaterialSphereViewer = ({
  baseColor,
  roughness,
  metalness,
  emissive = "#000000",
  emissiveIntensity = 0,
  transmission = 0,
  ior = 1.45,
}: ViewerProps) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#2f333a");

    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 2.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.3;

    const lightA = new THREE.HemisphereLight("#ffffff", "#555555", 0.9);
    scene.add(lightA);

    const key = new THREE.DirectionalLight("#ffffff", 1.2);
    key.position.set(2, 3, 2);
    scene.add(key);

    const rim = new THREE.DirectionalLight("#93c5fd", 0.4);
    rim.position.set(-2, -1, -1.5);
    scene.add(rim);

    const geometry = new THREE.SphereGeometry(0.72, 64, 64);
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(baseColor),
      roughness: THREE.MathUtils.clamp(roughness, 0, 1),
      metalness: THREE.MathUtils.clamp(metalness, 0, 1),
      emissive: new THREE.Color(emissive),
      emissiveIntensity: THREE.MathUtils.clamp(emissiveIntensity, 0, 5),
      transmission: THREE.MathUtils.clamp(transmission, 0, 1),
      ior: Math.max(1, ior),
      clearcoat: 0.25,
      clearcoatRoughness: 0.15,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const grid = new THREE.Mesh(
      new THREE.CircleGeometry(1.3, 64),
      new THREE.MeshStandardMaterial({ color: "#20242a", roughness: 1, metalness: 0 })
    );
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = -0.86;
    scene.add(grid);

    let raf = 0;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [baseColor, emissive, emissiveIntensity, ior, metalness, roughness, transmission]);

  return <div ref={mountRef} className="w-full h-full min-h-[240px] rounded-xl overflow-hidden" />;
};

export default MaterialSphereViewer;

