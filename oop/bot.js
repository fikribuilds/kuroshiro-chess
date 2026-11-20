import { langkahLegal, jalankanLangkah, sedangSkak } from "./aturan.js";

const NILAI = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 0 };
const SKOR_MAT = 50000;
const lawan = (w) => (w === "white" ? "black" : "white");

function semuaLangkah(board, warna, ep) {
    const hasil = [];
    for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.color === warna)
                for (const m of langkahLegal(board, r, c, ep)) hasil.push({ dari: { r, c }, m });
        }
    return hasil;
}

function evaluasi(board) {
    let skor = 0;
    for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (!p) continue;
            let n = NILAI[p.type];
            if (p.type !== "king" && p.type !== "rook")
                n += 4 * (3.5 - Math.max(Math.abs(r - 3.5), Math.abs(c - 3.5)));
            if (p.type === "pawn") n += (p.color === "white" ? 6 - r : r - 1) * 5;
            skor += p.color === "white" ? n : -n;
        }
    return skor;
}

function urutkan(board, daftar) {
    const nilai = ({ m }) => {
        const t = board[m.r][m.c];
        return (t ? NILAI[t.type] : 0) + (m.promotion ? 800 : 0);
    };
    return daftar.sort((a, b) => nilai(b) - nilai(a));
}

function negamax(board, warna, ep, kecepatan, alpha, beta) {
    const daftar = semuaLangkah(board, warna, ep);
    if (daftar.length === 0) return sedangSkak(board, warna) ? -100000 - kecepatan : 0;
    if (kecepatan === 0) return (warna === "white" ? 1 : -1) * evaluasi(board);

    let terbaik = -Infinity;
    for (const { dari, m } of urutkan(board, daftar)) {
        const salinan = board.map((baris) => baris.slice());
        const epBaru = jalankanLangkah(salinan, dari, m);
        const skor = -negamax(salinan, lawan(warna), epBaru, kecepatan - 1, -beta, -alpha);
        if (skor > terbaik) terbaik = skor;
        if (terbaik > alpha) alpha = terbaik;
        if (alpha >= beta) break;
    }
    return terbaik;
}

export function pilihLangkahBot(board, warna, ep, kecepatan = 2, toleransi = 60, peluangMeleset = 0.1, tolMeleset = 200) {
    const daftar = urutkan(board, semuaLangkah(board, warna, ep));
    if (daftar.length === 0) return null;

    const bernilai = daftar.map((lg) => {
        const salinan = board.map((baris) => baris.slice());
        const epBaru = jalankanLangkah(salinan, lg.dari, lg.m);
        const skor = -negamax(salinan, lawan(warna), epBaru, kecepatan - 1, -Infinity, Infinity);
        return { lg, skor };
    });

    const terbaik = Math.max(...bernilai.map((x) => x.skor));
    if (terbaik >= SKOR_MAT) {
        const mat = bernilai.filter((x) => x.skor === terbaik);
        return mat[Math.floor(Math.random() * mat.length)].lg;
    }

    const batas = Math.random() < peluangMeleset ? tolMeleset : toleransi;
    const kandidat = bernilai.filter((x) => x.skor >= terbaik - batas);
    return kandidat[Math.floor(Math.random() * kandidat.length)].lg;
}
