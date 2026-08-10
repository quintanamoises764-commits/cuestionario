-- ===========================================================
-- Acción Acuicultura · Estructura de base de datos
-- Pega esto completo en Supabase: SQL Editor -> New query -> Run
-- ===========================================================

-- Tabla de clientes (para el autocompletado por Razón Social / RFC)
create table if not exists clientes (
  rfc text primary key,
  razon_social text not null,
  giro_negocio text,
  comprador text,
  telefono text,
  nombre_comercial text,
  ruta text,
  creado_en timestamp with time zone default now()
);

-- Tabla de cuestionarios
create table if not exists cuestionarios (
  id bigint generated always as identity primary key,
  -- quien captura (sin login todavía)
  nombre_usuario text,
  apellido text,
  puesto text,
  ciudad text,
  -- datos generales del cliente
  fecha date,
  razon_social text,
  giro_negocio text,
  comprador text,
  telefono text,
  rfc text,
  nombre_comercial text,
  ruta text,
  puesto_empresa text,
  correo_empresa text,
  -- volumen y presentación
  consumo_actual numeric,
  presentacion_1 text,
  presentacion_2 text,
  presentacion_3 text,
  consumo_total numeric,
  parti_provee_competencia numeric,
  meses_estacionalidad text,
  camaron_part numeric,
  tilapia_part numeric,
  segmento text,
  nombre_provee_competencia text,
  -- capacidad financiera
  facturas_mensuales text,
  condiciones_compra text,
  establecimiento text,
  -- logística
  frecuencia text,
  dias_recepcion text,
  hora_recepcion text,
  volumen_prom_entrega numeric,
  ubicacion_entrega text,
  requerimiento_especial text,
  -- comentarios
  comentarios text,
  guardado_en timestamp with time zone default now()
);

-- Activar seguridad a nivel de fila (obligatorio en Supabase)
alter table clientes enable row level security;
alter table cuestionarios enable row level security;

-- Políticas: como aún no hay login, permitimos leer/escribir
-- con la anon key (la llave pública). Cuando agreguemos login,
-- estas políticas se ajustan para exigir usuario autenticado.
create policy "Lectura pública clientes" on clientes
  for select using (true);
create policy "Escritura pública clientes" on clientes
  for insert with check (true);
create policy "Actualización pública clientes" on clientes
  for update using (true);

create policy "Lectura pública cuestionarios" on cuestionarios
  for select using (true);
create policy "Escritura pública cuestionarios" on cuestionarios
  for insert with check (true);
create policy "Borrado público cuestionarios" on cuestionarios
  for delete using (true);
