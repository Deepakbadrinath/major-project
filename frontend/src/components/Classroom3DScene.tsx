import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ZoneData {
  name: string;
  desks: number[];
  occupied_desks: number[];
  motion: boolean;
  fan_state: boolean;
  light_state: boolean;
  state_label: string;
  expiring_countdown: number;
}

interface Classroom3DSceneProps {
  zones: Record<number, ZoneData>;
  selectedZone: number;
  onSelectZone: (zoneId: number) => void;
  isCompact?: boolean; // For Overview card vs Live Classroom full viewport
}

export const Classroom3DScene: React.FC<Classroom3DSceneProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  isCompact = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const fanBladesRef = useRef<{ [key: number]: THREE.Group }>({});
  const deskMeshesRef = useRef<{ [key: number]: THREE.Mesh }>({});
  const lightFixturesRef = useRef<{ [key: number]: { mesh: THREE.Mesh; light: THREE.PointLight } }>({});

  const [cameraMode, setCameraMode] = useState<'iso' | 'front' | 'ceiling'>('iso');
  const [isZoomed, setIsZoomed] = useState(false);
  const [viewStyle, setViewStyle] = useState<'3d' | 'render'>('3d');

  // Mouse drag orbit state
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef({ radius: 24, theta: Math.PI / 4, phi: Math.PI / 3.2 });
  const targetLookAt = useRef(new THREE.Vector3(0, 1.2, 0));

  useEffect(() => {
    if (!containerRef.current || viewStyle !== '3d') return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(isCompact ? 0xF8FAFC : 0x0F172A);

    // Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    sunLight.position.set(-15, 20, 12);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 15;
    sunLight.shadow.camera.bottom = -15;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x90cdf4, 0.4);
    fillLight.position.set(15, 10, -10);
    scene.add(fillLight);

    // 1. Concrete Room Slab & Raised Floor
    const slabGeo = new THREE.BoxGeometry(18, 0.8, 14);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0xCBD5E1,
      roughness: 0.8,
      metalness: 0.1
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.y = -0.4;
    slab.receiveShadow = true;
    scene.add(slab);

    // Tiled Floor
    const floorGeo = new THREE.PlaneGeometry(17.6, 13.6, 24, 18);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xF1F5F9,
      roughness: 0.35,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid Floor lines
    const grid = new THREE.GridHelper(16, 16, 0x94A3B8, 0xE2E8F0);
    grid.position.y = 0.02;
    scene.add(grid);

    // 2. Cutaway Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      roughness: 0.9,
      metalness: 0.05
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x94A3B8,
      roughness: 0.7
    });

    // Front Wall (where blackboard & banner sit)
    const frontWallGeo = new THREE.BoxGeometry(18, 5, 0.6);
    const frontWall = new THREE.Mesh(frontWallGeo, wallMat);
    frontWall.position.set(0, 2.5, -6.8);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    scene.add(frontWall);

    // Left Wall with Cutout Windows
    const leftWallGeo = new THREE.BoxGeometry(0.6, 5, 14);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-8.8, 2.5, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Window Frames on Left Wall
    for (let w = -3; w <= 3; w += 3.5) {
      const windowFrameGeo = new THREE.BoxGeometry(0.7, 2.8, 2.6);
      const windowGlassMat = new THREE.MeshPhysicalMaterial({
        color: 0xBAE6FD,
        transparent: true,
        opacity: 0.45,
        roughness: 0.1,
        transmission: 0.8
      });
      const windowMesh = new THREE.Mesh(windowFrameGeo, windowGlassMat);
      windowMesh.position.set(-8.8, 2.8, w);
      scene.add(windowMesh);
    }

    // 3. Stage & Whiteboard
    // Raised stage for teacher
    const stageGeo = new THREE.BoxGeometry(10, 0.4, 2.6);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0xE5E7EB,
      roughness: 0.5
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.set(0, 0.2, -5.2);
    stage.receiveShadow = true;
    scene.add(stage);

    // Whiteboard Frame & Board
    const boardFrameGeo = new THREE.BoxGeometry(7.2, 2.8, 0.1);
    const boardFrame = new THREE.Mesh(boardFrameGeo, trimMat);
    boardFrame.position.set(0, 3.2, -6.45);
    scene.add(boardFrame);

    const boardSurfaceGeo = new THREE.BoxGeometry(6.9, 2.5, 0.08);
    const boardSurfaceMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.2
    });
    const boardSurface = new THREE.Mesh(boardSurfaceGeo, boardSurfaceMat);
    boardSurface.position.set(0, 3.2, -6.4);
    scene.add(boardSurface);

    // Kishkinda University Header Banner on board
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 512;
    bannerCanvas.height = 128;
    const ctx = bannerCanvas.getContext('2d')!;
    ctx.fillStyle = '#0F766E';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎓 KISHKINDA UNIVERSITY', 256, 52);
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#CCFBF1';
    ctx.fillText('SMART LECTURE SYSTEM • LH-204', 256, 96);
    const bannerTexture = new THREE.CanvasTexture(bannerCanvas);
    const bannerGeo = new THREE.PlaneGeometry(5.4, 1.2);
    const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTexture });
    const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
    bannerMesh.position.set(0, 3.5, -6.34);
    scene.add(bannerMesh);

    // Teacher Podium Lectern
    const podiumBaseGeo = new THREE.BoxGeometry(1.4, 1.3, 1.0);
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xB45309,
      roughness: 0.4
    });
    const podium = new THREE.Mesh(podiumBaseGeo, woodMat);
    podium.position.set(0, 1.05, -5.0);
    podium.castShadow = true;
    scene.add(podium);

    // Laptop on Podium
    const laptopGeo = new THREE.BoxGeometry(0.5, 0.04, 0.35);
    const laptopMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.2 });
    const laptop = new THREE.Mesh(laptopGeo, laptopMat);
    laptop.position.set(0, 1.72, -5.0);
    scene.add(laptop);

    // Decorative Plants in corners
    const createPlant = (x: number, z: number) => {
      const potGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.6, 12);
      const potMat = new THREE.MeshStandardMaterial({ color: 0xD97706 });
      const pot = new THREE.Mesh(potGeo, potMat);
      pot.position.set(x, 0.3, z);
      pot.castShadow = true;
      scene.add(pot);

      const foliageGeo = new THREE.DodecahedronGeometry(0.55);
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.7 });
      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.set(x, 0.85, z);
      foliage.castShadow = true;
      scene.add(foliage);
    };
    createPlant(-7.5, -5.8);
    createPlant(7.5, -5.8);
    createPlant(-7.5, 5.8);
    createPlant(7.5, 5.8);

    // 4. Exactly 15 Desks (3 Rows of 5)
    // Row 1 (Front): z = -2.8 (desks 1 - 5)
    // Row 2 (Middle): z = 0.6 (desks 6 - 10)
    // Row 3 (Rear): z = 4.0 (desks 11 - 15)
    const rowZ = [-2.8, 0.6, 4.0];
    const colX = [-5.2, -2.6, 0.0, 2.6, 5.2];
    const deskMeshes: { [key: number]: THREE.Mesh } = {};

    let deskNum = 1;
    for (let r = 0; r < 3; r++) {
      const zPos = rowZ[r];
      const zoneId = r + 1;

      for (let c = 0; c < 5; c++) {
        const xPos = colX[c];
        const currentDeskNum = deskNum;

        // Desk Group
        const deskGroup = new THREE.Group();
        deskGroup.position.set(xPos, 0, zPos);

        // Desk Tabletop
        const topGeo = new THREE.BoxGeometry(1.7, 0.08, 0.95);
        const topMat = new THREE.MeshStandardMaterial({
          color: 0x14B8A6,
          roughness: 0.3,
          metalness: 0.1
        });
        const deskTop = new THREE.Mesh(topGeo, topMat);
        deskTop.position.y = 1.0;
        deskTop.castShadow = true;
        deskTop.receiveShadow = true;
        deskTop.userData = { deskNum: currentDeskNum, zoneId };
        deskGroup.add(deskTop);
        deskMeshes[currentDeskNum] = deskTop;

        // Metal Legs (4 legs)
        const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.96);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.8, roughness: 0.3 });
        const legOffsets = [
          [-0.75, -0.38],
          [0.75, -0.38],
          [-0.75, 0.38],
          [0.75, 0.38]
        ];
        legOffsets.forEach(([ox, oz]) => {
          const leg = new THREE.Mesh(legGeo, legMat);
          leg.position.set(ox, 0.5, oz);
          leg.castShadow = true;
          deskGroup.add(leg);
        });

        // Ergonomic Chair behind desk
        const seatGeo = new THREE.BoxGeometry(0.7, 0.06, 0.65);
        const chairMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
        const seat = new THREE.Mesh(seatGeo, chairMat);
        seat.position.set(0, 0.65, 0.7);
        seat.castShadow = true;
        deskGroup.add(seat);

        // Chair Backrest
        const backGeo = new THREE.BoxGeometry(0.65, 0.6, 0.06);
        const back = new THREE.Mesh(backGeo, chairMat);
        back.position.set(0, 1.05, 0.98);
        back.castShadow = true;
        deskGroup.add(back);

        // Chair Pole & Base
        const chairPoleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.65);
        const chairPole = new THREE.Mesh(chairPoleGeo, legMat);
        chairPole.position.set(0, 0.32, 0.7);
        deskGroup.add(chairPole);

        scene.add(deskGroup);
        deskNum++;
      }
    }
    deskMeshesRef.current = deskMeshes;

    // 5. Overhead Ceiling Fans & Linear LED Fixtures for Each Row
    const fanBladesMap: { [key: number]: THREE.Group } = {};
    const lightFixturesMap: { [key: number]: { mesh: THREE.Mesh; light: THREE.PointLight } } = {};

    rowZ.forEach((zPos, idx) => {
      const zoneId = idx + 1;

      // Ceiling Fan
      const fanGroup = new THREE.Group();
      fanGroup.position.set(0, 4.4, zPos);

      // Fan Rod
      const rodGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8);
      const rodMat = new THREE.MeshStandardMaterial({ color: 0x64748B, metalness: 0.6 });
      const rod = new THREE.Mesh(rodGeo, rodMat);
      rod.position.y = 0.4;
      fanGroup.add(rod);

      // Fan Center Hub
      const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
      const hub = new THREE.Mesh(hubGeo, rodMat);
      fanGroup.add(hub);

      // Fan Blades Assembly (rotates)
      const bladesGroup = new THREE.Group();
      for (let b = 0; b < 3; b++) {
        const bladeGeo = new THREE.BoxGeometry(0.22, 0.02, 1.4);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.4 });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.z = 0.7;
        const bladePivot = new THREE.Group();
        bladePivot.rotation.y = (b * 2 * Math.PI) / 3;
        bladePivot.add(blade);
        bladesGroup.add(bladePivot);
      }
      fanGroup.add(bladesGroup);
      scene.add(fanGroup);
      fanBladesMap[zoneId] = bladesGroup;

      // Linear LED Light Fixtures (2 per row: left & right)
      [-3.2, 3.2].forEach((xOffset) => {
        const fixtureGeo = new THREE.BoxGeometry(2.4, 0.08, 0.2);
        const fixtureMat = new THREE.MeshStandardMaterial({
          color: 0x0D9488,
          emissive: 0x0D9488,
          emissiveIntensity: 0.8
        });
        const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
        fixture.position.set(xOffset, 4.3, zPos);
        scene.add(fixture);

        // Point Light for ambient glow
        const pointLight = new THREE.PointLight(0xF0FDFA, 0.9, 8);
        pointLight.position.set(xOffset, 4.0, zPos);
        scene.add(pointLight);

        lightFixturesMap[zoneId] = { mesh: fixture, light: pointLight };
      });
    });

    fanBladesRef.current = fanBladesMap;
    lightFixturesRef.current = lightFixturesMap;

    // Raycaster for Clicking Desks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(Object.values(deskMeshesRef.current));

      if (intersects.length > 0) {
        const clickedDesk = intersects[0].object;
        const zoneId = clickedDesk.userData.zoneId;
        if (zoneId) {
          onSelectZone(zoneId);
        }
      }
    };

    // Mouse Drag Controls
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDraggingRef.current = true;
        prevMousePosRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevMousePosRef.current.x;
      const dy = e.clientY - prevMousePosRef.current.y;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };

      sphericalRef.current.theta -= dx * 0.008;
      sphericalRef.current.phi = Math.max(0.2, Math.min(Math.PI / 2.1, sphericalRef.current.phi - dy * 0.008));
      updateCameraPosition();
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('click', handleCanvasClick);
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Spin ceiling fans dynamically based on relay states
      Object.entries(fanBladesRef.current).forEach(([zStr, bladeGroup]) => {
        const zId = Number(zStr);
        const fanIsOn = zones[zId]?.fan_state;
        if (fanIsOn) {
          bladeGroup.rotation.y += delta * 12.0;
        } else {
          // Slow coast down
          bladeGroup.rotation.y += delta * 0.5;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      domElement.removeEventListener('click', handleCanvasClick);
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [viewStyle]);

  // Update desk and fixture colors when zone telemetry changes
  useEffect(() => {
    Object.entries(deskMeshesRef.current).forEach(([deskStr, mesh]) => {
      const dNum = Number(deskStr);
      let zId = 1;
      if (dNum >= 6 && dNum <= 10) zId = 2;
      if (dNum >= 11 && dNum <= 15) zId = 3;

      const zone = zones[zId];
      const isSelected = selectedZone === zId;

      let color = 0x14B8A6; // Active teal
      let emissive = 0x0F766E;
      let emissiveIntensity = 0.2;

      if (zone?.state_label === 'EXPIRING' || dNum === 15) {
        color = 0xF59E0B; // Amber
        emissive = 0xD97706;
        emissiveIntensity = 0.5;
      } else if (zone?.state_label === 'INACTIVE') {
        color = 0x64748B; // Slate
        emissive = 0x1E293B;
        emissiveIntensity = 0.05;
      }

      if (isSelected) {
        emissiveIntensity += 0.4;
      }

      (mesh.material as THREE.MeshStandardMaterial).color.setHex(color);
      (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(emissive);
      (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = emissiveIntensity;
    });

    // Update light fixture emissive based on light relays
    Object.entries(lightFixturesRef.current).forEach(([zStr, { mesh, light }]) => {
      const zId = Number(zStr);
      const lightOn = zones[zId]?.light_state;
      if (lightOn) {
        (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xF59E0B);
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0;
        light.intensity = 1.2;
      } else {
        (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x334155);
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
        light.intensity = 0.05;
      }
    });
  }, [zones, selectedZone]);

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = sphericalRef.current;
    const zoomMultiplier = isZoomed ? 0.7 : 1.0;
    const r = radius * zoomMultiplier;

    const x = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(targetLookAt.current);
  };

  const setCameraPreset = (mode: 'iso' | 'front' | 'ceiling') => {
    setCameraMode(mode);
    if (mode === 'iso') {
      sphericalRef.current = { radius: 24, theta: Math.PI / 4, phi: Math.PI / 3.2 };
    } else if (mode === 'front') {
      sphericalRef.current = { radius: 20, theta: 0.05, phi: Math.PI / 2.3 };
    } else if (mode === 'ceiling') {
      sphericalRef.current = { radius: 22, theta: 0.1, phi: 0.25 };
    }
    updateCameraPosition();
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
    sphericalRef.current.radius = isZoomed ? 24 : 16;
    updateCameraPosition();
  };

  const resetCamera = () => {
    setCameraMode('iso');
    setIsZoomed(false);
    sphericalRef.current = { radius: 24, theta: Math.PI / 4, phi: Math.PI / 3.2 };
    updateCameraPosition();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden rounded-2xl">
      {/* View Mode Switcher: Interactive 3D WebGL vs Architectural Cutaway Render */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-xl">
        <button
          onClick={() => setViewStyle('3d')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            viewStyle === '3d' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          🎮 3D Digital Twin
        </button>
        <button
          onClick={() => setViewStyle('render')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            viewStyle === 'render' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          🏛️ Architectural Cutaway
        </button>

        {viewStyle === '3d' && (
          <>
            <div className="h-4 w-px bg-slate-700 mx-1" />
            <button
              onClick={() => setCameraPreset('iso')}
              className={`px-2 py-1 text-xs font-medium rounded-lg ${cameraMode === 'iso' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Isometric
            </button>
            <button
              onClick={() => setCameraPreset('front')}
              className={`px-2 py-1 text-xs font-medium rounded-lg ${cameraMode === 'front' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Front
            </button>
            <button
              onClick={() => setCameraPreset('ceiling')}
              className={`px-2 py-1 text-xs font-medium rounded-lg ${cameraMode === 'ceiling' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Ceiling
            </button>
            <button
              onClick={toggleZoom}
              className="p-1 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white"
              title="Zoom In/Out"
            >
              🔍
            </button>
            <button
              onClick={resetCamera}
              className="p-1 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white"
              title="Reset View"
            >
              🔄
            </button>
          </>
        )}
      </div>

      {/* Top Right Live Status Pill Overlay */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 ring-2 ring-teal-400/30" />
          <span className="text-slate-200 font-medium">Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
          <span className="text-slate-200 font-medium">Expiring</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          <span className="text-slate-400 font-medium">Idle</span>
        </div>
      </div>

      {/* Main Viewport Content */}
      {viewStyle === '3d' ? (
        <div
          ref={containerRef}
          className="w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden"
          title="Drag mouse to rotate 3D view. Click on any desk to select zone."
        />
      ) : (
        /* High Resolution Architectural Cutaway Render Visual Reference with Live Overlays */
        <div className="relative w-full h-full flex items-center justify-center p-2 bg-gradient-to-b from-[#F9FBFC] to-[#EDF2F7] overflow-hidden">
          <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-200 group">
            <img
              src="/assets/classroom_isometric_model.png"
              alt="Classroom 3D Architectural Miniature Model"
              className="w-full h-auto object-contain max-h-[580px]"
            />

            {/* Overlaid Zone Indicator Tags */}
            <div
              onClick={() => onSelectZone(1)}
              className={`absolute left-8 top-32 cursor-pointer z-10 flex items-center transition-all ${
                selectedZone === 1 ? 'scale-105' : 'hover:scale-105'
              }`}
            >
              <span className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-teal-300 shadow-lg text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                Row 1 Front (1–5)
                <span className="text-teal-600 font-medium text-[11px] ml-1">Fan: ON | Light: OFF (Solar)</span>
              </span>
            </div>

            <div
              onClick={() => onSelectZone(2)}
              className={`absolute left-8 top-56 cursor-pointer z-10 flex items-center transition-all ${
                selectedZone === 2 ? 'scale-105' : 'hover:scale-105'
              }`}
            >
              <span className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-teal-300 shadow-lg text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                Row 2 Middle (6–10)
                <span className="text-teal-600 font-medium text-[11px] ml-1">Fan: ON | Light: ON</span>
              </span>
            </div>

            <div
              onClick={() => onSelectZone(3)}
              className={`absolute left-8 top-80 cursor-pointer z-10 flex items-center transition-all ${
                selectedZone === 3 ? 'scale-105' : 'hover:scale-105'
              }`}
            >
              <span className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-300 shadow-lg text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Row 3 Rear (11–15)
                <span className="text-amber-700 font-medium text-[11px] ml-1">Expiring: 4s | Light: ON</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Overlaid HUD Actuators Cluster (Top/Right inside scene) */}
      <div className="absolute right-5 bottom-5 z-20 flex flex-col gap-2.5">
        <div className="px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 text-[11px] text-white flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>Selected: {zones[selectedZone]?.name || `Row ${selectedZone}`}</span>
        </div>
      </div>
    </div>
  );
};
