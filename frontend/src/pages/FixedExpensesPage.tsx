import {
  ArrowDownRight, ArrowUpRight, CalendarClock, PauseCircle, Pencil, PlayCircle, Plus, Trash2, Wallet,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Empty, ErrorState, Modal, MonthFilter, PageHeader, Spinner, SummaryCard } from '../components/UI';
import { useApi } from '../hooks';
import { api, currentMonth, money } from '../lib';
import { Category, Member } from '../types';

type FixedRecord = {
  id: string; name: string; type: 'INCOME' | 'EXPENSE'; categoryId: string; responsibleId: string;
  amount: string; dayOfMonth: number; paymentMethod: string; startMonth: string; endMonth?: string;
  notes?: string; active: boolean; category: Category; responsible: Member; transactions: { id: string }[];
};
type Response = {
  items: FixedRecord[];
  summary: { income: number; expenses: number; balance: number };
};
const initial: Response = { items: [], summary: { income: 0, expenses: 0, balance: 0 } };
const paymentLabels: Record<string, string> = {
  CASH: 'Dinheiro', MPESA: 'M-Pesa', EMOLA: 'E-Mola', BANK: 'Banco', CARD: 'Cartão',
};

export default function FixedExpensesPage() {
  const [month, setMonth] = useState(currentMonth());
  const [editing, setEditing] = useState<FixedRecord | null | undefined>(undefined);
  const records = useApi<Response>(`/recurring-transactions?month=${month}`, initial);
  const categories = useApi<Category[]>('/categories', []);
  const members = useApi<Member[]>('/users', []);

  async function toggle(item: FixedRecord) {
    await api(`/recurring-transactions/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify(recordPayload(item, { active: !item.active })),
    });
    records.reload();
  }

  async function remove(item: FixedRecord) {
    if (!confirm(`Apagar o registo fixo “${item.name}”? Os meses anteriores serão mantidos.`)) return;
    await api(`/recurring-transactions/${item.id}`, { method: 'DELETE' });
    records.reload();
  }

  return <div className="page">
    <PageHeader
      title="Entradas e despesas fixas"
      subtitle="Registe uma vez. Salários, renda de casa e outros valores aparecem automaticamente todos os meses."
      actions={<button className="btn primary" onClick={() => setEditing(null)}><Plus /> Novo registo fixo</button>}
    />
    <div className="inline-filter"><MonthFilter value={month} onChange={setMonth} /></div>
    <div className="summary-grid compact fixed-summary">
      <SummaryCard label="Entradas fixas" value={money(records.data.summary.income)} tone="positive" icon={<ArrowUpRight />} />
      <SummaryCard label="Despesas fixas" value={money(records.data.summary.expenses)} tone="negative" icon={<ArrowDownRight />} />
      <SummaryCard label="Saldo fixo previsto" value={money(records.data.summary.balance)} tone={records.data.summary.balance >= 0 ? 'positive' : 'negative'} icon={<Wallet />} />
    </div>
    {records.error ? <ErrorState message={records.error} onRetry={records.reload} /> : records.loading ? <Spinner /> :
      records.data.items.length ? <section className="fixed-records-grid">{records.data.items.map((item) =>
        <article className={`panel fixed-record-card ${item.active ? '' : 'inactive'}`} key={item.id}>
          <div className="fixed-record-head">
            <div className={`fixed-type-icon ${item.type.toLowerCase()}`}>{item.type === 'INCOME' ? <ArrowUpRight /> : <ArrowDownRight />}</div>
            <div><span className="eyebrow">{item.type === 'INCOME' ? 'ENTRADA FIXA' : 'DESPESA FIXA'}</span><h2>{item.name}</h2></div>
            <span className={`badge ${item.active ? 'ok' : 'cancelled'}`}>{item.active ? 'Ativo' : 'Pausado'}</span>
          </div>
          <strong className={`fixed-record-amount ${item.type.toLowerCase()}`}>{money(item.amount)}</strong>
          <div className="fixed-record-meta">
            <span><CalendarClock /> Dia {item.dayOfMonth} de cada mês</span>
            <span>{item.category.name} · {paymentLabels[item.paymentMethod]}</span>
            <span>Responsável: {item.responsible.name}</span>
          </div>
          <div className="fixed-generated">
            {item.transactions.length ? 'Movimento deste mês criado automaticamente' : 'Fora do período selecionado'}
          </div>
          <div className="fixed-record-actions">
            <button className="btn secondary" onClick={() => setEditing(item)}><Pencil /> Editar</button>
            <button className="btn secondary" onClick={() => toggle(item)}>{item.active ? <PauseCircle /> : <PlayCircle />}{item.active ? 'Pausar' : 'Ativar'}</button>
            <button className="icon-btn danger" aria-label={`Apagar ${item.name}`} onClick={() => remove(item)}><Trash2 /></button>
          </div>
        </article>)}</section> :
        <Empty title="Ainda sem registos fixos" text="Adicione salários, renda de casa, internet, escola e outros valores mensais." />}
    {editing !== undefined && <FixedRecordModal
      item={editing}
      categories={categories.data}
      members={members.data}
      onClose={() => setEditing(undefined)}
      onSaved={() => { setEditing(undefined); records.reload(); }}
    />}
  </div>;
}

function FixedRecordModal({ item, categories, members, onClose, onSaved }: {
  item: FixedRecord | null; categories: Category[]; members: Member[]; onClose: () => void; onSaved: () => void;
}) {
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>(item?.type ?? 'INCOME');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const available = categories.filter((category) =>
    category.type === type && (type === 'INCOME' || category.nature === 'FIXED'));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const body: Record<string, unknown> = Object.fromEntries(new FormData(event.currentTarget));
    body.type = type;
    body.amount = Number(body.amount);
    body.dayOfMonth = Number(body.dayOfMonth);
    body.startMonth = new Date(`${body.startMonth}-01T00:00:00.000Z`).toISOString();
    if (body.endMonth) body.endMonth = new Date(`${body.endMonth}-01T00:00:00.000Z`).toISOString();
    else delete body.endMonth;
    body.active = item?.active ?? true;
    try {
      await api(`/recurring-transactions${item ? `/${item.id}` : ''}`, {
        method: item ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      onSaved();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <Modal title={item ? 'Editar registo fixo' : 'Novo registo fixo'} onClose={onClose}>
    <form className="form-grid" onSubmit={submit}>
      <div className="segment span-2">
        <button type="button" className={type === 'INCOME' ? 'active' : ''} onClick={() => setType('INCOME')}>Entrada fixa</button>
        <button type="button" className={type === 'EXPENSE' ? 'active' : ''} onClick={() => setType('EXPENSE')}>Despesa fixa</button>
      </div>
      <label className="span-2">Nome<input name="name" required defaultValue={item?.name} placeholder={type === 'INCOME' ? 'Ex.: Salário do Layton' : 'Ex.: Renda de casa'} /></label>
      <label>Categoria<select name="categoryId" required defaultValue={item?.categoryId}><option value="">Selecionar</option>{available.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label>Valor mensal (MT)<input name="amount" type="number" min=".01" step=".01" required defaultValue={item?.amount} /></label>
      <label>Dia do mês<input name="dayOfMonth" type="number" min="1" max="31" required defaultValue={item?.dayOfMonth ?? 1} /></label>
      <label>Responsável<select name="responsibleId" required defaultValue={item?.responsibleId}><option value="">Selecionar</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
      <label>Método de pagamento<select name="paymentMethod" defaultValue={item?.paymentMethod ?? 'BANK'}>{Object.entries(paymentLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Começa em<input name="startMonth" type="month" required defaultValue={(item?.startMonth ?? `${currentMonth()}-01`).slice(0, 7)} /></label>
      <label>Termina em<input name="endMonth" type="month" defaultValue={item?.endMonth?.slice(0, 7)} /></label>
      <label className="span-2">Observações<input name="notes" defaultValue={item?.notes} placeholder="Opcional" /></label>
      {error && <div className="form-message span-2">{error}</div>}
      <div className="form-actions span-2"><button type="button" className="btn secondary" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={busy}>{busy ? 'A guardar...' : 'Guardar registo'}</button></div>
    </form>
  </Modal>;
}

function recordPayload(item: FixedRecord, changes: Partial<FixedRecord>) {
  const next = { ...item, ...changes };
  return {
    name: next.name,
    type: next.type,
    categoryId: next.categoryId,
    responsibleId: next.responsibleId,
    amount: Number(next.amount),
    dayOfMonth: next.dayOfMonth,
    paymentMethod: next.paymentMethod,
    startMonth: next.startMonth,
    endMonth: next.endMonth,
    notes: next.notes,
    active: next.active,
  };
}
