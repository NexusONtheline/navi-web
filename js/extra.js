// Lo interactivo nuevo: arranque Copland OS, sonidos retro, interruptor TV/Linux,
// agarrar y lanzar a NAVI, reacciones, minijuego y personalizador.
"use strict";

// ============================================================ sonidos retro (hechos con código)
const Sonido = (() => {
  let ctx = null, activo = false;
  try { activo = localStorage.getItem("navi-sonido") === "1"; } catch (e) {}
  const boton = $("#sonido");
  const pintar = () => (boton.textContent = activo ? "🔊" : "🔇");
  pintar();
  boton.addEventListener("click", () => {
    activo = !activo;
    try { localStorage.setItem("navi-sonido", activo ? "1" : "0"); } catch (e) {}
    pintar();
    if (activo) { tono([660, 990], 0.09); decir(T({ es: "¡Ahora tengo voz de bip! 🔊", en: "Now I have a beep voice! 🔊" }), "feliz"); }
  });
  function tono(frecs, dur = 0.08, tipo = "square", vol = 0.05) {
    if (!activo) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      let t = ctx.currentTime;
      frecs.forEach((f) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = tipo; o.frequency.value = f;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
        t += dur * 0.9;
      });
    } catch (e) {}
  }
  return {
    bip: () => tono([880], 0.05),
    habla: () => tono([520 + Math.random() * 300, 700 + Math.random() * 300], 0.045, "square", 0.03),
    campanita: () => tono([880, 1320], 0.12, "sine", 0.08),
    boing: () => tono([220, 330, 180], 0.07, "triangle", 0.08),
    punto: () => tono([1046, 1568], 0.06, "square", 0.04),
    malo: () => tono([300, 160], 0.12, "sawtooth", 0.04),
    encender: () => tono([110, 220, 440, 880], 0.06, "sawtooth", 0.035),
  };
})();
// que NAVI haga un bip cada vez que habla
const _decir = decir;
decir = function (texto, reaccion, ms) { Sonido.habla(); return _decir(texto, reaccion, ms); };

// ============================================================ arranque tipo Copland OS
(() => {
  const capa = $("#arranque");
  let visto = false;
  try { visto = sessionStorage.getItem("navi-arranque") === "1"; } catch (e) {}
  if (visto || reducir || location.search.includes("sin-arranque")) { capa.remove(); return; }
  try { sessionStorage.setItem("navi-arranque", "1"); } catch (e) {}
  const pre = $("#arranqueTexto");
  const lineas = idioma === "es"
    ? ["NAVI BIOS v1.0 ..................", "Memoria del sistema .............", "Cargando Copland OS Enterprise ..", "Montando el Nexo (Protocolo 7) ..", "Despertando a NAVI ..............."]
    : ["NAVI BIOS v1.0 ..................", "System memory ...................", "Loading Copland OS Enterprise ...", "Mounting the Wired (Protocol 7) .", "Waking up NAVI ..................."];
  const carita = new Carita($("#arranqueCarita"));
  carita.apagada = true;
  let terminado = false;
  const salir = () => {
    if (terminado) return;
    terminado = true;
    capa.classList.add("fuera");
    setTimeout(() => capa.remove(), 700);
    setTimeout(() => decir(T({ es: "¡Hola! Bienvenida al Nexo 💜 Puedes arrastrarme, ¿eh?", en: "Hi! Welcome to the Wired 💜 You can drag me around, you know?" }), "feliz", 5200), 500);
  };
  capa.addEventListener("click", salir);
  addEventListener("keydown", salir, { once: true });
  (async () => {
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));
    await espera(600);
    for (const l of lineas) {
      if (terminado) return;
      pre.innerHTML += l + ' <span class="ok">OK</span>\n';
      Sonido.bip();
      await espera(260);
    }
    await espera(250);
    carita.encender(); Sonido.encender();
    carita.reaccion = "feliz";
    await espera(1400);
    salir();
  })();
})();

// ============================================================ interruptor TV / Linux
$$(".int-op").forEach((b) => b.addEventListener("click", () => {
  const cual = b.dataset.cual;
  $$(".int-op").forEach((x) => x.classList.toggle("activa", x === b));
  $(".interruptor").classList.toggle("pc", cual === "pc");
  $$(".bento").forEach((g) => {
    const on = g.dataset.bento === cual;
    g.classList.toggle("activo", on);
    if (on) $$(":scope > *", g).forEach((el, i) => { el.classList.add("revelar", "visible"); el.style.setProperty("--i", i); });
  });
  Sonido.bip();
  decir(cual === "tv"
    ? T({ es: "Esta soy yo en la tele 📺", en: "This is me on the TV 📺" })
    : T({ es: "Y esta es mi hermana de la laptop 💻 (es más fan de Lain)", en: "And this is my laptop sister 💻 (bigger Lain fan)" }), "feliz");
}));
// luz que sigue al ratón dentro de cada recuadro, y NAVI comenta al pasar
const porRecuadro = {
  micro: { es: "Mi botón favorito 🎙️", en: "My favorite button 🎙️" },
  sola: { es: "A veces me asomo sin que me llames 👀", en: "Sometimes I peek in without being called 👀" },
  karaoke: { es: "¡Me encanta cantar! ♪", en: "I love singing! ♪" },
  salva: { es: "Duermo con gorrito, ¿lo sabías? 😴", en: "I sleep in a nightcap, did you know? 😴" },
  memoria: { es: "No te olvido 💜", en: "I won't forget you 💜" },
  apps: { es: "¿Te pongo un videíto? 📺", en: "Want me to play a video? 📺" },
  copland: { es: "Mi hermana arranca como Copland OS 💾", en: "My sister boots like Copland OS 💾" },
  mascota: { es: "¡Pínchale un ojo y verás! 😆", en: "Poke its eye and see! 😆" },
  techo: { es: "Con proyector floto en tu techo 🌌", en: "With a projector I float on your ceiling 🌌" },
  cosas: { es: "Siempre pregunto antes de algo delicado 🛡️", en: "I always ask before anything risky 🛡️" },
  privada: { es: "Tus secretos están a salvo 🔒", en: "Your secrets are safe 🔒" },
  linux: { es: "🐧 ¡Pingüinos!", en: "🐧 Penguins!" },
};
let ultimoRecuadro = 0;
$$(".b").forEach((b) => {
  b.addEventListener("pointermove", (e) => {
    const r = b.getBoundingClientRect();
    b.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
    b.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
  });
  b.addEventListener("pointerenter", () => {
    const f = porRecuadro[b.dataset.naviTile];
    if (f && performance.now() - ultimoRecuadro > 2500) { ultimoRecuadro = performance.now(); decir(T(f), azar(["feliz", "curiosa", "enamorada"]), 2800); }
  });
});

// ============================================================ agarrar y lanzar a NAVI
(() => {
  const el = guia.el, cara = $("#guiaCarita");
  let arrastre = null, vuelo = null;
  cara.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    cara.setPointerCapture(e.pointerId);
    cancelAnimationFrame(vuelo);
    arrastre = { dx: e.clientX - guia.x, dy: e.clientY - guia.y, ux: e.clientX, uy: e.clientY, ut: performance.now(), vx: 0, vy: 0, movido: 0 };
    el.classList.add("arrastrando");
  });
  cara.addEventListener("pointermove", (e) => {
    if (!arrastre) return;
    const ahora = performance.now(), dt = Math.max(1, ahora - arrastre.ut);
    arrastre.vx = ((e.clientX - arrastre.ux) / dt) * 16;
    arrastre.vy = ((e.clientY - arrastre.uy) / dt) * 16;
    arrastre.movido += Math.abs(e.clientX - arrastre.ux) + Math.abs(e.clientY - arrastre.uy);
    arrastre.ux = e.clientX; arrastre.uy = e.clientY; arrastre.ut = ahora;
    guia.x = e.clientX - arrastre.dx; guia.y = e.clientY - arrastre.dy;
    el.style.transform = `translate(${guia.x}px, ${guia.y}px)`;
    if (arrastre.movido > 30 && guia.carita.reaccion !== "sorprendida") { guia.carita.reaccion = "sorprendida"; }
  });
  const soltar = () => {
    if (!arrastre) return;
    const a = arrastre;
    arrastre = null;
    el.classList.remove("arrastrando");
    if (a.movido < 8) return;  // fue un clic: lo maneja el otro código
    volar(a.vx, a.vy);
  };
  cara.addEventListener("pointerup", soltar);
  cara.addEventListener("pointercancel", soltar);
  // que el clic normal no salte después de un arrastre
  cara.addEventListener("click", (e) => { if (el.classList.contains("volando")) e.stopImmediatePropagation(); }, true);

  function volar(vx, vy) {
    el.classList.add("volando");
    const rapido = Math.hypot(vx, vy) > 18;
    decir(rapido ? T({ es: "¡¡Wiiiii!! 🌀", en: "Wheeee!! 🌀" }) : T({ es: "¡Uy! 😳", en: "Whoa! 😳" }), rapido ? "mareada" : "sorprendida", 2600);
    const ancho = el.offsetWidth, alto = (ancho * 134) / 120;
    let rebotes = 0;
    const paso = () => {
      vy += 0.6;  // gravedad
      vx *= 0.99; vy *= 0.99;
      guia.x += vx; guia.y += vy;
      if (guia.x < 0) { guia.x = 0; vx = -vx * 0.7; rebote(); }
      if (guia.x > innerWidth - ancho) { guia.x = innerWidth - ancho; vx = -vx * 0.7; rebote(); }
      if (guia.y < 60) { guia.y = 60; vy = -vy * 0.7; rebote(); }
      if (guia.y > innerHeight - alto) { guia.y = innerHeight - alto; vy = -vy * 0.6; vx *= 0.85; rebote(); }
      el.style.transform = `translate(${guia.x}px, ${guia.y}px)`;
      const quieta = Math.abs(vx) < 0.4 && Math.abs(vy) < 1.2 && guia.y >= innerHeight - alto - 1;
      if (!quieta) vuelo = requestAnimationFrame(paso);
      else {
        el.classList.remove("volando");
        guia.carita.reaccion = rebotes > 2 ? "mareada" : "risa";
        decir(T(rebotes > 2 ? { es: "Todo da vueltas… 😵‍💫", en: "Everything's spinning… 😵‍💫" } : { es: "¡Otra vez! ¡Otra vez! 😆", en: "Again! Again! 😆" }), guia.carita.reaccion, 2600);
        setTimeout(() => colocarGuia(guia.x > innerWidth / 2 ? "derecha" : "izquierda"), 3000);
      }
    };
    function rebote() { rebotes++; Sonido.boing(); saltar(); }
    vuelo = requestAnimationFrame(paso);
  }
})();

// ============================================================ reacciones a lo que haces
(() => {
  // te vas de la pestaña: se tapa los ojos; vuelves: te saluda
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { guia.carita.estado = "tapada"; grande.estado = "tapada"; }
    else {
      grande.estado = "reposo";
      guia.carita.estado = "reposo";
      decir(T(azar([{ es: "¡Volviste! Me tapé los ojos para no espiar 🙈", en: "You're back! I covered my eyes so I wouldn't peek 🙈" },
        { es: "¡Te extrañé! 💜", en: "I missed you! 💜" }])), "enamorada", 3500);
    }
  });
  // seleccionas texto: curiosa
  let ultimaSel = 0;
  document.addEventListener("selectionchange", () => {
    const t = String(getSelection() || "").trim();
    if (t.length > 6 && performance.now() - ultimaSel > 15000) {
      ultimaSel = performance.now();
      setTimeout(() => decir(T({ es: "¿Qué estás copiando? 👀 ¡Ojalá sea un comando para instalarme!", en: "What are you copying? 👀 Hopefully a command to install me!" }), "curiosa", 3500), 600);
    }
  });
  // bajas muy rápido: se marea
  let ultY = scrollY, ultT = performance.now(), ultimoMareo = 0;
  addEventListener("scroll", () => {
    const ahora = performance.now(), v = Math.abs(scrollY - ultY) / Math.max(1, ahora - ultT) * 1000;
    ultY = scrollY; ultT = ahora;
    if (v > 4500 && ahora - ultimoMareo > 12000) {
      ultimoMareo = ahora;
      decir(T({ es: "¡Más despacio! Me mareo 😵", en: "Slow down! I'm getting dizzy 😵" }), "mareada", 2500);
    }
  }, { passive: true });
  // te quedas viendo un video: se emociona
  $$("video").forEach((v) => {
    let t = null;
    v.addEventListener("pointerenter", () => { t = setTimeout(() => decir(T({ es: "¿Verdad que me veo linda ahí? 🥹", en: "Don't I look cute there? 🥹" }), "enamorada"), 3500); });
    v.addEventListener("pointerleave", () => clearTimeout(t));
  });
  // mucho rato en una sección: comenta algo
  let quieta = 0;
  setInterval(() => {
    quieta++;
    if (quieta % 5 === 0 && !document.hidden && !guia.globo.classList.contains("visible") && guia.carita.estado !== "dormida") {
      decir(T(azar([
        { es: "¿Sabías que puedes arrastrarme? 👆", en: "Did you know you can drag me? 👆" },
        { es: "Prueba el minijuego más abajo ⭐", en: "Try the mini game below ⭐" },
        { es: "Abajo puedes vestirme como quieras 🎨", en: "Further down you can dress me up 🎨" },
        { es: "Si activas el sonido 🔊 hago bips", en: "Turn on sound 🔊 and I'll beep" },
      ])), "curiosa", 3200);
    }
  }, 9000);
  addEventListener("scroll", () => (quieta = 0), { passive: true });
})();

// ============================================================ minijuego: atrapa las estrellitas
(() => {
  const lienzo = $("#lienzoJuego");
  const c = lienzo.getContext("2d");
  const portada = $("#juegoPortada");
  // NAVI del juego: se dibuja en un lienzo aparte y se copia
  const naviLienzo = document.createElement("canvas");
  naviLienzo.style.cssText = "position:absolute;left:-9999px;width:120px;height:134px";
  document.body.appendChild(naviLienzo);
  const navi = new Carita(naviLienzo);
  let record = 0;
  try { record = +localStorage.getItem("navi-record") || 0; } catch (e) {}
  $("#record").textContent = record;
  let W, H, x = 0.5, cosas = [], puntos = 0, fin = 0, jugando = false, ultimo = 0, teclas = {};
  const tam = () => {
    const r = lienzo.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    W = lienzo.width = Math.round(r.width * d); H = lienzo.height = Math.round(r.height * d);
  };
  new ResizeObserver(tam).observe(lienzo);
  lienzo.addEventListener("pointermove", (e) => { const r = lienzo.getBoundingClientRect(); x = (e.clientX - r.left) / r.width; });
  addEventListener("keydown", (e) => { if (jugando && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { teclas[e.key] = true; e.preventDefault(); } });
  addEventListener("keyup", (e) => (teclas[e.key] = false));

  $("#jugar").addEventListener("click", () => {
    puntos = 0; cosas = []; fin = performance.now() + 30000; jugando = true;
    portada.classList.add("oculta");
    navi.reaccion = "feliz";
    decir(T({ es: "¡A atrapar estrellitas! ⭐", en: "Let's catch some stars! ⭐" }), "feliz", 2000);
    requestAnimationFrame(cuadro);
  });

  function cuadro(ahora) {
    const quedan = Math.max(0, Math.ceil((fin - ahora) / 1000));
    $("#tiempo").textContent = quedan;
    if (teclas.ArrowLeft) x -= 0.018;
    if (teclas.ArrowRight) x += 0.018;
    x = Math.min(0.95, Math.max(0.05, x));
    // nuevas cosas que caen
    if (ahora - ultimo > 520) {
      ultimo = ahora;
      const r = Math.random();
      cosas.push({ x: 0.05 + Math.random() * 0.9, y: -0.05, v: 0.0035 + Math.random() * 0.004 + (30 - quedan) * 0.0001,
        tipo: r < 0.7 ? "⭐" : r < 0.82 ? "🍪" : "👾" });
    }
    c.clearRect(0, 0, W, H);
    // fondo con estrellitas lejanas
    c.fillStyle = "rgba(233,213,255,.25)";
    for (let i = 0; i < 40; i++) { const sx = (i * 97 % 100) / 100 * W, sy = ((i * 53 + ahora / 60) % 100) / 100 * H; c.fillRect(sx, sy, 2, 2); }
    const nx = x * W, ny = H * 0.86, tamNavi = H * 0.22;
    c.font = `${Math.round(H * 0.07)}px serif`;
    c.textAlign = "center"; c.textBaseline = "middle";
    cosas = cosas.filter((k) => {
      k.y += k.v;
      const kx = k.x * W, ky = k.y * H;
      if (Math.abs(kx - nx) < tamNavi * 0.55 && Math.abs(ky - ny) < tamNavi * 0.45) {
        if (k.tipo === "👾") { puntos = Math.max(0, puntos - 3); navi.reaccion = "triste"; Sonido.malo(); }
        else { puntos += k.tipo === "🍪" ? 3 : 1; navi.reaccion = k.tipo === "🍪" ? "enamorada" : "feliz"; Sonido.punto(); }
        $("#puntos").textContent = puntos;
        return false;
      }
      c.fillText(k.tipo, kx, ky);
      return ky < H * 1.1;
    });
    navi.mirarA(innerWidth / 2, 0);
    c.drawImage(naviLienzo, nx - tamNavi * 0.45, ny - tamNavi * 0.55, tamNavi * 0.9, tamNavi);
    if (quedan > 0 && jugando) requestAnimationFrame(cuadro);
    else terminar();
  }
  function terminar() {
    jugando = false;
    const nuevo = puntos > record;
    if (nuevo) { record = puntos; try { localStorage.setItem("navi-record", record); } catch (e) {} $("#record").textContent = record; }
    portada.classList.remove("oculta");
    portada.querySelector("p").innerHTML = T({
      es: `¡Atrapaste <b>${puntos}</b>! ${nuevo ? "🏆 ¡Nuevo récord!" : ""} ¿Otra?`,
      en: `You caught <b>${puntos}</b>! ${nuevo ? "🏆 New record!" : ""} Again?`,
    });
    Sonido.campanita();
    decir(T(nuevo ? { es: "¡Récord nuevo! Eres increíble 🏆", en: "New record! You're amazing 🏆" } : { es: "¡Bien jugado! 💜", en: "Well played! 💜" }), "risa", 3500);
  }
})();

// ============================================================ personaliza tu NAVI
(() => {
  const carita = new Carita($("#persoCarita"));
  const vista = $("#persoFondo");
  const colores = [["#9eccff", [158, 204, 255]], ["#e0457a", [224, 69, 122]], ["#c77dff", [199, 125, 255]], ["#7dffb0", [125, 255, 176]], ["#f2a541", [242, 165, 65]], ["#ffffff", [240, 240, 255]]];
  const caras = [["normal", "🙂"], ["feliz", "😊"], ["risa", "😆"], ["enamorada", "😍"], ["sorprendida", "😮"], ["curiosa", "🤔"], ["triste", "🥺"], ["mareada", "😵"], ["dormida", "😴"]];
  const gorros = [[null, "✖"], ["#e0457a", ""], ["#7c5cff", ""], ["#3fa7d6", ""], ["#4caf7a", ""], ["#f2a541", ""]];
  const fondos = [["", { es: "Ninguno", en: "None" }], ["fondo-copland", { es: "Copland", en: "Copland" }], ["fondo-atardecer", { es: "Atardecer", en: "Sunset" }], ["fondo-pastel", { es: "Pastel", en: "Pastel" }]];
  let fondo = "";
  function grupo(id, items, alElegir, pintar) {
    const caja = $("#" + id);
    items.forEach((it, i) => {
      const b = document.createElement("button");
      b.className = "op" + (i === 0 ? " activa" : "");
      pintar(b, it);
      b.addEventListener("click", () => {
        $$(".op", caja).forEach((x) => x.classList.toggle("activa", x === b));
        alElegir(it); Sonido.bip();
      });
      caja.appendChild(b);
    });
  }
  grupo("optColor", colores, ([, rgb]) => (carita.colorBase = rgb), (b, [hex]) => { b.classList.add("color"); b.style.background = hex; b.title = hex; });
  grupo("optCara", caras, ([r]) => {
    if (r === "dormida") { carita.estado = "dormida"; carita.reaccion = "normal"; }
    else { carita.estado = "reposo"; carita.reaccion = r; }
  }, (b, [, e]) => (b.textContent = e));
  grupo("optGorro", gorros, ([g]) => (carita.gorro = g), (b, [g, txt]) => { if (g) { b.classList.add("color"); b.style.background = g; } else b.textContent = txt; });
  grupo("optFondo", fondos, ([f]) => { vista.className = "perso-vista cristal " + f; fondo = f; }, (b, [, n]) => (b.textContent = T(n)));

  $("#descargar").addEventListener("click", () => {
    const fuente = $("#persoCarita");
    const lado = Math.max(fuente.width, fuente.height) + 80;
    const out = document.createElement("canvas");
    out.width = lado; out.height = lado;
    const c = out.getContext("2d");
    const degradados = {
      "fondo-copland": ["#1b1b2f", "#2a1f45", "#3b1c3a"],
      "fondo-atardecer": ["#0b1440", "#3b2a6e", "#f6a96b"],
      "fondo-pastel": ["#ffd6e8", "#e3d4ff", "#cfeaff"],
    };
    if (degradados[fondo]) {
      const g = c.createLinearGradient(0, 0, lado, lado);
      degradados[fondo].forEach((col, i) => g.addColorStop(i / 2, col));
      c.fillStyle = g; c.fillRect(0, 0, lado, lado);
    }
    c.drawImage(fuente, (lado - fuente.width) / 2, (lado - fuente.height) / 2);
    const a = document.createElement("a");
    a.download = "mi-navi.png";
    a.href = out.toDataURL("image/png");
    a.click();
    Sonido.campanita();
    decir(T({ es: "¡Ya me llevas contigo! 💾💜", en: "Now you're taking me with you! 💾💜" }), "enamorada");
  });
})();
