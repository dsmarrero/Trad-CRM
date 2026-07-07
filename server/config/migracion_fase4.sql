-- Soporte de impuesto (IVA / IGIC / exento) con porcentaje configurable por factura.
-- 'importe' sigue siendo la base imponible; el total con impuesto se calcula, no se
-- almacena, para que cambiar el porcentaje por defecto no desincronice facturas ya emitidas.
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS tipo_impuesto VARCHAR(20) DEFAULT 'exento';
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS porcentaje_impuesto NUMERIC(5,2) DEFAULT 0;
