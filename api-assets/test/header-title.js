async function startWave() {
  const titles = document.querySelectorAll(".header-title");
  if (!titles.length) return;
  const total = titles.length;
  const duration = 1.3;
  const interval = 0.3;

  titles.forEach((el) => {
    el.style.animation = "none";
    void el.offsetHeight;
    el.style.animation = `colorChange ${duration}s ease forwards`;
    const index = Array.from(titles).indexOf(el);
    el.style.animationDelay = index * interval + "s";
    el.style.animationPlayState = "running";
  });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const lastDelay = (total - 1) * interval;
  const totalTime = lastDelay + duration;
  setTimeout(startWave, totalTime * 1000);
}

document.addEventListener("DOMContentLoaded", startWave);
