/* AyAccount · brand letter wave (strict mode, no globals) */
"use strict";

(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  async function startWave() {
    const titles = $$(".card-header-title");
    if (!titles.length) return;

    const total = titles.length;
    const duration = 1.3;
    const interval = 0.2;

    titles.forEach((el, index) => {
      el.style.animation = "none";
      void el.offsetHeight;
      el.style.animation = `colorChange ${duration}s ease forwards`;
      el.style.animationDelay = `${index * interval}s`;
      el.style.animationPlayState = "running";
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const lastDelay = (total - 1) * interval;
    const totalTime = lastDelay + duration;
    setTimeout(startWave, totalTime * 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWave);
  } else {
    startWave();
  }
})();
