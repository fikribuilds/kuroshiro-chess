const html = document.documentElement;
const tombol = document.querySelector(".dark-light");

function terapkan(gelap) {
    html.classList.toggle("dark", gelap);
    tombol.classList.toggle("active", gelap);   // tampilkan ikon matahari saat gelap
    tombol.setAttribute("aria-pressed", String(gelap));
}

function ganti() {
    const gelap = !html.classList.contains("dark");
    terapkan(gelap);
    try { localStorage.setItem("tema", gelap ? "dark" : "light"); } catch (e) {}
}

terapkan(html.classList.contains("dark"));
tombol.addEventListener("click", ganti);
tombol.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ganti(); }
});
