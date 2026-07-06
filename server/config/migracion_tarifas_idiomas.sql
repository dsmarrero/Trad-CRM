ALTER TABLE usuarios RENAME COLUMN tarifa_palabra TO tarifa_traduccion;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tarifa_jurada NUMERIC(6,4) DEFAULT 0.06;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tarifa_revision NUMERIC(6,4) DEFAULT 0.03;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tarifa_edicion_hora NUMERIC(6,2) DEFAULT 25.00;

CREATE TABLE IF NOT EXISTS idiomas_usuario (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  idioma_origen VARCHAR(50) NOT NULL,
  idioma_destino VARCHAR(50) NOT NULL
);
