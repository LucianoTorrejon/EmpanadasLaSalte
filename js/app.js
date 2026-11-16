(() => {
  "use strict";

  const C = window.CONFIG;
  const P = C.precios;
  const $ = (sel) => document.querySelector(sel);

  // ---------------------------------------------------------------
  //  Estado (sólo en memoria: no se guarda nada en ningún servidor)
  // ---------------------------------------------------------------
  const cart = new Map(); // clave "variedad|tipo" -> cantidad
  const delivery = { lat: null, lng: null, km: null };
  let map = null;
  let marker = null;

  // ---------------------------------------------------------------
  //  Utilidades
  // ---------------------------------------------------------------
  const money = (n) => "$" + Math.round(n).toLocaleString("es-AR");
  const key = (v, t) => `${v}|${t}`;
  const variedad = (id) => C.variedades.find((v) => v.id === id);
  const tipo = (id) => C.tipos.find((t) => t.id === id);

  function totalUnidades() {
    let n = 0;
    cart.forEach((q) => (n += q));
    return n;
  }

  /** Desglose de precio sobre el total de empanadas (docenas + medias + unidades). */
  function calcularPrecio(n) {
    const docenas = Math.floor(n / 12);
    const resto = n % 12;
    const medias = Math.floor(resto / 6);
    const unidades = resto % 6;
    const total = docenas * P.docena + medias * P.media + unidades * P.unidad;
    return { n, docenas, medias, unidades, total };
  }

  function describirDesglose(d) {
    const partes = [];
    if (d.docenas) partes.push(`${d.docenas} docena${d.docenas > 1 ? "s" : ""}`);
    if (d.medias) partes.push(`${d.medias} media docena`);
    if (d.unidades) partes.push(`${d.unidades} unidad${d.unidades > 1 ? "es" : ""}`);
    return partes.join(" + ");
  }

  /** Sugerencia para que el cliente aproveche el precio por media/docena. */
  function sugerencia(d) {
    const resto = d.n % 12;
    if (d.n === 0) return "";
    if (resto === 0) return "";
    const faltaDocena = 12 - resto;
    const costoResto = (resto >= 6 ? P.media : 0) + (resto % 6) * P.unidad;
    if (costoResto >= P.docena) {
      return `Agregando ${faltaDocena} empanada${faltaDocena > 1 ? "s" : ""} completás la docena y pagás menos.`;
    }
    if (resto < 6) {
      const faltaMedia = 6 - resto;
      const costoUnid = resto * P.unidad;
      if (costoUnid >= P.media) {
        return `Agregando ${faltaMedia} empanada${faltaMedia > 1 ? "s" : ""} completás la media docena por el mismo precio o menos.`;
      }
      return `Te faltan ${faltaMedia} para la media docena (${money(P.media)}).`;
    }
    return `Te faltan ${faltaDocena} para completar la docena (${money(P.docena)}).`;
  }

  function distanciaKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 2400);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------------------------------------------------------------
  //  Menú
  // ---------------------------------------------------------------
  function renderMenu() {
    $("#p-unidad").textContent = money(P.unidad);
    $("#p-media").textContent = money(P.media);
    $("#p-docena").textContent = money(P.docena);

    $("#menu").innerHTML = C.variedades
      .map(
        (v) => `
      <article class="item">
        ${v.foto ? `<div class="item-photo"><img src="${escapeHtml(v.foto)}" alt="Empanada de ${escapeHtml(v.nombre.toLowerCase())}" loading="lazy" onerror="this.parentNode.remove()" /></div>` : ""}
        <div class="item-head">
          <div class="item-emoji" aria-hidden="true">${v.emoji}</div>
          <div>
            <h2>${escapeHtml(v.nombre)}</h2>
            <p class="item-desc">${escapeHtml(v.desc)}</p>
          </div>
        </div>
        ${C.tipos
          .map(
            (t) => `
        <div class="item-row">
          <span class="item-row-label">${escapeHtml(t.nombre)}</span>
          <div class="item-row-right">
            <div class="stepper" role="group" aria-label="Cantidad ${escapeHtml(v.nombre)} ${escapeHtml(t.nombre)}">
              <button type="button" data-act="dec" data-k="${key(v.id, t.id)}" aria-label="Quitar una">−</button>
              <output data-out="${key(v.id, t.id)}">0</output>
              <button type="button" class="plus" data-act="inc" data-k="${key(v.id, t.id)}" aria-label="Agregar una">+</button>
            </div>
            <div class="quick">
              <button type="button" data-act="add6" data-k="${key(v.id, t.id)}">+6</button>
              <button type="button" data-act="add12" data-k="${key(v.id, t.id)}">+12</button>
            </div>
          </div>
        </div>`
          )
          .join("")}
      </article>`
      )
      .join("");
  }

  function renderCredits() {
    const cr = C.variedades.filter((v) => v.credito);
    if (!cr.length) return;
    $("#credits").innerHTML =
      "Fotos: " +
      cr
        .map((v) => `${escapeHtml(v.nombre)}: <a href="${escapeHtml(v.credito.url)}" target="_blank" rel="noopener">${escapeHtml(v.credito.autor)}</a> (${escapeHtml(v.credito.licencia)})`)
        .join(" · ") +
      ", vía Wikimedia Commons.";
    $("#credits").hidden = false;
  }

  function setQty(k, q) {
    q = Math.max(0, Math.min(999, q));
    if (q === 0) cart.delete(k);
    else cart.set(k, q);
    refresh();
  }

  function handleQtyClick(e) {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const k = btn.dataset.k;
    const cur = cart.get(k) || 0;
    const delta = { inc: 1, dec: -1, add6: 6, add12: 12, del: -cur }[btn.dataset.act];
    setQty(k, cur + delta);
  }

  // ---------------------------------------------------------------
  //  Carrito y resúmenes
  // ---------------------------------------------------------------
  function summaryHtml(withTip) {
    const d = calcularPrecio(totalUnidades());
    const rows = [];
    if (d.docenas) rows.push(row(`${d.docenas} × docena`, money(d.docenas * P.docena)));
    if (d.medias) rows.push(row(`${d.medias} × media docena`, money(d.medias * P.media)));
    if (d.unidades) rows.push(row(`${d.unidades} × unidad`, money(d.unidades * P.unidad)));
    rows.push(`<div class="summary-row total"><span>Total (${d.n} empanadas)</span><span>${money(d.total)}</span></div>`);
    const tip = withTip ? sugerencia(d) : "";
    return rows.join("") + (tip ? `<div class="summary-tip">💡 ${tip}</div>` : "");

    function row(a, b) {
      return `<div class="summary-row muted"><span>${a}</span><span>${b}</span></div>`;
    }
  }

  function renderCart() {
    const list = $("#cart-list");
    if (cart.size === 0) {
      list.innerHTML = `<li class="empty">Tu pedido está vacío.<br/>Agregá empanadas desde el menú.</li>`;
      $("#cart-summary").hidden = true;
      $("#btn-to-checkout").disabled = true;
      $("#btn-clear").hidden = true;
      return;
    }
    $("#cart-summary").hidden = false;
    $("#btn-to-checkout").disabled = false;
    $("#btn-clear").hidden = false;

    // Ordenar según el orden del menú
    const items = [];
    C.variedades.forEach((v) =>
      C.tipos.forEach((t) => {
        const q = cart.get(key(v.id, t.id));
        if (q) items.push({ v, t, q, k: key(v.id, t.id) });
      })
    );
    list.innerHTML = items
      .map(
        ({ v, t, q, k }) => `
      <li class="cart-item">
        <span aria-hidden="true">${v.emoji}</span>
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(v.nombre)}</div>
          <div class="cart-item-type">${escapeHtml(t.nombre)}</div>
        </div>
        <div class="stepper">
          <button type="button" data-act="dec" data-k="${k}" aria-label="Quitar una">−</button>
          <output>${q}</output>
          <button type="button" class="plus" data-act="inc" data-k="${k}" aria-label="Agregar una">+</button>
        </div>
      </li>`
      )
      .join("");
    $("#cart-summary").innerHTML = summaryHtml(true);
  }

  function refresh() {
    // Contadores del menú
    document.querySelectorAll("output[data-out]").forEach((o) => {
      const q = cart.get(o.dataset.out) || 0;
      o.textContent = q;
      o.previousElementSibling.disabled = q === 0;
    });
    const n = totalUnidades();
    const d = calcularPrecio(n);
    $("#cart-bar").hidden = n === 0 || sheetOpen;
    $("#cart-bar-count").textContent = n;
    $("#cart-bar-total").textContent = money(d.total);
    renderCart();
    $("#checkout-summary").innerHTML = summaryHtml(false);
    if (n === 0 && currentStep === "checkout") showStep("cart");
  }

  // ---------------------------------------------------------------
  //  Panel (pasos)
  // ---------------------------------------------------------------
  let sheetOpen = false;
  let currentStep = "cart";

  function openSheet(step = "cart") {
    sheetOpen = true;
    $("#overlay").hidden = false;
    $("#sheet").classList.add("open");
    $("#sheet").setAttribute("aria-hidden", "false");
    $("#cart-bar").hidden = true;
    document.body.style.overflow = "hidden";
    showStep(step);
  }

  function closeSheet() {
    sheetOpen = false;
    $("#overlay").hidden = true;
    $("#sheet").classList.remove("open");
    $("#sheet").setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (currentStep === "done") resetAll();
    refresh();
  }

  function showStep(step) {
    currentStep = step;
    $("#step-cart").hidden = step !== "cart";
    $("#step-checkout").hidden = step !== "checkout";
    $("#step-done").hidden = step !== "done";
    $("#sheet-back").hidden = step !== "checkout";
    $("#sheet-title").textContent = { cart: "Tu pedido", checkout: "Datos de entrega", done: "Último paso" }[step];
    if (step === "checkout" && isEnvio()) ensureMap();
    $("#sheet").querySelector(".sheet-body:not([hidden])").scrollTop = 0;
  }

  // ---------------------------------------------------------------
  //  Entrega / ubicación
  // ---------------------------------------------------------------
  const isEnvio = () => document.querySelector('input[name="entrega"]:checked').value === "envio";

  function onEntregaChange() {
    const envio = isEnvio();
    $("#envio-box").hidden = !envio;
    $("#retiro-info").hidden = envio;
    $("#form-error").hidden = true;
    if (envio) ensureMap();
  }

  function ensureMap() {
    if (typeof L === "undefined") {
      $("#map").innerHTML = '<p class="hint" style="padding:12px">No se pudo cargar el mapa. Usá “Usar mi ubicación” o buscá tu dirección.</p>';
      return;
    }
    if (map) {
      setTimeout(() => map.invalidateSize(), 50);
      return;
    }
    // Esperar a que el contenedor sea visible para que Leaflet calcule bien el tamaño
    requestAnimationFrame(() => {
      map = L.map("map", { scrollWheelZoom: false }).setView([C.local.lat, C.local.lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      L.circle([C.local.lat, C.local.lng], {
        radius: C.radioKm * 1000,
        color: "#b5361b",
        weight: 1.5,
        fillColor: "#b5361b",
        fillOpacity: 0.07,
      }).addTo(map);

      L.marker([C.local.lat, C.local.lng], {
        icon: L.divIcon({ className: "", html: '<div style="font-size:26px;line-height:1">🏪</div>', iconSize: [28, 28], iconAnchor: [14, 14] }),
        interactive: false,
      }).addTo(map);

      map.on("click", (e) => setDeliveryPoint(e.latlng.lat, e.latlng.lng, { reverse: true }));
      setTimeout(() => map.invalidateSize(), 300);
      if (delivery.lat != null) setDeliveryPoint(delivery.lat, delivery.lng, { pan: true });
    });
  }

  function setDeliveryPoint(lat, lng, opts = {}) {
    delivery.lat = lat;
    delivery.lng = lng;
    delivery.km = distanciaKm(C.local.lat, C.local.lng, lat, lng);

    if (map) {
      if (!marker) {
        marker = L.marker([lat, lng], {
          draggable: true,
          icon: L.divIcon({ className: "", html: '<div style="font-size:32px;line-height:1">📍</div>', iconSize: [32, 32], iconAnchor: [16, 30] }),
        }).addTo(map);
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          setDeliveryPoint(p.lat, p.lng, { reverse: true });
        });
      } else {
        marker.setLatLng([lat, lng]);
      }
      if (opts.pan) map.setView([lat, lng], Math.max(map.getZoom(), 15));
    }

    const st = $("#dist-status");
    st.hidden = false;
    const kmTxt = delivery.km.toLocaleString("es-AR", { maximumFractionDigits: 1 });
    if (delivery.km <= C.radioKm) {
      st.className = "dist-status ok";
      st.textContent = `✔ Estás a ${kmTxt} km del local: hacemos envío a tu zona.`;
    } else {
      st.className = "dist-status err";
      st.textContent = `✖ Estás a ${kmTxt} km del local. Sólo enviamos hasta ${C.radioKm} km. Podés elegir retiro en el local.`;
    }
    $("#form-error").hidden = true;
    if (opts.reverse) reverseGeocode(lat, lng);
  }

  function useGeolocation() {
    if (!("geolocation" in navigator)) {
      toast("Tu navegador no permite obtener la ubicación.");
      return;
    }
    const btn = $("#btn-geo");
    btn.disabled = true;
    btn.textContent = "Buscando ubicación…";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        btn.disabled = false;
        btn.textContent = "📍 Usar mi ubicación";
        setDeliveryPoint(pos.coords.latitude, pos.coords.longitude, { pan: true, reverse: true });
      },
      (err) => {
        btn.disabled = false;
        btn.textContent = "📍 Usar mi ubicación";
        toast(err.code === 1 ? "Permiso de ubicación denegado. Buscá tu dirección o marcala en el mapa." : "No pudimos obtener tu ubicación.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  // Geocodificación con OpenStreetMap Nominatim (gratuito, sin API key)
  /** Acepta "lat, lng" o links de Google Maps que incluyan coordenadas. */
  function parseCoords(q) {
    const pats = [
      /@(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
      /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
      /[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
      /^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/,
    ];
    for (const re of pats) {
      const m = q.match(re);
      if (m) {
        const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
        if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
      }
    }
    return null;
  }

  async function searchAddress() {
    const q = $("#f-buscar").value.trim();
    const list = $("#search-results");
    const coords = parseCoords(q);
    if (coords) {
      list.hidden = true;
      setDeliveryPoint(coords.lat, coords.lng, { pan: true, reverse: true });
      return;
    }
    if (q.length < 3) {
      toast("Escribí calle y número para buscar.");
      return;
    }
    list.hidden = false;
    list.innerHTML = '<li class="hint" style="padding:8px">Buscando…</li>';
    // Sólo se buscan direcciones dentro de Salta Capital (recuadro definido en config.js)
    const Z = C.zonaBusqueda;
    const viewbox = [Z.oeste, Z.norte, Z.este, Z.sur].join(",");
    const query = new RegExp(Z.ciudad, "i").test(q) ? q : `${q}, ${Z.ciudad}, ${Z.provincia}`;
    const url =
      "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=10&countrycodes=ar&accept-language=es" +
      `&viewbox=${viewbox}&bounded=1&q=${encodeURIComponent(query)}`;
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(res.status);
      const data = (await res.json())
        .filter((r) => {
          const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
          return lat <= Z.norte && lat >= Z.sur && lng >= Z.oeste && lng <= Z.este;
        })
        .slice(0, 6);
      if (!data.length) {
        list.innerHTML = `<li class="hint" style="padding:8px">No encontramos esa dirección en ${escapeHtml(Z.ciudad)} Capital. Probá con calle y número, o marcá el punto en el mapa.</li>`;
        return;
      }
      list.innerHTML = data
        .map((r, i) => {
          const label = shortAddress(r.address, r.display_name);
          return `<li><button type="button" data-i="${i}">${escapeHtml(label)}</button></li>`;
        })
        .join("");
      list.onclick = (e) => {
        const b = e.target.closest("button[data-i]");
        if (!b) return;
        const r = data[+b.dataset.i];
        list.hidden = true;
        if (!$("#f-direccion").value.trim()) $("#f-direccion").value = shortAddress(r.address, r.display_name);
        setDeliveryPoint(parseFloat(r.lat), parseFloat(r.lon), { pan: true });
      };
    } catch {
      list.innerHTML = '<li class="hint" style="padding:8px">No se pudo buscar ahora. Marcá tu ubicación en el mapa.</li>';
    }
  }

  async function reverseGeocode(lat, lng) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=es&lat=${lat}&lon=${lng}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) return;
      const r = await res.json();
      const input = $("#f-direccion");
      if (r && (!input.value.trim() || input.dataset.auto === "1")) {
        input.value = shortAddress(r.address, r.display_name);
        input.dataset.auto = "1";
      }
    } catch {
      /* sin conexión: el cliente escribe la dirección a mano */
    }
  }

  function shortAddress(a, fallback) {
    if (!a) return fallback || "";
    const calle = [a.road, a.house_number].filter(Boolean).join(" ");
    const barrio = a.suburb || a.neighbourhood || a.quarter || "";
    const ciudad = a.city || a.town || a.village || "";
    return [calle, barrio, ciudad].filter(Boolean).join(", ") || fallback || "";
  }

  // ---------------------------------------------------------------
  //  Confirmación y mensaje de WhatsApp
  // ---------------------------------------------------------------
  function validar() {
    const errs = [];
    const nombre = $("#f-nombre");
    nombre.classList.toggle("invalid", !nombre.value.trim());
    if (!nombre.value.trim()) errs.push("Ingresá tu nombre.");
    if (totalUnidades() === 0) errs.push("Tu pedido está vacío.");
    if (isEnvio()) {
      const dir = $("#f-direccion");
      if (delivery.lat == null) errs.push("Marcá tu ubicación en el mapa o usá “Usar mi ubicación”.");
      else if (delivery.km > C.radioKm) errs.push(`Tu ubicación está fuera del radio de envío (${C.radioKm} km). Podés elegir retiro en el local.`);
      dir.classList.toggle("invalid", !dir.value.trim());
      if (!dir.value.trim()) errs.push("Ingresá la dirección de entrega.");
    }
    return errs;
  }

  function codigoPedido() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return "LS-" + s;
  }

  function armarMensaje(codigo) {
    const d = calcularPrecio(totalUnidades());
    const L1 = [];
    L1.push(`¡Hola ${C.nombre}! Quiero hacer un pedido 🥟`);
    L1.push("");
    L1.push(`*Pedido ${codigo}*`);
    L1.push(`*Nombre:* ${$("#f-nombre").value.trim()}`);
    L1.push("");
    L1.push("*Detalle:*");
    C.variedades.forEach((v) =>
      C.tipos.forEach((t) => {
        const q = cart.get(key(v.id, t.id));
        if (q) L1.push(`• ${q} × ${v.nombre} – ${t.nombre}`);
      })
    );
    L1.push("");
    L1.push(`Cantidad: ${d.n} empanadas (${describirDesglose(d)})`);
    L1.push(`*TOTAL: ${money(d.total)}*`);
    L1.push("");
    if (isEnvio()) {
      const ref = $("#f-referencia").value.trim();
      L1.push("*Entrega:* 🛵 Envío a domicilio");
      L1.push(`*Dirección:* ${$("#f-direccion").value.trim()}`);
      if (ref) L1.push(`*Referencias:* ${ref}`);
      L1.push(`*Ubicación:* https://www.google.com/maps?q=${delivery.lat.toFixed(6)},${delivery.lng.toFixed(6)}`);
      L1.push(`(a ${delivery.km.toLocaleString("es-AR", { maximumFractionDigits: 1 })} km del local)`);
    } else {
      L1.push("*Entrega:* 🏪 Retiro en el local");
    }
    const notas = $("#f-notas").value.trim();
    if (notas) {
      L1.push("");
      L1.push(`*Comentarios:* ${notas}`);
    }
    L1.push("");
    L1.push("*Pago por transferencia*");
    L1.push(`Alias: *${C.alias}*`);
    if (C.titular) L1.push(`Titular: ${C.titular}`);
    L1.push("Te envío el comprobante por acá. ¡Gracias!");
    return L1.join("\n");
  }

  function onConfirm(e) {
    e.preventDefault();
    const errs = validar();
    const box = $("#form-error");
    if (errs.length) {
      box.innerHTML = errs.map(escapeHtml).join("<br/>");
      box.hidden = false;
      box.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    box.hidden = true;
    const codigo = codigoPedido();
    const msg = armarMensaje(codigo);
    const link = `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`;

    $("#btn-wpp").href = link;
    $("#done-alias").textContent = C.alias;
    $("#done-titular").textContent = C.titular || "—";
    $("#done-total").textContent = money(calcularPrecio(totalUnidades()).total);
    $("#done-msg").textContent = msg;
    showStep("done");
  }

  function resetAll() {
    cart.clear();
    delivery.lat = delivery.lng = delivery.km = null;
    if (marker) {
      marker.remove();
      marker = null;
    }
    $("#step-checkout").reset();
    $("#f-direccion").dataset.auto = "";
    $("#dist-status").hidden = true;
    $("#search-results").hidden = true;
    onEntregaChange();
    refresh();
  }

  async function copyAlias() {
    try {
      await navigator.clipboard.writeText(C.alias);
      toast("Alias copiado ✔");
    } catch {
      const r = document.createRange();
      r.selectNodeContents($("#done-alias"));
      const s = getSelection();
      s.removeAllRanges();
      s.addRange(r);
      toast("Seleccionado: copialo manualmente");
    }
  }

  // ---------------------------------------------------------------
  //  Inicio
  // ---------------------------------------------------------------
  function init() {
    document.title = `${C.nombre} · Menú`;
    $("#year").textContent = new Date().getFullYear();
    $("#local-dir").textContent = C.local.direccion;
    $("#radio-km").textContent = `${C.radioKm} km`;
    renderMenu();
    renderCredits();

    $("#menu").addEventListener("click", handleQtyClick);
    $("#cart-list").addEventListener("click", handleQtyClick);
    $("#cart-bar").addEventListener("click", () => openSheet("cart"));
    $("#overlay").addEventListener("click", closeSheet);
    $("#sheet-close").addEventListener("click", closeSheet);
    $("#sheet-back").addEventListener("click", () => showStep("cart"));
    $("#btn-clear").addEventListener("click", () => {
      cart.clear();
      refresh();
    });
    $("#btn-to-checkout").addEventListener("click", () => showStep("checkout"));
    document.querySelectorAll('input[name="entrega"]').forEach((r) => r.addEventListener("change", onEntregaChange));
    $("#btn-geo").addEventListener("click", useGeolocation);
    $("#btn-buscar").addEventListener("click", searchAddress);
    $("#f-buscar").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        searchAddress();
      }
    });
    $("#f-direccion").addEventListener("input", (e) => (e.target.dataset.auto = ""));
    $("#step-checkout").addEventListener("submit", onConfirm);
    $("#btn-copy").addEventListener("click", copyAlias);
    $("#btn-new").addEventListener("click", () => {
      resetAll();
      closeSheet();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sheetOpen) closeSheet();
    });

    onEntregaChange();
    refresh();
  }

  init();
})();
