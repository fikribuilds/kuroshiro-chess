const tombol = document.getElementById('tombol-kabur');

function pindahPosisi() {
    const batasLebar = window.innerWidth - tombol.offsetWidth - 20;
    const batasTinggi = window.innerHeight - tombol.offsetHeight - 20;

    const posisiX = Math.max(20, Math.floor(Math.random() * batasLebar));
    const posisiY = Math.max(20, Math.floor(Math.random() * batasTinggi));

    tombol.style.position = 'fixed';
    tombol.style.left = posisiX + 'px';
    tombol.style.top = posisiY + 'px';
}

tombol.addEventListener('mouseover', pindahPosisi);
tombol.addEventListener('touchstart', (e) => {
    e.preventDefault();
    pindahPosisi();
});