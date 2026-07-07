-- Datos fiscales del cliente, necesarios para que las facturas cumplan el
-- Real Decreto 1619/2012 (identificación completa del destinatario).
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nif VARCHAR(20);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS direccion VARCHAR(255);
