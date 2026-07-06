-- Historial de notas por cliente (sustituye el uso informal de clientes.notas para seguimiento)
CREATE TABLE IF NOT EXISTS cliente_notas (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id),
  texto TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Versionado de documentos: cada subida nueva del mismo tipo incrementa version
-- y enlaza con la anterior en vez de sustituirla.
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS reemplaza_a INTEGER REFERENCES documentos(id);
