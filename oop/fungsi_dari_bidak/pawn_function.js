export function gambarBidak(piece) {
    return `images/pieces/${piece.color}/${piece.type}.png`;
}

const URUTAN_BARIS_BELAKANG = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];

// Mengisi bidak awal pada satu petak (obj.id contoh: "e2")
export function addPiecesToObject(obj) {
    const file = obj.id.charCodeAt(0) - 97;
    const rank = Number(obj.id[1]);
    let piece = null;

    if (rank === 8) piece = { type: URUTAN_BARIS_BELAKANG[file], color: "black", moved: false };
    if (rank === 7) piece = { type: "pawn", color: "black", moved: false };
    if (rank === 2) piece = { type: "pawn", color: "white", moved: false };
    if (rank === 1) piece = { type: URUTAN_BARIS_BELAKANG[file], color: "white", moved: false };

    if (piece) {
        obj.piece = piece;
        obj.isPiece = gambarBidak(piece);
    }
}
