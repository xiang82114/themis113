

window.addEventListener('scroll', function () {
  const nav = document.querySelector('.navbar-top');
  if (window.scrollY > 10) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});