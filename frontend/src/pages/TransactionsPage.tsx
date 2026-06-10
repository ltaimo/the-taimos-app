import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Empty, Modal, MonthFilter, PageHeader, Spinner } from '../components/UI';
import { useApi } from '../hooks';
import { api, currentMonth, money, shortDate } from '../lib';
import { Category, Member, Transaction } from '../types';

const labels: Record<string, string> = { INCOME: 'Entrada', EXPENSE: 'Saída', SAVING: 'Poupança', CASH: 'Dinheiro', MPESA: 'M-Pesa', EMOLA: 'E-Mola', BANK: 'Banco', CARD: 'Cartão', FIXED: 'Fixa', VARIABLE: 'Variável', EMERGENCY: 'Emergência' };
export default function TransactionsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [editing, setEditing] = useState<Transaction | null | undefined>(undefined);
  const { data, loading, reload } = useApi<Transaction[]>(`/transactions?month=${month}${type ? `&type=${type}` : ''}`, []);
  const { data: categories } = useApi<Category[]>('/categories', []);
  const { data: members } = useApi<Member[]>('/users', []);
  const rows = useMemo(() => data.filter((x) => `${x.description} ${x.category.name}`.toLowerCase().includes(query.toLowerCase())), [data, query]);
  async function remove(id: string) { if (confirm('Apagar este movimento?')) { await api(`/transactions/${id}`, { method: 'DELETE' }); reload(); } }
  function exportCsv() {
    const body = [['Data','Tipo','Categoria','Descrição','Valor','Responsável','Pagamento'], ...rows.map((x) => [shortDate(x.date), labels[x.type], x.category.name, x.description, x.amount, x.responsible.name, labels[x.paymentMethod]])]
      .map((r) => r.map((v) => `"${String(v).replaceAll('"','""')}"`).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + body], { type: 'text/csv' })); a.download = `movimentos-${month}.csv`; a.click();
  }
  return <div className="page"><PageHeader title="Movimentos" subtitle="Todas as entradas, saídas e poupanças da família." actions={<><button className="btn secondary" onClick={exportCsv}><Download /> Exportar CSV</button><button className="btn primary" onClick={() => setEditing(null)}><Plus /> Novo movimento</button></>} />
    <div className="toolbar"><MonthFilter value={month} onChange={setMonth} /><div className="search"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar movimentos..." /></div><select value={type} onChange={(e) => setType(e.target.value)}><option value="">Todos os tipos</option><option value="INCOME">Entradas</option><option value="EXPENSE">Saídas</option><option value="SAVING">Poupanças</option></select></div>
    <section className="panel table-panel">{loading ? <Spinner /> : rows.length ? <div className="table-scroll"><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Responsável</th><th>Método</th><th>Valor</th><th /></tr></thead><tbody>{rows.map((x) => <tr key={x.id}><td>{shortDate(x.date)}</td><td><strong>{x.description}</strong><small>{labels[x.nature] ?? x.nature}</small></td><td><span className="category-pill"><i style={{ background: x.category.color }} />{x.category.name}</span></td><td>{x.responsible.name}</td><td>{labels[x.paymentMethod]}</td><td className={`amount ${x.type.toLowerCase()}`}>{x.type === 'EXPENSE' ? '- ' : '+ '}{money(x.amount)}</td><td><div className="row-actions"><button onClick={() => setEditing(x)}><Pencil /></button><button onClick={() => remove(x.id)}><Trash2 /></button></div></td></tr>)}</tbody></table></div> : <Empty title="Sem movimentos" text="Adicione o primeiro movimento deste mês." />}</section>
    {editing !== undefined && <TransactionModal item={editing} categories={categories} members={members} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); reload(); }} />}
  </div>;
}
function TransactionModal({ item, categories, members, onClose, onSaved }: { item: Transaction | null; categories: Category[]; members: Member[]; onClose: () => void; onSaved: () => void }) {
  const [kind, setKind] = useState(item?.type ?? 'EXPENSE');
  const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const body: Record<string, any> = Object.fromEntries(f); body.amount = Number(body.amount); body.type = kind; body.date = new Date(`${body.date}T12:00:00`).toISOString();
    try { await api(`/transactions${item ? `/${item.id}` : ''}`, { method: item ? 'PATCH' : 'POST', body: JSON.stringify(body) }); onSaved(); } catch (err) { setError((err as Error).message); }
  }
  const available = categories.filter((x) => x.type === kind);
  return <Modal title={item ? 'Editar movimento' : 'Novo movimento'} onClose={onClose}><form className="form-grid" onSubmit={submit}>
    <div className="segment span-2">{['INCOME','EXPENSE','SAVING'].map((x) => <button type="button" key={x} className={kind === x ? 'active' : ''} onClick={() => setKind(x)}>{labels[x]}</button>)}</div>
    <label>Data<input type="date" name="date" required defaultValue={(item?.date ?? new Date().toISOString()).slice(0,10)} /></label><label>Valor (MT)<input type="number" name="amount" min=".01" step=".01" required defaultValue={item?.amount} /></label>
    <label className="span-2">Descrição<input name="description" required defaultValue={item?.description} placeholder="Ex.: Compras do mês" /></label>
    <label>Categoria<select name="categoryId" required defaultValue={item?.categoryId}><option value="">Selecionar</option>{available.map((x) => <option value={x.id} key={x.id}>{x.name}</option>)}</select></label>
    <label>Subcategoria<input name="subcategory" defaultValue={item?.subcategory} placeholder="Opcional" /></label>
    <label>Responsável<select name="responsibleId" required defaultValue={item?.responsibleId}><option value="">Selecionar</option>{members.map((x) => <option value={x.id} key={x.id}>{x.name}</option>)}</select></label>
    <label>Método<select name="paymentMethod" required defaultValue={item?.paymentMethod ?? 'MPESA'}>{['CASH','MPESA','EMOLA','BANK','CARD'].map((x) => <option value={x} key={x}>{labels[x]}</option>)}</select></label>
    <label>Natureza<select name="nature" required defaultValue={item?.nature ?? (kind === 'SAVING' ? 'SAVING' : 'VARIABLE')}>{['FIXED','VARIABLE','EMERGENCY','SAVING'].map((x) => <option value={x} key={x}>{labels[x] ?? 'Poupança'}</option>)}</select></label>
    <label>Observações<input name="notes" defaultValue={item?.notes} placeholder="Opcional" /></label>
    {error && <div className="form-message span-2">{error}</div>}<div className="form-actions span-2"><button type="button" className="btn secondary" onClick={onClose}>Cancelar</button><button className="btn primary">Guardar movimento</button></div>
  </form></Modal>;
}
