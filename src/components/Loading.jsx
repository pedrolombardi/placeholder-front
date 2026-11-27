/** Estados de carregamento e erro das páginas que consultam o Core. */
export function Loading({ children = 'Carregando...' }) {
  return <div className="notice notice--info">⏳ {children}</div>
}

export function ErrorNotice({ error }) {
  if (!error) return null
  return <div className="notice notice--danger">✕ {error}</div>
}
