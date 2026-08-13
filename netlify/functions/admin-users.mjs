import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

export default async function handler(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };

  try {
    // 1) Verificar que quien llama es un admin con sesión
    const token = (event.headers.authorization || "").replace("Bearer ", "");
    if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: "Sin sesión" }) };

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: { user }, error: userErr } = await anonClient.auth.getUser(token);
    if (userErr || !user) return { statusCode: 401, headers, body: JSON.stringify({ error: "Sesión inválida" }) };

    const { data: perfil } = await anonClient.from("usuarios").select("rol, activo").eq("id", user.id).maybeSingle();
    if (!perfil || !perfil.activo || perfil.rol !== "admin") {
      return { statusCode: 403, headers, body: JSON.stringify({ error: "Solo admin" }) };
    }

    const body = JSON.parse(event.body || "{}");
    const method = event.httpMethod;

    // ===== CREAR usuario (correo + contraseña) =====
    if (method === "POST") {
      const { email, password, rol, activo } = body;
      if (!email || !password) return { statusCode: 400, headers, body: JSON.stringify({ error: "Correo y contraseña son obligatorios" }) };

      const { data: created, error } = await serviceClient.auth.admin.createUser({
        email, password, email_confirm: true
      });
      if (error) return { statusCode: 400, headers, body: JSON.stringify({ error: error.message }) };

      // Guardar rol/activo en la tabla usuarios (tu BD)
      const { error: upsErr } = await serviceClient.from("usuarios").upsert({
        id: created.user.id, email, rol: rol || "comercial", activo: activo !== false
      });
      if (upsErr) return { statusCode: 500, headers, body: JSON.stringify({ error: upsErr.message }) };

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id: created.user.id }) };
    }

    // ===== EDITAR usuario (correo / contraseña / rol / activo) =====
    if (method === "PUT") {
      const { id, email, password, rol, activo } = body;
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: "id requerido" }) };

      const attrs = {};
      if (email) { attrs.email = email; attrs.email_confirm = true; }
      if (password) attrs.password = password;
      if (Object.keys(attrs).length) {
        const { error } = await serviceClient.auth.admin.updateUserById(id, attrs);
        if (error) return { statusCode: 400, headers, body: JSON.stringify({ error: error.message }) };
      }

      const perfilUpdate = {};
      if (email) perfilUpdate.email = email;
      if (typeof rol !== "undefined") perfilUpdate.rol = rol;
      if (typeof activo !== "undefined") perfilUpdate.activo = activo;
      const { error: upErr } = await serviceClient.from("usuarios").update(perfilUpdate).eq("id", id);
      if (upErr) return { statusCode: 500, headers, body: JSON.stringify({ error: upErr.message }) };

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    // ===== ELIMINAR usuario =====
    if (method === "DELETE") {
      const { id } = body;
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: "id requerido" }) };
      if (id === user.id) return { statusCode: 400, headers, body: JSON.stringify({ error: "No puedes eliminar tu propio usuario" }) };

      const { error } = await serviceClient.auth.admin.deleteUser(id);
      if (error) return { statusCode: 400, headers, body: JSON.stringify({ error: error.message }) };
      await serviceClient.from("usuarios").delete().eq("id", id);

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Método no permitido" }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message || "error interno" }) };
  }
}
