import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(scriptDir, "..")
const mapPath = path.join(appRoot, "docs/shotiq/screen-implementation-map.json")
const functionalityPath = path.join(appRoot, "docs/shotiq/ios-72-feature-functionality-map.md")
const canonicalDir = path.join(appRoot, "docs/shotiq/canonical")
const currentDir = process.env.SHOTIQ_IOS_CURRENT_SHOTS
  || "/Volumes/TBF SKILLZ.INC/CodexWork/shotiq-ios-review-board/current-simshots"
const outDir = path.join(appRoot, "public/shotiq-ios-review-board")
const imageOutDir = path.join(outDir, "screens")

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"))
}

function parseFunctionality(file) {
  const out = new Map()
  const text = fs.readFileSync(file, "utf8")
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith("|")) continue
    const cells = line.split("|").slice(1, -1).map((v) => v.trim())
    if (!/^\d{3}$/.test(cells[0] || "")) continue
    const screenKey = `${cells[0]}-${cells[1]}`
    const payload = {
      number: cells[0],
      screen: cells[1],
      area: cells[2],
      primaryFeature: cells[3],
      requiredFunctionality: cells[4],
      proofSurface: cells[5],
    }
    out.set(cells[1], payload)
    out.set(screenKey, payload)
  }
  return out
}

function findSourceImage(screen) {
  const candidates = []
  if (currentDir && fs.existsSync(currentDir)) {
    for (const name of fs.readdirSync(currentDir)) {
      if (name.endsWith(".png") && name.includes(screen)) {
        candidates.push({ file: path.join(currentDir, name), source: "current simulator capture" })
      }
    }
  }
  const canonical = path.join(canonicalDir, `${screen}.png`)
  if (fs.existsSync(canonical)) {
    candidates.push({ file: canonical, source: "canonical fallback" })
  }
  return candidates[0] || null
}

function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function renderPage(screens) {
  const data = JSON.stringify(screens).replaceAll("</", "<\\/")
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ShotIQ iOS 72 Correction Board</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #080808;
      --muted: #676b73;
      --line: #e8e8e8;
      --paper: #ffffff;
      --canvas: #f5f5f3;
      --orange: #ff330d;
      --blue: #2d6cdf;
      --green: #087a3f;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--canvas);
      color: var(--ink);
    }
    header {
      position: sticky;
      top: 0;
      z-index: 10;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      padding: 18px 22px;
      background: rgba(255,255,255,.94);
      border-bottom: 1px solid var(--line);
      backdrop-filter: blur(10px);
    }
    h1 {
      margin: 0;
      font-size: 24px;
      line-height: 1.05;
      letter-spacing: 0;
    }
    .sub {
      margin-top: 5px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.35;
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    button, select, input {
      height: 38px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fff;
      color: var(--ink);
      font: inherit;
      font-size: 13px;
      padding: 0 10px;
    }
    button.primary {
      background: var(--orange);
      border-color: var(--orange);
      color: white;
      font-weight: 700;
    }
    main {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(430px, 1fr));
      gap: 18px;
      padding: 18px;
    }
    article {
      display: grid;
      grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
      gap: 14px;
      align-items: start;
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
      box-shadow: 0 1px 2px rgba(0,0,0,.04);
    }
    .shot-wrap {
      align-self: stretch;
    }
    .shot {
      width: 100%;
      border-radius: 8px;
      border: 1px solid #dcdcdc;
      background: #111;
      display: block;
      cursor: zoom-in;
    }
    .meta {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 0;
    }
    .eyebrow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: .04em;
    }
    .badge {
      white-space: nowrap;
      border-radius: 999px;
      padding: 4px 8px;
      background: #f1f1ef;
      color: var(--muted);
      font-size: 11px;
      text-transform: none;
      letter-spacing: 0;
    }
    .badge.current {
      background: #e8f4ed;
      color: var(--green);
    }
    h2 {
      margin: 0;
      font-size: 20px;
      line-height: 1.1;
      letter-spacing: 0;
    }
    dl {
      display: grid;
      gap: 7px;
      margin: 0;
      font-size: 12px;
      line-height: 1.35;
    }
    dt {
      color: var(--muted);
      font-weight: 800;
      letter-spacing: .04em;
      text-transform: uppercase;
      font-size: 10px;
    }
    dd { margin: 2px 0 0; }
    textarea {
      width: 100%;
      min-height: 148px;
      resize: vertical;
      border: 1px solid var(--line);
      border-radius: 7px;
      padding: 10px;
      color: var(--ink);
      font: inherit;
      font-size: 13px;
      line-height: 1.35;
      background: #fff;
    }
    .note-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .note-grid textarea {
      min-height: 104px;
    }
    .screen-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .screen-actions button, .upload-label {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 32px;
      font-size: 12px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fff;
      color: var(--ink);
      padding: 0 10px;
      cursor: pointer;
    }
    .upload-label input {
      position: absolute;
      opacity: 0;
      width: 1px;
      height: 1px;
      pointer-events: none;
    }
    .attachments {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
      gap: 8px;
    }
    .attachment {
      display: grid;
      gap: 5px;
      min-width: 0;
    }
    .attachment img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid var(--line);
      background: #111;
      cursor: zoom-in;
    }
    .attachment button {
      width: 100%;
      height: 28px;
      font-size: 11px;
    }
    .save-status {
      min-height: 16px;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.2;
    }
    dialog {
      width: min(94vw, 1100px);
      border: 0;
      border-radius: 10px;
      padding: 0;
      background: #111;
      color: #fff;
    }
    dialog::backdrop { background: rgba(0,0,0,.75); }
    .modal-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255,255,255,.16);
    }
    #modalImg {
      display: block;
      width: 100%;
      max-height: 82vh;
      object-fit: contain;
      background: #000;
    }
    .hidden { display: none; }
    @media (max-width: 760px) {
      header { grid-template-columns: 1fr; }
      .toolbar { justify-content: flex-start; }
      main { grid-template-columns: 1fr; padding: 12px; }
      article { grid-template-columns: 1fr; }
      .shot-wrap { max-width: 320px; }
      .note-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>ShotIQ iOS 72 Correction Board</h1>
      <div class="sub">
        Click any screenshot to enlarge it. Type what each page should do, how it should be laid out,
        and what must be fixed. Notes auto-save in this browser and can be exported.
      </div>
    </div>
    <div class="toolbar">
      <input id="search" placeholder="Search screens" aria-label="Search screens" />
      <select id="area" aria-label="Filter by area">
        <option value="">All areas</option>
      </select>
      <button id="exportNotes" class="primary">Export notes</button>
      <button id="saveNow">Save now</button>
      <button id="clearFilter">Clear</button>
    </div>
  </header>
  <main id="board"></main>
  <dialog id="modal">
    <div class="modal-top">
      <strong id="modalTitle"></strong>
      <button id="closeModal">Close</button>
    </div>
    <img id="modalImg" alt="" />
  </dialog>
  <script>
    const screens = ${data};
    const key = "shotiq-ios-review-board-notes-v1";
    const board = document.getElementById("board");
    const search = document.getElementById("search");
    const area = document.getElementById("area");
    const modal = document.getElementById("modal");
    const modalImg = document.getElementById("modalImg");
    const modalTitle = document.getElementById("modalTitle");
    const saveNow = document.getElementById("saveNow");
    const notes = JSON.parse(localStorage.getItem(key) || "{}");
    let saveTimer = null;
    let serverUpdatedAt = null;

    for (const value of [...new Set(screens.map((s) => s.area).filter(Boolean))].sort()) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      area.appendChild(option);
    }

    function saveLocal() {
      localStorage.setItem(key, JSON.stringify(notes, null, 2));
    }

    function setSaveStatus(text) {
      document.querySelectorAll(".save-status").forEach((el) => { el.textContent = text; });
    }

    async function saveServer() {
      saveLocal();
      setSaveStatus("Saving to server...");
      try {
        const response = await fetch("/api/shotiq-ios-review-board", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ notes }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Save failed");
        serverUpdatedAt = data.updatedAt;
        setSaveStatus("Saved to server " + new Date(serverUpdatedAt).toLocaleString());
      } catch (error) {
        setSaveStatus("Saved in this browser. Server save failed: " + error.message);
      }
    }

    function queueSave() {
      saveLocal();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveServer, 800);
    }

    function textarea(screen, field, placeholder) {
      const el = document.createElement("textarea");
      el.placeholder = placeholder;
      el.value = notes[screen.screen]?.[field] || "";
      el.addEventListener("input", () => {
        notes[screen.screen] ||= {};
        notes[screen.screen][field] = el.value;
        queueSave();
      });
      return el;
    }

    function openImage(title, src) {
      modalTitle.textContent = title;
      modalImg.src = src;
      modalImg.alt = title;
      modal.showModal();
    }

    function attachmentsFor(screen) {
      notes[screen.screen] ||= {};
      notes[screen.screen].attachments ||= [];
      return notes[screen.screen].attachments;
    }

    function renderAttachments(screen, host) {
      host.replaceChildren();
      for (const [index, item] of attachmentsFor(screen).entries()) {
        const wrap = document.createElement("div");
        wrap.className = "attachment";
        const img = document.createElement("img");
        img.src = item.dataUrl;
        img.alt = item.name || "Uploaded correction screenshot";
        img.loading = "lazy";
        img.addEventListener("click", () => openImage(screen.number + " · uploaded reference", item.dataUrl));
        const remove = document.createElement("button");
        remove.textContent = "Remove";
        remove.addEventListener("click", () => {
          attachmentsFor(screen).splice(index, 1);
          renderAttachments(screen, host);
          queueSave();
        });
        wrap.append(img, remove);
        host.appendChild(wrap);
      }
    }

    function handleUpload(screen, files, host) {
      const selected = [...files].filter((file) => file.type.startsWith("image/"));
      if (!selected.length) return;
      const readers = selected.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read " + file.name));
        reader.onload = () => resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          createdAt: new Date().toISOString(),
          dataUrl: reader.result,
        });
        reader.readAsDataURL(file);
      }));
      Promise.all(readers).then((items) => {
        attachmentsFor(screen).push(...items);
        renderAttachments(screen, host);
        queueSave();
      }).catch((error) => setSaveStatus(error.message));
    }

    async function loadServerNotes() {
      try {
        const response = await fetch("/api/shotiq-ios-review-board", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (data.notes && Object.keys(data.notes).length) {
          Object.assign(notes, data.notes);
          serverUpdatedAt = data.updatedAt;
          saveLocal();
        }
      } catch {
        // Local browser notes still work offline.
      }
    }

    function render() {
      const q = search.value.trim().toLowerCase();
      const a = area.value;
      board.replaceChildren();
      for (const screen of screens) {
        const haystack = [screen.screen, screen.area, screen.primaryFeature, screen.requiredFunctionality, screen.proofSurface].join(" ").toLowerCase();
        if (a && screen.area !== a) continue;
        if (q && !haystack.includes(q)) continue;

        const article = document.createElement("article");
        article.id = screen.screen;

        const shotWrap = document.createElement("div");
        shotWrap.className = "shot-wrap";
        const img = document.createElement("img");
        img.className = "shot";
        img.src = screen.image;
        img.alt = screen.screen + " screenshot";
        img.loading = "lazy";
        img.addEventListener("click", () => {
          openImage(screen.number + " · " + screen.screen, screen.image);
        });
        shotWrap.appendChild(img);

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.innerHTML = \`
          <div class="eyebrow"><span>\${screen.number} · \${screen.area}</span><span class="badge \${screen.source.startsWith("current") ? "current" : ""}">\${screen.source}</span></div>
          <h2>\${screen.screen}</h2>
          <dl>
            <div><dt>Primary Feature</dt><dd>\${screen.primaryFeature}</dd></div>
            <div><dt>Required Functionality</dt><dd>\${screen.requiredFunctionality}</dd></div>
            <div><dt>Media / Proof Surface</dt><dd>\${screen.proofSurface}</dd></div>
          </dl>
        \`;
        const mainNote = textarea(screen, "shouldDo", "What should this page do? List the customer functionality, actions, and expected behavior.");
        const noteGrid = document.createElement("div");
        noteGrid.className = "note-grid";
        noteGrid.append(
          textarea(screen, "layout", "Layout / visual corrections"),
          textarea(screen, "actions", "Buttons, tabs, uploads, saves, progress/toasts that must work")
        );
        const uploads = document.createElement("div");
        uploads.className = "attachments";
        renderAttachments(screen, uploads);
        const actions = document.createElement("div");
        actions.className = "screen-actions";
        const upload = document.createElement("label");
        upload.className = "upload-label";
        upload.textContent = "Upload reference image";
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.multiple = true;
        input.addEventListener("change", () => {
          handleUpload(screen, input.files, uploads);
          input.value = "";
        });
        upload.appendChild(input);
        const copy = document.createElement("button");
        copy.textContent = "Copy screen notes";
        copy.addEventListener("click", async () => {
          const n = notes[screen.screen] || {};
          await navigator.clipboard.writeText(\`\${screen.number} \${screen.screen}\\n\\nShould do:\\n\${n.shouldDo || ""}\\n\\nLayout:\\n\${n.layout || ""}\\n\\nActions:\\n\${n.actions || ""}\\n\\nUploaded images: \${(n.attachments || []).length}\`);
          copy.textContent = "Copied";
          setTimeout(() => copy.textContent = "Copy screen notes", 1000);
        });
        actions.append(upload, copy);
        const status = document.createElement("div");
        status.className = "save-status";
        status.textContent = serverUpdatedAt ? "Saved to server " + new Date(serverUpdatedAt).toLocaleString() : "Ready";
        meta.append(mainNote, noteGrid, uploads, actions, status);
        article.append(shotWrap, meta);
        board.appendChild(article);
      }
    }

    search.addEventListener("input", render);
    area.addEventListener("change", render);
    document.getElementById("clearFilter").addEventListener("click", () => {
      search.value = "";
      area.value = "";
      render();
    });
    saveNow.addEventListener("click", saveServer);
    document.getElementById("exportNotes").addEventListener("click", () => {
      const payload = {
        exportedAt: new Date().toISOString(),
        source: "ShotIQ iOS 72 Correction Board",
        notes,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "shotiq-ios-72-correction-notes.json";
      a.click();
      URL.revokeObjectURL(url);
    });
    document.getElementById("closeModal").addEventListener("click", () => modal.close());
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.close();
    });
    loadServerNotes().finally(render);
  </script>
</body>
</html>`
}

cleanDir(imageOutDir)

const implementationMap = readJson(mapPath)
const functionality = parseFunctionality(functionalityPath)
const builtScreens = implementationMap
  .filter((row) => row.platform === "ios")
  .slice(0, 72)
  .map((row) => {
    const fn = functionality.get(row.screen) || {}
    const source = findSourceImage(row.screen)
    if (!source) throw new Error(`No screenshot found for ${row.screen}`)
    const outName = `${row.screen}.png`
    fs.copyFileSync(source.file, path.join(imageOutDir, outName))
    return {
      number: row.screen.slice(0, 3),
      screen: row.screen,
      testId: row.testId,
      area: fn.area || "iOS",
      primaryFeature: fn.primaryFeature || row.screen,
      requiredFunctionality: fn.requiredFunctionality || "",
      proofSurface: fn.proofSurface || "",
      component: row.component,
      image: `/shotiq-ios-review-board/screens/${outName}`,
      source: source.source,
      sourceFile: path.basename(source.file),
    }
  })

fs.writeFileSync(path.join(outDir, "screens.json"), JSON.stringify(builtScreens, null, 2))
fs.writeFileSync(path.join(outDir, "index.html"), renderPage(builtScreens))
console.log(`SHOTIQ_IOS_REVIEW_BOARD_READY ${builtScreens.length} screens -> ${outDir}`)
