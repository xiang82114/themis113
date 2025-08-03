// document.body.id = "skrollr-body";
// $(document).ready(function () {
//     $(window).scroll(function () {
//         if ($(window).scrollTop() > 0) {
//             $(".navbar").removeClass("navbar-top");
//             document.getElementById("logo").src = "./imges/圖片2.png";
//         } else {
//             $(".navbar").addClass("navbar-top");
//             document.getElementById("logo").src = "./imges/圖片1.png";
//         }
//     });
// });
// var s = skrollr.init();

window.addEventListener('scroll', function () {
  const nav = document.querySelector('.navbar-top');
  if (window.scrollY > 10) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});