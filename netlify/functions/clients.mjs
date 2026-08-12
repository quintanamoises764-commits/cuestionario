import { createClient } from "@supabase/supabase-js";

// Endpoint: /api/clients
// GET    -> devuelve arreglo con todos los clientes guardados en Supabase
// POST   -> guarda/actualiza un cliente (usa RFC para saber si ya existe)
// DELETE -> elimina un cliente por RFC (?rfc=...)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function limpio(v) {
  return (v || "").toString().trim();
}

export default async (req) => {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("razonSocial", { ascending: true });

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

    const rfc = limpio(body.rfc).toUpperCase();
    if (!rfc) {
      return new Response(JSON.stringify({ error: "El RFC es obligatorio" }), { status: 400 });
    }

    const row = {
      rfc,
      razonSocial: limpio(body.razonSocial),
      giroDelNegocio: limpio(body.giroDelNegocio),
      nombreComprador: limpio(body.nombreComprador),
      telefono: limpio(body.telefono),
      nombreComercial: limpio(body.nombreComercial),
      ciudadRuta: limpio(body.ciudadRuta),
    };

    // No hay restricción única sobre rfc en la tabla, así que revisamos
    // manualmente si ya existe un cliente con ese RFC para actualizar
    // en vez de duplicar.
    const { data: existente } = await supabase
      .from("clientes")
      .select("id")
      .eq("rfc", rfc)
      .maybeSingle();

    let data, error;
    if (existente) {
      ({ data, error } = await supabase
        .from("clientes")
        .update(row)
        .eq("id", existente.id)
        .select()
        .single());
    } else {
      ({ data, error } = await supabase
        .from("clientes")
        .insert(row)
        .select()
        .single());
    }

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify({ ok: true, client: data }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "DELETE") {
    const url = new URL(req.url);
    const rfc = limpio(url.searchParams.get("rfc")).toUpperCase();
    if (!rfc) {
      return new Response(JSON.stringify({ error: "Falta RFC" }), { status: 400 });
    }
    const { error } = await supabase.from("clientes").delete().eq("rfc", rfc);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Método no permitido", { status: 405 });
};

export const config = { path: "/api/clients" };
