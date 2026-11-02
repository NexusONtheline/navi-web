// Fondo vivo: los «cables del Nexo» ondulando y lucecitas flotando, detrás de todo.
"use strict";
(() => {
  const lienzo = document.createElement("canvas");
  lienzo.id = "fondo";
  lienzo.setAttribute("aria-hidden", "true");
  document.body.prepend(lienzo);
  const c = lienzo.getContext("2d");
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, d = 1, mx = 0.5, my = 0.5;

  const cables = Array.from({ length: 7 }, (_, i) => ({
    y: 0.12 + i * 0.13, amp: 30 + Math.random() * 60, vel: 0.15 + Math.random() * 0.25,
    fase: Math.random() * 6, grosor: 1 + Math.random() * 1.6,
    color: [[199, 125, 255], [224, 69, 122], [158, 204, 255]][i % 3],
  }));
  const luces = Array.from({ length: 70 }, () => ({
    x: Math.random(), y: Math.random(), r: 0.5 + Math.random() * 1.8,
    v: 0.004 + Math.random() * 0.012, b: Math.random() * 6,
  }));

  function tam() {
    d = Math.min(2, devicePixelRatio || 1);
    w = lienzo.width = Math.round(innerWidth * d);
    h = lienzo.height = Math.round(innerHeight * d);
  }
  addEventListener("resize", tam);
  addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth; my = e.clientY / innerHeight; }, { passive: true });
  tam();

  function cuadro(ms) {
    const t = ms / 1000;
    c.clearRect(0, 0, w, h);
    // cables: curvas que ondulan, con un pulso de luz que viaja por ellos
    cables.forEach((k, i) => {
      const y0 = (k.y + (my - 0.5) * 0.04 * (i % 2 ? 1 : -1)) * h;
      c.beginPath();
      for (let x = -20; x <= w + 20; x += 24 * d) {
        const y = y0 + Math.sin(x / (260 * d) + t * k.vel + k.fase) * k.amp * d
          + Math.sin(x / (90 * d) - t * k.vel * 1.7) * 6 * d;
        x <= -20 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.strokeStyle = `rgba(${k.color},0.10)`;
      c.lineWidth = k.grosor * d;
      c.stroke();
      // el pulso
      const px = ((t * 120 * k.vel + k.fase * 300) * d) % (w + 200) - 100;
      const py = y0 + Math.sin(px / (260 * d) + t * k.vel + k.fase) * k.amp * d + Math.sin(px / (90 * d) - t * k.vel * 1.7) * 6 * d;
      const g = c.createRadialGradient(px, py, 0, px, py, 22 * d);
      g.addColorStop(0, `rgba(${k.color},0.55)`);
      g.addColorStop(1, `rgba(${k.color},0)`);
      c.fillStyle = g;
      c.beginPath(); c.arc(px, py, 22 * d, 0, Math.PI * 2); c.fill();
    });
    // lucecitas que suben
    luces.forEach((l) => {
      l.y -= l.v / 60;
      if (l.y < -0.02) { l.y = 1.02; l.x = Math.random(); }
      const brillo = 0.25 + 0.35 * Math.sin(t * 2 + l.b);
      c.fillStyle = `rgba(233,213,255,${brillo})`;
      c.beginPath();
      c.arc((l.x + (mx - 0.5) * 0.02) * w, l.y * h, l.r * d, 0, Math.PI * 2);
      c.fill();
    });
    if (!quieto) requestAnimationFrame(cuadro);
  }
  requestAnimationFrame(cuadro);
})();
