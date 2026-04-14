require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const BOT_TOKEN = process.env.BOT_TOKEN; // tylko raz!
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActivityType,
  Collection,
  REST,
  Routes
} = require('discord.js');



const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.once("clientReady", () => {
    console.log(`🤖 Bot online jako ${client.user.tag}`);
});

const userLevels = new Map();

const levels = [
    "MINUS 3/3",
    "MINUS 2/3",
    "MINUS 1/3",
    "Brak plusów/minusów",
    "PLUS 1/6",
    "PLUS 2/6",
    "PLUS 3/6",
    "PLUS 4/6",
    "PLUS 5/6",
    "PLUS 6/6"
];

const ACTIONS = {
    plus: "plus",
    minus: "minus",
    fire: "zwolnij"
};

const AWANSE_DEGRADY_LOG_CHANNEL = "1254576741003821106";

client.login(BOT_TOKEN);

const app = express();

app.use(cors());
app.use(express.json());

const GUILD_ID = "1163522282010976277";
const ROLE_ZARZAD = "1395064937520435413";
const ROLE_PRACOWNIK = "1395077434621038722";
const ROLE_ZARZAD_1 = "1395064937520435413";
const ROLE_ZARZAD_2 = "1418257931287265341";


const ROLE_NAMES = {
    "1395071544182444134": { name: "⎩👑⎫ Właściciel", color: "#ffcc00" },
    "1165761536539775048": { name: "⎩👑⎫ Szef", color: "#ffcc00" },
    "1165761584585527377": { name: "⎩👑⎫ Zastępca Szefa", color: "#c37827" },
    "1461495953843290270": { name: "⎩✍⎫ Sekretarka", color: "#5a0101" },
    "1395064313085034496": { name: "⎩🛠️⎫ Koordynator", color: "#902b2b" },
    "1395064166389387437": { name: "⎩🔧⎫ Jr.Koordynator", color: "#b33a3a" },
    "1395063470663401554": { name: "⎩⚒️⎫ Specjalista", color: "#9e2f2f" },
    "1395063100675330152": { name: "⎩🔧⎫ Zawodowiec", color: "#b33a3a" },
    "1395062055341396020": { name: "⎩🛠️⎫ Fachowiec", color: "#cc5c5c" },
    "1395062717919793272": { name: "⎩🔧⎫ Majster", color: "#e28a8a" },
    "1395062497802846248": { name: "⎩👨‍🔧⎫ Nowicjusz", color: "#f6b5b5" },
};

function getMinusLevel(userId) {
    const current = userLevels.get(userId) || 0;
    const next = Math.min(current + 1, 3);
    userLevels.set(userId, next);
    return next;
}

function isZarzad(member) {
    return member.roles?.includes(ROLE_ZARZAD_1) ||
           member.roles?.includes(ROLE_ZARZAD_2);
}

function getUserRole(member) {
    const roles = member.roles || [];

    for (const roleId of roles) {
        if (ROLE_NAMES[roleId]) {
            return ROLE_NAMES[roleId];
        }
    }

    return { name: "Brak rangi", color: "#ffffff" };
}

console.log("BOT_TOKEN:", process.env.BOT_TOKEN ? "OK" : "BRAK");
console.log("TOKEN LENGTH:", BOT_TOKEN?.length);

const Papa = require("papaparse");

app.get("/api/podania", async (req, res) => {
    try {
        const response = await axios.get(
            "https://docs.google.com/spreadsheets/d/e/2PACX-1vR9zWXXafdHqJIYho5uzgjSCwnieql8w5ppLgKu9pbqYZ8fcUepOoYLOeO8U4CsrFI14IoI338_gFTZ/pub?output=csv"
        );

        const parsed = Papa.parse(response.data, {
            header: true,
            skipEmptyLines: true
        });

const podania = parsed.data.map(row => {
    const values = Object.values(row);

    return {
        serwer: values[1],
        nick: values[2],
        godziny: values[3],
        mutacja: values[4],
        wiek: values[5],
        doswiadczenie: values[6],
        wiekIC: values[7]
    };
});

        res.json(podania);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/action", async (req, res) => {
    const { type, userId, reason, executorId } = req.body;

    if (!executorId) {
        return res.status(401).json({ error: "Nie zalogowany" });
    }

    try {
        if (type === "plus") await givePlus(userId, reason, executorId);
        if (type === "minus") await giveMinus(userId, reason, executorId);
        if (type === "fire") await fireUser(userId, reason, executorId);
        if (type === "awans") await giveAwans(userId, reason, executorId);
        if (type === "degrad") await giveDegrad(userId, reason, executorId);

        res.json({ ok: true });

    } catch (e) {
        console.log(e);
        res.status(500).json({ error: e.message });
    }
});

app.get("/test", async (req, res) => {
    try {
        const r = await axios.get("https://discord.com/api/v10/users/@me", {
            headers: {
                Authorization: `Bot ${BOT_TOKEN}`
            }
        });

        res.json(r.data);
    } catch (e) {
        res.json({
            error: e.response?.data || e.message
        });
    }
});

function extractNumber(nick) {
    const match = nick.match(/\d+/g);
    if (!match) return null; // brak numeru
    return parseInt(match[match.length - 1]);
}

// 🔥 API PRACOWNICY
app.get("/api/pracownicy", async (req, res) => {
    try {

        let allMembers = [];
        let after = undefined;

        // 🔥 POBIERANIE DISCORDA
        while (true) {
            const url = after
                ? `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000&after=${after}`
                : `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bot ${BOT_TOKEN}` }
            });

            const members = response.data;

            if (!members.length) break;

            allMembers.push(...members);

            after = members[members.length - 1].user.id;

            if (members.length < 1000) break;
        }

        // 🔥 TU ROBIMY LISTY (WAŻNE!)
        const zarzadList = allMembers.filter(m => isZarzad(m));

        const pracownicyList = allMembers.filter(m =>
            m.roles?.includes(ROLE_PRACOWNIK)
        );

        // 🔥 MAPOWANIE PRACOWNIKÓW
        const pracownicy = pracownicyList.map(m => {
            const role = getUserRole(m);

            return {
                username: m.user.username,
                nick: m.nick || m.user.username,
                avatar: m.user.avatar,
                id: m.user.id,
                role: role.name,
                color: role.color
            };
        });

        // 🔥 SORTOWANIE
        pracownicy.sort((a, b) => {

            const order = Object.keys(ROLE_NAMES);

            const aRole = order.findIndex(id => ROLE_NAMES[id].name === a.role);
            const bRole = order.findIndex(id => ROLE_NAMES[id].name === b.role);

            if (aRole !== bRole) return aRole - bRole;

            const aNum = extractNumber(a.nick);
            const bNum = extractNumber(b.nick);

            if (aNum === null && bNum === null) return 0;
            if (aNum === null) return -1;
            if (bNum === null) return 1;

            return aNum - bNum;
        });

        // 🔥 ODPOWIEDŹ DO FRONTENDU
        res.json({
            zarzad: zarzadList.length,
            pracownicy: pracownicyList.length,
            users: pracownicy
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

app.post("/api/wynik", async (req, res) => {
    const { userId, nick, wynik, powod, executorId } = req.body;

    try {
        const guild = await client.guilds.fetch(GUILD_ID);

        let member = null;

        // 🔥 1. próbuj po ID
        if (userId) {
            member = await guild.members.fetch(userId).catch(() => null);
        }

        // 🔥 2. jak nie ma → szukaj po nicku
        if (!member && nick) {
            const members = await guild.members.fetch();

            member = members.find(m =>
                m.user.username.toLowerCase().includes(nick.toLowerCase()) ||
                (m.nick && m.nick.toLowerCase().includes(nick.toLowerCase()))
            );
        }

        if (!member) {
            return res.status(404).json({ error: "Nie znaleziono użytkownika" });
        }

        const channel = guild.channels.cache.get("ID_KANAŁU_LOGI_WYNIK");

        let message = "";

        if (wynik === "przyjete") {
            message = `<@${member.id}> Twoje podanie zostało przyjęte ✅\n-# Sprawdzone przez <@${executorId}>`;

            const etap1 = guild.roles.cache.get("ID_ROLI_ETAP1");
            const obywatel = guild.roles.cache.get("ID_ROLI_OBYWATEL");

            if (etap1) await member.roles.add(etap1).catch(()=>{});
            if (obywatel) await member.roles.add(obywatel).catch(()=>{});

        } else {
            message = `<@${member.id}> Twoje podanie zostało odrzucone ❌ ${powod || ""}\n-# Sprawdzone przez <@${executorId}>`;
        }

        await channel.send(message);

        res.json({ ok: true });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

async function givePlus(userId, reason, executorId) {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(userId);

        const roles = member.roles.cache;

        let current = levels.findIndex(level =>
            roles.some(r => r.name?.trim() === level)
        );

        if (current === -1) {
            current = levels.indexOf("Brak plusów/minusów");
        }

        const newLevel = Math.min(levels.length - 1, current + 1);

        const oldRoleName = levels[current];
        const newRoleName = levels[newLevel];

        if (oldRoleName && oldRoleName !== "Brak plusów/minusów") {
            const oldRole = guild.roles.cache.find(r => r.name === oldRoleName);
            if (oldRole) await member.roles.remove(oldRole).catch(() => {});
        }

        if (newRoleName && newRoleName !== "Brak plusów/minusów") {
            const newRole = guild.roles.cache.find(r => r.name === newRoleName);
            if (newRole) await member.roles.add(newRole).catch(() => {});
        }

        const channel = guild.channels.cache.get(LOG_CHANNEL);

        if (channel) {
            const embed = new EmbedBuilder()
                .setTitle("Plus")
                .setColor(0x00ff00)
                .addFields(
                    { name: "Kto", value: `<@${executorId}>` },
                    { name: "Komu", value: `<@${userId}>` },
                    { name: "Status", value: newRoleName || "Brak" },
                    { name: "Powód", value: reason || "Brak powodu" }
                )
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        }

        console.log("PLUS OK:", userId, "->", newRoleName);

    } catch (err) {
        console.error("givePlus ERROR:", err);
    }
}

const LOG_CHANNEL = "1163540961570328576";
const ROLE_OBYWATEL = "1163551673659175014";
const FIRE_LOG_CHANNEL = "1254576091134431352";

async function giveAwans(userId, reason, executorId) {
    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(userId);

    const rangi = [
        "⎩👨‍🔧⎫ Nowicjusz",
        "⎩🔧⎫ Majster",
        "⎩🛠️⎫ Fachowiec",
        "⎩🔧⎫ Zawodowiec",
        "⎩⚒️⎫ Specjalista",
        "⎩🔧⎫ Jr.Koordynator",
        "⎩🛠️⎫ Koordynator"
    ];

    const roles = member.roles.cache;

    let current = rangi.findIndex(r =>
        roles.some(x => x.name === r)
    );

    if (current === -1) return;

    if (current >= rangi.length - 1) return;

    const oldRole = guild.roles.cache.find(r => r.name === rangi[current]);
    const newRole = guild.roles.cache.find(r => r.name === rangi[current + 1]);

    if (oldRole) await member.roles.remove(oldRole).catch(() => {});
    if (newRole) await member.roles.add(newRole).catch(() => {});

    const channel = guild.channels.cache.get(AWANSE_DEGRADY_LOG_CHANNEL);

    if (channel) {
        const embed = new EmbedBuilder()
            .setTitle("Awans")
            .setColor(0x00ff00)
            .addFields(
                { name: "Kto:", value: `<@${executorId}>` },
                { name: "Komu:", value: `<@${userId}>` },
                { name: "Na co:", value: newRole?.name || "Brak" },
                { name: "Za co:", value: reason || "Brak" }
            )
            .setTimestamp();

        channel.send({ embeds: [embed] });
    }
}

let newRole = null;

async function giveDegrad(userId, reason, executorId) {
    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(userId);

    const rangi = [
        "⎩👨‍🔧⎫ Nowicjusz",
        "⎩🔧⎫ Majster",
        "⎩🛠️⎫ Fachowiec",
        "⎩🔧⎫ Zawodowiec",
        "⎩⚒️⎫ Specjalista",
        "⎩🔧⎫ Jr.Koordynator",
        "⎩🛠️⎫ Koordynator"
    ];

    const roles = member.roles.cache;

    let current = rangi.findIndex(r =>
        roles.some(x => x.name === r)
    );

    if (current === -1) return;

    const newIndex = Math.max(0, current - 1);

    const oldRole = guild.roles.cache.find(r => r.name === rangi[current]);
    const newRole = guild.roles.cache.find(r => r.name === rangi[newIndex]);

    // 🔥 usuń starą
    if (oldRole) await member.roles.remove(oldRole).catch(() => {});

    // 🔥 dodaj nową (jeśli istnieje)
    if (newRole) await member.roles.add(newRole).catch(() => {});

    const channel = guild.channels.cache.get(AWANSE_DEGRADY_LOG_CHANNEL);

    if (channel) {
        const embed = new EmbedBuilder()
            .setTitle("Degrad")
            .setColor(0xff0000)
            .addFields(
                { name: "Kto:", value: `<@${executorId}>` },
                { name: "Komu:", value: `<@${userId}>` },
                { name: "Na co:",
                  value: newRole ? `<@&${newRole.id}>` : "Brak (najniższa ranga)"
                },
                { name: "Za co:", value: reason || "Brak" }
            )
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }
}

async function giveMinus(userId, reason, executorId) {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(userId);

        const roles = member.roles.cache;

        // znajdź aktualny poziom po nazwie roli
        let current = levels.findIndex(level =>
            roles.some(r => r.name === level)
        );

        // jeśli nie ma żadnego poziomu → ustaw środek
        if (current === -1) {
            current = levels.indexOf("Brak plusów/minusów");
        }

        // cofamy poziom
        const newLevel = Math.max(0, current - 1);

        const oldRoleName = levels[current];
        const newRoleName = levels[newLevel];

        // usuń starą rolę
        if (oldRoleName && oldRoleName !== "Brak plusów/minusów") {
            const oldRole = guild.roles.cache.find(r => r.name === oldRoleName);
            if (oldRole) {
                await member.roles.remove(oldRole).catch(() => {});
            }
        }

        // dodaj nową rolę
        if (newRoleName && newRoleName !== "Brak plusów/minusów") {
            const newRole = guild.roles.cache.find(r => r.name === newRoleName);
            if (newRole) {
                await member.roles.add(newRole).catch(() => {});
            }
        }

        // logi
        const channel = guild.channels.cache.get(LOG_CHANNEL);

        if (channel) {
            const embed = new EmbedBuilder()
                .setTitle("Minus")
                .setColor(0xff0000)
                .addFields(
                    { name: "Kto", value: `<@${executorId}>`, inline: false },
                    { name: "Komu", value: `<@${userId}>`, inline: false },
                    { name: "Status", value: newRoleName || "Brak plusów/minusów", inline: false },
                    { name: "Powód", value: reason || "Brak powodu" }
                )
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        }

        console.log("MINUS OK:", userId, "->", newRoleName);

    } catch (err) {
        console.error("giveMinus ERROR:", err);
    }
}

async function fireUser(userId, reason, executorId) {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(userId);

        const channel = guild.channels.cache.get(FIRE_LOG_CHANNEL);
        const obywatelRole = guild.roles.cache.get(ROLE_OBYWATEL);

        if (!obywatelRole) {
            console.log("❌ Brak roli Obywatel");
            return;
        }

        // 🔥 usuń wszystkie role (oprócz @everyone)
        const rolesToRemove = member.roles.cache.filter(r => r.id !== guild.id);
        await member.roles.remove(rolesToRemove).catch(() => {});

        // 🔥 nadaj Obywatela
        await member.roles.add(obywatelRole).catch(() => {});

        // 🔥 DM
        try {
            const dmEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Zwolnienie')
                .setDescription(`Zostałeś **zwolniony** z firmy **RedLine Mechanic**.`)
                .addFields(
                    { name: 'Zwolnił:', value: `<@${executorId}>` },
                    { name: 'Powód:', value: reason || "Brak powodu" }
                )
                .setFooter({ text: 'RedLine Mechanic - Zarząd' })
                .setTimestamp();

            await member.user.send({ embeds: [dmEmbed] });
        } catch {
            console.log("⚠️ Nie można wysłać DM");
        }

        // 🔥 LOGI NA TWÓJ KANAŁ
        if (channel) {
            const logEmbed = new EmbedBuilder()
                .setTitle("Zwolnienie")
                .setColor(0xff0000)
                .addFields(
                    { name: "Kto:", value: `<@${executorId}>` },
                    { name: "Komu", value: `<@${userId}>` },
                    { name: "Powód:", value: reason || "Brak powodu" }
                )
                .setTimestamp();

            await channel.send({ embeds: [logEmbed] });
        }

        console.log("FIRE OK:", userId);

    } catch (err) {
        console.error("fireUser ERROR:", err);
    }
}


// 🔐 LOGIN DISCORD
app.get("/auth/discord", async (req, res) => {
    const code = req.query.code;
    if (!code) return res.redirect("https://redline.umod.pl");

    try {
        const tokenRes = await axios.post(
            "https://discord.com/api/oauth2/token",
            new URLSearchParams({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.REDIRECT_URI,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const access_token = tokenRes.data.access_token;

        const userRes = await axios.get("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const guildMember = await axios.get(
            `https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`,
            { headers: { Authorization: `Bearer ${access_token}` } }
        ).catch(() => null);

        const roles = guildMember?.data?.roles || [];

        const user = {
            ...userRes.data,
            roles,
            isZarzad: roles.includes(ROLE_ZARZAD),
            isPracownik: roles.includes(ROLE_PRACOWNIK),
        };

        res.redirect(
            `https://redline.umod.pl/index.html?user=${encodeURIComponent(JSON.stringify(user))}`
        );

    } catch (err) {
        console.log(err.response?.data || err.message);
        res.redirect("https://redline.umod.pl");
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server działa na", PORT);
});