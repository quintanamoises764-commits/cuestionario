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

// Solo usuarios con sesión activa (comercial, oficina o admin) pueden leer o
// escribir cuestionarios: esta tabla contiene datos sensibles del cliente.
async function usuarioActivoDesdeToken(req) {
  const usuario = await usuarioDesdeToken(req);
  if (!usuario) return null;
  const { data: perfil } = await supabase
    .from("usuarios")
    .select("rol, activo")
    .eq("id", usuario.id)
    .maybeSingle();
  if (!perfil || !perfil.activo) return null;
  return { ...usuario, rol: perfil.rol };
}

export default async (req) => {
  if (req.method === "GET") {
    const usuario = await usuarioActivoDesdeToken(req);
    if (!usuario) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
    }

    const url = new URL(req.url);
    const verPapelera = url.searchParams.get("papelera") === "1";
    // La papelera es solo de admin -- ni gerente ni oficina la ven.
    if (verPapelera && usuario.rol !== "admin") {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 403 });
    }

    // comercial solo ve lo que él mismo capturó; admin, gerente y
    // oficina ven todo (admin/oficina lo necesitan para "Respuestas"
    // en el Panel Admin; gerente para "Mis cuestionarios").
    let query = supabase.from("cuestionarios").select("*").order("guardadoEn", { ascending: false });
    query = verPapelera ? query.not("eliminado_en", "is", null) : query.is("eliminado_en", null);
    if (usuario.rol !== "admin" && usuario.rol !== "gerente" && usuario.rol !== "oficina") {
      query = query.eq("creado_por", usuario.id);
    }
    const { data, error } = await query;

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

    const usuario = await usuarioActivoDesdeToken(req);
    if (!usuario) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
    }

    const row = {
      creado_por: usuario.id,
      razonSocial: textoOnull(body.razonSocial),
      giroDelNegocio: textoOnull(body.giroDelNegocio),
      nombreComprador: textoOnull(body.nombreComprador),
      telefono: textoOnull(body.telefono),
      rfc: textoOnull(body.rfc),
      nombreComercial: textoOnull(body.nombreComercial),
      sucursal: textoOnull(body.sucursal),
      direccion: textoOnull(body.direccion),
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
      fotoUrl: textoOnull(body.fotoUrl),
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
