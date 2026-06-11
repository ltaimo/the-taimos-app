import {
  BarChart3, Bell, CalendarDays, Goal, Home, LayoutDashboard, LogOut, Menu,
  MoreHorizontal, ReceiptText, Settings, ShoppingBag, SlidersHorizontal, WalletCards, X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib';

const nav = [
  ['/dashboard', 'Início', LayoutDashboard],
  ['/lembretes', 'Lembretes', Bell],
  ['/compras', 'Compras e necessidades', ShoppingBag],
  ['/programas', 'Programas', CalendarDays],
  ['/movimentos', 'Movimentos', WalletCards],
  ['/despesas-fixas', 'Fixos mensais', ReceiptText],
  ['/orcamento', 'Orçamento', SlidersHorizontal],
  ['/poupanca', 'Poupança', Goal],
  ['/relatorios', 'Relatórios', BarChart3],
  ['/definicoes', 'Definições', Settings],
] as const;
export default function Layout() {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  return <div className="app-shell">
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand"><img className="brand-mark" src="/app-icon-192.png" alt="Símbolo The Taimo's" /><div><strong>The Taimo's App</strong><span>by Jasvania & Layton</span></div></div>
      <button className="icon-btn close-menu" aria-label="Fechar menu" onClick={() => setOpen(false)}><X size={20} /></button>
      <nav>{nav.map(([to, label, Icon]) =>
        <NavLink key={to} to={to} onClick={() => setOpen(false)}><Icon size={19} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-footer">
        <div className="avatar">{session?.user.email?.slice(0, 2).toUpperCase()}</div>
        <div className="user-label"><strong>{session?.user.user_metadata.name ?? 'Família'}</strong><span>{session?.user.email}</span></div>
        <button className="icon-btn" aria-label="Terminar sessão" title="Terminar sessão" onClick={() => supabase.auth.signOut()}><LogOut size={18} /></button>
      </div>
    </aside>
    <main className="main">
      <header className="mobile-header"><div className="mobile-brand"><img className="brand-mark" src="/app-icon-192.png" alt="Símbolo The Taimo's" /><span><strong>The Taimo's App</strong><small>by Jasvania & Layton</small></span></div><button className="icon-btn" aria-label="Abrir menu" onClick={() => setOpen(true)}><Menu /></button></header>
      <Outlet />
      <nav className="bottom-nav">
        <NavLink to="/dashboard"><Home /><span>Início</span></NavLink>
        <NavLink to="/movimentos"><WalletCards /><span>Finanças</span></NavLink>
        <NavLink to="/compras"><ShoppingBag /><span>Comprar</span></NavLink>
        <NavLink to="/programas"><CalendarDays /><span>Agenda</span></NavLink>
        <button onClick={() => setOpen(true)}><MoreHorizontal /><span>Mais</span></button>
      </nav>
    </main>
    {open && <button className="backdrop" aria-label="Fechar menu" onClick={() => setOpen(false)} />}
  </div>;
}
