import { createClient } from "@supabase/supabase-js";

// Endpoint: /api/clients
// GET    -> devuelve arreglo con todos los clientes guardados en Supabase
// POST   -> guarda/actualiza un cliente (usa RFC como llave única)
// DELETE -> elimina un cliente por RFC (?rfc=...)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function aFormato(c) {
  return {
    rfc: c.rfc,
    razonSocial: c.razon_social,
    giroDelNegocio: c.giro_negocio,
    nombreComprador: c.comprador,
    telefono: c.telefono,
    nombreComercial: c.nombre_comercial,
    ciudadRuta: c.ruta,
  };
}

export default async (req) => {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("razon_social", { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify((data || []).map(aFormato)), {
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

    const rfc = (body.rfc || "").trim().toUpperCase();
    if (!rfc) {
      return new Response(JSON.stringify({ error: "El RFC es obligatorio" }), { status: 400 });
    }

    const row = {
      rfc,
      razon_social: (body.razonSocial || "").trim(),
      giro_negocio: (body.giroDelNegocio || "").trim(),
      comprador: (body.nombreComprador || "").trim(),
      telefono: (body.telefono || "").trim(),
      nombre_comercial: (body.nombreComercial || "").trim(),
      ruta: (body.ciudadRuta || "").trim(),
    };

    const { data, error } = await supabase
      .from("clientes")
      .upsert(row, { onConflict: "rfc" })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify({ ok: true, client: aFormato(data) }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "DELETE") {
    const url = new URL(req.url);
    const rfc = (url.searchParams.get("rfc") || "").trim().toUpperCase();
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
