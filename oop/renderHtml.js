"use strict";

import { mainMap } from "./initial_mapping.js";
import { gambarBidak } from "./fungsi_dari_bidak/pawn_function.js";
import { langkahLegal, jalankanLangkah, statusPermainan, cariRaja } from "./aturan.js";
import { pilihLangkahBot } from "./bot.js";


const kontainer = document.querySelector(".kontainer-utama");
const statusEl = document.querySelector(".status");
const giliranEl = document.querySelector(".teks-giliran");
const jamEl = {
    white: document.querySelector(".jam-white"),
    black: document.querySelector(".jam-black"),
};

const WAKTU_AWAL_MENIT = 10;
const NAMA = { white: "Putih", black: "Hitam" };
const BOT = "black";
const KECEPATAN_BOT = 2;
const board = mainMap.map((baris) => baris.map((k) => k.piece || null));

const state = {
    giliran: "white",
    terpilih: null,   
    langkah: [],     
    ep: null,        
    status: "normal",
    selesai: false,
    menungguPromosi: false,
    sisa: { white: WAKTU_AWAL_MENIT * 60 * 1000, black: WAKTU_AWAL_MENIT * 60 * 1000 }, 
    jalan: false,     
};
let terakhirTick = 0;
let lapisanPromosi = null;

function sinkronkanMapping() {
    mainMap.forEach((baris, r) => baris.forEach((kotak, c) => {
        kotak.piece = board[r][c];
        kotak.isPiece = board[r][c] ? gambarBidak(board[r][c]) : undefined;
    }));
}

function teksStatus() {
    const nama = NAMA[state.giliran];
    switch (state.status) {
        case "waktu-habis": return `Waktu ${nama} habis! ${NAMA[state.giliran === "white" ? "black" : "white"]} menang.`;
        case "skakmat": return `Skakmat! ${NAMA[state.giliran === "white" ? "black" : "white"]} menang.`;
        case "remis-pat": return "Remis (pat): tidak ada langkah legal.";
        case "remis-material": return "Remis: material tidak cukup untuk skakmat.";
        case "skak": return `Giliran ${nama} – SKAK!`;
        default: return `Giliran ${nama}`;
    }
}

function teksGiliran() {
    const nama = NAMA[state.giliran];
    const lawan = NAMA[state.giliran === "white" ? "black" : "white"];
    switch (state.status) {
        case "skakmat": return `Skakmat! ${lawan} menang`;
        case "remis-pat":
        case "remis-material": return "Remis";
        case "waktu-habis": return `Waktu habis! ${lawan} menang`;
        case "skak": return `Giliran: ${nama} (Skak!)`;
        default: return `Giliran: ${nama}`;
    }
}

function formatWaktu(ms) {
    const detik = Math.max(0, Math.ceil(ms / 1000));
    const m = String(Math.floor(detik / 60)).padStart(2, "0");
    const d = String(detik % 60).padStart(2, "0");
    return `${m}:${d}`;
}

function updateJam() {
    for (const warna of ["white", "black"]) {
        const el = jamEl[warna];
        if (!el) continue;
        el.querySelector(".jam-waktu").textContent = formatWaktu(state.sisa[warna]);
        el.classList.toggle("aktif", !state.selesai && state.giliran === warna);
        el.classList.toggle("rendah", state.sisa[warna] <= 30000);
    }
}

function updateInfo() {
    if (giliranEl) giliranEl.textContent = teksGiliran();
    updateJam();
}

function tick() {
    if (!state.jalan || state.selesai) return;
    const sekarang = performance.now();
    state.sisa[state.giliran] -= sekarang - terakhirTick;
    terakhirTick = sekarang;

    if (state.sisa[state.giliran] <= 0) {
        state.sisa[state.giliran] = 0;
        state.selesai = true;
        state.status = "waktu-habis";
        state.terpilih = null;
        state.langkah = [];
        state.menungguPromosi = false;
        if (lapisanPromosi) { lapisanPromosi.remove(); lapisanPromosi = null; }
        renderUI();
        return;
    }
    updateJam();
}

function renderUI() {
    kontainer.innerHTML = "";
    statusEl.textContent = teksStatus();
    updateInfo();

    const rajaSkak = (state.status === "skak" || state.status === "skakmat")
        ? cariRaja(board, state.giliran) : null;

    mainMap.forEach((baris, r) => {
        const rank = document.createElement("div");
        rank.classList.add("rank-style");
        rank.setAttribute("rank", 8 - r);

        baris.forEach((el, c) => {
            const kotak = document.createElement("div");
            kotak.classList.add(`color-${el.color}`, "square-common", "file-" + el.id[0]);
            kotak.setAttribute("id", el.id);

            const piece = board[r][c];
            if (piece) {
                const pieceElement = document.createElement("div");
                const img = document.createElement("img");
                img.setAttribute("src", gambarBidak(piece));
                img.setAttribute("draggable", "false");
                pieceElement.appendChild(img);
                kotak.appendChild(pieceElement);
                if (piece.color === state.giliran && !state.selesai) kotak.classList.add("bisa-diklik");
            }

            if (state.terpilih && state.terpilih.r === r && state.terpilih.c === c) kotak.classList.add("terpilih");
            if (rajaSkak && rajaSkak.r === r && rajaSkak.c === c) kotak.classList.add("skak");

            const tujuan = state.langkah.find((m) => m.r === r && m.c === c);
            if (tujuan) {
                kotak.classList.add("bisa-diklik");
                if (piece || tujuan.special === "ep") {
                    kotak.classList.add("tangkap");          
                } else {
                    kotak.classList.add("flex");
                    const bulatan = document.createElement("div");
                    bulatan.classList.add("circle");          
                    kotak.appendChild(bulatan);
                }
            }

            kotak.addEventListener("click", () => klikPetak(r, c));
            rank.appendChild(kotak);
        });
        kontainer.appendChild(rank);
    });
}

function klikPetak(r, c) {
    if (state.selesai || state.menungguPromosi || state.giliran === BOT) return;

    const tujuan = state.langkah.find((m) => m.r === r && m.c === c);
    if (state.terpilih && tujuan) {
        lakukanLangkah(state.terpilih, tujuan);
        return;
    }

    const piece = board[r][c];
    const sama = state.terpilih && state.terpilih.r === r && state.terpilih.c === c;
    if (piece && piece.color === state.giliran && !sama) {
        state.terpilih = { r, c };
        state.langkah = langkahLegal(board, r, c, state.ep);
    } else {
        state.terpilih = null;
        state.langkah = [];
    }
    renderUI();
}

function lakukanLangkah(dari, langkah) {
    if (langkah.promotion) {
        state.menungguPromosi = true;
        tampilkanPilihanPromosi(state.giliran, (tipe) => {
            state.menungguPromosi = false;
            selesaikanLangkah(dari, langkah, tipe);
        });
        return;
    }
    selesaikanLangkah(dari, langkah, "queen");
}

function selesaikanLangkah(dari, langkah, promosiKe) {
    if (state.selesai) return;   
    tick();                      
    if (state.selesai) return;
    if (!state.jalan) {         
        state.jalan = true;
        terakhirTick = performance.now();
    }
    state.ep = jalankanLangkah(board, dari, langkah, promosiKe);
    state.giliran = state.giliran === "white" ? "black" : "white";
    state.terpilih = null;
    state.langkah = [];
    state.status = statusPermainan(board, state.giliran, state.ep);
    state.selesai = ["skakmat", "remis-pat", "remis-material"].includes(state.status);
    sinkronkanMapping();
    renderUI();
    jadwalkanBot();
}
function jadwalkanBot(){
    if (state.selesai || state.giliran !== BOT) return;
    setTimeout(() => {
        if (state.selesai || state.menungguPromosi) return;
        const pilihan = pilihLangkahBot(board, BOT, state.ep, KECEPATAN_BOT);
        if (pilihan) selesaikanLangkah(pilihan.dari, pilihan.m, "queen");
    }, 250);
}

function tampilkanPilihanPromosi(warna, callback) {
    const lapisan = document.createElement("div");
    lapisan.classList.add("promosi-lapisan");
    const kotakPilihan = document.createElement("div");
    kotakPilihan.classList.add("promosi-kotak");
    ["queen", "rook", "bishop", "knight"].forEach((tipe) => {
        const tombol = document.createElement("button");
        tombol.type = "button";
        tombol.title = tipe;
        const img = document.createElement("img");
        img.src = gambarBidak({ color: warna, type: tipe });
        tombol.appendChild(img);
        tombol.addEventListener("click", () => {
            lapisan.remove();
            lapisanPromosi = null;
            callback(tipe);
        });
        kotakPilihan.appendChild(tombol);
    });
    lapisan.appendChild(kotakPilihan);
    document.body.appendChild(lapisan);
    lapisanPromosi = lapisan;
}

document.querySelector(".tombol-ulang")?.addEventListener("click", () => location.reload());

setInterval(tick, 200);
renderUI();
