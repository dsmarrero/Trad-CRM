CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(20) DEFAULT 'traductor',
  tarifa_palabra NUMERIC(6,4) DEFAULT 0.06,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  telefono VARCHAR(30),
  empresa VARCHAR(150),
  notas TEXT,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE encargos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  idioma_origen VARCHAR(50) NOT NULL,
  idioma_destino VARCHAR(50) NOT NULL,
  tipo_documento VARCHAR(100),
  estado VARCHAR(30) DEFAULT 'recibido', -- recibido, en_curso, entregado, facturado
  fecha_recibido DATE DEFAULT CURRENT_DATE,
  fecha_entrega DATE,
  precio NUMERIC(10,2),
  notas TEXT,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE documentos (
  id SERIAL PRIMARY KEY,
  encargo_id INTEGER REFERENCES encargos(id) ON DELETE CASCADE,
  nombre_archivo VARCHAR(255) NOT NULL,
  url_archivo VARCHAR(500) NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- original, traducido
  palabras INTEGER,
  subido_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE facturas (
  id SERIAL PRIMARY KEY,
  encargo_id INTEGER REFERENCES encargos(id) ON DELETE CASCADE,
  numero VARCHAR(50) UNIQUE NOT NULL,
  importe NUMERIC(10,2) NOT NULL,
  estado_pago VARCHAR(20) DEFAULT 'pendiente', -- pendiente, pagada
  fecha_emision DATE DEFAULT CURRENT_DATE,
  fecha_pago DATE
);
