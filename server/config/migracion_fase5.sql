-- Retención de IRPF (habitual en facturas de profesionales autónomos en España),
-- con porcentaje configurable. Se resta del total a cobrar, no se almacena el importe
-- calculado por la misma razón que tipo_impuesto/porcentaje_impuesto (fase 4).
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS aplica_retencion_irpf BOOLEAN DEFAULT FALSE;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS porcentaje_retencion_irpf NUMERIC(5,2) DEFAULT 0;
