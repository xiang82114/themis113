window.addEventListener("DOMContentLoaded", function () {
    const splash = document.getElementById("splash");
    let emitted = false;

    const dispatchHidden = () => {
        if (emitted) {
            return;
        }
        emitted = true;
        window.dispatchEvent(new CustomEvent("themis:splashHidden"));
    };

    if (!splash) {
        dispatchHidden();
        return;
    }

    setTimeout(function () {
        splash.classList.add("hide");

        const handleTransition = () => {
            splash.removeEventListener("transitionend", handleTransition);
            dispatchHidden();
        };

        splash.addEventListener("transitionend", handleTransition, { once: true });
        setTimeout(dispatchHidden, 700);
    }, 600);
});

window.addEventListener("scroll", function () {
    const navbar = document.querySelector(".navbar");
    const logo = document.getElementById("navbarLogo");

    if (window.scrollY > 50) {
        navbar.classList.remove("navbar-transparent");
        navbar.classList.add("navbar-colored");
    } else {
        navbar.classList.add("navbar-transparent");
        navbar.classList.remove("navbar-colored");
    }
});