export default function Button({ variante = 'primario', className = '', children, ...props }) {
  const clases = `btn-${variante}${className ? ' ' + className : ''}`;
  return (
    <button className={clases} {...props}>
      {children}
    </button>
  );
}
