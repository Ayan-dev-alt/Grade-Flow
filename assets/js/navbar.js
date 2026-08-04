/*=====================================
        MOBILE NAVBAR
======================================*/

const menuBtn = document.querySelector(".menu-btn");
const mobileMenu = document.querySelector(".mobile-menu");
const overlay = document.querySelector(".nav-overlay");

if (menuBtn && mobileMenu && overlay) {
    menuBtn.addEventListener("click", () => {

        menuBtn.classList.toggle("active");
        mobileMenu.classList.toggle("active");
        overlay.classList.toggle("active");

    });

    overlay.addEventListener("click", () => {

        menuBtn.classList.remove("active");
        mobileMenu.classList.remove("active");
        overlay.classList.remove("active");

    });

    document.querySelectorAll(".mobile-menu a").forEach(link => {

        link.addEventListener("click", () => {

            menuBtn.classList.remove("active");
            mobileMenu.classList.remove("active");
            overlay.classList.remove("active");

        });

    });

    const mobileCloseBtn = document.querySelector('.mobile-close-btn');
    if (mobileCloseBtn) {
        mobileCloseBtn.addEventListener('click', () => {
            menuBtn.classList.remove('active');
            mobileMenu.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
}

