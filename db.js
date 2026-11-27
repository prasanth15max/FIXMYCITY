// db.js - shared browser storage (localStorage) for the public site AND the officer page.
// Load this file BEFORE script.js and officer.js.

const DB_KEYS = {
    users: "users",               // citizen accounts
    session: "session",           // logged-in citizen
    complaints: "complaints",     // all complaints (shared by both pages)
    officer: "officerSession"     // logged-in officer
};

// Read a value (returns null if missing or broken)
const load = k => {
    try { return JSON.parse(localStorage.getItem(k) || "null"); }
    catch (e) { return null; }
};

// Write a value (throws if the browser storage is full)
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// ---------- Complaint helpers ----------
const getComplaints = () => load(DB_KEYS.complaints) || [];

const saveComplaints = list => save(DB_KEYS.complaints, list);

function addComplaint(complaint) {
    const all = getComplaints();
    all.push(complaint);
    saveComplaints(all);
    return complaint;
}

function findComplaint(id) {
    const key = String(id).trim().toLowerCase();
    return getComplaints().find(c => c.id.toLowerCase() === key) || null;
}

// Change fields of one complaint, e.g. updateComplaint("TN-2026-1234", { status: 2 })
function updateComplaint(id, changes) {
    const all = getComplaints();
    const c = all.find(x => x.id === id);
    if (!c) return null;
    Object.assign(c, changes);
    saveComplaints(all);
    return c;
}

// Run a function when ANOTHER tab changes the complaints
// (the officer page uses this to show new public complaints instantly)
function onComplaintsChange(callback) {
    window.addEventListener("storage", e => {
        if (e.key === DB_KEYS.complaints) callback();
    });
}
