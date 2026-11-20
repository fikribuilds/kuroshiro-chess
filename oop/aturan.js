const LAWAN = (warna) => (warna === "white" ? "black" : "white");
const DALAM = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

const KUDA = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
const LURUS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAGONAL = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

export function petakAttacked(board, r, c, olehWarna) {
    const pr = olehWarna === "white" ? r + 1 : r - 1;
    for (const dc of [-1, 1]) {
        if (DALAM(pr, c + dc)) {
            const p = board[pr][c + dc];
            if (p && p.color === olehWarna && p.type === "pawn") return true;
        }
    }
    for (const [dr, dc] of KUDA) {
        if (!DALAM(r + dr, c + dc)) continue;
        const p = board[r + dr][c + dc];
        if (p && p.color === olehWarna && p.type === "knight") return true;
    }
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if ((dr || dc) && DALAM(r + dr, c + dc)) {
                const p = board[r + dr][c + dc];
                if (p && p.color === olehWarna && p.type === "king") return true;
            }
        }
    }
    const geser = (arah, tipe) => {
        for (const [dr, dc] of arah) {
            let nr = r + dr, nc = c + dc;
            while (DALAM(nr, nc)) {
                const p = board[nr][nc];
                if (p) {
                    if (p.color === olehWarna && (p.type === tipe || p.type === "queen")) return true;
                    break;
                }
                nr += dr; nc += dc;
            }
        }
        return false;
    };
    return geser(LURUS, "rook") || geser(DIAGONAL, "bishop");
}

export function cariRaja(board, warna) {
    for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.type === "king" && p.color === warna) return { r, c };
        }
    return null;
}

export function sedangSkak(board, warna) {
    const k = cariRaja(board, warna);
    return !!k && petakAttacked(board, k.r, k.c, LAWAN(warna));
}

function langkahPseudo(board, r, c, ep) {
    const p = board[r][c];
    const hasil = [];
    if (!p) return hasil;
    const lawan = LAWAN(p.color);

    if (p.type === "pawn") {
        const arah = p.color === "white" ? -1 : 1;
        const barisAwal = p.color === "white" ? 6 : 1;
        const barisAkhir = p.color === "white" ? 0 : 7;
        const nr = r + arah;
        if (DALAM(nr, c) && !board[nr][c]) {
            hasil.push({ r: nr, c, promotion: nr === barisAkhir });
            if (r === barisAwal && !board[r + 2 * arah][c]) hasil.push({ r: r + 2 * arah, c });
        }
        for (const dc of [-1, 1]) {
            const nc = c + dc;
            if (!DALAM(nr, nc)) continue;
            const t = board[nr][nc];
            if (t && t.color === lawan) hasil.push({ r: nr, c: nc, promotion: nr === barisAkhir });
            else if (!t && ep && ep.r === nr && ep.c === nc) hasil.push({ r: nr, c: nc, special: "ep" });
        }
        return hasil;
    }

    if (p.type === "knight" || p.type === "king") {
        const langkah = p.type === "knight"
            ? KUDA
            : [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        for (const [dr, dc] of langkah) {
            const nr = r + dr, nc = c + dc;
            if (!DALAM(nr, nc)) continue;
            const t = board[nr][nc];
            if (!t || t.color === lawan) hasil.push({ r: nr, c: nc });
        }
        if (p.type === "king" && !p.moved && !petakAttacked(board, r, c, lawan)) {
            const benteng = (col) => {
                const b = board[r][col];
                return b && b.type === "rook" && b.color === p.color && !b.moved;
            };
            const kosong = (...cols) => cols.every((col) => !board[r][col]);
            const aman = (...cols) => cols.every((col) => !petakAttacked(board, r, col, lawan));
            if (benteng(7) && kosong(5, 6) && aman(5, 6)) hasil.push({ r, c: 6, special: "castleK" });
            if (benteng(0) && kosong(1, 2, 3) && aman(2, 3)) hasil.push({ r, c: 2, special: "castleQ" });
        }
        return hasil;
    }

    const arah = p.type === "rook" ? LURUS : p.type === "bishop" ? DIAGONAL : [...LURUS, ...DIAGONAL];
    for (const [dr, dc] of arah) {
        let nr = r + dr, nc = c + dc;
        while (DALAM(nr, nc)) {
            const t = board[nr][nc];
            if (!t) hasil.push({ r: nr, c: nc });
            else {
                if (t.color === lawan) hasil.push({ r: nr, c: nc });
                break;
            }
            nr += dr; nc += dc;
        }
    }
    return hasil;
}

// Menjalankan langkah pada board (mengubah board). Mengembalikan target en passant baru.
export function jalankanLangkah(board, dari, langkah, promosiKe = "queen") {
    const p = board[dari.r][dari.c];
    board[dari.r][dari.c] = null;
    if (langkah.special === "ep") board[dari.r][langkah.c] = null;
    const baru = { ...p, moved: true };
    if (langkah.promotion) baru.type = promosiKe;
    board[langkah.r][langkah.c] = baru;
    if (langkah.special === "castleK") {
        board[dari.r][5] = { ...board[dari.r][7], moved: true };
        board[dari.r][7] = null;
    } else if (langkah.special === "castleQ") {
        board[dari.r][3] = { ...board[dari.r][0], moved: true };
        board[dari.r][0] = null;
    }
    if (p.type === "pawn" && Math.abs(langkah.r - dari.r) === 2) {
        return { r: (langkah.r + dari.r) / 2, c: dari.c };
    }
    return null;
}

// Langkah yang benar-benar legal: raja sendiri tidak boleh berada dalam skak setelahnya.
export function langkahLegal(board, r, c, ep) {
    const p = board[r][c];
    if (!p) return [];
    return langkahPseudo(board, r, c, ep).filter((m) => {
        const salinan = board.map((baris) => baris.slice());
        jalankanLangkah(salinan, { r, c }, m);
        return !sedangSkak(salinan, p.color);
    });
}

export function adaLangkahLegal(board, warna, ep) {
    for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.color === warna && langkahLegal(board, r, c, ep).length > 0) return true;
        }
    return false;
}

function materialTidakCukup(board) {
    const sisa = [];
    for (const baris of board) for (const p of baris) if (p && p.type !== "king") sisa.push(p.type);
    if (sisa.length === 0) return true;
    return sisa.length === 1 && (sisa[0] === "bishop" || sisa[0] === "knight");
}

// "skakmat" | "remis-pat" | "remis-material" | "skak" | "normal"
export function statusPermainan(board, warna, ep) {
    const skak = sedangSkak(board, warna);
    if (!adaLangkahLegal(board, warna, ep)) return skak ? "skakmat" : "remis-pat";
    if (materialTidakCukup(board)) return "remis-material";
    return skak ? "skak" : "normal";
}
