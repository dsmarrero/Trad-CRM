ALTER TABLE idiomas_usuario ADD COLUMN IF NOT EXISTS tarifa_minima NUMERIC(6,2) DEFAULT 25.00;
ALTER TABLE idiomas_usuario ADD COLUMN IF NOT EXISTS palabras_minimas INTEGER DEFAULT 400;

CREATE TABLE IF NOT EXISTS dias_no_disponibles (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  motivo VARCHAR(100),
  UNIQUE(usuario_id, fecha)
);
