import { Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Empty, Modal, MonthFilter, PageHeader, Spinner } from '../components/UI';
import { useApi } from '../hooks';
import { api, currentMonth, money } from '../lib';
import { Category } from '../types';

type Budget = { id: string; categoryId: string; category: Category; amount: string; spent: number; difference: number; status: string };
export default function BudgetsPage() {
  const [month, setMonth] = useState(currentMonth()), [open, setOpen] = useState(false);
  const { data, loading, reload } = useApi<Budget[]>(`/budgets?month=${month}`, []);
  const { data: categories } = useApi<Category[]>('/categories', []);
  return <div className="page"><PageHeader title="Orçamento mensal" subtitle="Definam limites que fazem sentido para a vossa realidade." actions={<button className="btn primary" onClick={() => setOpen(true)}><Plus /> Definir limite</button>} />
    <div className="inline-filter"><MonthFilter value={month} onChange={setMonth} /></div>
    <section className="panel">{loading ? <Spinner /> : data.length ? <div className="budget-list">{data.map((x) => { const ratio = Math.min(100, x.spent / Number(x.amount) * 100); return <article key={x.id}><div className="budget-head"><div><i style={{ background: x.category.color }} /><strong>{x.category.name}</strong></div><span className={`badge ${x.status.toLowerCase()}`}>{x.status === 'OK' ? 'Dentro do limite' : x.status === 'WARNING' ? 'Atenção' : 'Ultrapassado'}</span></div><div className="budget-values"><span>{money(x.spent)} gastos</span><span>de {money(x.amount)}</span></div><div className={`progress ${x.status.toLowerCase()}`}><span style={{ width: `${ratio}%` }} /></div><div className="budget-foot"><span>{x.difference >= 0 ? `${money(x.difference)} disponíveis` : `${money(Math.abs(x.difference))} acima`}</span><button onClick={async () => { await api(`/budgets/${x.id}`, { method: 'DELETE' }); reload(); }}><Trash2 /></button></div></article>; })}</div> : <Empty title="Orçamento por definir" text="Crie limites por categoria para acompanhar melhor os gastos." />}</section>
    {open && <Modal title="Definir limite" onClose={() => setOpen(false)}><form className="form-grid" onSubmit={async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const body: Record<string, any> = Object.fromEntries(new FormData(e.currentTarget)); body.amount = Number(body.amount); body.month = `${month}-01T00:00:00.000Z`; await api('/budgets', { method: 'POST', body: JSON.stringify(body) }); setOpen(false); reload(); }}><label className="span-2">Categoria<select name="categoryId" required><option value="">Selecionar categoria</option>{categories.filter((x) => x.type === 'EXPENSE').map((x) => <option value={x.id}>{x.name}</option>)}</select></label><label className="span-2">Limite mensal (MT)<input name="amount" type="number" min=".01" step=".01" required /></label><div className="form-actions span-2"><button type="button" className="btn secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary">Guardar limite</button></div></form></Modal>}
  </div>;
}
