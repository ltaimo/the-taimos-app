import { ArrowDown, ArrowUp, Calendar, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Empty, ErrorState, Modal, PageHeader, Spinner } from '../components/UI';
import { useApi } from '../hooks';
import { api, money, shortDate } from '../lib';

type Movement = { id: string; type: string; amount: string; date: string };
type Goal = { id: string; name: string; targetAmount: string; currentAmount: number; progress: number; deadline?: string; type: string; movements: Movement[] };
const goalLabels: Record<string,string> = { EMERGENCY_FUND: 'Fundo de emergência', GENERAL_SAVINGS: 'Poupança geral', INVESTMENT: 'Investimento', FAMILY_GOAL: 'Objetivo familiar' };

export default function SavingsPage() {
  const [modal, setModal] = useState<{ kind: 'goal' | 'movement'; goal?: Goal } | null>(null);
  const goals = useApi<Goal[]>('/savings-goals', []);
  async function remove(goal: Goal) {
    if (!confirm(`Apagar o objetivo “${goal.name}” e todos os seus movimentos?`)) return;
    await api(`/savings-goals/${goal.id}`, { method: 'DELETE' });
    goals.reload();
  }
  return <div className="page"><PageHeader title="Poupança e objetivos" subtitle="Cada contribuição aproxima a família dos seus planos." actions={<button className="btn primary" onClick={() => setModal({ kind: 'goal' })}><Plus /> Novo objetivo</button>} />
    {goals.error ? <ErrorState message={goals.error} onRetry={goals.reload} /> : goals.loading ? <Spinner /> : goals.data.length ? <div className="goals-grid">{goals.data.map((goal) =>
      <article className="panel goal-card" key={goal.id}>
        <div className="goal-card-head"><div className="goal-icon"><Target /></div><div className="row-actions"><button aria-label={`Editar ${goal.name}`} onClick={() => setModal({ kind: 'goal', goal })}><Pencil /></button><button aria-label={`Apagar ${goal.name}`} onClick={() => remove(goal)}><Trash2 /></button></div></div>
        <span className="eyebrow">{goalLabels[goal.type]}</span><h2>{goal.name}</h2>
        <div className="goal-amount"><strong>{money(goal.currentAmount)}</strong><span>de {money(goal.targetAmount)}</span></div>
        <div className="progress purple"><span style={{ width: `${goal.progress}%` }} /></div>
        <div className="goal-meta"><strong>{goal.progress.toFixed(0)}% concluído</strong>{goal.deadline && <span><Calendar /> {shortDate(goal.deadline)}</span>}</div>
        <button className="btn secondary full" onClick={() => setModal({ kind: 'movement', goal })}>Adicionar contribuição ou retirada</button>
        {goal.movements[0] && <div className="last-movement">{goal.movements[0].type === 'CONTRIBUTION' ? <ArrowUp /> : <ArrowDown />}<span>Último movimento</span><strong>{money(goal.movements[0].amount)}</strong></div>}
      </article>)}</div> : <Empty title="Ainda sem objetivos" text="Criem o fundo de emergência ou o próximo objetivo da família." />}
    {modal?.kind === 'goal' && <GoalModal goal={modal.goal} onClose={() => setModal(null)} onSaved={() => { setModal(null); goals.reload(); }} />}
    {modal?.kind === 'movement' && <MovementModal goal={modal.goal!} onClose={() => setModal(null)} onSaved={() => { setModal(null); goals.reload(); }} />}
  </div>;
}

function GoalModal({ goal, onClose, onSaved }: { goal?: Goal; onClose: () => void; onSaved: () => void }) {
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const body: Record<string, any> = Object.fromEntries(new FormData(event.currentTarget));
    body.targetAmount = Number(body.targetAmount);
    if (!body.deadline) delete body.deadline; else body.deadline = new Date(`${body.deadline}T12:00:00`).toISOString();
    try {
      await api(`/savings-goals${goal ? `/${goal.id}` : ''}`, { method: goal ? 'PATCH' : 'POST', body: JSON.stringify(body) });
      onSaved();
    } catch (caught) { setError((caught as Error).message); } finally { setBusy(false); }
  }
  return <Modal title={goal ? 'Editar objetivo' : 'Novo objetivo'} onClose={onClose}><form className="form-grid" onSubmit={submit}>
    <label className="span-2">Nome do objetivo<input name="name" required defaultValue={goal?.name} placeholder="Ex.: Reserva de 6 meses" /></label>
    <label>Valor alvo<input name="targetAmount" type="number" min=".01" step=".01" required defaultValue={goal?.targetAmount} /></label>
    <label>Prazo<input name="deadline" type="date" defaultValue={goal?.deadline?.slice(0, 10)} /></label>
    <label className="span-2">Tipo<select name="type" defaultValue={goal?.type}>{Object.entries(goalLabels).map(([key,value]) => <option key={key} value={key}>{value}</option>)}</select></label>
    {error && <div className="form-message span-2">{error}</div>}
    <div className="form-actions span-2"><button type="button" className="btn secondary" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={busy}>{busy ? 'A guardar...' : 'Guardar objetivo'}</button></div>
  </form></Modal>;
}

function MovementModal({ goal, onClose, onSaved }: { goal: Goal; onClose: () => void; onSaved: () => void }) {
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const body: Record<string, any> = Object.fromEntries(new FormData(event.currentTarget));
    body.amount = Number(body.amount); body.date = new Date(`${body.date}T12:00:00`).toISOString();
    try {
      await api(`/savings-goals/${goal.id}/movements`, { method: 'POST', body: JSON.stringify(body) });
      onSaved();
    } catch (caught) { setError((caught as Error).message); } finally { setBusy(false); }
  }
  return <Modal title={`Movimento · ${goal.name}`} onClose={onClose}><form className="form-grid" onSubmit={submit}>
    <label>Tipo<select name="type"><option value="CONTRIBUTION">Contribuição</option><option value="WITHDRAWAL">Retirada</option></select></label>
    <label>Valor<input name="amount" type="number" min=".01" step=".01" required /></label>
    <label>Data<input name="date" type="date" required defaultValue={new Date().toISOString().slice(0,10)} /></label>
    <label>Observações<input name="notes" /></label>
    {error && <div className="form-message span-2">{error}</div>}
    <div className="form-actions span-2"><button type="button" className="btn secondary" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={busy}>{busy ? 'A registar...' : 'Registar'}</button></div>
  </form></Modal>;
}
