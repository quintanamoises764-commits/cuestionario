import { createClient } from "@supabase/supabase-js";

// Endpoint: /api/cuestionarios
// GET  -> devuelve todos los cuestionarios guardados
// POST -> guarda un cuestionario nuevo

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function textoOnull(v) {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  return t === "" ? null : t;
}

async function usuarioDesdeToken(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export default async (req) => {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("cuestionarios")
      .select("*")
      .order("guardadoEn", { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify(data || []), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400 });
    }

    const usuario = await usuarioDesdeToken(req);

    const row = {
      creado_por: usuario ? usuario.id : null,
      razonSocial: textoOnull(body.razonSocial),
      giroDelNegocio: textoOnull(body.giroDelNegocio),
      nombreComprador: textoOnull(body.nombreComprador),
      telefono: textoOnull(body.telefono),
      rfc: textoOnull(body.rfc),
      nombreComercial: textoOnull(body.nombreComercial),
      ciudadRuta: textoOnull(body.ciudadRuta),
      puesto: textoOnull(body.puesto),
      correoElectronico: textoOnull(body.correoElectronico),
      fechaCaptura: textoOnull(body.fechaCaptura),
      consumoActual: textoOnull(body.consumoActual),
      mesesEstacionalidad: textoOnull(body.mesesEstacionalidad),
      presentacion1: textoOnull(body.presentacion1),
      presentacion2: textoOnull(body.presentacion2),
      presentacion3: textoOnull(body.presentacion3),
      proteinaCamaron: textoOnull(body.proteinaCamaron),
      proteinaTilapia: textoOnull(body.proteinaTilapia),
      consumoTotal: textoOnull(body.consumoTotal),
      segmento: textoOnull(body.segmento),
      participacionCompetencia: textoOnull(body.participacionCompetencia),
      proveedorCompetencia: textoOnull(body.proveedorCompetencia),
      facturacionMensual: textoOnull(body.facturacionMensual),
      establecimiento: textoOnull(body.establecimiento),
      condicionCompra: textoOnull(body.condicionCompra),
      frecuencia: textoOnull(body.frecuencia),
      horarioRecepcion: textoOnull(body.horarioRecepcion),
      diasRecepcion: textoOnull(body.diasRecepcion),
      volumenPromedio: textoOnull(body.volumenPromedio),
      ubicacionEntrega: textoOnull(body.ubicacionEntrega),
      requerimientosEspeciales: textoOnull(body.requerimientosEspeciales),
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
  }

  return new Response("Método no permitido", { status: 405 });
};

export const config = { path: "/api/cuestionarios" };

