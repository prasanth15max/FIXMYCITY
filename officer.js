const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const stages = ["Registered", "Assigned to officer", "Work in progress", "Resolved"];
const prioRank = { Emergency: 0, High: 1, Medium: 2, Low: 3 };

// Demo officer accounts (front-end only. A real portal must check these on a server.)
const OFFICERS = [
    { id: "officer1", pass: "tn@2026", name: "Officer Kumar", dept: "Corporation Engineer" },
    { id: "officer2", pass: "tn@2026", name: "Officer Priya", dept: "Sanitation Officer" },
    { id: "admin", pass: "admin@2026", name: "Commissioner", dept: "Commissioner, Corporation" }
];

let me = load("officerSession");
let openId = null;
let statFilter = "";

// ---------- HEADER ANIMATION ----------
window.addEventListener("load", () => {
    const topbar = document.querySelector(".topbar");
    if (!topbar) return;
    topbar.style.opacity = "0";
    topbar.style.transform = "translateY(-30px)";
    setTimeout(() => {
        topbar.style.transition = "opacity 1s ease, transform 1s ease";
        topbar.style.opacity = "1";
        topbar.style.transform = "translateY(0)";
    }, 100);
});

// ---------- HELPERS ----------
function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t.timer);
    t.timer = setTimeout(() => t.classList.remove("show"), 3200);
}

function legacyStage(c) {
    return Math.min(3, Math.floor((Date.now() - c.time) / 120000));
}

// Reads all complaints. Old complaints (made before the officer page existed) get a fixed status once.
function getAll() {
    const all = load("complaints") || [];
    let changed = false;
    all.forEach(c => {
        if (typeof c.status !== "number") { c.status = legacyStage(c); changed = true; }
        if (!Array.isArray(c.history)) {
            c.history = [{ stage: 0, note: "Complaint registered by citizen", by: "Citizen", time: c.date }];
            changed = true;
        }
    });
    if (changed) save("complaints", all);
    return all;
}

// ---------- LOGIN ----------
function showDash() {
    $("oLogin").hidden = true;
    $("oDash").hidden = false;
    $("oName").textContent = me.name;
    $("oDept").textContent = me.dept;
    render();
}

function showLogin() {
    $("oDash").hidden = true;
    $("oLogin").hidden = false;
    closeDetail();
}

$("oForm").addEventListener("submit", e => {
    e.preventDefault();
    const id = $("oId").value.trim().toLowerCase();
    const pass = $("oPass").value;
    const o = OFFICERS.find(x => x.id === id && x.pass === pass);
    const msg = $("oMsg");
    if (!o) {
        msg.textContent = "Wrong Officer ID or password.";
        msg.className = "msg bad";
        return;
    }
    me = { id: o.id, name: o.name, dept: o.dept };
    save("officerSession", me);
    $("oForm").reset();
    msg.textContent = "";
    msg.className = "msg";
    showDash();
    toast("Welcome " + me.name);
});

$("bLogout").addEventListener("click", () => {
    localStorage.removeItem("officerSession");
    me = null;
    showLogin();
});

// ---------- DASHBOARD ----------
function fillSelect(sel, firstLabel, values) {
    const keep = sel.value;
    sel.innerHTML = "<option value=''>" + firstLabel + "</option>" +
        values.map(v => "<option>" + esc(v) + "</option>").join("");
    sel.value = values.includes(keep) ? keep : "";
}

function render() {
    if (!me) return;
    const all = getAll();

    // stat cards
    const counts = [0, 0, 0, 0];
    all.forEach(c => counts[c.status]++);
    const cards = [
        { k: "", label: "All complaints", n: all.length },
        { k: "0", label: "New", n: counts[0] },
        { k: "1", label: "Assigned", n: counts[1] },
        { k: "2", label: "In progress", n: counts[2] },
        { k: "3", label: "Resolved", n: counts[3] }
    ];
    $("oStats").innerHTML = cards.map(c =>
        "<button type='button' class='o-stat" + (statFilter === c.k ? " on" : "") + "' data-k='" + c.k + "'><b>" + c.n + "</b><span>" + c.label + "</span></button>").join("");

    // filter dropdowns
    fillSelect($("fCity"), "All cities", [...new Set(all.map(c => c.city))].sort());
    fillSelect($("fType"), "All problems", [...new Set(all.map(c => c.type))].sort());
    const fs = $("fStatus");
    const keepS = fs.value;
    fs.innerHTML = "<option value=''>All status</option>" + stages.map((s, i) => "<option value='" + i + "'>" + s + "</option>").join("");
    fs.value = keepS || statFilter;

    // apply filters
    const q = $("fSearch").value.trim().toLowerCase();
    const st = fs.value, city = $("fCity").value, type = $("fType").value, pr = $("fPrio").value;
    const rows = all.filter(c =>
        (!st || String(c.status) === st) &&
        (!city || c.city === city) &&
        (!type || c.type === type) &&
        (!pr || c.priority === pr) &&
        (!q || [c.id, c.name, c.area, c.city, c.type].join(" ").toLowerCase().includes(q))
    ).sort((a, b) =>
        (a.status === 3) - (b.status === 3) ||
        (prioRank[a.priority] ?? 9) - (prioRank[b.priority] ?? 9) ||
        b.time - a.time
    );

    $("oCount").textContent = rows.length + " complaint" + (rows.length === 1 ? "" : "s") + " shown";
    $("oList").innerHTML = rows.length ? rows.map(c =>
        "<button type='button' class='o-item pr-" + esc(c.priority) + (c.status === 3 ? " done" : "") + "' data-id='" + esc(c.id) + "'>" +
        "<div class='o-top'><b>" + esc(c.id) + "</b><span class='badge s" + c.status + "'>" + stages[c.status] + "</span></div>" +
        "<div><b>" + esc(c.type) + "</b> &middot; " + esc(c.city) + "</div>" +
        "<div class='o-meta'>" + esc(c.area) + "</div>" +
        "<div class='o-meta'><span class='badge pr-" + esc(c.priority) + "'>" + esc(c.priority) + "</span> " + esc(c.date) + "</div>" +
        "</button>").join("")
        : "<p class='o-empty'>No complaints match. New complaints from the public website will appear here.</p>";

}

$("oStats").addEventListener("click", e => {
    const b = e.target.closest(".o-stat");
    if (!b) return;
    statFilter = b.dataset.k;
    $("fStatus").value = statFilter;
    render();
});
$("oList").addEventListener("click", e => {
    const b = e.target.closest(".o-item");
    if (b) openDetail(b.dataset.id);
});
["fSearch", "fStatus", "fCity", "fType", "fPrio"].forEach(id =>
    $(id).addEventListener(id === "fSearch" ? "input" : "change", () => {
        if (id === "fStatus") statFilter = $("fStatus").value;
        render();
    }));
$("bRefresh").addEventListener("click", () => { render(); toast("List refreshed"); });

// ---------- DETAIL PANEL ----------
function openDetail(id) {
    openId = id;
    $("oModal").hidden = false;
    document.body.style.overflow = "hidden";
    fillDetail(id);
}

function closeDetail() {
    openId = null;
    $("oModal").hidden = true;
    document.body.style.overflow = "";
}

function mapLink(area) {
    const m = /GPS:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)/.exec(area || "");
    return m ? " <a target='_blank' rel='noopener' href='https://www.google.com/maps?q=" + m[1] + "," + m[2] + "'>Open map</a>" : "";
}

function fillDetail(id) {
    const c = getAll().find(x => x.id === id);
    if (!c) { closeDetail(); return; }

    const tl = stages.map((t, i) => "<div class='" + (i < c.status ? "ok" : i === c.status ? "now" : "") + "'><i></i>" + t + "</div>").join("");
    const photo = c.photoData && c.photoData.startsWith("data:image/")
        ? "<img class='o-photo' alt='Photo from citizen' src='" + c.photoData + "'>"
        : "<div>" + esc(c.photo) + "</div>";
    const hist = (c.history || []).slice().reverse().map(h =>
        "<li><b>" + esc(stages[h.stage] || "Update") + "</b>" + (h.note ? ": " + esc(h.note) : "") +
        "<small>" + esc(h.by) + " | " + esc(h.time) + "</small></li>").join("");

    $("mBody").innerHTML =
        "<h3 id='mTitle'>" + esc(c.id) + " <span class='badge s" + c.status + "'>" + stages[c.status] + "</span></h3>" +
        "<div class='tl'>" + tl + "</div>" +
        "<div class='o-grid'>" +
        "<div><b>Problem</b>" + esc(c.type) + "</div>" +
        "<div><b>Priority</b><span class='badge pr-" + esc(c.priority) + "'>" + esc(c.priority) + "</span></div>" +
        "<div><b>Citizen</b>" + esc(c.name) + "</div>" +
        "<div><b>Mobile</b><a href='tel:" + esc(c.phone) + "'>" + esc(c.phone) + "</a></div>" +
        "<div><b>City / Corporation</b>" + esc(c.city) + "</div>" +
        "<div><b>Registered on</b>" + esc(c.date) + "</div>" +
        "<div style='grid-column:1/-1'><b>Area / landmark</b>" + esc(c.area) + mapLink(c.area) + "</div>" +
        "<div><b>Assigned to</b>" + esc(c.assignedTo || "Not assigned yet") + "</div>" +
        "<div><b>Video</b>" + esc(c.video) + "</div>" +
        "</div>" +
        "<b>Complaint letter</b><div class='o-letter'>" + esc(c.letter) + "</div>" +
        "<b>Photo</b>" + photo +
        "<b>Work history</b><ul class='o-hist'>" + hist + "</ul>" +
        "<div class='o-update'><h4>Update this complaint</h4>" +
        "<label for='uStage'>Status</label><select id='uStage'>" +
        stages.map((s, i) => "<option value='" + i + "'" + (i === c.status ? " selected" : "") + ">" + s + "</option>").join("") + "</select>" +
        "<label for='uWho'>Assigned officer</label><input id='uWho' value='" + esc(c.assignedTo || me.name) + "'>" +
        "<label for='uNote'>Remark for the citizen (required when resolved)</label>" +
        "<textarea id='uNote' placeholder='Example: Drain cleaned by the sanitation team on site.'></textarea>" +
        "<div class='o-btns'>" +
        "<button type='button' class='btn' data-act='save'>Save update</button>" +
        (c.status < 3 ? "<button type='button' class='btn good' data-act='resolve'>Mark as resolved</button>" : "") +
        "<button type='button' class='btn small' data-act='close'>Close</button>" +
        "</div></div>";
}

function applyUpdate(forceResolved) {
    const all = getAll();
    const c = all.find(x => x.id === openId);
    if (!c) return;

    const stage = forceResolved ? 3 : +$("uStage").value;
    const who = $("uWho").value.trim() || me.name;
    const note = $("uNote").value.trim();

    if (stage === 3 && !note) { toast("Please write a remark before resolving."); $("uNote").focus(); return; }
    if (stage === c.status && !note && who === (c.assignedTo || "")) { toast("Change the status or write a remark first."); return; }

    c.status = stage;
    c.assignedTo = who;
    if (note) c.officerNote = note;
    c.history.push({ stage, note, by: me.name + " (" + me.dept + ")", time: new Date().toLocaleString() });
    save("complaints", all);

    toast(stage === 3 ? c.id + " marked as resolved" : c.id + " updated");
    render();
    fillDetail(openId);
}

$("mBody").addEventListener("click", e => {
    const a = e.target.closest("[data-act]");
    if (!a) return;
    if (a.dataset.act === "save") applyUpdate(false);
    if (a.dataset.act === "resolve") applyUpdate(true);
    if (a.dataset.act === "close") closeDetail();
});
$("mClose").addEventListener("click", closeDetail);
$("oModal").addEventListener("click", e => { if (e.target === $("oModal")) closeDetail(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && openId) closeDetail(); });

// ---------- EXPORT ----------
function csvCell(v) {
    let s = String(v == null ? "" : v);
    if (/^[=+\-@]/.test(s)) s = "'" + s;   // stops spreadsheet formula injection
    return '"' + s.replace(/"/g, '""') + '"';
}

$("bExport").addEventListener("click", () => {
    const all = getAll();
    if (!all.length) { toast("No complaints to export"); return; }
    const head = ["ID", "Status", "Priority", "Problem", "City", "Area", "Citizen", "Mobile", "Assigned to", "Registered on", "Letter"];
    const rows = all.map(c => [c.id, stages[c.status], c.priority, c.type, c.city, c.area, c.name, c.phone, c.assignedTo || "", c.date, c.letter]);
    const csv = [head, ...rows].map(r => r.map(csvCell).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = "complaints.csv";
    a.click();
    URL.revokeObjectURL(a.href);
});

// ---------- LIVE UPDATE ----------
// A complaint sent from the public website in another tab shows up here automatically.
onComplaintsChange(() => { if (me) render(); });   // db.js
setInterval(() => { if (me && !openId) render(); }, 15000);

if (me) showDash(); else showLogin();
