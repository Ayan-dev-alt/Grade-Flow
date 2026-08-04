// Hero section placeholder script
// Add hero interactions here if needed.

const heroPlayBtn = document.querySelector(".hero-outline");

if (heroPlayBtn) {
    heroPlayBtn.addEventListener("click", (event) => {
        event.preventDefault();
        window.scrollTo({ top: document.querySelector(".features").offsetTop, behavior: "smooth" });
    });
}
