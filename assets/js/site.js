/* Topo muda ao rolar, orçamento por WhatsApp com o nome do kit, leve parallax do mascote */
(function () {
  const topo = document.getElementById("topo");
  const onScroll = () => topo.classList.toggle("is-solid", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  document.querySelectorAll(".orc").forEach((a) => {
    a.href = "https://wa.me/5551992921288?text=" + encodeURIComponent("Olá, quero um orçamento do " + a.dataset.kit + ".");
    a.target = "_blank";
    a.rel = "noopener";
  });

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = document.querySelector(".hero");
  const bg = document.querySelector(".hero__bg");
  if (!reduce && hero && bg && window.matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      bg.style.transform = "scale(1.04) translate(" + x * -14 + "px," + y * -10 + "px)";
    });
    hero.addEventListener("pointerleave", () => { bg.style.transform = ""; });
  }
})();
