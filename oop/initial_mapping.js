import { Kotak } from './kelas/square_class.js'
import {addPiecesToObject} from "./fungsi_dari_bidak/pawn_function.js";

const mainMap = [];

for (let i = 8; i > 0; i--) {
    const rowArray = [];
    for (let j = 97; j < 105; j++) {
        const fileName = String.fromCharCode(j);
        const id = fileName + i;
        const kotak = new Kotak();
        kotak.id = id;

        const isRowEven = i % 2 === 0;
        const isElementEven = j % 2 === 0;

        // a1 harus gelap: petak terang jika (baris, kolom) berbeda paritas
        kotak.color = (isRowEven !== isElementEven) ? "light" : "dark";

        rowArray.push(kotak);
    }
    mainMap.push(rowArray);
}

mainMap.forEach(function (insiderArray) {
    insiderArray.forEach(function(obj){
        addPiecesToObject(obj);
    })
});
export {mainMap};