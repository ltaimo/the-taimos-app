import { CheckCircle2, Clock3, Plus, ReceiptText, TriangleAlert } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Empty, Modal, MonthFilter, PageHeader, Spinner, SummaryCard } from '../components/UI';
import { useApi } from '../hooks';
import { api, currentMonth, money } from '../lib';
import { Category } from '../types';

type Expense = { id: string; name: string; categoryId: string; expectedAmount: string; dueDay: number; status: string; notes?: string; category: Category };
type Response = { items: Expense[]; summary: { expected: number; paid: number; pending: number; overdue: number } };
const initial: Response = { items: [], summary: { expected: 0, paid: 0, pending: 0, overdue: 0 } };
export default function FixedExpensesPage() {
  const [month, setMonth] = useState(currentMonth()), [open, setOpen] = useState(false);
  const { data, loading, reload } = useApi<Response>(`/fixed-expenses?month=${month}`, initial);
  const { data: categories } = useApi<Category[]>('/categories', []);
  return <div className="page"><PageHeader title="Despesas fixas" subtitle="Compromissos mensais, sem surpresas." actions={<button className="btn primary" onClick={() => setOpen(true)}><Plus /> Nova despesa</button>} />
    <div className="inline-filter"><MonthFilter value={month} onChange={setMonth} /></div>
    <div className="summary-grid compact"><SummaryCard label="Total previsto" value={money(data.summary.expected)} icon={<ReceiptText />} /><SummaryCard label="Total pago" value={money(data.summary.paid)} tone="positive" icon={<CheckCircle2 />} /><SummaryCard label="Pendente" value={money(data.summary.pending)} tone="warning" icon={<Clock3 />} /><SummaryCard label="Atrasado" value={money(data.summary.overdue)} tone="negative" icon={<TriangleAlert />} /></div>
    <section className="panel">{loading ? <Spinner /> : data.items.length ? <div className="expense-list">{data.items.map((x) => <article key={x.id}><div className={`status-dot ${x.status.toLowerCase()}`} /><div className="expense-main"><strong>{x.name}</strong><span>{x.category.name} · Dia {x.dueDay}</span></div><strong>{money(x.expectedAmount)}</strong><select value={x.status} onChange={async (e) => { await api(`/fixed-expenses/${x.id}`, { method: 'PATCH', body: JSON.stringify({ name: x.name, categoryId: x.categoryId, expectedAmount: Number(x.expectedAmount), dueDay: x.dueDay, status: e.target.value, month: `${month}-01T00:00:00.000Z`, notes: x.notes }) }); reload(); }}><option value="PENDING">Pendente</option><option value="PAID">Pago</option><option value="OVERDUE">Atrasado</option></select></article>)}</div> : <Empty title="Sem despesas fixas" text="Adicione renda, energia, escola e outros compromissos." />}</section>
    {open && <Modal title="Nova despesa fixa" onClose={() => setOpen(false)}><form className="form-grid" onSubmit={async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const body: Record<string, any> = Object.fromEntries(new FormData(e.currentTarget)); body.expectedAmount = Number(body.expectedAmount); body.dueDay = Number(body.dueDay); body.month = `${month}-01T00:00:00.000Z`; await api('/fixed-expenses', { method: 'POST', body: JSON.stringify(body) }); setOpen(false); reload(); }}>
      <label className="span-2">Nome<input name="name" required placeholder="Ex.: Internet de casa" /></label><label>Categoria<select name="categoryId" required><option value="">Selecionar</option>{categories.filter((x) => x.nature === 'FIXED').map((x) => <option value={x.id}>{x.name}</option>)}</select></label><label>Valor previsto<input name="expectedAmount" type="number" min=".01" step=".01" required /></label><label>Dia de pagamento<input name="dueDay" type="number" min="1" max="31" required /></label><label>Estado<select name="status"><option value="PENDING">Pendente</option><option value="PAID">Pago</option><option value="OVERDUE">Atrasado</option></select></label><label className="span-2">Observações<input name="notes" /></label><div className="form-actions span-2"><button type="button" className="btn secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary">Guardar</button></div>
    </form></Modal>}
  </div>;
}
