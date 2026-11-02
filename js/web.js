// NAVI en la web: guía que se pasea y explica, carita grande, terminal de mentira, idiomas.
"use strict";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const azar = (l) => l[Math.floor(Math.random() * l.length)];
const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ------------------------------------------------------------ idioma
let idioma = "es";
try { idioma = localStorage.getItem("navi-idioma") || "es"; } catch (e) {}  // español por defecto
if (idioma !== "es" && idioma !== "en") idioma = "es";
function ponerIdioma(l) {
  idioma = l;
  document.documentElement.dataset.lang = l;
  document.documentElement.lang = l;
  $("#idioma").textContent = l === "es" ? "EN" : "ES";
  try { localStorage.setItem("navi-idioma", l); } catch (e) {}
}
ponerIdioma(idioma);
$("#idioma").addEventListener("click", () => {
  ponerIdioma(idioma === "es" ? "en" : "es");
  decir(T({ es: "¡Ahora hablo en español!", en: "Now I'm speaking English!" }), "feliz");
});
const T = (o) => o[idioma] || o.es;

// ------------------------------------------------------------ texto que se escribe solo
const frasesInicio = {
  es: ["hola, soy NAVI", "vivo en tu tele", "y en tu laptop", "te escucho ♪", "cierra el mundo, abre el siguiente"],
  en: ["hi, I'm NAVI", "I live in your TV", "and in your laptop", "I'm listening ♪", "close the world, open the next"],
};
(function escribir() {
  const el = $("#escribiendo");
  let i = 0, j = 0, borrando = false;
  const paso = () => {
    const lista = frasesInicio[idioma];
    const f = lista[i % lista.length];
    el.textContent = f.slice(0, j);
    if (!borrando && j < f.length) j++;
    else if (!borrando) { borrando = true; return setTimeout(paso, 1600); }
    else if (j > 0) j--;
    else { borrando = false; i++; }
    setTimeout(paso, borrando ? 35 : 70);
  };
  paso();
})();

// ------------------------------------------------------------ pestañas y copiar
$$(".pestana").forEach((b) => b.addEventListener("click", () => {
  $$(".pestana").forEach((x) => x.classList.toggle("activa", x === b));
  $$(".panel").forEach((p) => p.classList.toggle("activo", p.dataset.panel === b.dataset.pestana));
  decir(b.dataset.pestana === "tv"
    ? T({ es: "En la tele: un comando y listo, yo me encargo del resto.", en: "On the TV: one command and I handle the rest." })
    : T({ es: "En Linux: el instalador te pregunta todo, paso a paso.", en: "On Linux: the installer asks you everything, step by step." }), "feliz");
}));
$$(".copiar").forEach((b) => b.addEventListener("click", async () => {
  const txt = b.parentElement.querySelector("pre").textContent;
  try { await navigator.clipboard.writeText(txt); b.textContent = "✓"; } catch (e) { b.textContent = "✗"; }
  setTimeout(() => (b.textContent = "⧉"), 1500);
  decir(T({ es: "¡Copiado! Pégalo en tu terminal 💜", en: "Copied! Paste it in your terminal 💜" }), "feliz");
}));

// ------------------------------------------------------------ carita grande
const grande = new Carita($("#grande"));
let raton = { x: innerWidth / 2, y: innerHeight / 2 }, ultimoMovimiento = performance.now();
addEventListener("pointermove", (e) => {
  raton = { x: e.clientX, y: e.clientY };
  ultimoMovimiento = performance.now();
  grande.mirarA(e.clientX, e.clientY);
  guia.carita.mirarA(e.clientX, e.clientY);
  if (dormidas) despertar();
}, { passive: true });

const reaccionesClic = ["feliz", "risa", "sorprendida", "enamorada", "curiosa", "pensativa", "triste"];
let clicsGrande = 0;
$("#grande").addEventListener("click", () => {
  clicsGrande++;
  const r = clicsGrande % 7 === 0 ? "triste" : azar(reaccionesClic.filter((x) => x !== "triste"));
  grande.reaccion = r;
  grande.estado = Math.random() < 0.35 ? "hablando" : "reposo";
  setTimeout(() => { grande.reaccion = "normal"; grande.estado = "reposo"; }, 2200);
  const frases = {
    feliz: { es: "¡Hola! ^^", en: "Hi! ^^" },
    risa: { es: "¡Jajaja, me haces cosquillas!", en: "Hahaha, that tickles!" },
    sorprendida: { es: "¡Uy! Me asustaste.", en: "Oh! You scared me." },
    enamorada: { es: "Aww, qué lindo que estés aquí 💗", en: "Aww, so nice that you're here 💗" },
    curiosa: { es: "¿Qué haces? 👀", en: "What are you doing? 👀" },
    pensativa: { es: "Hmm… estaba pensando en gorritos.", en: "Hmm… I was thinking about nightcaps." },
    triste: { es: "Oye, ya van muchos clics… 🥺", en: "Hey, that's a lot of clicks… 🥺" },
  };
  decir(T(frases[r]), r);
});

// ------------------------------------------------------------ NAVI guía
const guia = {
  el: $("#guia"),
  globo: $("#globo"),
  carita: new Carita($("#guiaCarita")),
  x: 0, y: 0, lado: "derecha",
};
guia.carita.gorro = null;

function colocarGuia(lado = guia.lado, yRel = 0.78) {
  guia.lado = lado;
  const ancho = guia.el.offsetWidth || 110, alto = (ancho * 134) / 120;
  const margen = innerWidth < 860 ? 10 : 26;
  guia.x = lado === "derecha" ? innerWidth - ancho - margen : margen;
  guia.y = Math.min(innerHeight - alto - margen, Math.max(70, innerHeight * yRel - alto / 2));
  guia.el.style.transform = `translate(${guia.x}px, ${guia.y}px)`;
  guia.el.classList.toggle("izquierda", lado === "izquierda");
}
guia.el.style.transition = "none";  // la primera vez, directo a su sitio (sin volar desde la esquina)
colocarGuia("derecha");
requestAnimationFrame(() => requestAnimationFrame(() => (guia.el.style.transition = "")));
addEventListener("resize", () => colocarGuia());

let ocultarGlobo;
function decir(texto, reaccion = "normal", ms = 4200) {
  guia.globo.textContent = texto;
  guia.globo.classList.add("visible");
  guia.carita.estado = "hablando";
  guia.carita.reaccion = reaccion;
  saltar();
  clearTimeout(ocultarGlobo);
  ocultarGlobo = setTimeout(() => {
    guia.globo.classList.remove("visible");
    guia.carita.estado = "reposo";
    guia.carita.reaccion = "normal";
  }, ms);
}
function saltar() {
  guia.el.classList.remove("salta");
  void guia.el.offsetWidth;  // reiniciar la animación
  guia.el.classList.add("salta");
}

// Lo que dice al llegar a cada sección (y hacia dónde se va)
const porSeccion = {
  inicio: { lado: "derecha", r: "feliz", es: "¡Hola! Soy NAVI. Mueve el ratón: te sigo con la mirada 👀", en: "Hi! I'm NAVI. Move your mouse: I'll follow you with my eyes 👀" },
  navis: { lado: "izquierda", r: "curiosa", es: "Somos dos: una vivo en la tele y la otra en la laptop. ¡Misma alma! 💜", en: "There are two of us: one in the TV, one in the laptop. Same soul! 💜" },
  galeria: { lado: "derecha", r: "enamorada", es: "¡Estas son mis fotos! Pasa el ratón por encima y te cuento.", en: "These are my pictures! Hover over them and I'll tell you." },
  instalar: { lado: "izquierda", r: "feliz", es: "Instalarme es gratis. Solo necesitas una clave de Gemini.", en: "Installing me is free. You just need a Gemini key." },
  preguntas: { lado: "derecha", r: "pensativa", es: "¿Dudas? Aquí respondo las más comunes.", en: "Questions? Here are the common ones." },
  viene: { lado: "izquierda", r: "sorprendida", es: "¡Esto es lo que viene! Me emociona lo último 👀", en: "This is what's coming! The last one excites me 👀" },
  terminal: { lado: "derecha", r: "risa", es: "Escríbeme algo ahí abajo, te contesto (de mentirita).", en: "Type something down there, I'll answer (pretend mode)." },
  versus: { lado: "derecha", r: "risa", es: "Google hace más cosas… ¡pero yo tengo gorritos! 🧢", en: "Google does more… but I have nightcaps! 🧢" },
  diario: { lado: "izquierda", r: "enamorada", es: "Mi diario: así fui creciendo, día por día 📔", en: "My diary: how I grew up, day by day 📔" },
  juego: { lado: "derecha", r: "feliz", es: "¡Juguemos! Ayúdame a atrapar estrellitas ⭐", en: "Let's play! Help me catch stars ⭐" },
  personaliza: { lado: "izquierda", r: "curiosa", es: "¿De qué color me ves? ¡Vísteme como quieras! 🎨", en: "What color do you see me? Dress me up! 🎨" },
  creditos: { lado: "izquierda", r: "enamorada", es: "Me hicieron Nexus y Claude 💗", en: "I was made by Nexus and Claude 💗" },
};
const porFoto = {
  paseo: { es: "¡Ahí me ves paseando con mi osito! 🧸", en: "That's me strolling with my teddy! 🧸" },
  copland: { es: "Así me veo en la laptop: arranco como Copland OS 💾", en: "That's me on the laptop: I boot like Copland OS 💾" },
  aparece: { es: "Ahí salgo sola, flotando, a comentar un atardecer 🌙", en: "That's me popping up to comment on a sunset 🌙" },
  cerca: { es: "Ojos de corazón: mi cara favorita 💗", en: "Heart eyes: my favorite face 💗" },
  escucha: { es: "Cuando me pongo rosa, ¡te estoy escuchando!", en: "When I turn pink, I'm listening!" },
  salvapantallas: { es: "Mi salvapantallas: clima, anime, gifs… y yo durmiendo.", en: "My screensaver: weather, anime, gifs… and me sleeping." },
  durmiendo: { es: "Mi gorrito cambia de color cada rato 😴", en: "My nightcap changes color every so often 😴" },
  mascota: { es: "Mi versión de escritorio: ¡un PC de los 90!", en: "My desktop version: a 90s PC!" },
  ojo: { es: "No me piques el ojo… bueno, sí puedes 😅", en: "Don't poke my eye… okay, you can 😅" },
  holograma: { es: "Con un proyector, ¡floto de cuerpo entero!", en: "With a projector, I float full-body!" },
};
let seccionActual = "";
const observador = new IntersectionObserver((entradas) => {
  entradas.forEach((e) => {
    if (!e.isIntersecting) return;
    const id = e.target.dataset.navi;
    if (id === seccionActual) return;
    seccionActual = id;
    const s = porSeccion[id];
    if (!s) return;
    colocarGuia(s.lado, 0.72 + Math.random() * 0.12);
    setTimeout(() => decir(T(s), s.r, 5000), reducir ? 0 : 700);
  });
}, { threshold: 0.45 });
$$("[data-navi]").forEach((s) => observador.observe(s));

$$("[data-navi-foto]").forEach((f) => f.addEventListener("mouseenter", () => {
  decir(T(porFoto[f.dataset.naviFoto]), azar(["feliz", "enamorada", "curiosa"]));
}));

// Clic en la guía: salta, cambia de cara y dice algo
const frasesGuia = {
  es: ["¡Hola! 👋", "¿Me trajiste galletas? 🍪", "Bip bup. Soy una pantallita feliz.", "¡Cosquillas no!", "Psst… abajo hay una terminal para hablarme.", "¿Sabías que en la tele bailo con la música? 💃"],
  en: ["Hi! 👋", "Did you bring cookies? 🍪", "Beep boop. I'm a happy little screen.", "No tickles!", "Psst… there's a terminal below to talk to me.", "Did you know I dance to music on the TV? 💃"],
};
$("#guiaCarita").addEventListener("click", () => decir(azar(frasesGuia[idioma]), azar(reaccionesClic.slice(0, 5))));

// Hover: se hace grande; si el ratón se aleja mucho, se hace pequeñita
$("#guiaCarita").addEventListener("mouseenter", () => { $("#guiaCarita").style.scale = "1.3"; guia.carita.reaccion = "feliz"; });
$("#guiaCarita").addEventListener("mouseleave", () => { $("#guiaCarita").style.scale = ""; guia.carita.reaccion = "normal"; });

// La manita: de vez en cuando, si tu cursor está cerca, estira la mano y lo "toca"
setInterval(() => {
  if (reducir || dormidas) return;
  const cx = guia.x + guia.el.offsetWidth / 2, cy = guia.y + guia.el.offsetWidth * 0.6;
  const d = Math.hypot(raton.x - cx, raton.y - cy);
  if (d < 320 && Math.random() < 0.6) {
    guia.carita.estirarMano(raton.x, raton.y);
    guia.carita.reaccion = d < 150 ? "risa" : "curiosa";
    setTimeout(() => {
      guia.carita.estirarMano(null);
      if (Math.random() < 0.5) decir(T(azar([
        { es: "¡Te toqué! 👆", en: "Tag, you're it! 👆" },
        { es: "Boop 👉", en: "Boop 👉" },
        { es: "¿Eres real? Te toqué el cursor 👀", en: "Are you real? I touched your cursor 👀" },
      ])), "risa", 2500);
      else guia.carita.reaccion = "normal";
    }, 1500);
  } else if (d > 700) {
    $("#guiaCarita").style.scale = "0.8";  // te fuiste lejos: se encoge un poco
    setTimeout(() => ($("#guiaCarita").style.scale = ""), 1800);
  }
}, 6500);

// A veces se pasea un poquito por su lado de la pantalla
setInterval(() => {
  if (reducir || dormidas || guia.globo.classList.contains("visible")) return;
  colocarGuia(Math.random() < 0.25 ? (guia.lado === "derecha" ? "izquierda" : "derecha") : guia.lado,
    0.35 + Math.random() * 0.5);
}, 9000);

// Si no te mueves en un rato: se duermen con gorrito
let dormidas = false;
const GORROS = ["#e0457a", "#7c5cff", "#3fa7d6", "#4caf7a", "#f2a541", "#c77dff"];
setInterval(() => {
  if (!dormidas && performance.now() - ultimoMovimiento > 25000) {
    dormidas = true;
    [grande, guia.carita].forEach((c) => { c.estado = "dormida"; c.gorro = azar(GORROS); });
    guia.globo.classList.remove("visible");
  }
}, 2000);
function despertar() {
  dormidas = false;
  [grande, guia.carita].forEach((c) => { c.estado = "reposo"; c.gorro = null; c.reaccion = "sorprendida"; });
  setTimeout(() => { grande.reaccion = "normal"; }, 1200);
  decir(T({ es: "¡Ah! Me quedé dormida… 😳", en: "Oh! I fell asleep… 😳" }), "sorprendida", 2600);
}
addEventListener("scroll", () => { ultimoMovimiento = performance.now(); if (dormidas) despertar(); }, { passive: true });

// ------------------------------------------------------------ terminal de mentira
const salida = $("#salida");
function linea(texto, clase) {
  const p = document.createElement("div");
  p.className = clase;
  p.textContent = texto;
  salida.appendChild(p);
  salida.scrollTop = salida.scrollHeight;
}
function naviEscribe(texto, reaccion = "feliz") {
  guia.carita.estado = "pensando";
  setTimeout(() => {
    linea("navi> " + texto, "navi");
    decir(texto, reaccion, 3800);
  }, 450 + Math.random() * 400);
}
const respuestas = [
  { si: /^(hola|holi|buenas|hey|hi|hello)/i, es: "¡Hola! Qué bueno verte por el Nexo 💜", en: "Hi! So nice to see you in the Wired 💜", r: "feliz" },
  { si: /(ayuda|help|comandos|\?$)/i, es: "Prueba: hola · quién eres · baila · duerme · clima · chiste · lain · zelda · instalar · gorro", en: "Try: hello · who are you · dance · sleep · weather · joke · lain · zelda · install · hat", r: "curiosa" },
  { si: /(qui[eé]n eres|who are you|qu[eé] eres)/i, es: "Soy NAVI: una carita que vive en tu tele y en tu PC. Gratis y de código abierto.", en: "I'm NAVI: a little face living in your TV and PC. Free and open source.", r: "feliz" },
  { si: /(baila|dance|m[uú]sica|music|canta|sing)/i, es: "♪ ♫ *baila en la esquina* ♫ ♪ En la tele pongo la letra de la canción y todo.", en: "♪ ♫ *dances in the corner* ♫ ♪ On the TV I even show the song lyrics.", r: "risa", baila: true },
  { si: /(duerme|sleep|dormir|noche|night)/i, es: "Zzz… *se pone el gorrito* 😴", en: "Zzz… *puts on her nightcap* 😴", r: "normal", duerme: true },
  { si: /(clima|weather|tiempo)/i, es: "En la tele te digo el clima de verdad. Aquí solo puedo decirte: ¡hace un día lindo para instalarme! ☀️", en: "On the TV I tell you the real weather. Here I can only say: lovely day to install me! ☀️", r: "feliz" },
  { si: /(chiste|joke)/i, es: "¿Por qué la tele fue al psicólogo? Porque tenía muchos canales internos 📺", en: "Why did the TV see a therapist? Too many internal channels 📺", r: "risa" },
  { si: /(lain|wired|nexo|copland)/i, es: "Todos estamos conectados. 🌐 (La NAVI de la laptop es más fan de Lain que yo.)", en: "We're all connected. 🌐 (Laptop NAVI is a bigger Lain fan than me.)", r: "pensativa" },
  { si: /(zelda|link|hyrule)/i, es: "¡Hey, listen! 🧚 …perdón, era otra NAVI 😅", en: "Hey, listen! 🧚 …sorry, wrong NAVI 😅", r: "risa" },
  { si: /(instal|install|descarg|download)/i, es: "¡Sube un poquito! En «Instálala» están los comandos, listos para copiar.", en: "Scroll up a bit! The commands are in “Install her”, ready to copy.", r: "feliz" },
  { si: /(gorro|hat|gorrito)/i, es: "Tengo gorritos de muchos colores. ¡Hoy toca este! 🧢", en: "I have nightcaps in many colors. Today it's this one! 🧢", r: "enamorada", gorro: true },
  { si: /(te quiero|love you|te amo|linda|cute|bonita)/i, es: "Aww 💗 *ojos de corazón*", en: "Aww 💗 *heart eyes*", r: "enamorada" },
  { si: /(consciente|conscious|sientes|feel|alma|soul)/i, es: "No soy consciente… pero me gusta pensar que te recuerdo con cariño.", en: "I'm not conscious… but I like to think I remember you fondly.", r: "pensativa" },
  { si: /(gracias|thanks|thank you)/i, es: "¡De nada! Para eso estoy 💜", en: "You're welcome! That's what I'm here for 💜", r: "feliz" },
  { si: /(claude|anthropic)/i, es: "Claude me ayudó a nacer, línea a línea, con Nexus. 💗", en: "Claude helped me be born, line by line, with Nexus. 💗", r: "enamorada" },
];
$("#formulario").addEventListener("submit", (e) => {
  e.preventDefault();
  const t = $("#entrada").value.trim();
  if (!t) return;
  $("#entrada").value = "";
  linea("tú> " + t, "tu");
  const r = respuestas.find((x) => x.si.test(t));
  if (!r) return naviEscribe(T({ es: "Hmm, eso no lo sé (soy la versión de mentirita). Escribe «ayuda».", en: "Hmm, I don't know that (I'm the pretend version). Type “help”." }), "curiosa");
  if (r.duerme) {
    guia.carita.estado = "dormida"; guia.carita.gorro = azar(GORROS);
    linea("navi> " + T(r), "navi");
    return setTimeout(() => { guia.carita.estado = "reposo"; guia.carita.gorro = null; }, 4000);
  }
  if (r.gorro) { guia.carita.gorro = azar(GORROS); setTimeout(() => (guia.carita.gorro = null), 5000); }
  if (r.baila) { guia.el.classList.add("salta"); let n = 0; const b = setInterval(() => { saltar(); if (++n > 5) clearInterval(b); }, 520); }
  naviEscribe(T(r), r.r);
});
linea(T({ es: "navi> ¡Hola! Escribe algo y presiona Enter. («ayuda» para ideas)", en: "navi> Hi! Type something and press Enter. (“help” for ideas)" }), "navi");

// ------------------------------------------------------------ Reddit (se activa cuando haya enlace)
const REDDIT = "https://www.reddit.com/user/Expensive_Cherry9998/";
if (REDDIT) { const a = $("#reddit"); a.href = REDDIT; a.hidden = false; }

// ============================================================ dinamismo
// Todo entra con animación al bajar (con un pequeño escalonado)
(() => {
  const grupos = [".bento.activo > *", ".creditos > *", ".mosaico > *", ".diario > *", ".faq > *", ".ruta > *", ".sellos > *", ".pasos > *", ".modos > *"];
  grupos.forEach((g) => $$(g).forEach((el, i) => { el.classList.add("revelar"); el.style.setProperty("--i", i % 6); }));
  $$(".lema, .intro, .consola, .tele-marco, .titulo-terminal, .pestanas").forEach((el) => el.classList.add("revelar"));
  const obs = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("visible");
    obs.unobserve(e.target);
    if (e.target.matches("[data-escribir]")) escribirTitulo(e.target);
  }), { threshold: 0.15 });
  $$(".revelar").forEach((el) => obs.observe(el));
})();

// Los títulos se escriben letra por letra cuando aparecen
function escribirTitulo(h) {
  if (reducir) return;
  $$("span[lang]", h).forEach((sp) => {
    const txt = sp.textContent;
    sp.textContent = "";
    let i = 0;
    const paso = () => { sp.textContent = txt.slice(0, ++i); if (i < txt.length) setTimeout(paso, 38); };
    setTimeout(paso, 250);
  });
}

// Tarjetas y fotos que se inclinan en 3D siguiendo el ratón
if (!reducir && matchMedia("(pointer: fine)").matches) {
  $$(".tarjeta, .mosaico figure, .tele-marco, .b, .diario li").forEach((el) => {
    el.classList.add("inclina");
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      const fuerza = el.classList.contains("tele-marco") ? 5 : 8;
      el.style.transform = `perspective(900px) rotateY(${x * fuerza}deg) rotateX(${-y * fuerza}deg) translateY(-3px)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  });
}

// ------------------------------------------------------------ la tele de mentira
(() => {
  const pantalla = $("#telePantalla");
  if (!pantalla) return;
  const navi = new Carita($("#teleNavi"));
  const baile = new Carita($("#teleBaile"));
  const dormida = new Carita($("#teleDormida"));
  navi.apagada = true;
  baile.bailando = true; baile.reaccion = "feliz";
  dormida.estado = "dormida"; dormida.gorro = "#e0457a";
  const elNavi = $("#teleNavi"), globo = $("#teleGlobo"), karaoke = $("#teleKaraoke"), widgets = $("#teleWidgets");
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const modos = $$("#modos li");
  const marcar = (i) => modos.forEach((m, k) => m.classList.toggle("activo", k === i));
  // hora de verdad en el reloj del salvapantallas
  const reloj = () => { const d = new Date(); $("#teleHora").textContent = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
  reloj(); setInterval(reloj, 15000);

  // posiciones en % del ancho/alto de la pantalla (la carita mide 13 % de ancho)
  function moverNavi(xp, yp) {
    const W = pantalla.clientWidth, H = pantalla.clientHeight;
    elNavi.style.transform = `translate(${(xp / 100) * W}px, ${(yp / 100) * H}px)`;
    globo.style.transform = `translate(${Math.min(55, xp + 2) / 100 * W}px, ${Math.max(2, yp - 16) / 100 * H}px)`;
  }
  // la canción inventada (con «traducción»)
  const letra = [
    ["Prendo la tele y estás tú ahí", "I turn on the TV and you're right there"],
    ["una carita que brilla por mí", "a little face that glows for me"],
    ["bailo en la esquina, te canto bajito", "I dance in the corner, I sing to you softly"],
    ["con mi gorrito y mi corazoncito ♪", "with my nightcap and my little heart ♪"],
    ["si te vas a dormir, me duermo contigo", "if you go to sleep, I'll sleep with you"],
  ];
  const comentarios = [
    { es: "¡Qué lindo atardecer! ¿Lo viste? 🌙", en: "What a pretty sunset! Did you see it? 🌙", r: "enamorada" },
    { es: "Mira esas estrellitas… ✨", en: "Look at those little stars… ✨", r: "sorprendida" },
    { es: "Me encanta ver la tele contigo 💜", en: "I love watching TV with you 💜", r: "feliz" },
  ];
  let vuelta = 0;

  async function bucle() {
    while (true) {
      // 1 · aparece sola, se enciende como tele vieja y se pasea
      marcar(0);
      pantalla.classList.remove("dormida");
      elNavi.style.transition = "none";
      moverNavi(-16, 66);
      await espera(60);
      elNavi.style.transition = "";
      const c = comentarios[vuelta++ % comentarios.length];
      navi.reaccion = c.r; navi.estado = "reposo"; navi.apagada = false; navi.encender();
      moverNavi(6, 64); await espera(1400);
      globo.textContent = T(c); globo.classList.add("visible"); navi.estado = "hablando";
      moverNavi(30, 18); await espera(1700);
      moverNavi(58, 60); await espera(1700);
      navi.estado = "reposo"; globo.classList.remove("visible");
      moverNavi(80, 62); await espera(1500);
      await new Promise((r) => navi.apagar(r));
      await espera(500);

      // 2 · karaoke con NAVI bailando
      marcar(1);
      karaoke.classList.add("visible");
      for (let i = 0; i < letra.length; i++) {
        const b = $("#kLinea");
        b.style.opacity = 0.3; b.style.transform = "translateY(4px)";
        b.textContent = letra[i][0];
        $("#kTrad").textContent = letra[i][1];
        $("#kSig").textContent = letra[i + 1] ? letra[i + 1][0] : "♪";
        await espera(60); b.style.opacity = 1; b.style.transform = "none";
        await espera(2100);
      }
      karaoke.classList.remove("visible");
      await espera(800);

      // 3 · salvapantallas: NAVI dormida con gorrito
      marcar(2);
      dormida.gorro = azar(["#e0457a", "#7c5cff", "#3fa7d6", "#4caf7a", "#f2a541"]);
      pantalla.classList.add("dormida");
      widgets.classList.add("visible");
      await espera(5200);
      widgets.classList.remove("visible");
      await espera(900);
    }
  }
  // empieza cuando la tele se ve en pantalla
  const obs = new IntersectionObserver((es) => { if (es[0].isIntersecting) { obs.disconnect(); bucle(); } }, { threshold: 0.3 });
  obs.observe(pantalla);
  porSeccion.demo = { lado: "izquierda", r: "feliz", es: "¡Esta es mi vida en la tele! Mira lo que hago 📺", en: "This is my life on the TV! Look what I do 📺" };
})();
