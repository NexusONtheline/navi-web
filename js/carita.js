// La carita de NAVI: la misma pantallita CRT de NAVI TV, dibujada en un <canvas>.
// Lienzo lógico de 120×104 (más espacio arriba para el gorrito), se escala al tamaño real.
"use strict";

const AZUL = [158, 204, 255];
const ROSA = [224, 69, 122];
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a))})`;

const PX = 14, PY = 12, PW = 92, PH = 76, OJOS_Y = 44, OJOS_X = [48, 72];
const ARRIBA = 30;            // espacio para el gorrito
const ANCHO = 120, ALTO = 104 + ARRIBA;

class Carita {
  /** @param {HTMLCanvasElement} lienzo */
  constructor(lienzo) {
    this.lienzo = lienzo;
    this.c = lienzo.getContext("2d");
    this.inicio = performance.now();
    this.estado = "reposo";          // reposo · escuchando · pensando · hablando · dormida
    this.reaccion = "normal";        // normal feliz risa sorprendida curiosa enamorada triste pensativa
    this.mirada = { x: 0, y: 0 };    // -1..1
    this.objetivo = { x: 0, y: 0 };
    this.gorro = null;               // color del gorrito o null
    this.parpadeo = 0;
    this.proximoParpadeo = performance.now() + 2500;
    this.mano = null;                // {x, y} en coordenadas del lienzo lógico: hacia dónde estira la manita
    this.manoProgreso = 0;
    this.bailando = false;
    this.tele = null;                // animación de tele vieja: {inicio, encender, fin}
    this.apagada = false;
    this._redimensionar();
    new ResizeObserver(() => this._redimensionar()).observe(lienzo);
    requestAnimationFrame((t) => this._cuadro(t));
  }

  _redimensionar() {
    const r = this.lienzo.getBoundingClientRect();
    const d = window.devicePixelRatio || 1;
    this.lienzo.width = Math.max(1, Math.round(r.width * d));
    this.lienzo.height = Math.max(1, Math.round(r.height * d));
  }

  /** Mira hacia un punto de la página (en px de pantalla). */
  mirarA(xPantalla, yPantalla) {
    const r = this.lienzo.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height * 0.45;
    const dx = (xPantalla - cx) / Math.max(200, r.width * 2);
    const dy = (yPantalla - cy) / Math.max(200, r.height * 2);
    this.objetivo.x = Math.max(-1, Math.min(1, dx));
    this.objetivo.y = Math.max(-1, Math.min(1, dy));
  }

  /** Se enciende como una tele vieja: puntito → línea → pantalla. */
  encender() { this.apagada = false; this.tele = { inicio: performance.now(), encender: true }; }

  /** Se apaga como una tele vieja y luego llama a fin(). */
  apagar(fin) { this.tele = { inicio: performance.now(), encender: false, fin }; }

  /** Estira la manita hacia un punto de la pantalla (null = guardarla). */
  estirarMano(xPantalla, yPantalla) {
    if (xPantalla == null) { this.mano = null; return; }
    const r = this.lienzo.getBoundingClientRect();
    const e = Math.min(r.width / ANCHO, r.height / ALTO);
    this.mano = { x: (xPantalla - r.left) / e, y: (yPantalla - r.top) / e - ARRIBA };
  }

  _cuadro(ahora) {
    const c = this.c, t = (ahora - this.inicio) / 1000;
    const w = this.lienzo.width, h = this.lienzo.height;
    c.clearRect(0, 0, w, h);
    const e = Math.min(w / ANCHO, h / ALTO);
    c.save();
    c.translate((w - ANCHO * e) / 2, (h - ALTO * e) / 2);
    c.scale(e, e);
    c.translate(0, ARRIBA);
    if (this.apagada) { c.restore(); return requestAnimationFrame((x) => this._cuadro(x)); }

    let destello = 0;
    if (this.tele) {
      const p = Math.min(1, (ahora - this.tele.inicio) / 480);
      const f = this.tele.encender ? p : 1 - p;
      const sx = f < 0.35 ? Math.max(0.02, f / 0.35) : 1;
      const sy = f < 0.35 ? 0.03 : 0.03 + 0.97 * ((f - 0.35) / 0.65);
      c.translate(ANCHO / 2, PY + PH / 2); c.scale(sx, sy); c.translate(-ANCHO / 2, -(PY + PH / 2));
      destello = f < 0.5 ? 1 - f * 2 : 0;
      if (p >= 1) {
        const fin = this.tele.fin, enc = this.tele.encender;
        this.tele = null;
        if (!enc) { this.apagada = true; if (fin) setTimeout(fin, 0); }
      }
    }
    if (this.bailando) {
      const beat = t * 2;
      c.translate(0, -Math.abs(Math.sin(Math.PI * beat)) * 7);
      c.translate(ANCHO / 2, PY + PH); c.rotate(Math.sin(Math.PI * beat) * 0.16); c.translate(-ANCHO / 2, -(PY + PH));
    }

    const dormida = this.estado === "dormida";
    c.translate(0, dormida ? Math.sin(t * 0.8) * 1.5 : Math.sin(t * 1.6) * 2.5);

    // la mirada se acerca suave al objetivo
    this.mirada.x += (this.objetivo.x - this.mirada.x) * 0.12;
    this.mirada.y += (this.objetivo.y - this.mirada.y) * 0.12;

    const color = this.estado === "escuchando" || this.reaccion === "enamorada" ? ROSA : AZUL;

    // manita (detrás de la pantalla)
    this.manoProgreso += ((this.mano ? 1 : 0) - this.manoProgreso) * 0.15;
    if (this.manoProgreso > 0.02) this._mano(c, t);

    // brillo
    const pulso = this.estado === "escuchando" ? 0.55 + 0.25 * Math.sin(t * 6)
      : dormida ? 0.18 + 0.05 * Math.sin(t * 0.8) : 0.32 + 0.08 * Math.sin(t * 2);
    c.save();
    c.shadowColor = rgba(color, pulso);
    c.shadowBlur = 18 * e;
    c.fillStyle = "#1e1b2b";
    this._redondo(c, PX - 3, PY - 3, PW + 6, PH + 6, 17);
    c.fill();
    c.restore();

    // pantalla
    c.fillStyle = "#05070d";
    this._redondo(c, PX, PY, PW, PH, 14); c.fill();
    c.fillStyle = rgba(color, 0.1 + 0.03 * Math.sin(t * 3));
    this._redondo(c, PX, PY, PW, PH, 14); c.fill();

    c.save();
    this._redondo(c, PX + 3, PY + 3, PW - 6, PH - 6, 12); c.clip();
    c.fillStyle = rgba(color, 0.06);
    for (let y = PY; y < PY + PH; y += 3) c.fillRect(PX, y, PW, 1);
    if (this.estado === "pensando") {
      c.fillStyle = rgba(color, 0.2);
      c.fillRect(PX, PY + (t * 45) % PH, PW, 4);
    }
    if (dormida) this._dormir(c, t, color); else this._cara(c, t, color, ahora);
    c.restore();

    // reflejo y lucecita
    c.strokeStyle = "rgba(255,255,255,0.09)"; c.lineWidth = 2.5; c.lineCap = "round";
    c.beginPath(); c.moveTo(PX + 12, PY + 6);
    c.bezierCurveTo(PX + 30, PY + 3, PX + 60, PY + 3, PX + PW - 14, PY + 6); c.stroke();
    c.fillStyle = dormida ? "#285a37" : this.estado !== "reposo" && Math.floor(t * 4) % 2 ? rgba(ROSA, 1) : "#40a659";
    c.beginPath(); c.arc(PX + PW / 2, PY + PH + 8, 1.8, 0, Math.PI * 2); c.fill();

    if (this.gorro) this._gorrito(c, t);
    if (dormida) this._zetas(c, t, color);
    if (this.bailando) this._notitas(c, t, color);
    if (destello > 0) {
      c.fillStyle = `rgba(255,255,255,${destello})`;
      this._redondo(c, PX - 3, PY - 3, PW + 6, PH + 6, 17); c.fill();
    }
    c.restore();
    requestAnimationFrame((x) => this._cuadro(x));
  }

  _redondo(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  _cara(c, t, color, ahora) {
    if (ahora > this.proximoParpadeo) {
      this.parpadeo = ahora;
      this.proximoParpadeo = ahora + 2500 + Math.random() * 3500;
    }
    const av = (ahora - this.parpadeo) / 1000;
    const abierto = av > 0.15 ? 1 : Math.abs(av / 0.075 - 1);
    const re = this.estado === "escuchando" || this.estado === "pensando" ? "normal" : this.reaccion;
    let mx = this.mirada.x * 7, my = this.mirada.y * 5;
    if (this.estado === "pensando") { mx = 6 * Math.sin(t * 2); my = -4; }
    if (re === "pensativa") { mx = 5; my = -5; }
    if (re === "triste") my += 3;
    const tinta = rgba(color, 0.95);
    c.fillStyle = tinta; c.strokeStyle = tinta; c.lineCap = "round";

    OJOS_X.forEach((ox, i) => {
      const cx = ox + mx, cy = OJOS_Y + my;
      if (re === "feliz" || re === "risa") {
        c.lineWidth = 2.6; c.beginPath(); c.moveTo(cx - 6, cy + 3); c.quadraticCurveTo(cx, cy - 7, cx + 6, cy + 3); c.stroke();
      } else if (re === "sorprendida") {
        c.beginPath(); c.arc(cx, cy, 6.5 * Math.max(0.15, abierto), 0, Math.PI * 2); c.fill();
      } else if (re === "enamorada") {
        this._corazon(c, cx, cy, 6.5 + 0.8 * Math.sin(t * 6));
      } else {
        const alto = (re === "curiosa" ? (i === 0 ? 16 : 10) : this.estado === "escuchando" ? 16 : re === "triste" ? 11 : 13)
          * Math.max(0.12, abierto);
        this._redondo(c, cx - 5.5, cy - alto / 2, 11, alto, 3); c.fill();
        if (re === "triste") {
          const lado = i === 0 ? 1 : -1;
          c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx - 6 * lado, cy - 11); c.lineTo(cx + 5 * lado, cy - 8); c.stroke();
        }
      }
    });
    if (re === "curiosa") {
      c.font = "bold 14px sans-serif"; c.fillStyle = rgba(color, 0.8);
      c.fillText("?", PX + PW - 18, PY + 20 + 2 * Math.sin(t * 3));
    }

    const bx = (OJOS_X[0] + OJOS_X[1]) / 2 + mx * 0.5, by = OJOS_Y + 21 + my * 0.5;
    c.fillStyle = tinta; c.strokeStyle = tinta;
    if (this.estado === "hablando") {
      const boca = Math.abs(Math.sin(t * 11)) * 5 + Math.abs(Math.sin(t * 7)) * 2;
      c.beginPath(); c.ellipse(bx, by, 7, 7 * Math.max(0.15, boca / 7), 0, 0, Math.PI * 2); c.fill();
    } else if (re === "risa") {
      c.beginPath(); c.moveTo(bx - 8, by - 1); c.lineTo(bx + 8, by - 1); c.arc(bx, by - 1, 8, 0, Math.PI); c.fill();
    } else if (re === "sorprendida") {
      c.lineWidth = 2; c.beginPath(); c.arc(bx, by + 1, 4, 0, Math.PI * 2); c.stroke();
    } else if (re === "triste") {
      c.lineWidth = 1.9; c.beginPath(); c.moveTo(bx - 7, by + 3); c.bezierCurveTo(bx - 3, by - 2, bx + 3, by - 2, bx + 7, by + 3); c.stroke();
    } else if (re === "pensativa") {
      c.lineWidth = 1.9; c.beginPath(); c.moveTo(bx - 5, by + 1); c.lineTo(bx + 5, by - 1); c.stroke();
    } else {
      const s = this.estado === "escuchando" ? 4 : re === "feliz" || re === "enamorada" ? 6 : 1.5;
      c.lineWidth = 1.9; c.beginPath(); c.moveTo(bx - 7, by); c.bezierCurveTo(bx - 3, by + s, bx + 3, by + s, bx + 7, by); c.stroke();
    }
  }

  _corazon(c, cx, cy, tam) {
    c.beginPath();
    c.moveTo(cx, cy + tam * 0.8);
    c.bezierCurveTo(cx - tam * 1.4, cy - tam * 0.1, cx - tam * 0.6, cy - tam * 1.1, cx, cy - tam * 0.35);
    c.bezierCurveTo(cx + tam * 0.6, cy - tam * 1.1, cx + tam * 1.4, cy - tam * 0.1, cx, cy + tam * 0.8);
    c.fill();
  }

  _dormir(c, t, color) {
    c.strokeStyle = rgba(color, 0.85); c.lineWidth = 2.2; c.lineCap = "round";
    OJOS_X.forEach((ox) => {
      c.beginPath(); c.moveTo(ox - 6, OJOS_Y + 1); c.quadraticCurveTo(ox, OJOS_Y + 7, ox + 6, OJOS_Y + 1); c.stroke();
    });
    const a = 1.5 + 1.2 * Math.sin(t * 0.8);
    c.fillStyle = rgba(color, 0.7);
    c.beginPath(); c.ellipse(60, OJOS_Y + 20, 3, a, 0, 0, Math.PI * 2); c.fill();
  }

  _notitas(c, t, color) {
    const notas = ["♪", "♫", "♪"];
    for (let i = 0; i < 3; i++) {
      const f = (t * 0.45 + i / 3) % 1;
      c.font = `${11 + f * 7}px sans-serif`;
      c.fillStyle = rgba(i === 1 ? ROSA : color, (1 - f) * 0.95);
      const x = i % 2 === 0 ? PX - 12 - f * 10 : PX + PW + 2 + f * 10;
      c.fillText(notas[i], x, PY + 30 - f * 40);
    }
  }

  _zetas(c, t, color) {
    c.font = "bold 12px sans-serif";
    for (let i = 0; i < 3; i++) {
      const f = (t * 0.25 + i / 3) % 1;
      c.font = `bold ${9 + f * 9}px sans-serif`;
      c.fillStyle = rgba(color, (1 - f) * 0.9);
      c.fillText("z", PX + PW - 6 + f * 14, PY + 10 - f * 34);
    }
  }

  _gorrito(c, t) {
    const cae = Math.sin(t * 0.8) * 2;
    c.beginPath();
    c.moveTo(PX + 4, PY + 2);
    c.bezierCurveTo(PX + 10, PY - 30, PX + 60, PY - 34, PX + 96 + cae, PY - 8 + cae);
    c.bezierCurveTo(PX + 70, PY - 16, PX + 62, PY - 6, PX + 66, PY + 2);
    c.closePath();
    c.fillStyle = this.gorro; c.fill();
    c.save(); c.clip(); c.fillStyle = "rgba(255,255,255,0.55)";
    for (let i = 0; i < 6; i++) c.fillRect(PX + 6 + i * 16, PY - 40, 6, 44);
    c.restore();
    c.fillStyle = "#f0ece4";
    this._redondo(c, PX - 2, PY - 4, 72, 9, 4.5); c.fill();
    c.beginPath(); c.arc(PX + 98 + cae, PY - 6 + cae, 6, 0, Math.PI * 2); c.fill();
  }

  /** Una manita con bracito que se estira hacia this.mano. */
  _mano(c, t) {
    const p = this.manoProgreso;
    const origen = { x: this.mano && this.mano.x < ANCHO / 2 ? PX + 4 : PX + PW - 4, y: PY + PH - 10 };
    const destino = this.mano || origen;
    // no estirarse más de ~70 unidades
    let dx = destino.x - origen.x, dy = destino.y - origen.y;
    const largo = Math.hypot(dx, dy) || 1, max = 70 * p;
    if (largo > max) { dx *= max / largo; dy *= max / largo; }
    const hx = origen.x + dx, hy = origen.y + dy;
    c.strokeStyle = "#1e1b2b"; c.lineWidth = 5; c.lineCap = "round";
    c.beginPath(); c.moveTo(origen.x, origen.y);
    c.quadraticCurveTo(origen.x + dx * 0.5, origen.y + dy * 0.5 + 10 * Math.sin(t * 4), hx, hy); c.stroke();
    // la manita: palma y deditos, moviéndose un poco
    const ang = Math.atan2(dy, dx);
    c.save(); c.translate(hx, hy); c.rotate(ang + Math.sin(t * 6) * 0.15);
    c.fillStyle = "#d9d2ff";
    c.beginPath(); c.arc(0, 0, 5.5, 0, Math.PI * 2); c.fill();
    for (let k = -1; k <= 1; k++) { c.beginPath(); c.ellipse(5.5, k * 3.2, 3.2, 1.6, k * 0.3, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
}

window.Carita = Carita;
