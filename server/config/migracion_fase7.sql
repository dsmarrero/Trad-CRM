-- Datos de facturación editables (antes hardcodeados en facturaPdfController.js):
-- emisor, método de pago, logo y colores de marca del PDF. Los DEFAULT son los
-- valores que ya estaban hardcodeados, para que ninguna factura cambie de aspecto
-- hasta que el usuario edite su configuración.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS factura_nombre VARCHAR(255) DEFAULT 'Daniel Santana Marrero';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS factura_direccion VARCHAR(255) DEFAULT 'Calle Ingeniero Salinas, 80 1º izquierda';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS factura_ciudad VARCHAR(255) DEFAULT '35006 – Las Palmas (Spain)';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS factura_nif VARCHAR(50) DEFAULT 'NIF 78502740Z';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS factura_email VARCHAR(255) DEFAULT 'daniel@dsantana.com';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS factura_telefono VARCHAR(50) DEFAULT '+34 668 886 181';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS factura_metodo_pago TEXT DEFAULT 'CAHMESMMXXX ES21 2038 7198 59 3000081142 (Bankia)';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS factura_logo_url VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS factura_color_primario VARCHAR(7) DEFAULT '#F5641E';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS factura_color_secundario VARCHAR(7) DEFAULT '#E7F6EE';
