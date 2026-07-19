/**
 * Codex Pet Viewer
 * 将 pet.json + spritesheet.webp 渲染为可互动网页宠物。
 */

const DEFAULT_ATLAS = {
  columns: 8,
  rows: 9,
  cell_width: 192,
  cell_height: 208,
  width: 1536,
  height: 1872,
};

/** 与 firefly 一致的默认行映射；无 atlas 的宠物共用此表 */
const DEFAULT_ROWS = [
  { state: "idle", row: 0, frames: 6, purpose: "平静待机 / 呼吸眨眼" },
  { state: "running-right", row: 1, frames: 8, purpose: "向右移动" },
  { state: "running-left", row: 2, frames: 8, purpose: "向左移动" },
  { state: "waving", row: 3, frames: 4, purpose: "打招呼" },
  { state: "jumping", row: 4, frames: 5, purpose: "跳跃 / 悬浮" },
  { state: "failed", row: 5, frames: 8, purpose: "失败 / 取消" },
  { state: "waiting", row: 6, frames: 6, purpose: "等待确认" },
  { state: "running", row: 7, frames: 6, purpose: "工作中" },
  { state: "review", row: 8, frames: 6, purpose: "完成审视" },
];

const PET_CATALOG = [
  {
    id: "firefly",
    displayName: "流萤",
    description: "银白短发、翠绿眼眸的机甲风 chibi 宠物。",
    folder: "firefly",
    spritesheetPath: "spritesheet.webp",
  },
  {
    id: "fufu-sticker",
    displayName: "芙芙 Sticker",
    description: "白蓝短发、黑白裙装的贴纸风宠物。",
    folder: "fufu-sticker",
    spritesheetPath: "spritesheet.webp",
  },
  {
    id: "ganyu-pet-v2",
    displayName: "甘雨",
    description: "桌面小羊宠物。",
    folder: "ganyu-pet-v2",
    spritesheetPath: "spritesheet.webp",
  },
  {
    id: "rich-paimon",
    displayName: "财神派蒙",
    description: "来自 codex-pets.net 的财神派蒙。",
    folder: "rich-paimon",
    spritesheetPath: "spritesheet.webp",
  },
];

const els = {
  petList: document.getElementById("pet-list"),
  stateList: document.getElementById("state-list"),
  meta: document.getElementById("meta"),
  pet: document.getElementById("pet"),
  canvas: document.getElementById("pet-canvas"),
  stage: document.getElementById("stage"),
  speed: document.getElementById("speed"),
  speedLabel: document.getElementById("speed-label"),
  scale: document.getElementById("scale"),
  scaleLabel: document.getElementById("scale-label"),
  btnPause: document.getElementById("btn-pause"),
  btnReset: document.getElementById("btn-reset"),
  btnDesktop: document.getElementById("btn-desktop"),
};

const ctx = els.canvas.getContext("2d");

const state = {
  petId: PET_CATALOG[0].id,
  animState: "idle",
  frame: 0,
  lastTick: 0,
  frameMs: 100,
  scale: 1,
  paused: false,
  image: null,
  atlas: { ...DEFAULT_ATLAS },
  rows: DEFAULT_ROWS.map((r) => ({ ...r })),
  drag: null,
  pos: null, // {x,y} relative to stage; null = centered
  raf: 0,
};

function currentPetMeta() {
  return PET_CATALOG.find((p) => p.id === state.petId) || PET_CATALOG[0];
}

function currentRow() {
  return (
    state.rows.find((r) => r.state === state.animState) ||
    state.rows[0] ||
    DEFAULT_ROWS[0]
  );
}

function sheetUrl(pet) {
  return `${pet.folder}/${pet.spritesheetPath}`;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`无法加载图片: ${url}`));
    img.src = url;
  });
}

async function tryLoadPetJson(pet) {
  try {
    const res = await fetch(`${pet.folder}/pet.json`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    // file:// 下 fetch 常被拦截，回退到内置默认 atlas
    return null;
  }
}

function normalizeConfig(pet, json) {
  const atlas = {
    ...DEFAULT_ATLAS,
    ...(json?.atlas || {}),
  };

  let rows = DEFAULT_ROWS.map((r) => ({ ...r }));
  if (Array.isArray(json?.rows) && json.rows.length) {
    rows = json.rows.map((r) => ({
      state: r.state,
      row: Number(r.row),
      frames: Number(r.frames),
      purpose: r.purpose || "",
    }));
  }

  return {
    id: json?.id || json?.pet_id || pet.id,
    displayName: json?.displayName || json?.display_name || pet.displayName,
    description: json?.description || pet.description,
    atlas,
    rows,
  };
}

function renderPetList() {
  els.petList.innerHTML = "";
  for (const pet of PET_CATALOG) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice" + (pet.id === state.petId ? " active" : "");
    btn.innerHTML = `<strong>${escapeHtml(pet.displayName)}</strong><small>${escapeHtml(pet.id)}</small>`;
    btn.addEventListener("click", () => selectPet(pet.id));
    els.petList.appendChild(btn);
  }
}

function renderStateList() {
  els.stateList.innerHTML = "";
  for (const row of state.rows) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice" + (row.state === state.animState ? " active" : "");
    btn.innerHTML = `<strong>${escapeHtml(row.state)}</strong><small>row ${row.row} · ${row.frames} 帧 · ${escapeHtml(row.purpose || "")}</small>`;
    btn.addEventListener("click", () => {
      state.animState = row.state;
      state.frame = 0;
      renderStateList();
      renderMeta();
    });
    els.stateList.appendChild(btn);
  }
}

function renderMeta() {
  const pet = currentPetMeta();
  const row = currentRow();
  const entries = [
    ["ID", state.petId],
    ["名称", pet.displayName],
    ["动画", state.animState],
    ["帧", `${state.frame + 1} / ${row.frames}`],
    ["格子", `${state.atlas.cell_width}×${state.atlas.cell_height}`],
    ["雪碧图", sheetUrl(pet)],
  ];
  els.meta.innerHTML = entries
    .map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(String(v))}</dd>`)
    .join("");
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function drawFrame() {
  const img = state.image;
  if (!img) return;

  const { cell_width: cw, cell_height: ch } = state.atlas;
  const row = currentRow();
  const sx = (state.frame % row.frames) * cw;
  const sy = row.row * ch;

  if (els.canvas.width !== cw || els.canvas.height !== ch) {
    els.canvas.width = cw;
    els.canvas.height = ch;
  }

  ctx.clearRect(0, 0, cw, ch);
  // 部分雪碧图空白帧会透明，先清再画
  try {
    ctx.drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch);
  } catch (err) {
    console.warn("drawImage failed", err);
  }
}

function tick(now) {
  state.raf = requestAnimationFrame(tick);
  if (state.paused || !state.image) {
    drawFrame();
    return;
  }

  if (!state.lastTick) state.lastTick = now;
  const elapsed = now - state.lastTick;
  if (elapsed >= state.frameMs) {
    const steps = Math.floor(elapsed / state.frameMs);
    state.lastTick += steps * state.frameMs;
    const row = currentRow();
    state.frame = (state.frame + steps) % Math.max(1, row.frames);
    renderMeta();
  }
  drawFrame();
}

function applyScale() {
  els.pet.style.setProperty("--pet-scale", String(state.scale));
}

function applyPosition() {
  if (!state.pos) {
    els.pet.style.left = "50%";
    els.pet.style.top = "50%";
    els.pet.style.transform = "translate(-50%, -50%)";
    return;
  }
  els.pet.style.left = `${state.pos.x}px`;
  els.pet.style.top = `${state.pos.y}px`;
  els.pet.style.transform = "translate(0, 0)";
}

async function selectPet(id) {
  const pet = PET_CATALOG.find((p) => p.id === id);
  if (!pet) return;

  state.petId = id;
  state.frame = 0;
  state.lastTick = 0;
  renderPetList();

  const json = await tryLoadPetJson(pet);
  const cfg = normalizeConfig(pet, json);
  state.atlas = cfg.atlas;
  state.rows = cfg.rows;
  // 保留当前动画名，若不存在则回 idle / 第一项
  if (!state.rows.some((r) => r.state === state.animState)) {
    state.animState = state.rows[0]?.state || "idle";
  }

  pet.displayName = cfg.displayName;
  pet.description = cfg.description;

  try {
    state.image = await loadImage(sheetUrl(pet));
  } catch (err) {
    state.image = null;
    ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
    alert(
      `${err.message}\n\n请在本目录启动本地服务器后访问：\n  python -m http.server 8765\n然后打开 http://localhost:8765/`
    );
  }

  renderStateList();
  renderMeta();
  drawFrame();
}

function cycleState() {
  if (!state.rows.length) return;
  const idx = state.rows.findIndex((r) => r.state === state.animState);
  const next = state.rows[(idx + 1) % state.rows.length];
  state.animState = next.state;
  state.frame = 0;
  renderStateList();
  renderMeta();
}

function setupDrag() {
  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    const rect = els.stage.getBoundingClientRect();
    const petRect = els.pet.getBoundingClientRect();
    state.drag = {
      offsetX: e.clientX - petRect.left,
      offsetY: e.clientY - petRect.top,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
    };
    // 转为左上角定位
    state.pos = {
      x: petRect.left - rect.left,
      y: petRect.top - rect.top,
    };
    applyPosition();
    els.pet.classList.add("dragging");
    els.pet.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!state.drag) return;
    const dx = e.clientX - state.drag.startX;
    const dy = e.clientY - state.drag.startY;
    if (Math.hypot(dx, dy) > 4) state.drag.moved = true;

    const rect = els.stage.getBoundingClientRect();
    const w = els.pet.offsetWidth;
    const h = els.pet.offsetHeight;
    let x = e.clientX - rect.left - state.drag.offsetX;
    let y = e.clientY - rect.top - state.drag.offsetY;
    x = Math.min(Math.max(0, x), Math.max(0, rect.width - w));
    y = Math.min(Math.max(0, y), Math.max(0, rect.height - h));
    state.pos = { x, y };
    applyPosition();

    // 拖动时根据水平方向切换跑步动画
    if (Math.abs(dx) > 8) {
      const want = dx > 0 ? "running-right" : "running-left";
      if (state.rows.some((r) => r.state === want) && state.animState !== want) {
        state.animState = want;
        state.frame = 0;
        renderStateList();
      }
    }
  };

  const onPointerUp = (e) => {
    if (!state.drag) return;
    const moved = state.drag.moved;
    state.drag = null;
    els.pet.classList.remove("dragging");
    try {
      els.pet.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    // 松手回到 idle（若未点选其他状态意图）
    if (moved && state.rows.some((r) => r.state === "idle")) {
      state.animState = "idle";
      state.frame = 0;
      renderStateList();
      renderMeta();
    } else if (!moved) {
      cycleState();
    }
  };

  els.pet.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
}

function setupControls() {
  els.speed.addEventListener("input", () => {
    state.frameMs = Number(els.speed.value);
    els.speedLabel.textContent = `${state.frameMs} ms/帧`;
  });

  els.scale.addEventListener("input", () => {
    state.scale = Number(els.scale.value) / 100;
    els.scaleLabel.textContent = `${els.scale.value}%`;
    applyScale();
  });

  els.btnPause.addEventListener("click", () => {
    state.paused = !state.paused;
    state.lastTick = 0;
    els.btnPause.textContent = state.paused ? "继续" : "暂停";
  });

  els.btnReset.addEventListener("click", () => {
    state.pos = null;
    applyPosition();
  });

  els.btnDesktop.addEventListener("click", () => {
    document.body.classList.toggle("desktop-mode");
    const on = document.body.classList.contains("desktop-mode");
    els.btnDesktop.textContent = on ? "退出桌面模式" : "桌面模式";
    if (on) {
      // 复位到右下角更像桌宠
      const rect = els.stage.getBoundingClientRect();
      const w = els.pet.offsetWidth;
      const h = els.pet.offsetHeight;
      state.pos = {
        x: Math.max(16, rect.width - w - 24),
        y: Math.max(16, rect.height - h - 24),
      };
      applyPosition();
      alert("已进入桌面模式。双击宠物可退出；拖动可移动。");
    }
  });

  els.pet.addEventListener("dblclick", () => {
    if (!document.body.classList.contains("desktop-mode")) return;
    document.body.classList.remove("desktop-mode");
    els.btnDesktop.textContent = "桌面模式";
  });
}

async function init() {
  renderPetList();
  setupDrag();
  setupControls();
  applyScale();
  applyPosition();
  await selectPet(state.petId);
  state.raf = requestAnimationFrame(tick);
}

init();
