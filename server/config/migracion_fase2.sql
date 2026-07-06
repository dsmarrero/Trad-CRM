CREATE TABLE IF NOT EXISTS presupuestos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  idioma_origen VARCHAR(50) NOT NULL,
  idioma_destino VARCHAR(50) NOT NULL,
  tipo_documento VARCHAR(100),
  palabras_estimadas INTEGER,
  precio_estimado NUMERIC(10,2),
  estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, aceptado, rechazado
  notas TEXT,
  encargo_id INTEGER REFERENCES encargos(id),
  creado_en TIMESTAMP DEFAULT NOW()
);
