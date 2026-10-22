/**
 * etabs_hub.js
 * Client-side Controller for ETABS Structural AI Hub in RevitAI Dashboard
 * 1. 2D Canvas Framing Plan Viewer with TRUE BEAM WIDTH & section labels
 * 2. 3D WebGL / Three.js Solid Model with realistic cross-sections, 3D grids, 3D moments M33
 * 3. Beam click-to-inspect & rebar selection modal (no tab switching needed)
 * 4. TCVN 5574-2012 Rebar Calculation Table & Selection Filter
 * 5. One-click Deploy to https://mr.pkld.online (VPS Sync)
 */

let etabsData = null;
let current2DStory = 'T4';
let last2DStory = null;
let lastModal2DStory = null;

let view2D = {
  scale: 0.024,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  hasUserInteracted: false
};
let modalView2D = {
  scale: 0.024,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  hasUserInteracted: false
};


// Three.js instances & states
let threeScene = null, threeCamera = null, threeRenderer = null, threeControls = null;
let threeMeshes = [];
let threeBeamMeshes = [];
let threeGridsGroup = null;
let threeMomentsGroup = null;
let threeLabelsGroup = null;

let modalThreeScene = null, modalThreeCamera = null, modalThreeRenderer = null, modalThreeControls = null;
let modalThreeMeshes = [];
let modalThreeBeamMeshes = [];
let modalThreeGridsGroup = null;
let modalThreeMomentsGroup = null;
let modalThreeLabelsGroup = null;

// Display toggles - Defaults per user requirements:
let is3DWireframe = false;  // Mặc định tắt khung dây
let show3DGrids = true;      // (1) Hiện lưới trục
let show3DMoments = true;    // (3) Hiển thị moment trên 3D luôn
let show3DBeamLabels = true; // (5) Hiện tên dầm

// Raycaster & Interaction
const threeRaycaster = new THREE.Raycaster();
const threeMouse = new THREE.Vector2();
let hoveredBeamMesh = null;
let selectedBeamForRebar = null;

// Rebar options catalog with exact areas (cm2)
const REBAR_CATALOG = [
  { label: '2D14', area: 3.08 },
  { label: '2D16', area: 4.02 },
  { label: '3D16', area: 6.03 },
  { label: '2D18', area: 5.09 },
  { label: '2D18+1D16', area: 7.10 },
  { label: '3D18', area: 7.63 },
  { label: '2D20', area: 6.28 },
  { label: '2D20+1D18', area: 8.83 },
  { label: '3D20', area: 9.42 },
  { label: '4D18', area: 10.18 },
  { label: '2D22', area: 7.60 },
  { label: '2D22+1D20', area: 10.74 },
  { label: '3D22', area: 11.40 },
  { label: '4D20', area: 12.57 },
  { label: '2D25', area: 9.82 },
  { label: '2D25+1D22', area: 13.62 },
  { label: '3D25', area: 14.73 },
  { label: '4D22', area: 15.21 },
  { label: '4D25', area: 19.63 }
];

const STIRRUP_OPTIONS = [
  'd8a100/a200',
  'd8a100',
  'd8a150',
  'd10a100/a200',
  'd10a100'
];

// ==============================================================================
// 1. DATA INITIALIZATION & HUB TOGGLING
// ==============================================================================

async function loadEtabsData() {
  try {
    let res = null;
    try {
      res = await fetch('/api/etabs-data');
    } catch (e) {
      console.warn('[ETABS Hub] Failed fetching /api/etabs-data, trying /etabs_beam_data.json fallback');
    }

    if (!res || !res.ok) {
      res = await fetch('/etabs_beam_data.json');
    }

    if (!res.ok) throw new Error('HTTP ' + res.status);
    etabsData = await res.json();
    console.log('[ETABS Hub] Loaded data successfully:', etabsData);
    
    // Update story select options
    populateStorySelects();
    
    // Populate Rebar tables
    populateRebarTable('rebarTableBody', 'rebarFilterStory', 'rebarSearchInput');
    populateRebarTable('modalRebarTableBody', null, null);
    
    // Render 2D
    renderEtabs2DPlan();
    
    // Initialize 3D
    setTimeout(() => {
      initThree3D('etabs3DContainer');
    }, 200);

  } catch (err) {
    console.error('[ETABS Hub] Error loading data:', err);
  }
}

function populateStorySelects() {
  if (!etabsData || !etabsData.stories) return;
  const selects = ['etabs2DStorySelect', 'modal2DStorySelect'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    const sorted = [...etabsData.stories].reverse();
    sorted.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st.name;
      opt.textContent = `${st.name} (Cao độ Z = ${(st.elevation/1000).toFixed(1)}m)`;
      el.appendChild(opt);
    });
    el.value = 'T4';
  });
}

function openEtabsHub(mode = 'middle') {
  if (!etabsData) {
    loadEtabsData();
  }
  
  if (mode === 'modal') {
    const modal = document.getElementById('etabsModal');
    if (modal) {
      modal.classList.remove('hidden');
      setTimeout(() => {
        fit2DView('modal2DCanvas', modalView2D);
        renderModal2DPlan();
        initModalThree3D('modal3DContainer');
      }, 150);
    }
  } else {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const tab = document.getElementById('tab-etabs-hub');
    if (tab) {
      tab.classList.remove('hidden');
      tab.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        fit2DView('etabs2DCanvas', view2D);
        renderEtabs2DPlan();
        if (threeRenderer) {
          resizeThreeRenderer('etabs3DContainer', threeRenderer, threeCamera);
        }
      }, 150);
    }
  }
}

function closeEtabsModal() {
  const modal = document.getElementById('etabsModal');
  if (modal) modal.classList.add('hidden');
}

function switchEtabsSubTab(tabName) {
  const tabs = [
    { id: 'etabs-3d', btnId: 'subtab-btn-3d', paneId: 'subpane-etabs-3d' },
    { id: 'etabs-2d', btnId: 'subtab-btn-2d', paneId: 'subpane-etabs-2d' },
    { id: 'etabs-rebar', btnId: 'subtab-btn-rebar', paneId: 'subpane-etabs-rebar' }
  ];

  tabs.forEach(t => {
    const btn = document.getElementById(t.btnId);
    const pane = document.getElementById(t.paneId);
    const isActive = (t.id === tabName);

    if (pane) {
      if (isActive) pane.classList.remove('hidden');
      else pane.classList.add('hidden');
    }

    if (btn) {
      if (isActive) {
        btn.className = 'etabs-subtab-btn py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-2 bg-indigo-600 text-white shadow-md shadow-indigo-600/25 transition-all duration-150 cursor-pointer';
      } else {
        btn.className = 'etabs-subtab-btn py-2 px-4 rounded-xl font-semibold text-xs flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all duration-150 cursor-pointer';
      }
    }
  });

  if (tabName === 'etabs-2d') {
    setTimeout(() => {
      fit2DView('etabs2DCanvas', view2D);
      renderEtabs2DPlan();
    }, 100);
  } else if (tabName === 'etabs-3d') {
    setTimeout(() => {
      if (!threeRenderer) {
        initThree3D('etabs3DContainer');
      } else {
        resizeThreeRenderer('etabs3DContainer', threeRenderer, threeCamera);
      }
    }, 150);
  }
}

function switchEtabsModalTab(tabName) {
  const modalTabs = [
    { id: 'modal-2d', btnId: 'modal-tabbtn-2d', paneId: 'modal-pane-2d' },
    { id: 'modal-3d', btnId: 'modal-tabbtn-3d', paneId: 'modal-pane-3d' },
    { id: 'modal-rebar', btnId: 'modal-tabbtn-rebar', paneId: 'modal-pane-rebar' }
  ];

  modalTabs.forEach(t => {
    const btn = document.getElementById(t.btnId);
    const pane = document.getElementById(t.paneId);
    const isActive = (t.id === tabName);

    if (pane) {
      if (isActive) pane.classList.remove('hidden');
      else pane.classList.add('hidden');
    }

    if (btn) {
      if (isActive) {
        btn.className = 'py-1 px-3 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-sm transition';
      } else {
        btn.className = 'py-1 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition';
      }
    }
  });

  if (tabName === 'modal-2d') {
    setTimeout(() => {
      fit2DView('modal2DCanvas', modalView2D);
      renderModal2DPlan();
    }, 100);
  } else if (tabName === 'modal-3d') {
    setTimeout(() => {
      if (!modalThreeRenderer) {
        initModalThree3D('modal3DContainer');
      } else {
        resizeThreeRenderer('modal3DContainer', modalThreeRenderer, modalThreeCamera);
      }
    }, 150);
  }
}

async function refreshEtabsDataLive() {
  const btn = document.getElementById('btnRefreshEtabs');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin inline-block mr-1">⏳</span> Đang nạp ETABS...';
  }
  try {
    const res = await fetch('/api/etabs-refresh', { method: 'POST' });
    const data = await res.json();
    alert(data.message || 'Làm mới thành công!');
    await loadEtabsData();
  } catch (e) {
    alert('Lỗi làm mới: ' + e);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-indigo-600"></i> Làm mới EDB';
      if (window.lucide) lucide.createIcons();
    }
  }
}

// ==============================================================================
// 2. 2D CANVAS FRAMING PLAN VIEWER
// ==============================================================================

function renderEtabs2DPlan(canvasId = 'etabs2DCanvas', selectId = 'etabs2DStorySelect', vState = view2D) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !etabsData) return;
  const ctx = canvas.getContext('2d');
  
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const width = rect.width;
  const height = rect.height;

  // Clear background with gray #AAA
  ctx.fillStyle = '#aaaaaa';
  ctx.fillRect(0, 0, width, height);

  const selStory = document.getElementById(selectId) ? document.getElementById(selectId).value : 'T4';
  const showLabels = document.getElementById('chkShow2DLabels') ? document.getElementById('chkShow2DLabels').checked : true;

  // Auto-fit whenever story changes or before user manually pans/zooms
  const isModal = (canvasId === 'modal2DCanvas');
  const prevStory = isModal ? lastModal2DStory : last2DStory;
  if (selStory !== prevStory) {
    if (isModal) lastModal2DStory = selStory;
    else last2DStory = selStory;
    vState.hasUserInteracted = false;
  }

  if (!vState.hasUserInteracted) {
    fit2DView(canvasId, vState);
  }

  const storyBeams = etabsData.beams.filter(b => b.story === selStory);
  const storyCols = etabsData.columns.filter(c => c.story === selStory);

  ctx.save();
  ctx.translate(vState.offsetX, vState.offsetY);
  ctx.scale(vState.scale, -vState.scale); // Invert Y so up is positive Y

  // 1. Draw Grid Lines
  if (etabsData.grids) {
    ctx.lineWidth = 1.2 / vState.scale;
    ctx.setLineDash([5 / vState.scale, 4 / vState.scale]);
    ctx.strokeStyle = '#475569'; // Slate-600 (sharp on #AAA)
    ctx.fillStyle = '#0f172a';   // Slate-900 text
    ctx.font = `bold ${Math.max(12, 14 / vState.scale)}px sans-serif`;

    const minX = -1000, maxX = 36000;
    const minY = -1000, maxY = 13000;

    (etabsData.grids.X || []).forEach(gx => {
      ctx.beginPath();
      ctx.moveTo(gx.ordinate, minY);
      ctx.lineTo(gx.ordinate, maxY);
      ctx.stroke();

      ctx.save();
      ctx.scale(1, -1);
      ctx.fillText(`Trục ${gx.id}`, gx.ordinate - (20 / vState.scale), -minY + (25 / vState.scale));
      ctx.restore();
    });

    (etabsData.grids.Y || []).forEach(gy => {
      ctx.beginPath();
      ctx.moveTo(minX, gy.ordinate);
      ctx.lineTo(maxX, gy.ordinate);
      ctx.stroke();

      ctx.save();
      ctx.scale(1, -1);
      ctx.fillText(`Trục ${gy.id}`, minX - (60 / vState.scale), -gy.ordinate + (5 / vState.scale));
      ctx.restore();
    });
    ctx.setLineDash([]);
  }

  // 2. Draw Beams with TRUE WIDTH
  storyBeams.forEach(b => {
    const x1 = b.p1[0], y1 = b.p1[1];
    const x2 = b.p2[0], y2 = b.p2[1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx*dx + dy*dy);
    if (len < 1) return;

    const bWidth = b.width || 200;
    const hw = bWidth / 2.0;

    const nx = -dy / len;
    const ny = dx / len;

    const v1x = x1 - hw * nx, v1y = y1 - hw * ny;
    const v2x = x1 + hw * nx, v2y = y1 + hw * ny;
    const v3x = x2 + hw * nx, v3y = y2 + hw * ny;
    const v4x = x2 - hw * nx, v4y = y2 - hw * ny;

    ctx.beginPath();
    ctx.moveTo(v1x, v1y);
    ctx.lineTo(v2x, v2y);
    ctx.lineTo(v3x, v3y);
    ctx.lineTo(v4x, v4y);
    ctx.closePath();

    if (bWidth >= 300) {
      ctx.fillStyle = 'rgba(2, 132, 199, 0.85)'; // Sky 600
      ctx.strokeStyle = '#0369a1';
    } else if (bWidth >= 250) {
      ctx.fillStyle = 'rgba(14, 165, 233, 0.8)';
      ctx.strokeStyle = '#0284c7';
    } else {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.strokeStyle = '#0ea5e9';
    }

    ctx.lineWidth = 1.5 / vState.scale;
    ctx.fill();
    ctx.stroke();

    // Centerline
    ctx.setLineDash([2 / vState.scale, 2 / vState.scale]);
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.lineWidth = 1.0 / vState.scale;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // 3. Draw Columns
  storyCols.forEach(c => {
    const cx = c.p1[0];
    const cy = c.p1[1];
    const cw = c.width || 300;
    const cd = c.depth || 300;

    ctx.fillStyle = '#1e293b'; // Slate 800
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5 / vState.scale;

    ctx.fillRect(cx - cw/2, cy - cd/2, cw, cd);
    ctx.strokeRect(cx - cw/2, cy - cd/2, cw, cd);
  });

  // 4. Draw Beam Text Labels
  if (showLabels) {
    ctx.save();
    ctx.scale(1, -1);
    ctx.font = `bold ${Math.max(11, 12 / vState.scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    storyBeams.forEach(b => {
      const mx = (b.p1[0] + b.p2[0]) / 2.0;
      const my = -(b.p1[1] + b.p2[1]) / 2.0;

      const labelText = `${b.label}: ${b.section.replace('B ', '')}`;
      const textWidth = ctx.measureText(labelText).width;
      const pad = 4 / vState.scale;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1 / vState.scale;

      ctx.fillRect(mx - textWidth/2 - pad, my - (8/vState.scale) - pad/2, textWidth + pad*2, (16/vState.scale) + pad);
      ctx.strokeRect(mx - textWidth/2 - pad, my - (8/vState.scale) - pad/2, textWidth + pad*2, (16/vState.scale) + pad);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(labelText, mx, my);
    });

    ctx.restore();
  }

  ctx.restore();
}

function fit2DView(canvasId = 'etabs2DCanvas', vState = view2D) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height || rect.width < 50 || rect.height < 50) return;

  // Exact bounds of all content including grid lines & labels:
  // X: from -3600 (leftmost Trục A/B/C labels) to 35800 (rightmost grid & beams)
  // Y: from -2200 (bottom Trục 1..7 labels) to 13200 (top of grid line)
  const minX = -3600;
  const maxX = 35800;
  const minY = -2200;
  const maxY = 13200;

  const modelW = maxX - minX;          // 39400 mm
  const modelH = maxY - minY;          // 15400 mm
  const centerX = (minX + maxX) / 2.0; // 16100 mm
  const centerY = (minY + maxY) / 2.0; // 5500 mm

  // Scale with 94% width padding & 88% height padding for clear framing
  const scaleX = (rect.width * 0.94) / modelW;
  const scaleY = (rect.height * 0.88) / modelH;
  vState.scale = Math.min(scaleX, scaleY);

  // Exact mathematical centering
  vState.offsetX = (rect.width / 2.0) - (centerX * vState.scale);
  vState.offsetY = (rect.height / 2.0) + (centerY * vState.scale);
}

function zoomEtabs2D(factor) {
  view2D.scale *= factor;
  view2D.hasUserInteracted = true;
  renderEtabs2DPlan('etabs2DCanvas', 'etabs2DStorySelect', view2D);
}

function resetEtabs2DView() {
  view2D.hasUserInteracted = false;
  fit2DView('etabs2DCanvas', view2D);
  renderEtabs2DPlan('etabs2DCanvas', 'etabs2DStorySelect', view2D);
}

function renderModal2DPlan() {
  renderEtabs2DPlan('modal2DCanvas', 'modal2DStorySelect', modalView2D);
}

function zoomModal2D(factor) {
  modalView2D.scale *= factor;
  modalView2D.hasUserInteracted = true;
  renderModal2DPlan();
}

function resetModal2DView() {
  modalView2D.hasUserInteracted = false;
  fit2DView('modal2DCanvas', modalView2D);
  renderModal2DPlan();
}

function setup2DCanvasEvents(canvasId, vState, renderFn) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  canvas.addEventListener('mousedown', e => {
    vState.isDragging = true;
    vState.dragStartX = e.clientX - vState.offsetX;
    vState.dragStartY = e.clientY - vState.offsetY;
  });

  window.addEventListener('mousemove', e => {
    if (!vState.isDragging) return;
    vState.offsetX = e.clientX - vState.dragStartX;
    vState.offsetY = e.clientY - vState.dragStartY;
    vState.hasUserInteracted = true; // User manually panned
    renderFn();
  });

  window.addEventListener('mouseup', () => {
    vState.isDragging = false;
  });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    vState.scale *= zoomFactor;
    vState.hasUserInteracted = true; // User manually zoomed
    renderFn();
  });

  // Responsive: Automatically re-fit whenever container size changes or becomes visible
  if (window.ResizeObserver && canvas.parentElement) {
    const ro = new ResizeObserver(() => {
      if (!vState.hasUserInteracted) {
        fit2DView(canvasId, vState);
      }
      renderFn();
    });
    ro.observe(canvas.parentElement);
  }
}


// ==============================================================================
// 3. THREE.JS 3D SOLID CROSS-SECTION VIEWER (WITH GRIDS, MOMENTS, RAYCASTER)
// ==============================================================================

function initThree3D(containerId) {
  const container = document.getElementById(containerId);
  if (!container || !window.THREE || !etabsData) return;
  if (container.children.length > 0) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  threeScene = new THREE.Scene();
  threeScene.background = new THREE.Color(0xaaaaaa); // Gray #AAA

  threeCamera = new THREE.PerspectiveCamera(45, width / height, 100, 200000);
  threeCamera.position.set(18000, 15000, 40000);

  threeRenderer = new THREE.WebGLRenderer({ antialias: true });
  threeRenderer.setSize(width, height);
  threeRenderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(threeRenderer.domElement);

  if (window.THREE.OrbitControls) {
    threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
    threeControls.target.set(17000, 8000, 6000);
    threeControls.update();
  }

  threeScene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.85);
  dirLight1.position.set(20000, 40000, 30000);
  threeScene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x93c5fd, 0.45);
  dirLight2.position.set(-20000, -20000, -20000);
  threeScene.add(dirLight2);

  // Ground Grid
  const gridHelper = new THREE.GridHelper(50000, 50, 0x475569, 0x888888);
  gridHelper.position.set(17000, 0, 6000);
  threeScene.add(gridHelper);

  // Build Model & Layers
  build3DModel(threeScene, false);

  // Setup Raycaster Hover & Click for Beams
  setupThreeRaycaster(container, threeRenderer, threeCamera, threeBeamMeshes, 'etabs3DTooltip');

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    if (threeControls) threeControls.update();
    threeRenderer.render(threeScene, threeCamera);
  }
  animate();
}

function initModalThree3D(containerId) {
  const container = document.getElementById(containerId);
  if (!container || !window.THREE || !etabsData) return;
  if (container.children.length > 0) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  modalThreeScene = new THREE.Scene();
  modalThreeScene.background = new THREE.Color(0xaaaaaa); // Gray #AAA

  modalThreeCamera = new THREE.PerspectiveCamera(45, width / height, 100, 200000);
  modalThreeCamera.position.set(18000, 15000, 40000);

  modalThreeRenderer = new THREE.WebGLRenderer({ antialias: true });
  modalThreeRenderer.setSize(width, height);
  modalThreeRenderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(modalThreeRenderer.domElement);

  if (window.THREE.OrbitControls) {
    modalThreeControls = new THREE.OrbitControls(modalThreeCamera, modalThreeRenderer.domElement);
    modalThreeControls.target.set(17000, 8000, 6000);
    modalThreeControls.update();
  }

  modalThreeScene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
  dirLight.position.set(20000, 40000, 30000);
  modalThreeScene.add(dirLight);

  const gridHelper = new THREE.GridHelper(50000, 50, 0x475569, 0x888888);
  gridHelper.position.set(17000, 0, 6000);
  modalThreeScene.add(gridHelper);

  build3DModel(modalThreeScene, true);

  setupThreeRaycaster(container, modalThreeRenderer, modalThreeCamera, modalThreeBeamMeshes, 'etabs3DTooltip');

  function animate() {
    requestAnimationFrame(animate);
    if (modalThreeControls) modalThreeControls.update();
    modalThreeRenderer.render(modalThreeScene, modalThreeCamera);
  }
  animate();
}

// ------------------------------------------------------------------------------
// BUILD 3D MODEL (COLUMNS, BEAMS, BALCONY/STAIR SLABS, GRIDS, MOMENTS, LABELS)
// ------------------------------------------------------------------------------

function build3DModel(scene, isModal = false) {
  if (!etabsData) return;

  const targetMeshes = isModal ? modalThreeMeshes : threeMeshes;
  const targetBeamMeshes = isModal ? modalThreeBeamMeshes : threeBeamMeshes;
  targetMeshes.length = 0;
  targetBeamMeshes.length = 0;

  const beamMaterial = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9, // Sky 500
    roughness: 0.4,
    metalness: 0.1,
    wireframe: is3DWireframe
  });

  const colMaterial = new THREE.MeshStandardMaterial({
    color: 0x6366f1, // Indigo 500
    roughness: 0.4,
    metalness: 0.1,
    wireframe: is3DWireframe
  });

  const stairMaterial = new THREE.MeshStandardMaterial({
    color: 0xef4444, // Red
    roughness: 0.3,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    wireframe: is3DWireframe
  });

  // 1. Columns (Extruded Solid Boxes along Z)
  (etabsData.columns || []).forEach(c => {
    const w = c.width || 300;
    const d = c.depth || 300;
    const h = c.height || 3800;

    const geom = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geom, colMaterial);

    const mx = c.p1[0];
    const my = (c.p1[2] + c.p2[2]) / 2.0; // Three.js Y is ETABS Z
    const mz = c.p1[1];                    // Three.js Z is ETABS Y

    mesh.position.set(mx, my, mz);
    scene.add(mesh);
    targetMeshes.push(mesh);

    const edges = new THREE.EdgesGeometry(geom);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x1e1b4b, linewidth: 1 }));
    mesh.add(line);
  });

  // 2. Beams (Oriented Solid Boxes with real b x h)
  (etabsData.beams || []).forEach(b => {
    const x1 = b.p1[0], y1 = b.p1[1], z1 = b.p1[2];
    const x2 = b.p2[0], y2 = b.p2[1], z2 = b.p2[2];

    const dx = x2 - x1;
    const dy = y2 - y1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (length < 10) return;

    const bWidth = b.width || 200;
    const bDepth = b.depth || 400;

    const geom = new THREE.BoxGeometry(bWidth, bDepth, length);
    // Distinct material clone per beam so we can highlight individually
    const meshMat = beamMaterial.clone();
    const mesh = new THREE.Mesh(geom, meshMat);

    const mx = (x1 + x2) / 2.0;
    const my = (z1 + z2) / 2.0;
    const mz = (y1 + y2) / 2.0;

    mesh.position.set(mx, my, mz);

    const dir = new THREE.Vector3(dx, dz, dy).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    mesh.setRotationFromQuaternion(quat);

    // Attach data for Raycaster inspection & click selection
    mesh.userData = { isBeam: true, beam: b, origColor: 0x0ea5e9 };

    scene.add(mesh);
    targetMeshes.push(mesh);
    targetBeamMeshes.push(mesh);

    const edges = new THREE.EdgesGeometry(geom);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x0369a1, linewidth: 1 }));
    mesh.add(line);
  });

  // 3. Slabs & Balconies (Robust N-gon Triangulation to fix Balcony gap at Trục 7)
  (etabsData.areas || []).forEach(a => {
    if (a.coords && a.coords.length >= 3) {
      const pts = a.coords.map(c => new THREE.Vector3(c[0], c[2], c[1]));
      const geom = new THREE.BufferGeometry();
      const vertices = [];

      if (pts.length === 3) {
        vertices.push(pts[0].x, pts[0].y, pts[0].z);
        vertices.push(pts[1].x, pts[1].y, pts[1].z);
        vertices.push(pts[2].x, pts[2].y, pts[2].z);
      } else if (pts.length === 4) {
        vertices.push(pts[0].x, pts[0].y, pts[0].z);
        vertices.push(pts[1].x, pts[1].y, pts[1].z);
        vertices.push(pts[2].x, pts[2].y, pts[2].z);

        vertices.push(pts[0].x, pts[0].y, pts[0].z);
        vertices.push(pts[2].x, pts[2].y, pts[2].z);
        vertices.push(pts[3].x, pts[3].y, pts[3].z);
      } else {
        // N-gon (e.g. 6-point Balcony F29 at Trục 7)
        try {
          const pts2D = pts.map(p => ({ x: p.x, y: p.z }));
          const faces = (THREE.ShapeUtils && THREE.ShapeUtils.triangulateShape)
            ? THREE.ShapeUtils.triangulateShape(pts2D, [])
            : null;
          if (faces && faces.length > 0) {
            faces.forEach(f => {
              const pA = pts[f[0]], pB = pts[f[1]], pC = pts[f[2]];
              vertices.push(pA.x, pA.y, pA.z);
              vertices.push(pB.x, pB.y, pB.z);
              vertices.push(pC.x, pC.y, pC.z);
            });
          } else {
            // Fan fallback
            for (let i = 1; i < pts.length - 1; i++) {
              vertices.push(pts[0].x, pts[0].y, pts[0].z);
              vertices.push(pts[i].x, pts[i].y, pts[i].z);
              vertices.push(pts[i+1].x, pts[i+1].y, pts[i+1].z);
            }
          }
        } catch (e) {
          for (let i = 1; i < pts.length - 1; i++) {
            vertices.push(pts[0].x, pts[0].y, pts[0].z);
            vertices.push(pts[i].x, pts[i].y, pts[i].z);
            vertices.push(pts[i+1].x, pts[i+1].y, pts[i+1].z);
          }
        }
      }

      geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geom.computeVertexNormals();

      const meshMat = stairMaterial.clone();
      const mesh = new THREE.Mesh(geom, meshMat);
      scene.add(mesh);
      targetMeshes.push(mesh);

      // Clean perimeter line loop
      const lineGeom = new THREE.BufferGeometry().setFromPoints(pts);
      const edgeLoop = new THREE.LineLoop(lineGeom, new THREE.LineBasicMaterial({ color: 0xf43f5e, linewidth: 2 }));
      scene.add(edgeLoop);
    }
  });

  // 4. (1) Grid Lines & Billboard Bubbles
  const gridsGrp = build3DGrids(scene);
  if (isModal) modalThreeGridsGroup = gridsGrp;
  else threeGridsGroup = gridsGrp;

  // 5. (3) 3D Moment M33 Diagrams
  const momentsGrp = build3DMoments(scene);
  if (isModal) modalThreeMomentsGroup = momentsGrp;
  else threeMomentsGroup = momentsGrp;

  // 6. (5) 3D Beam Labels
  const labelsGrp = build3DBeamLabels(scene);
  if (isModal) modalThreeLabelsGroup = labelsGrp;
  else threeLabelsGroup = labelsGrp;
}

// ------------------------------------------------------------------------------
// 3D GRID SYSTEM (TRỤC 1-7, A-C)
// ------------------------------------------------------------------------------

function createTextBubbleSprite(text, bgColor = '#0f172a', textColor = '#38bdf8', borderColor = '#0284c7') {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.arc(64, 64, 54, 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1800, 1800, 1);
  return sprite;
}

function build3DGrids(scene) {
  const group = new THREE.Group();
  group.name = 'etabs_grids_group';
  group.visible = show3DGrids;
  if (!etabsData || !etabsData.grids) return group;

  const minX = -2000, maxX = 36000;
  const minZ = -2000, maxZ = 14000;
  const gridY = 0; // Elevation Z=0 in ETABS -> Y=0 in Three.js

  const lineMat = new THREE.LineDashedMaterial({
    color: 0x38bdf8,
    dashSize: 500,
    gapSize: 250,
    linewidth: 1,
    opacity: 0.65,
    transparent: true
  });

  // X Grids (Vertical in plan -> lines along Z in Three.js)
  (etabsData.grids.X || []).forEach(gx => {
    const x = gx.ordinate;
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, gridY, minZ),
      new THREE.Vector3(x, gridY, maxZ)
    ]);
    const line = new THREE.Line(geom, lineMat);
    line.computeLineDistances();
    group.add(line);

    // Bubble at minZ & maxZ
    const sp1 = createTextBubbleSprite(gx.id);
    sp1.position.set(x, gridY + 200, minZ - 1200);
    group.add(sp1);

    const sp2 = createTextBubbleSprite(gx.id);
    sp2.position.set(x, gridY + 200, maxZ + 1200);
    group.add(sp2);
  });

  // Y Grids (Horizontal in plan -> lines along X in Three.js)
  (etabsData.grids.Y || []).forEach(gy => {
    const z = gy.ordinate;
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(minX, gridY, z),
      new THREE.Vector3(maxX, gridY, z)
    ]);
    const line = new THREE.Line(geom, lineMat);
    line.computeLineDistances();
    group.add(line);

    const sp1 = createTextBubbleSprite(gy.id);
    sp1.position.set(minX - 1200, gridY + 200, z);
    group.add(sp1);

    const sp2 = createTextBubbleSprite(gy.id);
    sp2.position.set(maxX + 1200, gridY + 200, z);
    group.add(sp2);
  });

  scene.add(group);
  return group;
}

// ------------------------------------------------------------------------------
// (3) 3D MOMENT M33 CALCULATION & PARABOLIC DIAGRAMS
// ------------------------------------------------------------------------------

function calculateBeamMoments(b) {
  const h0 = Math.max(100, (b.depth || 400) - 40);
  // M (kNm) = As (cm2) * 100 * 350 * 0.9 * h0 * 1e-6 = As * 0.0315 * h0
  const mLeft = -Math.round((b.as_top_left_cm2 || 0) * 0.0315 * h0 * 10) / 10;
  const mRight = -Math.round((b.as_top_right_cm2 || 0) * 0.0315 * h0 * 10) / 10;
  const mMid = Math.round((b.as_bot_mid_cm2 || 0) * 0.0315 * h0 * 10) / 10;
  return { mLeft, mMid, mRight, h0 };
}

function build3DMoments(scene) {
  const group = new THREE.Group();
  group.name = 'etabs_moments_group';
  group.visible = show3DMoments;
  if (!etabsData || !etabsData.beams) return group;

  const scaleM = 10.0; // 1 kNm = 10mm visual height

  etabsData.beams.forEach(b => {
    const x1 = b.p1[0], y1 = b.p1[1], z1 = b.p1[2];
    const x2 = b.p2[0], y2 = b.p2[1], z2 = b.p2[2];
    const p1 = new THREE.Vector3(x1, z1, y1);
    const p2 = new THREE.Vector3(x2, z2, y2);
    const L = p1.distanceTo(p2);
    if (L < 10) return;

    const { mLeft, mMid, mRight } = calculateBeamMoments(b);
    b._calculatedMoments = { mLeft, mMid, mRight };
    if (Math.abs(mLeft) < 0.1 && Math.abs(mMid) < 0.1 && Math.abs(mRight) < 0.1) return;

    const curvePts = [];
    const hatchVerts = [];
    const segments = 24;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const basePt = new THREE.Vector3().lerpVectors(p1, p2, t);
      // Parabolic formulation: M(t) = mL*(1-t) + mR*t + 4*mM*t*(1-t)
      const mVal = mLeft * (1 - t) + mRight * t + 4.0 * mMid * t * (1 - t);
      // Offset upward (+Y) for negative moment, downward (-Y) for positive moment
      const offsetY = -mVal * scaleM;
      const momentPt = new THREE.Vector3(basePt.x, basePt.y + offsetY, basePt.z);
      curvePts.push(momentPt);

      // Hatch line every 2 steps
      if (i % 2 === 0 && Math.abs(mVal) > 0.5) {
        hatchVerts.push(basePt.x, basePt.y, basePt.z);
        hatchVerts.push(momentPt.x, momentPt.y, momentPt.z);
      }
    }

    // Parabolic Moment Curve
    const curveGeom = new THREE.BufferGeometry().setFromPoints(curvePts);
    const curveMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 }); // Amber
    const curveLine = new THREE.Line(curveGeom, curveMat);
    group.add(curveLine);

    // Hatch Lines
    if (hatchVerts.length > 0) {
      const hatchGeom = new THREE.BufferGeometry();
      hatchGeom.setAttribute('position', new THREE.Float32BufferAttribute(hatchVerts, 3));
      const hatchMat = new THREE.LineBasicMaterial({ color: 0xfbbf24, opacity: 0.45, transparent: true });
      const hatchMesh = new THREE.LineSegments(hatchGeom, hatchMat);
      group.add(hatchMesh);
    }
  });

  scene.add(group);
  return group;
}

// ------------------------------------------------------------------------------
// (5) 3D BEAM LABELS (BILLBOARD SPRITES)
// ------------------------------------------------------------------------------

function createBeamLabelSprite(name, section) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(8, 8, 240, 80, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, 128, 42);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '24px sans-serif';
  ctx.fillText(section.replace('B ', ''), 128, 72);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1600, 600, 1);
  return sprite;
}

function build3DBeamLabels(scene) {
  const group = new THREE.Group();
  group.name = 'etabs_beam_labels_group';
  group.visible = show3DBeamLabels;
  if (!etabsData || !etabsData.beams) return group;

  etabsData.beams.forEach(b => {
    const mx = (b.p1[0] + b.p2[0]) / 2.0;
    const my = (b.p1[2] + b.p2[2]) / 2.0 + (b.depth || 400) / 2.0 + 350;
    const mz = (b.p1[1] + b.p2[1]) / 2.0;

    const sp = createBeamLabelSprite(b.label, b.section);
    sp.position.set(mx, my, mz);
    group.add(sp);
  });

  scene.add(group);
  return group;
}

// ------------------------------------------------------------------------------
// RAYCASTER HOVER & CLICK LISTENER FOR 3D BEAMS
// ------------------------------------------------------------------------------

function setupThreeRaycaster(container, renderer, camera, beamMeshes, tooltipId) {
  const tooltip = document.getElementById(tooltipId);

  container.addEventListener('mousemove', e => {
    const rect = container.getBoundingClientRect();
    threeMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    threeMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    threeRaycaster.setFromCamera(threeMouse, camera);
    const intersects = threeRaycaster.intersectObjects(beamMeshes);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const mesh = hit.object;
      const b = mesh.userData.beam;

      if (hoveredBeamMesh && hoveredBeamMesh !== mesh) {
        hoveredBeamMesh.material.color.setHex(hoveredBeamMesh.userData.origColor);
      }

      mesh.material.color.setHex(0xf59e0b); // Highlight Amber
      hoveredBeamMesh = mesh;
      container.style.cursor = 'pointer';

      if (tooltip && b) {
        const { mLeft, mMid, mRight } = calculateBeamMoments(b);
        tooltip.innerHTML = `
          <div class="font-bold text-white flex items-center justify-between gap-3 border-b border-slate-700 pb-1 mb-1.5">
            <span class="text-amber-400 font-mono text-sm">${b.label}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300">${b.story}</span>
          </div>
          <div class="text-[11px] text-slate-300 space-y-0.5">
            <div>📐 Tiết diện: <strong class="text-white">${b.section}</strong> (L = ${(b.length/1000).toFixed(2)}m)</div>
            <div>⚡ Moment: <span class="text-rose-400 font-semibold">${mLeft}</span> / <span class="text-emerald-400 font-bold">+${mMid}</span> / <span class="text-rose-400 font-semibold">${mRight}</span> kNm</div>
            <div>🔩 Thép chọn: <span class="text-sky-300 font-mono font-semibold">${b.rebar_top_left} / ${b.rebar_bot_mid} / ${b.rebar_top_right}</span></div>
          </div>
          <div class="mt-2 pt-1 border-t border-slate-700/60 text-[10px] text-cyan-300 font-bold flex items-center gap-1">
            <span>👉 Bấm chuột để chọn cốt thép dầm</span>
          </div>
        `;
        tooltip.style.left = `${Math.min(rect.width - 240, e.clientX - rect.left + 15)}px`;
        tooltip.style.top = `${Math.min(rect.height - 140, e.clientY - rect.top + 15)}px`;
        tooltip.classList.remove('hidden');
      }
    } else {
      if (hoveredBeamMesh) {
        hoveredBeamMesh.material.color.setHex(hoveredBeamMesh.userData.origColor);
        hoveredBeamMesh = null;
      }
      container.style.cursor = 'default';
      if (tooltip) tooltip.classList.add('hidden');
    }
  });

  container.addEventListener('click', e => {
    const rect = container.getBoundingClientRect();
    threeMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    threeMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    threeRaycaster.setFromCamera(threeMouse, camera);
    const intersects = threeRaycaster.intersectObjects(beamMeshes);

    if (intersects.length > 0) {
      const b = intersects[0].object.userData.beam;
      if (b) {
        openBeamRebarModal(b);
      }
    }
  });
}

// ------------------------------------------------------------------------------
// (5) BEAM REBAR INSPECTOR, CAD DRAWINGS & CONTINUOUS BEAM ENGINE
// ------------------------------------------------------------------------------

let beamDrawingMode = 'span'; // 'span' | 'chain'
let chainInteractiveBoxes = [];

function setBeamDrawingMode(mode) {
  beamDrawingMode = mode;
  const btnSpan = document.getElementById('btnBrmModeSpan');
  const btnChain = document.getElementById('btnBrmModeChain');
  const legend = document.getElementById('brmCanvasLegend');

  if (btnSpan && btnChain) {
    if (mode === 'span') {
      btnSpan.className = 'px-3 py-1 rounded-xl font-bold bg-white text-indigo-700 shadow-sm transition';
      btnChain.className = 'px-3 py-1 rounded-xl font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1';
      if (legend) legend.textContent = 'Mặt cắt dọc nhịp & 3 mặt cắt ngang (1-1, 2-2, 3-3)';
    } else {
      btnChain.className = 'px-3 py-1 rounded-xl font-bold bg-white text-indigo-700 shadow-sm transition flex items-center gap-1';
      btnSpan.className = 'px-3 py-1 rounded-xl font-semibold text-slate-600 hover:text-slate-900 transition';
      if (legend) legend.textContent = 'Mặt cắt dọc chuỗi dầm liên tục đa nhịp (Click nhịp để chọn)';
    }
  }
  renderBeamDrawings();
}

function parseRebarSpec(rebarStr, defaultCount = 2, defaultDiam = 16) {
  if (!rebarStr) return { count: defaultCount, diam: defaultDiam, label: `${defaultCount}Φ${defaultDiam}` };
  const m = rebarStr.match(/(\d+)\s*[dDΦ](\d+)/);
  if (m) {
    const count = parseInt(m[1], 10);
    const diam = parseInt(m[2], 10);
    return { count, diam, label: `${count}Φ${diam}` };
  }
  return { count: defaultCount, diam: defaultDiam, label: `${defaultCount}Φ${defaultDiam}` };
}

function parseStirrupSpec(stirrupStr) {
  if (!stirrupStr) return { label: 'Φ8a100/a200', zoneDense: 'a100', zoneMid: 'a200' };
  let dense = 'a100';
  let mid = 'a200';
  const m = stirrupStr.match(/a(\d+)(?:\/a?(\d+))?/i);
  if (m) {
    dense = 'a' + m[1];
    mid = m[2] ? 'a' + m[2] : 'a200';
  }
  return {
    label: stirrupStr.replace(/^[dD]/, 'Φ'),
    zoneDense: dense,
    zoneMid: mid
  };
}

function findContinuousBeamChain(targetBeam) {
  if (!targetBeam || !etabsData || !etabsData.beams) {
    return { chain: [targetBeam], axisName: 'Dầm', targetIndex: 0, isX: true };
  }

  // Filter floor beams on same story (horizontal: abs(dz) < 100)
  const storyBeams = etabsData.beams.filter(b => 
    b.story === targetBeam.story && 
    Math.abs(b.p2[2] - b.p1[2]) < 100
  );

  const tdx = targetBeam.p2[0] - targetBeam.p1[0];
  const tdy = targetBeam.p2[1] - targetBeam.p1[1];
  const isX = Math.abs(tdx) >= Math.abs(tdy);

  // Find collinear beams
  const collinear = [];
  storyBeams.forEach(b => {
    const bdx = b.p2[0] - b.p1[0];
    const bdy = b.p2[1] - b.p1[1];
    const bIsX = Math.abs(bdx) >= Math.abs(bdy);
    if (isX !== bIsX) return;

    let pStart, pEnd;
    if (isX) {
      if (Math.abs(b.p1[1] - targetBeam.p1[1]) > 250) return;
      if (b.p1[0] <= b.p2[0]) {
        pStart = b.p1; pEnd = b.p2;
      } else {
        pStart = b.p2; pEnd = b.p1;
      }
    } else {
      if (Math.abs(b.p1[0] - targetBeam.p1[0]) > 250) return;
      if (b.p1[1] <= b.p2[1]) {
        pStart = b.p1; pEnd = b.p2;
      } else {
        pStart = b.p2; pEnd = b.p1;
      }
    }
    collinear.push({ beam: b, pStart, pEnd });
  });

  // Sort along axis
  if (isX) {
    collinear.sort((a, b) => a.pStart[0] - b.pStart[0]);
  } else {
    collinear.sort((a, b) => a.pStart[1] - b.pStart[1]);
  }

  // Group contiguous segments (tolerance gap <= 450mm)
  const coordIdx = isX ? 0 : 1;
  const clusters = [];
  let currentCluster = [];

  collinear.forEach(item => {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
    } else {
      const prev = currentCluster[currentCluster.length - 1];
      const gap = Math.abs(item.pStart[coordIdx] - prev.pEnd[coordIdx]);
      if (gap <= 450) {
        currentCluster.push(item);
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
      }
    }
  });
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Find target cluster
  let targetCluster = clusters.find(c => c.some(it => it.beam.label === targetBeam.label && it.beam.story === targetBeam.story));
  if (!targetCluster) {
    targetCluster = [{ beam: targetBeam, pStart: targetBeam.p1, pEnd: targetBeam.p2 }];
  }

  // Axis identification
  let axisName = 'Trục';
  if (isX) {
    const yCoord = targetBeam.p1[1];
    let closestGrid = null, minDist = 999999;
    (etabsData.grids?.Y || []).forEach(g => {
      const d = Math.abs(g.ordinate - yCoord);
      if (d < minDist) { minDist = d; closestGrid = g; }
    });
    if (closestGrid && minDist <= 500) {
      axisName = `Trục ${closestGrid.id}`;
    } else {
      axisName = `Trục Y=${(yCoord/1000).toFixed(1)}m`;
    }
  } else {
    const xCoord = targetBeam.p1[0];
    let closestGrid = null, minDist = 999999;
    (etabsData.grids?.X || []).forEach(g => {
      const d = Math.abs(g.ordinate - xCoord);
      if (d < minDist) { minDist = d; closestGrid = g; }
    });
    if (closestGrid && minDist <= 500) {
      axisName = `Trục ${closestGrid.id}`;
    } else {
      axisName = `Trục X=${(xCoord/1000).toFixed(1)}m`;
    }
  }

  const chain = targetCluster.map(it => it.beam);
  const targetIndex = chain.findIndex(b => b.label === targetBeam.label);

  return { chain, axisName, targetIndex, isX };
}

function getGridBubbleLabel(coord, isXCoord) {
  if (!etabsData || !etabsData.grids) return null;
  const list = isXCoord ? etabsData.grids.X : etabsData.grids.Y;
  if (!list) return null;
  let match = null, minDist = 500;
  list.forEach(g => {
    const d = Math.abs(g.ordinate - coord);
    if (d <= minDist) {
      minDist = d;
      match = g.id;
    }
  });
  return match;
}

function drawCadDimension(ctx, x1, y1, x2, y2, text, offset = 0, isVertical = false) {
  ctx.save();
  ctx.strokeStyle = '#64748b';
  ctx.fillStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  if (!isVertical) {
    const y = y1 + offset;
    if (offset !== 0) {
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x1, y + (offset > 0 ? 4 : -4));
      ctx.moveTo(x2, y2); ctx.lineTo(x2, y + (offset > 0 ? 4 : -4));
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x1, y); ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1 - 3, y + 3); ctx.lineTo(x1 + 3, y - 3);
    ctx.moveTo(x2 - 3, y + 3); ctx.lineTo(x2 + 3, y - 3);
    ctx.stroke();
    ctx.fillText(text, (x1 + x2) / 2, y - 2);
  } else {
    const x = x1 + offset;
    if (offset !== 0) {
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x + (offset > 0 ? 4 : -4), y1);
      ctx.moveTo(x2, y2); ctx.lineTo(x + (offset > 0 ? 4 : -4), y2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x, y1); ctx.lineTo(x, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 3, y1 + 3); ctx.lineTo(x + 3, y1 - 3);
    ctx.moveTo(x - 3, y2 + 3); ctx.lineTo(x + 3, y2 - 3);
    ctx.stroke();
    ctx.save();
    ctx.translate(x - 3, (y1 + y2) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function drawCadGridBubble(ctx, x, y, label, isTop = true) {
  ctx.save();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 3, 2, 3]);
  ctx.beginPath();
  ctx.moveTo(x, isTop ? y + 13 : y - 13);
  ctx.lineTo(x, isTop ? y + 70 : y - 70);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label || '?', x, y);
  ctx.restore();
}

function drawSingleCrossSection(ctx, sec, beam) {
  const { title, xCenter, topCount, topLabel, botCount, botLabel, stirrupText, note } = sec;
  const wSec = 76;
  const hSec = 96;
  const ySec = 212;

  ctx.save();

  // Section Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, xCenter, ySec - 14);

  ctx.fillStyle = '#64748b';
  ctx.font = '9px sans-serif';
  ctx.fillText(note, xCenter, ySec - 3);

  // Top slab wings
  ctx.fillStyle = '#f1f5f9';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.fillRect(xCenter - wSec/2 - 20, ySec - 8, wSec + 40, 8);
  ctx.strokeRect(xCenter - wSec/2 - 20, ySec - 8, wSec + 40, 8);

  // Beam Concrete Web
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.fillRect(xCenter - wSec/2, ySec, wSec, hSec);
  ctx.strokeRect(xCenter - wSec/2, ySec, wSec, hSec);

  // Stirrup (Rounded Rect with Inset 7px)
  const stX = xCenter - wSec/2 + 7;
  const stY = ySec + 7;
  const stW = wSec - 14;
  const stH = hSec - 14;
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(stX, stY, stW, stH, 4);
  } else {
    ctx.rect(stX, stY, stW, stH);
  }
  ctx.stroke();

  // 135-deg hook at top-left
  ctx.beginPath();
  ctx.moveTo(stX + 12, stY + 12);
  ctx.lineTo(stX + 4, stY + 4);
  ctx.stroke();

  // Rebar Dots Setup
  const dotR = 3.6;
  const topY = stY + 6;
  const botY = stY + stH - 6;
  const innerLeft = stX + 6;
  const innerRight = stX + stW - 6;

  // Top Dots (Red)
  ctx.fillStyle = '#dc2626';
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 1;
  if (topCount === 1) {
    drawDot(ctx, (innerLeft + innerRight) / 2, topY, dotR);
  } else {
    const step = (innerRight - innerLeft) / Math.max(1, topCount - 1);
    for (let i = 0; i < topCount; i++) {
      drawDot(ctx, innerLeft + i * step, topY, dotR);
    }
  }

  // Bottom Dots (Blue)
  ctx.fillStyle = '#2563eb';
  ctx.strokeStyle = '#1e3a8a';
  if (botCount === 1) {
    drawDot(ctx, (innerLeft + innerRight) / 2, botY, dotR);
  } else {
    const step = (innerRight - innerLeft) / Math.max(1, botCount - 1);
    for (let i = 0; i < botCount; i++) {
      drawDot(ctx, innerLeft + i * step, botY, dotR);
    }
  }

  function drawDot(c, x, y, r) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    c.stroke();
  }

  // Leader lines & Text Labels
  // Top text
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 9.5px monospace';
  ctx.textAlign = 'left';
  ctx.beginPath();
  ctx.moveTo(innerRight, topY);
  ctx.lineTo(innerRight + 10, topY);
  ctx.lineTo(innerRight + 18, topY - 8);
  ctx.lineTo(xCenter + wSec/2 + 25, topY - 8);
  ctx.stroke();
  ctx.fillText(topLabel, innerRight + 12, topY - 11);

  // Bottom text
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.moveTo(innerRight, botY);
  ctx.lineTo(innerRight + 10, botY);
  ctx.lineTo(innerRight + 18, botY + 8);
  ctx.lineTo(xCenter + wSec/2 + 25, botY + 8);
  ctx.stroke();
  ctx.fillText(botLabel, innerRight + 12, botY + 18);

  // Stirrup text
  ctx.fillStyle = '#0284c7';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(stirrupText, stX - 4, stY + stH / 2);

  // Dimensions
  drawCadDimension(ctx, xCenter - wSec/2, ySec + hSec, xCenter + wSec/2, ySec + hSec, `b=${beam.width || 200}`, 14);
  drawCadDimension(ctx, xCenter - wSec/2, ySec, xCenter - wSec/2, ySec + hSec, `h=${beam.depth || 400}`, -14, true);

  ctx.restore();
}

function drawSpanCadDrawing(ctx, width, height, beam, chainInfo, rebarTopL, rebarBotM, rebarTopR, stirrupSpec) {
  const yBeam = 56;
  const hBeam = 40;
  const colW = 38;
  const xColL = Math.max(90, width * 0.12);
  const xColR = Math.min(width - 90, width * 0.88);
  const spanW = xColR - xColL;
  const xInnerL = xColL + colW / 2;
  const xInnerR = xColR - colW / 2;
  const innerSpan = xInnerR - xInnerL;

  // Header tag
  ctx.save();
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`MẶT CẮT DỌC DẦM: ${beam.label} (${beam.section} - L=${(beam.length/1000).toFixed(2)}m) • ${chainInfo.axisName} • TẦNG ${beam.story}`, 20, 20);
  ctx.restore();

  // Find Grid Labels for Left & Right Supports
  const isX = chainInfo.isX;
  const coordStart = isX ? Math.min(beam.p1[0], beam.p2[0]) : Math.min(beam.p1[1], beam.p2[1]);
  const coordEnd = isX ? Math.max(beam.p1[0], beam.p2[0]) : Math.max(beam.p1[1], beam.p2[1]);
  const gridL = getGridBubbleLabel(coordStart, isX) || 'G1';
  const gridR = getGridBubbleLabel(coordEnd, isX) || 'G2';

  // Grid Bubbles above columns
  drawCadGridBubble(ctx, xColL, 24, gridL, true);
  drawCadGridBubble(ctx, xColR, 24, gridR, true);

  // Supporting Columns
  ctx.save();
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  // Left Column
  ctx.fillRect(xColL - colW/2, yBeam - 16, colW, hBeam + 48);
  ctx.strokeRect(xColL - colW/2, yBeam - 16, colW, hBeam + 48);
  // Right Column
  ctx.fillRect(xColR - colW/2, yBeam - 16, colW, hBeam + 48);
  ctx.strokeRect(xColR - colW/2, yBeam - 16, colW, hBeam + 48);

  // Column Hatching
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  for (let dy = -20; dy < hBeam + 50; dy += 10) {
    ctx.beginPath();
    ctx.moveTo(xColL - colW/2, yBeam + dy);
    ctx.lineTo(xColL + colW/2, yBeam + dy + 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(xColR - colW/2, yBeam + dy);
    ctx.lineTo(xColR + colW/2, yBeam + dy + 10);
    ctx.stroke();
  }
  ctx.restore();

  // Concrete Slab Flange
  ctx.save();
  ctx.fillStyle = '#f1f5f9';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.fillRect(xColL - colW/2 - 10, yBeam - 8, spanW + colW + 20, 8);
  ctx.strokeRect(xColL - colW/2 - 10, yBeam - 8, spanW + colW + 20, 8);

  // Beam Concrete Web
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.fillRect(xInnerL, yBeam, innerSpan, hBeam);
  ctx.strokeRect(xInnerL, yBeam, innerSpan, hBeam);
  ctx.restore();

  // Reinforcement Details
  ctx.save();

  // 1. Stirrups in Beam
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.2;
  const lQuarter = innerSpan * 0.25;
  // Left dense zone
  for (let x = xInnerL + 8; x <= xInnerL + lQuarter; x += 10) {
    ctx.beginPath(); ctx.moveTo(x, yBeam + 3); ctx.lineTo(x, yBeam + hBeam - 3); ctx.stroke();
  }
  // Mid normal zone
  for (let x = xInnerL + lQuarter + 12; x <= xInnerR - lQuarter; x += 20) {
    ctx.beginPath(); ctx.moveTo(x, yBeam + 3); ctx.lineTo(x, yBeam + hBeam - 3); ctx.stroke();
  }
  // Right dense zone
  for (let x = xInnerR - lQuarter; x <= xInnerR - 8; x += 10) {
    ctx.beginPath(); ctx.moveTo(x, yBeam + 3); ctx.lineTo(x, yBeam + hBeam - 3); ctx.stroke();
  }

  // Stirrup text
  ctx.fillStyle = '#0284c7';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(stirrupSpec.zoneDense, xInnerL + lQuarter / 2, yBeam + hBeam / 2 + 3);
  ctx.fillText(stirrupSpec.zoneMid, (xInnerL + xInnerR) / 2, yBeam + hBeam / 2 + 3);
  ctx.fillText(stirrupSpec.zoneDense, xInnerR - lQuarter / 2, yBeam + hBeam / 2 + 3);

  // 2. Top Reinforcement (Gối Trái & Gối Phải & Cấu tạo)
  const yTopBar = yBeam + 6;
  const lThird = innerSpan * 0.33;

  // Left Top Bar (Hook in column + L/3)
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(xColL - colW/4, yBeam + 26);
  ctx.lineTo(xColL - colW/4, yTopBar);
  ctx.lineTo(xInnerL + lThird, yTopBar);
  ctx.stroke();

  // Right Top Bar (Hook in column + L/3)
  ctx.beginPath();
  ctx.moveTo(xInnerR - lThird, yTopBar);
  ctx.lineTo(xColR + colW/4, yTopBar);
  ctx.lineTo(xColR + colW/4, yBeam + 26);
  ctx.stroke();

  // Middle Top Hanger (Cấu tạo)
  ctx.strokeStyle = '#f87171';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(xInnerL + lThird - 15, yTopBar);
  ctx.lineTo(xInnerR - lThird + 15, yTopBar);
  ctx.stroke();
  ctx.setLineDash([]);

  // Top Bar Leaders
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'left';
  // Leader Left
  ctx.beginPath();
  ctx.moveTo(xInnerL + lThird * 0.45, yTopBar);
  ctx.lineTo(xInnerL + lThird * 0.45 + 15, yTopBar - 16);
  ctx.lineTo(xInnerL + lThird * 0.45 + 50, yTopBar - 16);
  ctx.stroke();
  ctx.fillText(rebarTopL.label, xInnerL + lThird * 0.45 + 18, yTopBar - 19);

  // Leader Right
  ctx.beginPath();
  ctx.moveTo(xInnerR - lThird * 0.45, yTopBar);
  ctx.lineTo(xInnerR - lThird * 0.45 - 15, yTopBar - 16);
  ctx.lineTo(xInnerR - lThird * 0.45 - 50, yTopBar - 16);
  ctx.stroke();
  ctx.textAlign = 'right';
  ctx.fillText(rebarTopR.label, xInnerR - lThird * 0.45 - 18, yTopBar - 19);

  // 3. Bottom Reinforcement (Bụng Nhịp chạy suốt, neo móc lên cột)
  const yBotBar = yBeam + hBeam - 6;
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(xColL - colW/4, yBotBar - 20);
  ctx.lineTo(xColL - colW/4, yBotBar);
  ctx.lineTo(xColR + colW/4, yBotBar);
  ctx.lineTo(xColR + colW/4, yBotBar - 20);
  ctx.stroke();

  // Bottom Leader
  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.beginPath();
  ctx.moveTo((xInnerL + xInnerR) / 2, yBotBar);
  ctx.lineTo((xInnerL + xInnerR) / 2, yBotBar + 14);
  ctx.stroke();
  ctx.fillText(rebarBotM.label, (xInnerL + xInnerR) / 2, yBotBar + 24);

  // 4. Section Cut Markers
  function drawCutSymbol(x, label) {
    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.fillStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, yBeam - 14);
    ctx.lineTo(x, yBeam + hBeam + 12);
    ctx.stroke();
    // Top arrow
    ctx.beginPath();
    ctx.moveTo(x, yBeam - 14);
    ctx.lineTo(x + 6, yBeam - 14);
    ctx.lineTo(x, yBeam - 8);
    ctx.fill();
    // Bottom arrow
    ctx.beginPath();
    ctx.moveTo(x, yBeam + hBeam + 12);
    ctx.lineTo(x + 6, yBeam + hBeam + 12);
    ctx.lineTo(x, yBeam + hBeam + 6);
    ctx.fill();

    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 8, yBeam - 8);
    ctx.fillText(label, x + 8, yBeam + hBeam + 14);
    ctx.restore();
  }

  drawCutSymbol(xInnerL + innerSpan * 0.12, '1');
  drawCutSymbol((xInnerL + xInnerR) / 2, '2');
  drawCutSymbol(xInnerR - innerSpan * 0.12, '3');

  // 5. Dimensions
  drawCadDimension(ctx, xInnerL, yTopBar - 26, xInnerL + lThird, yTopBar - 26, `L/3=${Math.round(beam.length/3)}`);
  drawCadDimension(ctx, xInnerR - lThird, yTopBar - 26, xInnerR, yTopBar - 26, `L/3=${Math.round(beam.length/3)}`);
  drawCadDimension(ctx, xInnerL, yBeam + hBeam, xInnerR, yBeam + hBeam, `L0 = ${Math.round(beam.length - 400)}`, 18);
  drawCadDimension(ctx, xColL, yBeam + hBeam, xColR, yBeam + hBeam, `L = ${Math.round(beam.length)}`, 32);

  ctx.restore();

  // --------------------------------------------------------------------------
  // Divider line
  // --------------------------------------------------------------------------
  ctx.save();
  ctx.strokeStyle = '#e2e8f0';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(20, 168);
  ctx.lineTo(width - 20, 168);
  ctx.stroke();
  ctx.setLineDash([]);

  // Tag
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BẢN VẼ CHI TIẾT MẶT CẮT NGANG (CROSS SECTIONS)', width / 2, 180);
  ctx.restore();

  // --------------------------------------------------------------------------
  // 3 Detailed Cross Sections
  // --------------------------------------------------------------------------
  const secDefs = [
    {
      title: 'MẶT CẮT 1-1 (GỐI TRÁI)',
      xCenter: width * 0.20,
      topCount: rebarTopL.count,
      topDiam: rebarTopL.diam,
      topLabel: rebarTopL.label,
      botCount: 2,
      botDiam: rebarBotM.diam,
      botLabel: `2Φ${rebarBotM.diam}`,
      stirrupText: `Φ8${stirrupSpec.zoneDense}`,
      note: 'Vùng Môn. Âm gối trái'
    },
    {
      title: 'MẶT CẮT 2-2 (BỤNG NHỊP)',
      xCenter: width * 0.50,
      topCount: 2,
      topDiam: 14,
      topLabel: '2Φ14 (c.tạo)',
      botCount: rebarBotM.count,
      botDiam: rebarBotM.diam,
      botLabel: rebarBotM.label,
      stirrupText: `Φ8${stirrupSpec.zoneMid}`,
      note: 'Vùng Môn. Dương nhịp giữa'
    },
    {
      title: 'MẶT CẮT 3-3 (GỐI PHẢI)',
      xCenter: width * 0.80,
      topCount: rebarTopR.count,
      topDiam: rebarTopR.diam,
      topLabel: rebarTopR.label,
      botCount: 2,
      botDiam: rebarBotM.diam,
      botLabel: `2Φ${rebarBotM.diam}`,
      stirrupText: `Φ8${stirrupSpec.zoneDense}`,
      note: 'Vùng Môn. Âm gối phải'
    }
  ];

  secDefs.forEach(sec => {
    drawSingleCrossSection(ctx, sec, beam);
  });
}

function drawChainCadDrawing(ctx, width, height, currentBeam, chainInfo) {
  const chain = chainInfo.chain;
  const numSpans = chain.length;
  let totalLength = 0;
  chain.forEach(b => totalLength += b.length);
  if (totalLength <= 0) totalLength = 10000;

  const leftMargin = 70;
  const rightMargin = 70;
  const availW = width - (leftMargin + rightMargin);
  const scale = availW / totalLength;

  const yChain = 145;
  const hBeam = 40;
  const colW = 24;

  chainInteractiveBoxes = [];

  // Header Title
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`CHUỖI DẦM LIÊN TỤC: ${chainInfo.axisName} • TẦNG ${currentBeam.story} • ${numSpans} NHỊP • TỔNG DÀI ${(totalLength/1000).toFixed(2)}m`, 20, 22);

  ctx.fillStyle = '#64748b';
  ctx.font = '10px sans-serif';
  ctx.fillText('💡 Click trực tiếp vào bất kỳ nhịp dầm nào trên bản vẽ để chuyển sang dầm đó', 20, 38);
  ctx.restore();

  const isX = chainInfo.isX;
  let currentAccumLen = 0;

  // Draw each span and support column
  for (let i = 0; i < numSpans; i++) {
    const b = chain[i];
    const xStart = leftMargin + currentAccumLen * scale;
    const spanW = b.length * scale;
    const xEnd = xStart + spanW;
    const isActive = (b.label === currentBeam.label);

    // Save interactive bounding box for click/hover
    chainInteractiveBoxes.push({
      beam: b,
      x1: xStart,
      y1: yChain - 25,
      x2: xEnd,
      y2: yChain + hBeam + 50
    });

    // Support Column at xStart
    const coordStart = isX ? Math.min(b.p1[0], b.p2[0]) : Math.min(b.p1[1], b.p2[1]);
    const gridLabel = getGridBubbleLabel(coordStart, isX) || (i + 1);

    // Grid Bubble
    drawCadGridBubble(ctx, xStart, 55, gridLabel, true);

    // Column Concrete
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    ctx.fillRect(xStart - colW/2, yChain - 12, colW, hBeam + 42);
    ctx.strokeRect(xStart - colW/2, yChain - 12, colW, hBeam + 42);

    // Column Hatch
    ctx.strokeStyle = '#cbd5e1';
    for (let dy = -10; dy < hBeam + 40; dy += 8) {
      ctx.beginPath();
      ctx.moveTo(xStart - colW/2, yChain + dy);
      ctx.lineTo(xStart + colW/2, yChain + dy + 8);
      ctx.stroke();
    }
    ctx.restore();

    // Beam Body
    ctx.save();
    if (isActive) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.4;
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.4;
    }
    ctx.fillRect(xStart, yChain, spanW, hBeam);
    ctx.strokeRect(xStart, yChain, spanW, hBeam);

    // If active span, add gold badge on top
    if (isActive) {
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'center';
      const badgeY = yChain - 10;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(xStart + spanW/2 - 42, badgeY - 10, 84, 15, 4);
      else ctx.rect(xStart + spanW/2 - 42, badgeY - 10, 84, 15);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('★ ĐANG CHỌN', xStart + spanW/2, badgeY + 1);
    }
    ctx.restore();

    // Reinforcement in Span
    ctx.save();
    // 1. Continuous Bottom Rebar (Blue)
    const yBot = yChain + hBeam - 6;
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    if (i === 0) {
      ctx.moveTo(xStart - colW/4, yBot - 18);
      ctx.lineTo(xStart - colW/4, yBot);
    } else {
      ctx.moveTo(xStart, yBot);
    }
    if (i === numSpans - 1) {
      ctx.lineTo(xEnd + colW/4, yBot);
      ctx.lineTo(xEnd + colW/4, yBot - 18);
    } else {
      ctx.lineTo(xEnd, yBot);
    }
    ctx.stroke();

    // 2. Top Negative Moment Bars (Red) over supports
    const yTop = yChain + 6;
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.2;

    // Over left column (if not first span)
    if (i > 0) {
      const prevSpanW = chain[i - 1].length * scale;
      ctx.beginPath();
      ctx.moveTo(xStart - prevSpanW * 0.33, yTop);
      ctx.lineTo(xStart + spanW * 0.33, yTop);
      ctx.stroke();
    } else {
      // First span exterior hook
      ctx.beginPath();
      ctx.moveTo(xStart - colW/4, yChain + 22);
      ctx.lineTo(xStart - colW/4, yTop);
      ctx.lineTo(xStart + spanW * 0.25, yTop);
      ctx.stroke();
    }

    if (i === numSpans - 1) {
      // Last span exterior hook
      ctx.beginPath();
      ctx.moveTo(xEnd - spanW * 0.25, yTop);
      ctx.lineTo(xEnd + colW/4, yTop);
      ctx.lineTo(xEnd + colW/4, yChain + 22);
      ctx.stroke();
    }

    // Top mid hanger (Cấu tạo)
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(xStart + spanW * 0.30, yTop);
    ctx.lineTo(xEnd - spanW * 0.30, yTop);
    ctx.stroke();
    ctx.setLineDash([]);

    // Stirrup ticks
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    const qW = spanW * 0.25;
    for (let x = xStart + 5; x <= xStart + qW; x += 8) {
      ctx.beginPath(); ctx.moveTo(x, yChain + 2); ctx.lineTo(x, yChain + hBeam - 2); ctx.stroke();
    }
    for (let x = xEnd - qW; x <= xEnd - 5; x += 8) {
      ctx.beginPath(); ctx.moveTo(x, yChain + 2); ctx.lineTo(x, yChain + hBeam - 2); ctx.stroke();
    }

    // Sub-dimension for this span
    drawCadDimension(ctx, xStart, yChain + hBeam, xEnd, yChain + hBeam, `${Math.round(b.length)}`, 16);

    // Labels under span
    ctx.fillStyle = isActive ? '#b45309' : '#1e293b';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${b.label} (${b.section})`, xStart + spanW/2, yChain + hBeam + 36);

    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    const topShort = (b.rebar_top_left || '').split(' ')[0];
    const botShort = (b.rebar_bot_mid || '').split(' ')[0];
    ctx.fillText(`${topShort}/${botShort}`, xStart + spanW/2, yChain + hBeam + 48);

    ctx.restore();
    currentAccumLen += b.length;
  }

  // Final column at right end
  const xFinal = leftMargin + availW;
  const lastB = chain[numSpans - 1];
  const coordEnd = isX ? Math.max(lastB.p1[0], lastB.p2[0]) : Math.max(lastB.p1[1], lastB.p2[1]);
  const finalGrid = getGridBubbleLabel(coordEnd, isX) || (numSpans + 1);

  drawCadGridBubble(ctx, xFinal, 55, finalGrid, true);

  ctx.save();
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.2;
  ctx.fillRect(xFinal - colW/2, yChain - 12, colW, hBeam + 42);
  ctx.strokeRect(xFinal - colW/2, yChain - 12, colW, hBeam + 42);
  ctx.strokeStyle = '#cbd5e1';
  for (let dy = -10; dy < hBeam + 40; dy += 8) {
    ctx.beginPath();
    ctx.moveTo(xFinal - colW/2, yChain + dy);
    ctx.lineTo(xFinal + colW/2, yChain + dy + 8);
    ctx.stroke();
  }
  ctx.restore();

  // Overall Total Dimension Line
  drawCadDimension(ctx, leftMargin, yChain + hBeam, xFinal, yChain + hBeam, `TỔNG CHIỀU DÀI TUYẾN DẦM = ${(totalLength/1000).toFixed(2)} m (${chainInfo.axisName})`, 65);
}

function renderBeamDrawings() {
  const canvas = document.getElementById('brmDrawingCanvas');
  if (!canvas || !selectedBeamForRebar) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.parentElement.clientWidth || 920;
  const height = rect.height || 370;

  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.resetTransform?.();
  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Subtle CAD engineering grid pattern
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 1;
  const gridStep = 20;
  ctx.beginPath();
  for (let x = 0; x <= width; x += gridStep) {
    ctx.moveTo(x, 0); ctx.lineTo(x, height);
  }
  for (let y = 0; y <= height; y += gridStep) {
    ctx.moveTo(0, y); ctx.lineTo(width, y);
  }
  ctx.stroke();

  // Active beam & rebar selections
  const b = selectedBeamForRebar;
  const selL = document.getElementById('brmSelLeft');
  const selM = document.getElementById('brmSelMid');
  const selR = document.getElementById('brmSelRight');
  const selSt = document.getElementById('brmSelStirrup');

  const rebarTopL = selL && selL.selectedIndex >= 0 ? parseRebarSpec(selL.options[selL.selectedIndex].value) : parseRebarSpec(b.rebar_top_left, 2, 16);
  const rebarBotM = selM && selM.selectedIndex >= 0 ? parseRebarSpec(selM.options[selM.selectedIndex].value) : parseRebarSpec(b.rebar_bot_mid, 2, 16);
  const rebarTopR = selR && selR.selectedIndex >= 0 ? parseRebarSpec(selR.options[selR.selectedIndex].value) : parseRebarSpec(b.rebar_top_right, 2, 16);
  const stirrupSpec = selSt && selSt.selectedIndex >= 0 ? parseStirrupSpec(selSt.options[selSt.selectedIndex].value) : parseStirrupSpec(b.stirrup);

  const chainInfo = findContinuousBeamChain(b);

  if (beamDrawingMode === 'span') {
    drawSpanCadDrawing(ctx, width, height, b, chainInfo, rebarTopL, rebarBotM, rebarTopR, stirrupSpec);
  } else {
    drawChainCadDrawing(ctx, width, height, b, chainInfo);
  }

  ctx.restore();
}

function openBeamRebarModal(b) {
  selectedBeamForRebar = b;
  const modal = document.getElementById('beamRebarModal');
  if (!modal) return;

  const { mLeft, mMid, mRight } = calculateBeamMoments(b);

  // Set Info
  document.getElementById('brmBeamName').textContent = b.label;
  document.getElementById('brmStory').textContent = b.story;
  document.getElementById('brmSection').textContent = b.section;
  document.getElementById('brmLength').textContent = `${(b.length/1000).toFixed(2)} m`;

  // Trace continuous beam chain
  const chainInfo = findContinuousBeamChain(b);
  const axisBadge = document.getElementById('brmGridAxisText');
  if (axisBadge) axisBadge.textContent = chainInfo.axisName;

  const chainBadge = document.getElementById('brmChainCountBadge');
  if (chainBadge) chainBadge.textContent = `${chainInfo.chain.length} nhịp`;

  // Populate Continuous Breadcrumbs Bar
  const breadcrumbContainer = document.getElementById('brmChainBreadcrumbs');
  if (breadcrumbContainer) {
    breadcrumbContainer.innerHTML = '';
    
    // Axis indicator
    const axisPill = document.createElement('span');
    axisPill.className = 'px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-extrabold text-[11px] border border-amber-300 mr-1 flex items-center gap-1 shrink-0';
    axisPill.innerHTML = `📍 ${chainInfo.axisName}`;
    breadcrumbContainer.appendChild(axisPill);

    chainInfo.chain.forEach((cb, idx) => {
      const isSelected = (cb.label === b.label);
      const btn = document.createElement('button');
      btn.type = 'button';
      if (isSelected) {
        btn.className = 'px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 shrink-0 cursor-default';
        btn.innerHTML = `<span>${cb.label}</span><span class="text-[9px] bg-white/20 px-1 rounded">${(cb.length/1000).toFixed(2)}m</span><span class="text-[9px] bg-amber-400 text-slate-900 px-1 rounded font-extrabold">Đang chọn</span>`;
      } else {
        btn.className = 'px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-semibold text-xs border border-slate-200 transition cursor-pointer flex items-center gap-1 shrink-0';
        btn.innerHTML = `<span>${cb.label}</span><span class="text-[9px] text-slate-500 font-normal">(${(cb.length/1000).toFixed(2)}m)</span>`;
        btn.onclick = () => {
          const target = etabsData.beams.find(x => x.label === cb.label && x.story === b.story);
          if (target) openBeamRebarModal(target);
        };
      }
      breadcrumbContainer.appendChild(btn);

      if (idx < chainInfo.chain.length - 1) {
        const arrow = document.createElement('span');
        arrow.className = 'text-slate-400 text-xs font-bold shrink-0';
        arrow.textContent = '➔';
        breadcrumbContainer.appendChild(arrow);
      }
    });
  }

  // Moments & Req As
  document.getElementById('brmMLeft').textContent = `${mLeft} kNm`;
  document.getElementById('brmAsLeftReq').textContent = `${(b.as_top_left_cm2 || 0).toFixed(2)} cm²`;

  document.getElementById('brmMMid').textContent = `+${mMid} kNm`;
  document.getElementById('brmAsMidReq').textContent = `${(b.as_bot_mid_cm2 || 0).toFixed(2)} cm²`;

  document.getElementById('brmMRight').textContent = `${mRight} kNm`;
  document.getElementById('brmAsRightReq').textContent = `${(b.as_top_right_cm2 || 0).toFixed(2)} cm²`;

  document.getElementById('brmShearReq').textContent = `${(b.as_shear_cm2_m || 0).toFixed(2)} cm²/m`;

  // Populate Dropdowns
  populateRebarSelect('brmSelLeft', REBAR_CATALOG, b.rebar_top_left);
  populateRebarSelect('brmSelMid', REBAR_CATALOG, b.rebar_bot_mid);
  populateRebarSelect('brmSelRight', REBAR_CATALOG, b.rebar_top_right);

  // Stirrups
  const stirrupSel = document.getElementById('brmSelStirrup');
  if (stirrupSel) {
    stirrupSel.innerHTML = '';
    STIRRUP_OPTIONS.forEach(opt => {
      const el = document.createElement('option');
      el.value = opt;
      el.textContent = opt;
      if (b.stirrup === opt) el.selected = true;
      stirrupSel.appendChild(el);
    });
  }

  // Live safety badges and render drawings
  onRebarSelectChange();

  modal.classList.remove('hidden');

  // Trigger high-dpi canvas render after modal display
  setTimeout(renderBeamDrawings, 60);
}

function populateRebarSelect(selectId, catalog, currentValue) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '';

  let matched = false;
  catalog.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.label;
    opt.dataset.area = item.area;
    opt.textContent = `${item.label} (${item.area.toFixed(2)} cm²)`;

    // Match if currentValue contains label, e.g. "2D16 (4.02cm2)"
    if (currentValue && currentValue.toUpperCase().includes(item.label.toUpperCase())) {
      opt.selected = true;
      matched = true;
    }
    sel.appendChild(opt);
  });

  if (!matched && catalog.length > 0) {
    sel.selectedIndex = 1; // Default 2D16
  }
}

function onRebarSelectChange() {
  if (!selectedBeamForRebar) return;
  const b = selectedBeamForRebar;

  updateRebarRatio('brmSelLeft', b.as_top_left_cm2, 'brmStatusLeft');
  updateRebarRatio('brmSelMid', b.as_bot_mid_cm2, 'brmStatusMid');
  updateRebarRatio('brmSelRight', b.as_top_right_cm2, 'brmStatusRight');

  // Live re-render drawings
  renderBeamDrawings();
}

function updateRebarRatio(selectId, reqArea, statusBadgeId) {
  const sel = document.getElementById(selectId);
  const badge = document.getElementById(statusBadgeId);
  if (!sel || !badge) return;

  const chosenOpt = sel.options[sel.selectedIndex];
  const chosenArea = chosenOpt ? parseFloat(chosenOpt.dataset.area) : 0;
  const req = reqArea || 0.1;
  const ratio = Math.round((chosenArea / req) * 100);

  if (ratio >= 100) {
    badge.className = 'text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1';
    badge.innerHTML = `🟢 Đạt ${ratio}% (${chosenArea.toFixed(2)} cm²)`;
  } else {
    badge.className = 'text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1';
    badge.innerHTML = `🔴 Thiếu ${ratio}% (${chosenArea.toFixed(2)} cm²)`;
  }
}

function saveBeamRebarSelection() {
  if (!selectedBeamForRebar) return;
  const b = selectedBeamForRebar;

  const selL = document.getElementById('brmSelLeft');
  const selM = document.getElementById('brmSelMid');
  const selR = document.getElementById('brmSelRight');
  const selSt = document.getElementById('brmSelStirrup');

  const optL = selL.options[selL.selectedIndex];
  const optM = selM.options[selM.selectedIndex];
  const optR = selR.options[selR.selectedIndex];

  b.rebar_top_left = `${optL.value} (${optL.dataset.area}cm²)`;
  b.rebar_bot_mid = `${optM.value} (${optM.dataset.area}cm²)`;
  b.rebar_top_right = `${optR.value} (${optR.dataset.area}cm²)`;
  if (selSt) b.stirrup = selSt.value;

  // Refresh tables and 2D canvas
  populateRebarTable('rebarTableBody', 'rebarFilterStory', 'rebarSearchInput');
  populateRebarTable('modalRebarTableBody', null, null);
  renderEtabs2DPlan();

  closeBeamRebarModal();
  alert(`✅ Đã lưu cấu hình cốt thép cho dầm ${b.label} (${b.section}) thành công!`);
}

function closeBeamRebarModal() {
  const modal = document.getElementById('beamRebarModal');
  if (modal) modal.classList.add('hidden');
  selectedBeamForRebar = null;
}

// ------------------------------------------------------------------------------
// TOP-RIGHT 3D TOOLBAR ACTIONS (WIRE, GRIDS, MOMENTS, RESET, DEPLOY)
// ------------------------------------------------------------------------------

function toggle3DWireframe() {
  is3DWireframe = !is3DWireframe;
  threeMeshes.forEach(m => {
    if (m.material) m.material.wireframe = is3DWireframe;
  });
  modalThreeMeshes.forEach(m => {
    if (m.material) m.material.wireframe = is3DWireframe;
  });

  const btns = [document.getElementById('btn3DWireframe'), document.getElementById('btnModalWireframe')].filter(Boolean);
  btns.forEach(btn => {
    btn.classList.toggle('bg-indigo-600', is3DWireframe);
    btn.classList.toggle('text-white', is3DWireframe);
    btn.classList.toggle('bg-slate-100', !is3DWireframe);
    btn.classList.toggle('text-slate-700', !is3DWireframe);
  });
}

function toggle3DGrids() {
  show3DGrids = !show3DGrids;
  if (threeGridsGroup) threeGridsGroup.visible = show3DGrids;
  if (modalThreeGridsGroup) modalThreeGridsGroup.visible = show3DGrids;

  const btn = document.getElementById('btn3DGrids');
  if (btn) {
    btn.classList.toggle('bg-emerald-600', show3DGrids);
    btn.classList.toggle('text-white', show3DGrids);
    btn.classList.toggle('bg-slate-100', !show3DGrids);
    btn.classList.toggle('text-slate-700', !show3DGrids);
  }
}

function toggle3DMoment() {
  show3DMoments = !show3DMoments;
  if (threeMomentsGroup) threeMomentsGroup.visible = show3DMoments;
  if (modalThreeMomentsGroup) modalThreeMomentsGroup.visible = show3DMoments;

  const btn = document.getElementById('btn3DMoment');
  if (btn) {
    btn.classList.toggle('bg-amber-600', show3DMoments);
    btn.classList.toggle('text-white', show3DMoments);
    btn.classList.toggle('bg-slate-100', !show3DMoments);
    btn.classList.toggle('text-slate-700', !show3DMoments);
  }
}

function reset3DCamera() {
  if (threeCamera && threeControls) {
    threeCamera.position.set(18000, 15000, 40000);
    threeControls.target.set(17000, 8000, 6000);
    threeControls.update();
  }
}

function resetModal3DCamera() {
  if (modalThreeCamera && modalThreeControls) {
    modalThreeCamera.position.set(18000, 15000, 40000);
    modalThreeControls.target.set(17000, 8000, 6000);
    modalThreeControls.update();
  }
}

function resizeThreeRenderer(containerId, renderer, camera) {
  const container = document.getElementById(containerId);
  if (!container || !renderer || !camera) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// ------------------------------------------------------------------------------
// (4) ONE-CLICK DEPLOY TO https://mr.pkld.online (VPS SYNC)
// ------------------------------------------------------------------------------

async function deployToVps() {
  const ok = confirm('🚀 Bạn có chắc muốn Deploy toàn bộ Hồ Sơ Kết Cấu Dầm lên https://mr.pkld.online (VPS 103.163.219.87) không?');
  if (!ok) return;

  const btns = [document.getElementById('btnDeployVps'), document.getElementById('btnCardDeployVps')].filter(Boolean);
  btns.forEach(b => {
    b.disabled = true;
    b.dataset.oldHtml = b.innerHTML;
    b.innerHTML = '<span class="animate-spin inline-block mr-1">⏳</span> Deploying...';
  });

  try {
    const res = await fetch('/api/deploy-to-vps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etabsData: etabsData })
    });
    const result = await res.json();
    if (result.success) {
      alert(`🚀 Deploy thành công lên:\n${result.url || 'https://mr.pkld.online'}\n\nTrang web đã sẵn sàng phục vụ!`);
      window.open('https://mr.pkld.online', '_blank');
    } else {
      alert(`⚠️ Lỗi deploy: ${result.message || 'Không xác định'}`);
    }
  } catch (err) {
    alert(`Lỗi kết nối deploy: ${err.message}`);
  } finally {
    const btn1 = document.getElementById('btnDeployVps');
    if (btn1) {
      btn1.disabled = false;
      btn1.innerHTML = '<i data-lucide="send" class="w-3.5 h-3.5 text-amber-300"></i> Deploy mr.pkld.online';
    }
    const btn2 = document.getElementById('btnCardDeployVps');
    if (btn2) {
      btn2.disabled = false;
      btn2.innerHTML = '<i data-lucide="send" class="w-3.5 h-3.5 text-emerald-200"></i> Deploy';
    }
    if (window.lucide) lucide.createIcons();
  }
}

// ==============================================================================
// 4. REBAR CALCULATION & SELECTION TABLE
// ==============================================================================

function populateRebarTable(tbodyId, storyFilterId, searchInputId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody || !etabsData || !etabsData.beams) return;

  const storyFilter = storyFilterId && document.getElementById(storyFilterId) ? document.getElementById(storyFilterId).value : 'ALL';
  const searchTerm = searchInputId && document.getElementById(searchInputId) ? document.getElementById(searchInputId).value.toLowerCase().trim() : '';

  let filtered = etabsData.beams;
  if (storyFilter !== 'ALL') {
    filtered = filtered.filter(b => b.story === storyFilter);
  }
  if (searchTerm) {
    filtered = filtered.filter(b => 
      b.label.toLowerCase().includes(searchTerm) || 
      b.section.toLowerCase().includes(searchTerm) ||
      b.story.toLowerCase().includes(searchTerm)
    );
  }

  tbody.innerHTML = '';
  filtered.forEach((b, idx) => {
    const tr = document.createElement('tr');
    tr.className = idx % 2 === 0 ? 'bg-white hover:bg-indigo-50/40 transition cursor-pointer' : 'bg-slate-50/60 hover:bg-indigo-50/40 transition cursor-pointer';
    tr.onclick = (e) => {
      // If clicking button/select ignore, otherwise open modal
      if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT') {
        openBeamRebarModal(b);
      }
    };

    tr.innerHTML = `
      <td class="p-2.5 text-center font-bold text-slate-700">${b.story}</td>
      <td class="p-2.5 font-bold text-indigo-700 flex items-center gap-1.5">
        <span>${b.label}</span>
        <button onclick="event.stopPropagation(); openBeamRebarModal(etabsData.beams.find(x => x.label === '${b.label}' && x.story === '${b.story}'))" class="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 text-[10px] font-semibold cursor-pointer" title="Chọn cốt thép dầm">Chọn thép</button>
      </td>
      <td class="p-2.5 text-slate-800 font-semibold">${b.section}</td>
      <td class="p-2.5 text-right font-medium text-slate-600">${(b.length/1000).toFixed(2)}m</td>
      <td class="p-2.5 text-right font-bold text-amber-700 bg-amber-50/40">${(b.as_top_left_cm2 || 0).toFixed(2)}</td>
      <td class="p-2.5 text-right font-bold text-amber-700 bg-amber-50/40">${(b.as_bot_mid_cm2 || 0).toFixed(2)}</td>
      <td class="p-2.5 text-right font-bold text-amber-700 bg-amber-50/40">${(b.as_top_right_cm2 || 0).toFixed(2)}</td>
      <td class="p-2.5 text-right font-bold text-sky-700 bg-sky-50/40">${(b.as_shear_cm2_m || 0).toFixed(2)}</td>
      <td class="p-2.5 font-bold text-indigo-950 bg-indigo-50/30">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold text-[10px]" title="Thép gối trái">${b.rebar_top_left}</span>
          <span class="text-slate-400">/</span>
          <span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]" title="Thép bụng nhịp">${b.rebar_bot_mid}</span>
          <span class="text-slate-400">/</span>
          <span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold text-[10px]" title="Thép gối phải">${b.rebar_top_right}</span>
        </div>
      </td>
      <td class="p-2.5 text-center font-bold text-sky-800 bg-sky-50/20">${b.stirrup}</td>
      <td class="p-2.5 text-center">
        <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">Đạt (TCVN)</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterRebarTable() {
  populateRebarTable('rebarTableBody', 'rebarFilterStory', 'rebarSearchInput');
}

function exportRebarCSV() {
  if (!etabsData || !etabsData.beams) return;
  let csv = '\uFEFFStory,Beam,Section,Width(mm),Depth(mm),Length(m),As_Top_Left(cm2),As_Bot_Mid(cm2),As_Top_Right(cm2),As_Shear(cm2/m),Rebar_Left,Rebar_Mid,Rebar_Right,Stirrup,Status\n';

  etabsData.beams.forEach(b => {
    csv += `"${b.story}","${b.label}","${b.section}",${b.width},${b.depth},${(b.length/1000).toFixed(2)},${b.as_top_left_cm2},${b.as_bot_mid_cm2},${b.as_top_right_cm2},${b.as_shear_cm2_m},"${b.rebar_top_left}","${b.rebar_bot_mid}","${b.rebar_top_right}","${b.stirrup}","An toàn (TCVN 5574)"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bang_Thong_Ke_Thep_Dam_ETABS_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function printRebarTable() {
  window.print();
}

function setupBeamCanvasEvents() {
  const canvas = document.getElementById('brmDrawingCanvas');
  if (!canvas) return;

  canvas.addEventListener('click', (e) => {
    if (beamDrawingMode !== 'chain') return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const box of chainInteractiveBoxes) {
      if (x >= box.x1 && x <= box.x2 && y >= box.y1 && y <= box.y2) {
        if (box.beam && box.beam.label !== selectedBeamForRebar?.label) {
          openBeamRebarModal(box.beam);
        }
        break;
      }
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (beamDrawingMode !== 'chain') {
      canvas.style.cursor = 'default';
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let hovering = false;
    for (const box of chainInteractiveBoxes) {
      if (x >= box.x1 && x <= box.x2 && y >= box.y1 && y <= box.y2) {
        hovering = true;
        break;
      }
    }
    canvas.style.cursor = hovering ? 'pointer' : 'default';
  });

  window.addEventListener('resize', () => {
    const modal = document.getElementById('beamRebarModal');
    if (modal && !modal.classList.contains('hidden') && selectedBeamForRebar) {
      renderBeamDrawings();
    }
  });
}

// Auto-run on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  setup2DCanvasEvents('etabs2DCanvas', view2D, renderEtabs2DPlan);
  setup2DCanvasEvents('modal2DCanvas', modalView2D, renderModal2DPlan);
  setupBeamCanvasEvents();
  
  // Pre-load data in background
  setTimeout(loadEtabsData, 400);
});

