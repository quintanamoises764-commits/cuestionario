






import { createClient } from "@supabase/supabase-js";

// Endpoint: /api/clients
// GET    -> lista clientes (activos por defecto; con ?todos=1 el admin ve todos)
// POST   -> crea un cliente nuevo
// PUT    -> edita o activa/desactiva (solo admin)
// DELETE -> desactiva (eliminación suave, solo admin)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function usuarioDesdeToken(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

async function esAdmin(req) {
  const usuario = await usuarioDesdeToken(req);
  if (!usuario) return false;
  const { data } = await supabase
    .from("usuarios")
    .select("rol, activo")
    .eq("id", usuario.id)
    .maybeSingle();
  return !!(data && data.activo && data.rol === "admin");
}

function textoOnull(v) {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  return t === "" ? null : t;
}

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  // ---------- GET ----------
  if (req.method === "GET") {
    const todos = url.searchParams.get("todos") === "1";
    if (todos && !(await esAdmin(req))) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 403 });
    }
    let query = supabase.from("clientes").select("*").order("razonSocial");
    if (!todos) query = query.eq("activo", true);
    const { data, error } = await query;
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data || []), { headers: { "Content-Type": "application/json" } });
  }

  // ---------- POST (crear) ----------
  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400 }); }
    if (!textoOnull(body.razonSocial) || !textoOnull(body.rfc)) {
      return new Response(JSON.stringify({ error: "Razón Social y RFC son obligatorios" }), { status: 400 });
    }
    const { data, error } = await supabase
      .from("clientes")
      .insert([{
        razonSocial: textoOnull(body.razonSocial),
        rfc: textoOnull(body.rfc),
        giroDelNegocio: textoOnull(body.giroDelNegocio),
        nombreComprador: textoOnull(body.nombreComprador),
        telefono: textoOnull(body.telefono),
        nombreComercial: textoOnull(body.nombreComercial),
        ciudadRuta: textoOnull(body.ciudadRuta),
        activo: true
      }])
      .select()
      .single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  }

  // ---------- PUT (editar / activar-desactivar, solo admin) ----------
  if (req.method === "PUT") {
    if (!(await esAdmin(req))) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 403 });
    if (!id) return new Response(JSON.stringify({ error: "Falta el id" }), { status: 400 });

    let body;
    try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400 }); }

    const patch = {};
    ["razonSocial","rfc","giroDelNegocio","nombreComprador","telefono","nombreComercial","ciudadRuta"].forEach(k => {
      if (body[k] !== undefined) patch[k] = textoOnull(body[k]);
    });
    if (body.activo !== undefined) patch.activo = !!body.activo;

    const { data, error } = await supabase.from("clientes").update(patch).eq("id", id).select().single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  }

  // ---------- DELETE (desactivar, solo admin) ----------
  if (req.method === "DELETE") {
    if (!(await esAdmin(req))) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 403 });
    if (!id) return new Response(JSON.stringify({ error: "Falta el id" }), { status: 400 });
    const { data, error } = await supabase.from("clientes").update({ activo: false }).eq("id", id).select().single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  }

  return new Response("Método no permitido", { status: 405 });
};

export const config = { path: "/api/clients" };
