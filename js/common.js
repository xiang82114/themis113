window.addEventListener("DOMContentLoaded", function () {
    // 1 秒後加上 hide class 讓遮罩淡出
    setTimeout(function () {
    document.getElementById("splash").classList.add("hide");
    }, 600); // 動畫 0.5 秒
});

AOS.init();

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