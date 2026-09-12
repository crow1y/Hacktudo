// Comportamento da landing page: menu hambúrguer (mobile) + carrossel
// autoplay com setas/bolinhas. Vanilla JS, sem dependências — a página
// não usa bundler.

function initNavToggle() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle("site-nav--open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.innerHTML = open
      ? '<svg class="icon"><use href="#icon-close"></use></svg>'
      : '<svg class="icon"><use href="#icon-menu"></use></svg>';
  };

  toggle.addEventListener("click", () => {
    setOpen(!nav.classList.contains("site-nav--open"));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });
}

function initCarousel() {
  const root = document.querySelector("[data-carousel]");
  if (!root) return;

  const track = root.querySelector("[data-carousel-track]");
  const slides = Array.from(track.children);
  const dotsContainer = root.querySelector("[data-carousel-dots]");
  const prevBtn = root.querySelector("[data-carousel-prev]");
  const nextBtn = root.querySelector("[data-carousel-next]");
  const AUTOPLAY_MS = 6000;

  let current = 0;
  let autoplayId = null;

  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel__dot";
    dot.setAttribute("aria-label", `Ir pro slide ${index + 1}`);
    dot.addEventListener("click", () => goTo(index));
    dotsContainer.appendChild(dot);
  });
  const dots = Array.from(dotsContainer.children);

  function render() {
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((dot, index) => {
      dot.classList.toggle("carousel__dot--active", index === current);
    });
  }

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    render();
    restartAutoplay();
  }

  function restartAutoplay() {
    clearInterval(autoplayId);
    autoplayId = setInterval(() => goTo(current + 1), AUTOPLAY_MS);
  }

  prevBtn.addEventListener("click", () => goTo(current - 1));
  nextBtn.addEventListener("click", () => goTo(current + 1));

  render();
  restartAutoplay();
}

initNavToggle();
initCarousel();
