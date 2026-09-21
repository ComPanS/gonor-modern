import { Outlet } from 'react-router-dom'
import { site } from '../content/site'

const navigation = [{ to: '#services', label: 'Услуги' }, { to: '#reviews', label: 'Отзывы' }, { to: '#contacts', label: 'Контакты' }]

export function SiteLayout() {
  return <div className="site-shell">
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Gonor, наверх"><img src={`${import.meta.env.BASE_URL}media/logo.png`} alt="Gonor" /></a>
      <nav aria-label="Основная навигация">{navigation.map(({ to, label }) => <a key={to} href={to}>{label}</a>)}</nav>
      <a className="header-book" href={site.bookingUrl} target="_blank" rel="noreferrer">Записаться <span>↗</span></a>
    </header>
    <main><Outlet /></main>
    <footer className="site-footer"><p><strong>{site.shortName}</strong> · Автозаводская, 23Б</p><a href={site.mapsUrl} target="_blank" rel="noreferrer">Открыть в Яндекс Картах ↗</a></footer>
  </div>
}
