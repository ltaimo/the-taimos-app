import { AlertTriangle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ReactNode } from 'react';
import { currentMonth } from '../lib';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  return <div className="page-header"><div><h1>{title}</h1><p>{subtitle}</p></div><div className="page-actions">{actions}</div></div>;
}
export function SummaryCard({ label, value, hint, tone = 'neutral', icon }: {
  label: string; value: string; hint?: string; tone?: string; icon: ReactNode;
}) {
  return <article className={`summary-card ${tone}`}><div className="summary-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}</div></article>;
}
export function MonthFilter({ value, onChange }: { value: string; onChange: (month: string) => void }) {
  const move = (delta: number) => {
    const d = new Date(`${value}-15T00:00:00`); d.setMonth(d.getMonth() + delta);
    onChange(d.toISOString().slice(0, 7));
  };
  const label = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(new Date(`${value}-15`));
  return <div className="month-filter"><button onClick={() => move(-1)}><ChevronLeft /></button><span>{label}</span><button disabled={value >= currentMonth()} onClick={() => move(1)}><ChevronRight /></button></div>;
}
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal-wrap"><button className="modal-backdrop" onClick={onClose} /><section className="modal"><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}><X /></button></div>{children}</section></div>;
}
export function Empty({ title, text }: { title: string; text: string }) {
  return <div className="empty"><div><AlertTriangle /></div><h3>{title}</h3><p>{text}</p></div>;
}
export function Spinner() { return <div className="spinner" aria-label="A carregar" />; }
