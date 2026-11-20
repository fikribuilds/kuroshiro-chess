import { pilihLangkahBot } from "./bot.js";
onmessage = (e) => {
    const { board, warna, ep, kecepatan } = e.data;
    postMessage(pilihLangkahBot(board, warna, ep, kecepatan));
};