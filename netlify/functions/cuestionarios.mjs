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

export default async (req) => {
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
