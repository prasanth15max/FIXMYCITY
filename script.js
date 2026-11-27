const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Header entrance animation
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

// Floating Chief Minister photo (only runs if the image exists)
const cmImage = document.querySelector(".cm img");
if (cmImage) {
    let angle = 0;
    setInterval(() => {
        if (!cmImage.isConnected) return;
        angle += 0.05;
        cmImage.style.transform = `translateY(${Math.sin(angle) * 6}px)`;
    }, 50);
}

// Subtle mouse parallax for the left header section (desktop only)
document.addEventListener("mousemove", (e) => {
    if (window.innerWidth <= 900) return;
    const gov = document.querySelector(".topbar .gov");
    if (!gov) return;
    const moveX = (e.clientX / window.innerWidth - 0.5) * 8;
    const moveY = (e.clientY / window.innerHeight - 0.5) * 8;
    gov.style.transform = `translate(${moveX}px, ${moveY}px)`;
});

// ---------- DATA ----------
const cities = ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Erode", "Vellore", "Thoothukudi",
    "Dindigul", "Thanjavur", "Nagercoil", "Hosur", "Avadi", "Tambaram", "Kancheepuram", "Karur", "Cuddalore", "Kumbakonam"];

const problems = [
    { n: "Drainage", d: "Blocked drain, sewage on road", i: "M3 8c3-3 5 3 9 0s5 3 9 0M3 14c3-3 5 3 9 0s5 3 9 0M3 20c3-3 5 3 9 0s5 3 9 0" },
    { n: "Streetlight", d: "Light not working, damaged pole", i: "M12 21V6M12 6h6v4M8 21h8M18 13v.01" },
    { n: "Road", d: "Potholes, broken road", i: "M8 3L4 21M16 3l4 18M12 4v3M12 10v4M12 17v3" },
    { n: "Water Supply", d: "Pipe leakage, no supply", i: "M12 3C8 9 6 12 6 15a6 6 0 0 0 12 0c0-3-2-6-6-12z" },
    { n: "Garbage", d: "Overflowing bins, waste on road", i: "M5 7h14M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" },
    { n: "Traffic Signal", d: "Signal not working or damaged", i: "M8 3h8v18H8zM12 7.5v.01M12 12v.01M12 16.5v.01" },
    { n: "EB (Electricity)", d: "Power cut, loose wire, transformer", i: "M13 2L5 14h6l-1 8 8-12h-6z" },
    { n: "Corporation Issue", d: "Tax, license, office or staff", i: "M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" },
    { n: "Other", d: "Anything else in your area", i: "M5 12v.01M12 12v.01M19 12v.01" }
];

const quotes = [
    "Clean street, happy feet. Together we make our city neat!",
    "Less waste, more green. That is the city we want to see!",
    "See a problem? Don't delay. Report it today!",
    "Spot it. Report it. Track it. Fix it.",
    "Clean roads, clear drains. Better cities, better lives!",
    "Our city. Our pride. Our responsibility."
];
const heroLines = ["Clean city, proud city.", "Report it. Track it. See it fixed.", "Salute to every corporation worker.", "Zero problem city starts with you."];
const loginLines = ["Pride of Tamil Nadu.", "Hard work that keeps our streets clean.", "Every worker. Every street. Every day."];
const photos = [
    "assets/tamil-nadu-road-sunset.jpg",
    "assets/chennai-tamil-nadu.jpg",
    "assets/tamil-nadu-landmarks.jpg"
];
const stages = ["Registered", "Assigned to officer", "Work in progress", "Resolved"];

// ---------- SMALL HELPERS ----------
function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t.timer);
    t.timer = setTimeout(() => t.classList.remove("show"), 3200);
}

function rotate(el, arr) {
    let i = 0;
    el.textContent = arr[0];
    setInterval(() => {
        el.style.opacity = 0;
        setTimeout(() => { i = (i + 1) % arr.length; el.textContent = arr[i]; el.style.opacity = 1; }, 400);
    }, 3600);
}

function slideshow(box) {
    photos.forEach(u => {
        const s = document.createElement("div");
        s.className = "slide";
        s.style.backgroundImage = "url('" + u + "')";
        box.appendChild(s);
    });
    let n = 0;
    const all = box.children;
    all[0].classList.add("on");
    setInterval(() => {
        all[n].classList.remove("on");
        n = (n + 1) % all.length;
        all[n].classList.add("on");
    }, 6000);
}

function countUp() {
    document.querySelectorAll("[data-n]").forEach(el => {
        const end = +el.dataset.n;
        let v = 0;
        const step = Math.max(1, Math.ceil(end / 40));
        const t = setInterval(() => { v = Math.min(end, v + step); el.textContent = v; if (v >= end) clearInterval(t); }, 40);
    });
}

// ---------- PAGES (login -> home -> complaint -> track) ----------
function go(v) {
    if (!load("session")) v = "login";
    document.querySelectorAll(".view").forEach(s => s.classList.toggle("on", s.id === v + "View"));
    document.querySelectorAll("nav [data-go]").forEach(b => b.classList.toggle("active", b.dataset.go === v));
    document.body.classList.toggle("out", v === "login");
    window.scrollTo(0, 0);
    if (v === "track") renderList();
}

function enterApp() {
    const user = load("session");
    $("who").textContent = user.name;
    $("cName").value = user.name;
    go("home");
}

// ---------- LOGIN / REGISTER ----------
function tab(which) {
    const login = which === "login";
    $("fLogin").hidden = !login;
    $("fReg").hidden = login;
    $("tLogin").classList.toggle("on", login);
    $("tReg").classList.toggle("on", !login);
    authMsg("");
}

function authMsg(text, bad) {
    const m = $("authMsg");
    m.textContent = text;
    m.className = "msg" + (bad ? " bad" : "");
}

function register(e) {
    e.preventDefault();
    const name = $("name").value.trim();
    const email = $("email").value.trim().toLowerCase();
    const password = $("password").value;
    const users = load("users") || [];

    if (users.some(u => u.email === email)) {
        authMsg("This email is already registered. Please login.", true);
        return;
    }
    users.push({ name, email, password });
    save("users", users);
    $("fReg").reset();
    tab("login");
    $("loginEmail").value = email;
    authMsg("Registration successful. Please login.");
}

function login(e) {
    e.preventDefault();
    const email = $("loginEmail").value.trim().toLowerCase();
    const password = $("loginPassword").value;
    const user = (load("users") || []).find(u => u.email === email && u.password === password);

    if (!user) {
        authMsg("Invalid email or password. New here? Click Register.", true);
        return;
    }
    save("session", { name: user.name, email: user.email });
    $("fLogin").reset();
    authMsg("");
    enterApp();
    toast("Welcome " + user.name);
}

function logout() {
    localStorage.removeItem("session");
    go("login");
}

// ---------- COMPLAINT ----------
function getLocation() {
    if (!navigator.geolocation) { toast("Location is not supported in this browser"); return; }
    navigator.geolocation.getCurrentPosition(pos => {
        $("cArea").value = "GPS: " + pos.coords.latitude.toFixed(5) + ", " + pos.coords.longitude.toFixed(5);
        toast("Location added. Please add the street name too.");
    }, () => toast("Could not get location. Please type your area."));
}

function preview(inputId, previewId) {
    const file = $(inputId).files[0];
    const el = $(previewId);
    if (!file) return;
    if (inputId === "video" && file.size > 25 * 1024 * 1024) {
        toast("Video is too big. Please choose one below 25 MB.");
        $(inputId).value = "";
        el.style.display = "none";
        return;
    }
    el.src = URL.createObjectURL(file);
    el.style.display = "block";
}

function pick(type) {
    $("cType").value = type;
    go("complaint");
}

// Makes a small copy of the photo so the officer can see it (localStorage is small)
function shrinkPhoto(file) {
    return new Promise(done => {
        if (!file) { done(""); return; }
        const reader = new FileReader();
        reader.onerror = () => done("");
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => done("");
            img.onload = () => {
                const k = Math.min(1, 700 / Math.max(img.width, img.height));
                const cv = document.createElement("canvas");
                cv.width = Math.round(img.width * k);
                cv.height = Math.round(img.height * k);
                cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
                done(cv.toDataURL("image/jpeg", 0.6));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

async function submitComplaint(e) {
    e.preventDefault();
    const phone = $("cPhone").value.trim();
    if (!/^[6-9]\d{9}$/.test(phone)) { toast("Enter a valid 10 digit mobile number"); $("cPhone").focus(); return; }

    const photo = $("photo").files[0];
    const video = $("video").files[0];
    const photoData = await shrinkPhoto(photo);
    const id = "TN-2026-" + Math.floor(1000 + Math.random() * 9000);
    const when = new Date().toLocaleString();

    const complaint = {
        id, owner: load("session").email, name: $("cName").value.trim(), phone,
        city: $("cCity").value, type: $("cType").value, priority: $("cPriority").value,
        area: $("cArea").value.trim(), letter: $("cLetter").value.trim(),
        photo: photo ? photo.name : "No photo", video: video ? video.name : "No video",
        photoData,
        status: 0, assignedTo: "", officerNote: "",
        history: [{ stage: 0, note: "Complaint registered by citizen", by: "Citizen", time: when }],
        date: when, time: Date.now()
    };
    try {
        addComplaint(complaint);                 // db.js: saves to localStorage
    } catch (err) {
        // storage full: try again without the photo copy
        complaint.photoData = "";
        try { addComplaint(complaint); } catch (err2) { toast("Browser storage is full. Could not save the complaint."); return; }
    }

    $("trackId").value = id;
    const done = $("done");
    done.hidden = false;
    done.innerHTML = "Complaint registered. Your Complaint ID<b>" + id + "</b>" +
        "<button type='button' class='btn small' onclick=\"go('track');trackComplaint()\">Track this complaint</button>";

    ["cArea", "cLetter", "photo", "video"].forEach(k => $(k).value = "");
    $("photoPreview").style.display = $("videoPreview").style.display = "none";
    toast("Complaint registered: " + id);
}

// ---------- TRACK ----------
// Status is now set by the officer on officer.html (same browser storage). Old complaints use the demo timer.
function stageOf(c) {
    // Real status set by the officer page. Old complaints without one fall back to the demo timer.
    if (typeof c.status === "number") return c.status;
    return Math.min(3, Math.floor((Date.now() - c.time) / 120000));
}

function trackComplaint() {
    const id = $("trackId").value.trim().toLowerCase();
    const c = findComplaint(id);                 // db.js
    const box = $("result");

    if (!id) { toast("Enter your Complaint ID"); return; }
    if (!c) { box.innerHTML = "<p class='msg bad'>Complaint not found. Check the ID and try again.</p>"; return; }

    const s = stageOf(c);
    const line = stages.map((t, i) => "<div class='" + (i < s ? "ok" : i === s ? "now" : "") + "'><i></i>" + t + "</div>").join("");
    box.innerHTML =
        "<div class='tl'>" + line + "</div>" +
        "<b>ID:</b> " + esc(c.id) + "<br><b>Problem:</b> " + esc(c.type) + " (" + esc(c.priority) + ")<br>" +
        "<b>City:</b> " + esc(c.city) + "<br><b>Area:</b> " + esc(c.area) + "<br>" +
        "<b>Letter:</b> " + esc(c.letter) + "<br><b>Photo:</b> " + esc(c.photo) + "<br><b>Video:</b> " + esc(c.video) + "<br>" +
        "<b>Date:</b> " + esc(c.date) + "<br><b>Status:</b> " + stages[s] +
        (c.assignedTo ? "<br><b>Assigned officer:</b> " + esc(c.assignedTo) : "") +
        (c.officerNote ? "<br><b>Officer remark:</b> " + esc(c.officerNote) : "");
}

function renderList() {
    const me = load("session");
    const mine = (load("complaints") || []).filter(c => c.owner === me.email).reverse();
    $("list").innerHTML = mine.length
        ? mine.map(c => "<button class='item' onclick=\"$('trackId').value='" + esc(c.id) + "';trackComplaint();window.scrollTo(0,0)\"><b>" +
            esc(c.id) + "</b><br>" + esc(c.type) + ", " + esc(c.city) + "<br><small>" + stages[stageOf(c)] + " | " + esc(c.date) + "</small></button>").join("")
        : "<p class='empty'>No complaints yet. Report your first problem.</p>";
}

// ---------- BUILD PAGE CONTENT ----------
$("problems").innerHTML = problems.map(p =>
    "<button class='pcard rv' onclick=\"pick('" + p.n + "')\"><svg viewBox='0 0 24 24'><path d='" + p.i + "'/></svg><b>" + p.n + "</b><span>" + p.d + "</span></button>").join("");
$("cType").innerHTML = "<option value=''>Select problem</option>" + problems.map(p => "<option>" + p.n + "</option>").join("");
$("cCity").innerHTML = "<option value=''>Select city</option>" + cities.map(c => "<option>" + c + "</option>").join("");
$("marq").innerHTML = (problems.map(p => "<span>" + p.n + "</span>").join("")).repeat(2);
document.querySelector("[data-n='9']").dataset.n = problems.length;
document.querySelector("[data-n='20']").dataset.n = cities.length;

document.querySelectorAll(".slides").forEach(slideshow);
rotate($("rot1"), loginLines);
rotate($("rot2"), heroLines);

let q = 0;
setInterval(() => {
    const box = $("quote");
    box.style.opacity = 0;
    setTimeout(() => { q = (q + 1) % quotes.length; box.textContent = quotes[q]; box.style.opacity = 1; }, 500);
}, 4500);

// reveal on scroll (used for problem cards, gallery, kural)
document.querySelectorAll(".gallery .ph, .kural, .steps div").forEach(el => el.classList.add("rv"));
const watcher = new IntersectionObserver(items => items.forEach(i => { if (i.isIntersecting) i.target.classList.add("show"); }), { threshold: 0.15 });
document.querySelectorAll(".rv").forEach(el => watcher.observe(el));

countUp();
if (load("session")) enterApp(); else go("login");
