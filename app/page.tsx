"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

type Project = {
  id: string;
  label: string;
  tag: string;
  title: string;
  subtitle: string;
  body: string;
  highlights: string[];
  award: string | null;
  color: number;
  emissive: number;
  geometry: string;
};

const PROJECTS: Project[] = [
  {
    id: "bio",
    label: "Bio",
    tag: "00 / ABOUT",
    title: "Luna Beauvois",
    subtitle: "Freelance 3D Artist & Unreal Developer",
    body: "I build 3D characters, environments, and interactive experiences for games, films, and VR projects. I specialise in motion capture — from directing actors to cleaning up the data — and I'm fast at turning concepts into finished assets, whether you need realistic or stylised work.",
    highlights: [
      "3D Modelling, Rigging & Animation",
      "Motion Capture Direction & Data Cleanup",
      "Unreal Engine Development & Custom Shaders",
      "VR Experience Development",
      "Virtual Production & Real-time Rendering",
    ],
    award: null,
    color: 0x4a9eff,
    emissive: 0x4a9eff,
    geometry: "icosahedron",
  },
  {
    id: "howlcast",
    label: "HowlCast",
    tag: "01 / PROJECT",
    title: "HowlCast",
    subtitle: "Personal VTuber Software — Unreal Engine",
    body: "An experimental VTuber application built in Unreal Engine for real-time 3D avatar streaming. Most VTuber software uses Unity — this explores what Unreal's rendering pipeline makes possible.",
    highlights: [
      "Basic 3D avatar streaming",
      "Live facial motion capture integration",
      "Twitch streaming service integration",
      "Real-time rendering in Unreal",
    ],
    award: null,
    color: 0x9b59f5,
    emissive: 0x3d1a6e,
    geometry: "torus",
  },
  {
    id: "infinite-museum",
    label: "Infinite Museum",
    tag: "02 / PROJECT",
    title: "Infinite Museum",
    subtitle: "VR Cultural Experience — 3D Artist & Mocap Lead",
    body: "A VR experience showcasing the history of Ayscoughfee Hall in Lincolnshire, funded by the National Lottery Heritage Fund. Visitors move through different periods of the hall's history via environmental storytelling and motion-captured historical characters.",
    highlights: [
      "All 3D characters from scratch, incl. ARKit facial blend shapes",
      "Entire first floor environment — period-accurate modelling & texturing",
      "Directed and performed motion capture sessions",
      "Cleaned up and integrated all mocap data",
    ],
    award: null,
    color: 0xff6eb4,
    emissive: 0x6e1a4a,
    geometry: "octahedron",
  },
  {
    id: "voyagers",
    label: "Voyagers",
    tag: "03 / PROJECT",
    title: "Voyagers",
    subtitle: "Short Film — Writer, Director & Technical Lead",
    body: "A 5-minute science fiction short written and directed at MBD, designed to showcase virtual production capabilities while upskilling the team in motion capture workflows.",
    highlights: [
      "Wrote the script and directed the project",
      "Managed MBD's 8-person team throughout production",
      "Created the character from modelling through final rigging",
      "Led motion capture sessions using Vicon systems",
      "Set up real-time camera tracking with Unreal Engine",
      "Edited the final film",
    ],
    award: "🏆 Nominated — We Are Creative Independent Film of the Year\n🏆 Nominated — Manchester Lift-Off Film Festival 2025\n🥇 Winner — Best Short Animation, Buffalo Roots Film Festival 2025",
    color: 0xff8c42,
    emissive: 0x6e3010,
    geometry: "cone",
  },
  {
    id: "steel-town",
    label: "Steel Town Tales",
    tag: "04 / PROJECT",
    title: "Steel Town Tales",
    subtitle: "Animated Series — Character & Environment Artist",
    body: "Character and environment work for an animated series set in a fictional steel town. Responsible for asset creation across characters and world-building environments.",
    highlights: [
      "Character design and 3D modelling",
      "Environment art and props",
      "Texture and material work",
    ],
    award: null,
    color: 0xf5c842,
    emissive: 0xf5c842,
    geometry: "box",
  },
];

const SPACING = 8;

function makeGeometry(type: string) {
  switch (type) {
    case "icosahedron":
      return new THREE.IcosahedronGeometry(1.1, 1);
    case "torus":
      return new THREE.TorusGeometry(0.9, 0.35, 20, 60);
    case "octahedron":
      return new THREE.OctahedronGeometry(1.2, 0);
    case "cone":
      return new THREE.ConeGeometry(0.9, 1.8, 6);
    case "box":
      return new THREE.BoxGeometry(1.4, 1.4, 1.4);
    default:
      return new THREE.IcosahedronGeometry(1, 0);
  }
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const goToRef = useRef<((index: number, openPanel?: boolean) => void) | undefined>(undefined);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hintsHidden, setHintsHidden] = useState(false);
  const [loaderDone, setLoaderDone] = useState(false);

  const selectedProject = PROJECTS[currentIndex];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isMobile = window.innerWidth < 768;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080808);
    scene.fog = new THREE.FogExp2(0x080808, 0.035);

    const camera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
    camera.position.set(0, 0, 10);

    const setRendererSize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (composer) composer.setSize(width, height);
    };

    let composer: EffectComposer | undefined;
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(canvas.clientWidth, canvas.clientHeight), 0.9, 0.8, 0.35);
    composer.addPass(bloom);

    setRendererSize();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    scene.add(ambientLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1);
    fillLight.position.set(-5, 3, 5);
    scene.add(fillLight);


    // const accentLight = new THREE.DirectionalLight(0xffffff, 1.2);
    // accentLight.position.set(5, 5, 3);
    // accentLight.target.position.set(0, 0, 0);
    // scene.add(accentLight);
    // scene.add(accentLight.target);

    const gradientMap = new THREE.DataTexture(
      new Uint8Array([
        64, 64, 64, 255,
        128, 128, 128, 255,
        192, 192, 192, 255,
        255, 255, 255, 255,
      ]),
      4,
      1,
      THREE.RGBAFormat
    );
    gradientMap.magFilter = THREE.NearestFilter;
    gradientMap.minFilter = THREE.NearestFilter;
    gradientMap.needsUpdate = true;

    const particleCount = isMobile ? 400 : 900;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 160;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 32;
    particleCanvas.height = 32;
    const ctx = particleCanvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(16, 16, 15, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    }
    const particleTexture = new THREE.CanvasTexture(particleCanvas);

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: isMobile ? 0.04 : 0.08,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      map: particleTexture,
      alphaTest: 0.1,
    });
    scene.add(new THREE.Points(particleGeometry, particleMaterial));

    const objectPositions = [
      { x: 0, y: 0, z: 0 },
      { x: 9, y: -1, z: 1 },
      { x: 16, y: 1.2, z: -0.5 },
      { x: 25, y: -0.8, z: 0.8 },
      { x: 32, y: 0.5, z: -1.2 },
    ];

    const loader = new GLTFLoader();
    const objects: THREE.Mesh<THREE.BufferGeometry, THREE.Material>[] = PROJECTS.map((project, i) => {
      const geo = makeGeometry(project.geometry);
      const material = new THREE.MeshToonMaterial({
        color: project.color,
        gradientMap,
        toneMapped: true,
      } as any);
      const mesh = new THREE.Mesh(geo, material) as THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
      const pos = objectPositions[i];
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.userData.index = i;
      mesh.userData.basePos = mesh.position.clone();
      scene.add(mesh);

      if (project.id === "bio") {
        loader.load(
          "/Models/Suzanne_Main.glb",
          (gltf) => {
            const loadedMesh = gltf.scene.getObjectByProperty("type", "Mesh") as THREE.Mesh | undefined;
            if (!loadedMesh) return;
            mesh.geometry.dispose();
            mesh.geometry = loadedMesh.geometry.clone();
          }
        );

        loader.load(
          "/Models/Suzanne_Wireframe.glb",
          (gltf) => {
            const wireMesh = gltf.scene.getObjectByProperty("type", "Mesh") as THREE.Mesh | undefined;
            if (!wireMesh) return;
            const wireMaterial = new THREE.MeshBasicMaterial({
              color: project.color,
              wireframe: true,
              transparent: true,
              opacity: 0.6,
              toneMapped: false,
            });
            const wire = new THREE.Mesh(wireMesh.geometry.clone(), wireMaterial);
            mesh.add(wire);
          }
        );
      } else {
        const wireMaterial = new THREE.MeshBasicMaterial({
          color: project.color,
          wireframe: true,
          transparent: true,
          opacity: 0.6,
          toneMapped: false,
        });
        const wire = new THREE.Mesh(geo, wireMaterial);
        mesh.add(wire);
      }

      return mesh;
    });

    const cameraTargets = objects.map((object) => ({
      pos: new THREE.Vector3(object.position.x - 4, object.position.y, object.position.z + 2),
      look: object.position.clone(),
    }));

    let currentIndexRef = 0;
    let targetCamPos = cameraTargets[0].pos.clone();
    let targetLookAt = cameraTargets[0].look.clone();
    const currentLookAt = new THREE.Vector3().copy(targetLookAt);

    const resizeCanvas = () => {
      setRendererSize();
    };

    const updateSceneIndex = (index: number) => {
      if (index < 0 || index >= PROJECTS.length) return;
      currentIndexRef = index;
      targetCamPos = cameraTargets[index].pos.clone();
      targetLookAt = cameraTargets[index].look.clone();
      // accentLight.color.set(PROJECTS[index].color);
      setCurrentIndex(index);
    };

    const goTo = (index: number, openPanel = false) => {
      if (index < 0 || index >= PROJECTS.length) return;
      const nextIndex = Math.min(Math.max(index, 0), PROJECTS.length - 1);
      updateSceneIndex(nextIndex);
      if (openPanel) setPanelOpen(true);
    };

    goToRef.current = goTo;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasInteraction = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(objects, false);
      if (hits.length > 0) {
        const idx = hits[0].object.userData.index as number;
        if (idx === currentIndexRef) {
          setPanelOpen(true);
        } else {
          goTo(idx, false);
        }
      }
    };

    const onCanvasClick = (event: MouseEvent) => {
      handleCanvasInteraction(event.clientX, event.clientY);
    };

    const onTouchEnd = (event: TouchEvent) => {
      event.preventDefault();
      const touch = event.changedTouches[0];
      if (!touch) return;

      const dx = touchStart.x - touch.clientX;
      const dy = touchStart.y - touch.clientY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        goTo(currentIndexRef + (dx > 0 ? 1 : -1));
        return;
      }

      handleCanvasInteraction(touch.clientX, touch.clientY);
    };

    let wheelLocked = false;
    const onWheel = (event: WheelEvent) => {
      if (wheelLocked) return;
      wheelLocked = true;
      window.setTimeout(() => {
        wheelLocked = false;
      }, 700);
      goTo(currentIndexRef + (event.deltaY > 0 ? 1 : -1));
    };

    const touchStart = { x: 0, y: 0 };
    const onTouchStart = (event: TouchEvent) => {
      touchStart.x = event.touches[0].clientX;
      touchStart.y = event.touches[0].clientY;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "ArrowRight") goTo(currentIndexRef + 1);
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") goTo(currentIndexRef - 1);
      if (event.key === "Enter" || event.key === " ") setPanelOpen(true);
      if (event.key === "Escape") setPanelOpen(false);
    };

    canvas.addEventListener("click", onCanvasClick);
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", resizeCanvas);

    let frameId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      objects.forEach((mesh, i) => {
        const base = mesh.userData.basePos as THREE.Vector3;
        const active = i === currentIndexRef;
        mesh.rotation.x += 0.003;
        mesh.rotation.y += active ? 0.006 : 0.003;
        mesh.position.y = base.y + Math.sin(t * 0.6 + i * 1.2) * (active ? 0.18 : 0.08);
        const targetScale = active ? 1.15 : 1.0;
        mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);
      });

      camera.position.lerp(targetCamPos, 0.06);
      currentLookAt.lerp(targetLookAt, 0.06);
      camera.lookAt(currentLookAt);

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };

    animate();
    goTo(0, false);

    const hintTimeout = window.setTimeout(() => setHintsHidden(true), 5000);
    const loaderTimeout = window.setTimeout(() => setLoaderDone(true), 1400);

    return () => {
      window.clearTimeout(hintTimeout);
      window.clearTimeout(loaderTimeout);
      canvas.removeEventListener("click", onCanvasClick);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", resizeCanvas);
      window.cancelAnimationFrame(frameId);
      renderer.dispose();
      composer?.dispose();
      scene.clear();
      objects.forEach((mesh) => {
        mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach((mat) => mat.dispose());
        } else {
          material.dispose();
        }
      });
      particleGeometry.dispose();
      particleMaterial.dispose();
      particleTexture.dispose();
    };
  }, []);

  const handleNavClick = (index: number) => {
    goToRef.current?.(index, false);
  };

  return (
    <div>
      <div id="loader" className={loaderDone ? "done" : ""}>
        <div className="loader-name">LUNA BEAUVOIS</div>
        <div className="loader-bar-track">
          <div className="loader-bar"></div>
        </div>
        <div className="loader-label">INITIALISING SCENE</div>
      </div>

      <aside className="sidebar">
        <div className="sidebar-name">
          <h1>Luna Beauvois</h1>
          <p>3D ARTIST & UNREAL DEV</p>
        </div>
        <ul className="nav-list">
          {PROJECTS.map((project, index) => (
            <li key={project.id}>
              <button
                type="button"
                className={`nav-item${index === currentIndex ? " active" : ""}`}
                onClick={() => handleNavClick(index)}
              >
                <span className="nav-dot" aria-hidden="true"></span>
                {project.label}
                <span className="nav-index">0{index}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <a href="mailto:hello@lunabeauvois.com">hello@lunabeauvois.com</a>
          <a href="#" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="#" target="_blank" rel="noreferrer">ArtStation</a>
        </div>
      </aside>

      <nav className="topnav">
        <span className="topnav-name">LUNA B.</span>
        {PROJECTS.map((project, index) => (
          <button
            key={project.id}
            type="button"
            className={`topnav-btn${index === currentIndex ? " active" : ""}`}
            onClick={() => handleNavClick(index)}
          >
            {project.label}
          </button>
        ))}
      </nav>

      <canvas id="scene-canvas" ref={canvasRef}></canvas>

      <div className={`info-panel${panelOpen ? " open" : ""}`}>
        <button type="button" className="panel-close" onClick={() => setPanelOpen(false)}>
          ✕
        </button>
        <div className="panel-tag">{selectedProject.tag}</div>
        <h2 className="panel-title">{selectedProject.title}</h2>
        <p className="panel-subtitle">{selectedProject.subtitle}</p>
        <div className="panel-divider"></div>
        <p className="panel-body">{selectedProject.body}</p>
        <div className="panel-highlights">
          <h4>Key Work</h4>
          <ul>
            {selectedProject.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </div>
        {selectedProject.award ? (
          <div className="panel-award" style={{ whiteSpace: "pre-line" }}>
            {selectedProject.award}
          </div>
        ) : null}
      </div>

      <div className={`scroll-hint desktop${hintsHidden ? " hidden" : ""}`}>
        <span className="hint-line"></span> SCROLL OR CLICK TO NAVIGATE
      </div>
      <div className={`scroll-hint mobile${hintsHidden ? " hidden" : ""}`}>
        <span className="hint-line"></span> SWIPE TO NAVIGATE
      </div>
    </div>
  );
}
