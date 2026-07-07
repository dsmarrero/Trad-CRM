// Filtra `items` por coincidencia de texto (sin distinguir mayúsculas) en cualquiera
// de los `campos` indicados. Si `texto` está vacío devuelve `items` sin tocar.
export function useFiltroTexto(items, texto, campos) {
  const busqueda = texto.trim().toLowerCase();
  if (!busqueda) return items;
  return items.filter((item) =>
    campos.some((campo) => String(item[campo] ?? '').toLowerCase().includes(busqueda))
  );
}
