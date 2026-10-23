/* ===========================================================
   Acción Acuicultura · utilidades compartidas entre index/login/
   cuestionario/prospectos/admin. Cárgalo después de config.js y
   antes del <script> propio de cada página.
   =========================================================== */

/* ============ Mostrar usuario: código en vez de correo ficticio ============
   Los usuarios dados de alta solo con código de empleado (sin correo
   real) tienen un correo interno armado como "codigo@interno.
   accionacuicola.local" (ver setup-usuarios-codigo-empleado.sql). Se
   puede reconocer por el dominio, y el código es literalmente lo que
   va antes de la @ -- así que no hace falta ir a buscarlo a ninguna
   tabla, se saca del mismo string. Usar esto en vez de mostrar
   ".email"/".usuario_email" tal cual en cualquier pantalla. */
const DOMINIO_CORREO_INTERNO = "@interno.accionacuicola.local";
function formatearUsuario(email){
  if (!email) return "—";
  if (email.toLowerCase().endsWith(DOMINIO_CORREO_INTERNO)) {
    return "Código " + email.slice(0, email.length - DOMINIO_CORREO_INTERNO.length);
  }
  return email;
}
/* Si hay nombre de pila cargado, ese manda -- tenga correo real o no.
   Solo cae al correo/código cuando a esa persona no le pusieron nombre. */
function nombreOCorreo(nombre, email){
  const n = (nombre || "").trim();
  return n || formatearUsuario(email);
}

/* ============ Ondas del encabezado (.topbar / .page-head) ============
   Se insertan aquí (no como HTML repetido en cada página) para tener
   un solo lugar que arreglar. Son <svg> reales, no background-image:
   eso evitó los parches mal pintados que daba la versión anterior. */
(function insertarOndas(){
  function svgOla(clase){
    return `<svg class="ola ${clase}" viewBox="0 0 2880 60" preserveAspectRatio="none" aria-hidden="true">` +
      `<path fill="#f4f7f9" d="M0,30 C180,57 360,3 540,25 C720,48 900,8 1080,25 C1260,43 1350,13 1440,28 L1440,60 L0,60 Z"/>` +
      `<path fill="#f4f7f9" d="M1440,30 C1620,57 1800,3 1980,25 C2160,48 2340,8 2520,25 C2700,43 2790,13 2880,28 L2880,60 L1440,60 Z"/>` +
      `</svg>`;
  }
  document.querySelectorAll(".topbar, .page-head").forEach(el => {
    if (el.querySelector(".ola")) return;
    el.insertAdjacentHTML("beforeend", svgOla("ola-fondo") + svgOla("ola-frente"));
  });
})();

/* ============ Tema claro/oscuro ============
   Modo oscuro desactivado por el momento: siempre se fuerza claro,
   sin importar preferencia guardada o del sistema. El botón .theme-toggle
   se oculta (ver shared.css) para no mostrar un control que no hace nada.
   Para reactivarlo: restaurar este bloque a su versión anterior. */
function temaGuardado(){
  try { return localStorage.getItem("tema"); } catch(e){ return null; }
}
function aplicarTema(modo){
  document.documentElement.setAttribute("data-theme", "light");
  try { localStorage.setItem("tema", "light"); } catch(e){}
}
function initTheme(){
  aplicarTema("light");
}
function toggleTheme(){
  aplicarTema("light");
}
initTheme();

/* ============ Bitácora de actividad (log_sesiones) ============
   Registra TODO lo que hace cada usuario -- entrar, salir, crear,
   editar, activar/desactivar, eliminar, restaurar, descargar -- en
   cuestionarios, prospectos, clientes, clientes_nuevos y usuarios.
   Escritura disponible para cualquier usuario logueado (cada quien
   solo puede registrar su propio evento, ver setup-log-sesiones.sql
   y setup-log-acciones-ampliar.sql). La lectura queda restringida a
   admin por RLS -- por eso el panel solo se muestra en admin.html
   cuando esAdmin() es true. Solo se llama en el camino de éxito de
   cada acción (nunca en catch/fallback), para no dejar huella falsa
   de algo que no se guardó de verdad. */
async function registrarAccion(tipo, entidad, entidadId, detalle){
  try{
    if (typeof supabaseClient === "undefined") return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    await supabaseClient.from("log_sesiones").insert({
      usuario_id: session.user.id,
      usuario_email: session.user.email,
      tipo,
      entidad: entidad || null,
      entidad_id: (entidadId === undefined || entidadId === null) ? null : String(entidadId),
      detalle: detalle || null
    });
  }catch(e){ /* si esto falla, la acción ya ocurrió igual */ }
}
function registrarLogin(){ return registrarAccion("login", "sesion", null, null); }
function registrarLogout(){ return registrarAccion("logout", "sesion", null, null); }

const ACCION_TEXTO = {
  login: "inició sesión",
  logout: "cerró sesión",
  crear_cuestionario: "completó un cuestionario",
  crear_cliente: "agregó un cliente",
  editar_cliente: "editó un cliente",
  editar_cliente_nuevo: "editó un cliente nuevo",
  activar_cliente_nuevo: "activó un cliente nuevo",
  desactivar_cliente_nuevo: "desactivó un cliente nuevo",
  activar_cliente: "activó un cliente",
  desactivar_cliente: "desactivó un cliente",
  eliminar_cliente: "eliminó un cliente",
  crear_prospecto: "registró un prospecto",
  editar_prospecto: "editó un prospecto",
  cambiar_estatus_prospecto: "cambió el estatus de un prospecto",
  revisar_prospecto: "marcó un prospecto como revisado",
  rechazar_prospecto: "rechazó un prospecto",
  reactivar_prospecto: "reactivó un prospecto rechazado",
  eliminar_prospecto: "mandó un prospecto a la papelera",
  restaurar_prospecto: "restauró un prospecto",
  eliminar_prospecto_permanente: "eliminó un prospecto para siempre",
  aceptar_prospecto: "aprobó un prospecto como cliente",
  eliminar_cuestionario: "mandó un cuestionario a la papelera",
  restaurar_cuestionario: "restauró un cuestionario",
  eliminar_cuestionario_permanente: "eliminó un cuestionario para siempre",
  crear_usuario: "creó un usuario",
  editar_usuario: "editó un usuario",
  activar_usuario: "activó un usuario",
  desactivar_usuario: "desactivó un usuario",
  eliminar_usuario: "eliminó un usuario",
  cambiar_rol_usuario: "cambió el rol de un usuario",
  cambiar_ruta_usuario: "cambió la ruta de un usuario",
  descargar_csv: "descargó un CSV",
  descargar_excel: "descargó un Excel"
};
/* Categoría del movimiento para el badge "Tipo" en el historial: solo
   sesion(login/logout) se llama Entrada/Salida -- todo lo demás se
   etiqueta por la entidad que tocó, para no decir "Salida" cuando en
   realidad fue, por ejemplo, aprobar un prospecto. */
const ENTIDAD_LOG_LABEL = {
  cuestionario: { label: "Cuestionario", cls: "rol-comercial" },
  prospecto: { label: "Prospecto", cls: "rol-gerente" },
  cliente: { label: "Cliente", cls: "rol-oficina" },
  cliente_nuevo: { label: "Cliente nuevo", cls: "st-calificado" },
  usuario: { label: "Usuario", cls: "rol-admin" },
  reporte: { label: "Descarga", cls: "pend" }
};
function categoriaLogSesion(row){
  if (row.entidad === "sesion" || row.tipo === "login" || row.tipo === "logout"){
    return row.tipo === "login" ? { label: "Entrada", cls: "act" } : { label: "Salida", cls: "inact" };
  }
  return ENTIDAD_LOG_LABEL[row.entidad] || { label: "Otro", cls: "pend" };
}
/* "Moisés inició sesión el día viernes 21 de agosto a las 12:00 del 2026".
   "nombreMostrar" es opcional: admin.html lo arma con su mapa de
   usuarios (id -> nombre), porque log_sesiones no guarda el nombre,
   solo el correo. Sin eso, cae al correo/código formateado. */
function frasearLogSesion(row, nombreMostrar){
  const d = new Date(row.creado_en);
  const partes = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .formatToParts(d).reduce((o, p) => { o[p.type] = p.value; return o; }, {});
  const hora = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
  const accion = ACCION_TEXTO[row.tipo] || row.tipo;
  const detalle = row.detalle ? ` ("${row.detalle}")` : "";
  return `${nombreMostrar || formatearUsuario(row.usuario_email)} ${accion}${detalle} el día ${partes.weekday} ${partes.day} de ${partes.month} a las ${hora} del ${partes.year}`;
}

/* ============ Texto seguro ============ */
function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

/* ============ Toast (con check animado en éxito) ============ */
const TICK_SVG = `<svg class="tick" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
  <circle cx="13" cy="13" r="10"/>
  <path d="M8 13.5l3.2 3.2L18 9.5"/>
</svg>`;
let __toastTimer;
function toast(msg, type){
  const t = document.getElementById("toast");
  if (!t) return;
  t.innerHTML = (type === "ok" ? TICK_SVG : "✘ ") + `<span>${escapeHtml(msg)}</span>`;
  t.className = "toast show " + (type || "");
  clearTimeout(__toastTimer);
  __toastTimer = setTimeout(() => t.classList.remove("show"), 3400);
}

/* Variantes de mensaje para no repetir siempre la misma frase en los
   guardados "grandes" (cuestionario, prospecto, cliente). Los mensajes
   de error o de acciones puntuales (eliminar, restaurar...) se quedan
   fijos porque ahí la claridad importa más que la variedad. */
const MENSAJES_GUARDADO = [
  "¡Guardado! Buen trabajo",
  "Listo, quedó guardado",
  "¡Hecho! Ya está en la base",
  "Guardado con éxito",
  "¡Perfecto! Ya se registró"
];
function toastGuardado(){
  const msg = MENSAJES_GUARDADO[Math.floor(Math.random() * MENSAJES_GUARDADO.length)];
  toast(msg, "ok");
}

/* ============ Modal de confirmación genérico ============
   Acepta callback (onConfirm) o se puede usar con await, según lo
   que necesite cada página:
     pedirConfirmacion({ ..., onConfirm: () => borrar() })
     const ok = await pedirConfirmacion({ ... }); if (ok) borrar();
   El botón "Cancelar" del modal debe llamar cerrarConfirmModal(),
   y el de confirmar, ejecutarConfirmacion(). */
let __confirmCallback = null;
let __confirmResolve = null;
function pedirConfirmacion({ icon, title, msg, okLabel, okClass, cancelLabel, onConfirm } = {}){
  document.getElementById("confirmIcon").textContent = icon || "⚠️";
  document.getElementById("confirmTitle").textContent = title || "¿Estás seguro?";
  document.getElementById("confirmMsg").textContent = msg || "Esta acción no se puede deshacer.";
  const okBtn = document.getElementById("confirmOkBtn");
  okBtn.textContent = okLabel || "Sí, continuar";
  okBtn.className = okClass || "btn-leave";
  const cancelBtn = document.getElementById("confirmCancelBtn");
  if (cancelBtn) cancelBtn.textContent = cancelLabel || "Cancelar";
  __confirmCallback = onConfirm || null;
  document.getElementById("confirmModal").classList.add("show");
  return new Promise(resolve => { __confirmResolve = resolve; });
}
function cerrarConfirmModal(){
  document.getElementById("confirmModal").classList.remove("show");
  __confirmCallback = null;
  const r = __confirmResolve;
  __confirmResolve = null;
  if (r) r(false);
}
async function ejecutarConfirmacion(){
  const cb = __confirmCallback;
  const r = __confirmResolve;
  document.getElementById("confirmModal").classList.remove("show");
  __confirmCallback = null;
  __confirmResolve = null;
  if (r) r(true);
  if (cb) await cb();
}

/* ============ Skeleton loader para tablas ============ */
function skeletonRows(cols, filas){
  filas = filas || 3;
  const fila = `<tr class="skeleton-row">${
    Array.from({ length: cols }).map(() => `<td><div class="skeleton-bar"></div></td>`).join("")
  }</tr>`;
  return fila.repeat(filas);
}

/* ============ Color estable por categoría (giro / segmento) ============
   Mismo texto siempre da el mismo color, sin necesidad de mantener
   una lista fija de categorías. */
function colorCategoria(nombre){
  const s = String(nombre || "").trim();
  if (!s) return "#94a3b8";
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue} 62% 45%)`;
}
function puntoCategoria(nombre){
  if (!nombre) return "";
  return `<span class="cat-dot" style="background:${colorCategoria(nombre)}" title="${escapeHtml(nombre)}"></span>`;
}

/* ============ Exportar CSV genérico ============ */
function exportarCSV(nombreArchivo, headers, filas){
  const csv = [headers, ...filas]
    .map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }));
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(a.href);
}
