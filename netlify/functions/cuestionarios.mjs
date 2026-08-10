import { createClient } from "@supabase/supabase-js";

// Endpoint: /api/cuestionarios
// POST -> guarda un cuestionario completo en la tabla `cuestionarios` de Supabase

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function numeroOnull(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}
function textoOnull(v) {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  return t === "" ? null : t;
}

// Convierte una fila de Supabase (snake_case) al formato que usa el formulario (camelCase)
function aFormato(r) {
  return {
    id: r.id,
    fechaCaptura: r.fecha,
    razonSocial: r.razon_social,
    giroDelNegocio: r.giro_negocio,
    nombreComprador: r.comprador,
    telefono: r.telefono,
    rfc: r.rfc,
    nombreComercial: r.nombre_comercial,
    ciudadRuta: r.ruta,
    puesto: r.puesto_empresa,
    correoElectronico: r.correo_empresa,

    consumoActual: r.consumo_actual,
    presentacion1: r.presentacion_1,
    presentacion2: r.presentacion_2,
    presentacion3: r.presentacion_3,
    consumoTotal: r.consumo_total,
    participacionCompetencia: r.parti_provee_competencia,
    mesesEstacionalidad: r.meses_estacionalidad,
    proteinaCamaron: r.camaron_part,
    proteinaTilapia: r.tilapia_part,
    segmento: r.segmento,
    proveedorCompetencia: r.nombre_provee_competencia,

    facturacionMensual: r.facturas_mensuales,
    condicionCompra: r.condiciones_compra,
    establecimiento: r.establecimiento,

    frecuencia: r.frecuencia,
    diasRecepcion: r.dias_recepcion,
    horarioRecepcion: r.hora_recepcion,
    volumenPromedio: r.volumen_prom_entrega,
    ubicacionEntrega: r.ubicacion_entrega,
    requerimientosEspeciales: r.requerimiento_especial,

    comentarios: r.comentarios,
    guardadoEn: r.guardado_en,
  };
}

export default async (req) => {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("cuestionarios")
      .select("*")
      .order("guardado_en", { ascending: false })
      .limit(300);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify((data || []).map(aFormato)), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response("Método no permitido", { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400 });
  }

  const row = {
    fecha: textoOnull(body.fechaCaptura),
    razon_social: textoOnull(body.razonSocial),
    giro_negocio: textoOnull(body.giroDelNegocio),
    comprador: textoOnull(body.nombreComprador),
    telefono: textoOnull(body.telefono),
    rfc: textoOnull(body.rfc),
    nombre_comercial: textoOnull(body.nombreComercial),
    ruta: textoOnull(body.ciudadRuta),
    puesto_empresa: textoOnull(body.puesto),
    correo_empresa: textoOnull(body.correoElectronico),

    consumo_actual: numeroOnull(body.consumoActual),
    presentacion_1: textoOnull(body.presentacion1),
    presentacion_2: textoOnull(body.presentacion2),
    presentacion_3: textoOnull(body.presentacion3),
    consumo_total: numeroOnull(body.consumoTotal),
    parti_provee_competencia: numeroOnull(body.participacionCompetencia),
    meses_estacionalidad: textoOnull(body.mesesEstacionalidad),
    camaron_part: numeroOnull(body.proteinaCamaron),
    tilapia_part: numeroOnull(body.proteinaTilapia),
    segmento: textoOnull(body.segmento),
    nombre_provee_competencia: textoOnull(body.proveedorCompetencia),

    facturas_mensuales: textoOnull(body.facturacionMensual),
    condiciones_compra: textoOnull(body.condicionCompra),
    establecimiento: textoOnull(body.establecimiento),

    frecuencia: textoOnull(body.frecuencia),
    dias_recepcion: textoOnull(body.diasRecepcion),
    hora_recepcion: textoOnull(body.horarioRecepcion),
    volumen_prom_entrega: numeroOnull(body.volumenPromedio),
    ubicacion_entrega: textoOnull(body.ubicacionEntrega),
    requerimiento_especial: textoOnull(body.requerimientosEspeciales),

    comentarios: textoOnull(body.comentarios),
  };

  const { data, error } = await supabase
    .from("cuestionarios")
    .insert(row)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, cuestionario: data }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const config = { path: "/api/cuestionarios" };
