window.addEventListener("DOMContentLoaded", function () {
    // 1 秒後加上 hide class 讓遮罩淡出
    setTimeout(function () {
    document.getElementById("splash").classList.add("hide");
    }, 1000); // 動畫 1 秒
});

// document.body.id = "skrollr-body"
// $(window).scroll(
//     function(evt){
//         if($(window).scrollTop()>0)
//             $(".navbar").removeClass("navbar-top");
//         else
//             $(".navbar").addClass("navbar-top");
//     }
// );

var s = skrollr.init();