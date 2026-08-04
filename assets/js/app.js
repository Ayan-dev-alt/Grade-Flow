const quickLinksSelect = document.getElementById("quickLinksSelect");

if (quickLinksSelect) {
    quickLinksSelect.addEventListener("change", function () {
        if (this.value) {
            window.location.href = this.value;
        }
    });
}

const featureSelect = document.getElementById("featureSelect");

if (featureSelect) {
    featureSelect.addEventListener("change", function () {
        if (this.value) {
            window.location.href = this.value;
        }
    });
}
/*=============================
    Footer Accordion
==============================*/

const footerToggles = document.querySelectorAll(".footer-toggle");

footerToggles.forEach(toggle => {

    toggle.addEventListener("click", () => {

        const parent = toggle.parentElement;

        document.querySelectorAll(".footer-links").forEach(item => {

            if (item !== parent) {

                item.classList.remove("active");

            }

        });

        parent.classList.toggle("active");

    });

});