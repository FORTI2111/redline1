let USERS = [];
let PODANIA = [];
let currentIndex = 0;

console.log("URL:", window.location.href);
console.log("RAW PARAM:", new URLSearchParams(window.location.search).get("user"));
console.log("LOCALSTORAGE:", localStorage.getItem("user"));

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("user"));
    } catch {
        return null;
    }
}

function openPodanie(index) {
    currentIndex = index;
    const p = PODANIA[index];

    document.getElementById("p-serwer").textContent = p.serwer || "Brak odpowiedzi";
    document.getElementById("p-nick").textContent = p.nick || "Brak odpowiedzi";
    document.getElementById("p-godziny").textContent = p.godziny || "Brak odpowiedzi";
    document.getElementById("p-mutacja").textContent = p.mutacja || "Brak odpowiedzi";
    document.getElementById("p-wiek").textContent = p.wiek || "Brak odpowiedzi";
    document.getElementById("p-doswiadczenie").textContent = p.doswiadczenie || "Brak odpowiedzi";
    document.getElementById("p-wiekic").textContent = p.wiekIC || "Brak odpowiedzi";

    document.getElementById("podanie-viewer").style.display = "flex";
}

function nextPodanie() {
    if (currentIndex < PODANIA.length - 1) {
        currentIndex++;
        openPodanie(currentIndex);
    }
}

function prevPodanie() {
    if (currentIndex > 0) {
        currentIndex--;
        openPodanie(currentIndex);
    }
}

function closeViewer() {
    document.getElementById("podanie-viewer").style.display = "none";
}

function getAvatar(user) {
    return user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/0.png`;
}

const clickSound = new Audio("https://www.myinstants.com/media/sounds/click.mp3");

const hoverSound = new Audio("https://www.myinstants.com/media/sounds/click.mp3");

function addHoverSound(el) {
    el.addEventListener("mouseenter", () => {
        hoverSound.currentTime = 0;
        hoverSound.play().catch(()=>{});
    });
}


window.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get("user");

    // 1. Jeśli przyszedł z loginu (?user=...)
    if (userParam) {
        try {
            const user = JSON.parse(decodeURIComponent(userParam));

            localStorage.setItem("user", JSON.stringify(user));

            console.log("✅ ZALOGOWANO:", user);
        } catch (e) {
            console.log("❌ BŁĄD LOGINU:", e);
        }

        // czyści URL
        window.history.replaceState({}, document.title, "/zarzad.html");
    }

    // 2. sprawdzamy czy user istnieje
    const user = getUser();

    if (!user || !user.id) {
        alert("Nie jesteś zalogowany!");
        window.location.href = "/index.html";
        return;
    }

    console.log("✅ USER OK:", user);
});

clickSound.addEventListener("error", () => {
    console.log("❌ audio nie działa");
});

clickSound.addEventListener("canplay", () => {
    console.log("✅ audio gotowe");
});

function createUser(user, query = "") {
    const div = document.createElement("div");

    div.className = "user fade-item";
    div.style.borderLeft = `5px solid ${user.color}`;

    div.innerHTML = `
        <img src="${getAvatar(user)}" class="avatar">
    
        <div style="flex:1">
            <span>${highlight(user.nick, query)}</span>
            <small style="opacity:0.6">(${highlight(user.username, query)})</small>
            <p style="color:${user.color}; margin:0">${user.role}</p>
    
            <div class="actions">
                <button onclick="action('plus','${user.id}')">➕</button>
                <button onclick="action('minus','${user.id}')">➖</button>
                <button onclick="action('awans','${user.id}')">⬆ AWANS</button>
                <button onclick="action('degrad','${user.id}')">⬇ DEGRAD</button>
                <button onclick="action('fire','${user.id}')">❌</button>
            </div>
        </div>
    `;

    return div;
}

function highlight(text, query) {
    if (!query) return text;

    const safe = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const regex = new RegExp(`(${query})`, "gi");

    return safe.replace(regex, `<span class="highlight">$1</span>`);
}

function render(list, query = "") {
    const container = document.getElementById("pracownicy-list");
    container.innerHTML = "";

    list.forEach(user => {
        const div = document.createElement("div");

        div.className = "user fade-item";
        div.style.borderLeft = `5px solid ${user.color}`;

        div.innerHTML = `
            <img src="${getAvatar(user)}" class="avatar">
        
            <div style="flex:1">
                <span>${highlight(user.nick, query)}</span>
                <small style="opacity:0.6">(${highlight(user.username, query)})</small>
                <p style="color:${user.color}; margin:0">${user.role}</p>
        
                <div class="actions">
                    <button onclick="action('plus','${user.id}')">➕ PLUS</button>
                    <button onclick="action('minus','${user.id}')">➖ MINUS</button>
                    <button onclick="action('awans','${user.id}')">⬆ AWANS</button>
                    <button onclick="action('degrad','${user.id}')">⬇ DEGRAD</button>
                    <button onclick="action('fire','${user.id}')">❌ ZWOLNIJ</button>
                </div>
            </div>
        `;

        container.appendChild(div);
    });
}

async function load() {
    const res = await fetch("https://redline.umod.pl/api/pracownicy");
    const data = await res.json();

    USERS = data.users;

    document.getElementById("zarzad-count").textContent = data.zarzad;
    document.getElementById("pracownicy-count").textContent = data.pracownicy;

    render(USERS);
}

function liczPodatek() {
    const koniec = parseFloat(document.getElementById("koniec").value) || 0;
    const wyplaty = parseFloat(document.getElementById("wyplaty").value) || 0;

    const step1 = koniec * 0.25;
    const step2 = step1 + wyplaty;
    const podatek = step2 * 0.12;

    // reset
    document.getElementById("step1").textContent = "";
    document.getElementById("step2").textContent = "";
    document.getElementById("step3").textContent = "";
    document.getElementById("podatek").textContent = "0$";

    // 🔥 ANIMACJA KROK PO KROKU
    setTimeout(() => {
        document.getElementById("step1").textContent =
            `1️⃣ 25% z ${koniec} = ${step1.toFixed(2)}`;
    }, 200);

    setTimeout(() => {
        document.getElementById("step2").textContent =
            `2️⃣ + wypłaty (${wyplaty}) = ${step2.toFixed(2)}`;
    }, 800);

    setTimeout(() => {
        document.getElementById("step3").textContent =
            `3️⃣ 12% podatku = ${podatek.toFixed(2)}`;
    }, 1400);

    setTimeout(() => {
        animateMoney(0, podatek, 1000);
    }, 1800);
}

function animateMoney(start, end, duration) {
    const el = document.getElementById("podatek");

    el.classList.add("animating");

    let startTime = null;

    function update(timestamp) {
        if (!startTime) startTime = timestamp;

        const progress = Math.min((timestamp - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        const value = start + (end - start) * ease;

        el.textContent = value.toFixed(2) + "$";

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.classList.remove("animating");
        }
    }

    requestAnimationFrame(update);
}

// 🔄 live update
document.addEventListener("input", (e) => {
    if (e.target.id === "koniec" || e.target.id === "wyplaty") {
        liczPodatek();
    }
});

function action(type, userId) {
    const reason = prompt(`Powód ${type.toUpperCase()}:`);
    if (!reason) return;

    const user = getUser(); // 👈 TU

    if (!user || !user.id) {
        alert("Nie jesteś zalogowany!");
        return;
    }

    fetch("https://redline.umod.pl/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            type,
            userId,
            reason,
            executorId: user.id
        })
    });
}

// 🔍 LIVE SEARCH (lepsze niż Twoje stare)
const search = document.getElementById("search");

if (search) {
    search.addEventListener("input", function () {
        const value = this.value.toLowerCase();

        const filtered = USERS.filter(user =>
            `${user.nick} ${user.username} ${user.role}`.toLowerCase().includes(value)
        );

        render(filtered, value);
    });
}

window.addEventListener("load", () => {
    setTimeout(() => {
        document.getElementById("boot").style.opacity = "0";
        document.getElementById("boot").style.transition = "0.5s";

        setTimeout(() => {
            document.getElementById("boot").remove();
        }, 600);
    }, 1200);
});

async function loadPodania() {
    try {
        const res = await fetch("https://redline.umod.pl/api/podania");
        const data = await res.json();

        PODANIA = data;

        renderPodania(PODANIA);

    } catch (e) {
        console.log("Błąd podania:", e);
    }
}

function renderPodania(list) {
    const container = document.getElementById("podania-list");
    container.innerHTML = "";

    list.forEach((p, index) => {
        const div = document.createElement("div");

        div.className = "user fade-item";

        div.innerHTML = `
            <div style="flex:1">
                <b>${p.name}</b> (${p.age})
                <p style="opacity:0.7">${p.reason}</p>
            </div>

            <button class="btn" onclick="openPodanie(${index})">
                Sprawdź
            </button>
        `;

        container.appendChild(div);
    });
}

console.log("LOCALSTORAGE USER:", localStorage.getItem("user"));

// 🔄 LIVE UPDATE
setInterval(load, 30000);

load();
loadPodania();