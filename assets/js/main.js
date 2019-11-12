// Mobile Menu Toggle
var menuBtn = document.querySelector(".nav__menu-trigger");

menuBtn.onclick = function () {
    menuBtn.classList.toggle("active");
    document.body.classList.toggle("menu-active");
};
