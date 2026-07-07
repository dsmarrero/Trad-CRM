-- Adjunto opcional del documento a presupuestar, para poder calcular palabras_estimadas
-- y precio_estimado automáticamente al subir el archivo (mismo patrón que "documentos").
ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS nombre_archivo VARCHAR(255);
ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS url_archivo VARCHAR(255);
