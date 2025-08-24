window.addEventListener("DOMContentLoaded", function () {
    // 1 秒後加上 hide class 讓遮罩淡出
    setTimeout(function () {
    document.getElementById("splash").classList.add("hide");
    }, 600); // 動畫 0.5 秒
});