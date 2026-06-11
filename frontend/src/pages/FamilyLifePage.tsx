import {
  Bell, CalendarDays, Check, Clock, MapPin, Pencil, Plus, ShoppingBag, Store, Trash2, UserRound,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Empty, ErrorState, Modal, PageHeader, Spinner } from '../components/UI';
import { useApi } from '../hooks';
import { api, money, shortDate } from '../lib';
import { Member } from '../types';

type Kind = 'reminders' | 'shopping' | 'events';
type Item = {
  id: string; title?: string; name?: string; description?: string; dueAt?: string;
  neededBy?: string; startsAt?: string; endsAt?: string; reminderAt?: string;
  estimatedPrice?: string; store?: string; location?: string; host?: string;
  priority?: string; status: string; assigneeId?: string; assignee?: { id: string; name: string };
};
const config = {
  reminders: { title: 'Lembretes', subtitle: 'Tudo o que a família não pode deixar passar.', button: 'Novo lembrete', icon: Bell },
  shopping: { title: 'Compras e necessidades', subtitle: 'O que falta, onde comprar, quanto custa e para quando.', button: 'Adicionar item', icon: ShoppingBag },
  events: { title: 'Programas', subtitle: 'Festas, visitas, compromissos e planos da família.', button: 'Novo programa', icon: CalendarDays },
};
const statusLabel: Record<string,string> = { PENDING: 'Pendente', IN_PROGRESS: 'Em curso', COMPLETED: 'Concluído', CANCELLED: 'Cancelado' };
const priorityLabel: Record<string,string> = { LOW: 'Baixa', MEDIUM: 'Normal', HIGH: 'Alta' };

export default function FamilyLifePage({ kind }: { kind: Kind }) {
  const [editing, setEditing] = useState<Item | null | undefined>(undefined);
  const items = useApi<Item[]>(`/family-life/${kind}`, []);
  const { data, loading, reload } = items;
  const { data: members } = useApi<Member[]>('/users', []);
  const meta = config[kind], Icon = meta.icon;

  async function toggle(item: Item) {
    const body = itemPayload(item, kind);
    body.status = item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    await api(`/family-life/${kind}/${item.id}`, { method: 'PATCH', body: JSON.stringify(body) });
    reload();
  }

  async function remove(item: Item) {
    if (!confirm(`Apagar “${item.title ?? item.name}”?`)) return;
    await api(`/family-life/${kind}/${item.id}`, { method: 'DELETE' });
    reload();
  }

  return <div className="page family-page">
    <PageHeader title={meta.title} subtitle={meta.subtitle} actions={<button className="btn primary" onClick={() => setEditing(null)}><Plus /> {meta.button}</button>} />
    <div className="family-summary"><div className="family-summary-icon"><Icon /></div><div><strong>{data.filter((x) => x.status !== 'COMPLETED').length}</strong><span>itens ativos</span></div><div><strong>{data.filter((x) => x.status === 'COMPLETED').length}</strong><span>concluídos</span></div></div>
    {items.error ? <ErrorState message={items.error} onRetry={reload} /> : loading ? <Spinner /> : data.length ? <section className="life-list">{data.map((item) =>
      <article className={`life-card ${item.status === 'COMPLETED' ? 'done' : ''}`} key={item.id}>
        <button className="life-check" aria-label={item.status === 'COMPLETED' ? 'Marcar como pendente' : 'Marcar como concluído'} onClick={() => toggle(item)}>{item.status === 'COMPLETED' && <Check />}</button>
        <div className="life-content">
          <div className="life-title"><strong>{item.title ?? item.name}</strong>{item.priority && <span className={`priority ${item.priority.toLowerCase()}`}>{priorityLabel[item.priority]}</span>}</div>
          {item.description && <p>{item.description}</p>}
          <div className="life-meta">
            {(item.dueAt || item.neededBy || item.startsAt) && <span><Clock /> {formatDateTime(item.dueAt ?? item.neededBy ?? item.startsAt!)}</span>}
            {item.store && <span><Store /> {item.store}</span>}
            {item.location && <span><MapPin /> {item.location}</span>}
            {item.host && <span><UserRound /> Na casa de {item.host}</span>}
            {item.assignee && <span><UserRound /> {item.assignee.name}</span>}
          </div>
        </div>
        <div className="life-side">
          {item.estimatedPrice && <strong>{money(item.estimatedPrice)}</strong>}
          <span className={`badge ${item.status.toLowerCase()}`}>{statusLabel[item.status]}</span>
          <div className="life-actions"><button className="icon-btn" aria-label={`Editar ${item.title ?? item.name}`} onClick={() => setEditing(item)}><Pencil /></button><button className="delete-btn" aria-label={`Apagar ${item.title ?? item.name}`} onClick={() => remove(item)}><Trash2 /></button></div>
        </div>
      </article>)}</section> : <Empty title={`Sem ${meta.title.toLowerCase()}`} text={`Use “${meta.button}” para começar.`} />}
    {editing !== undefined && <LifeModal item={editing} kind={kind} members={members} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); reload(); }} />}
  </div>;
}

function LifeModal({ item, kind, members, onClose, onSaved }: {
  item: Item | null; kind: Kind; members: Member[]; onClose: () => void; onSaved: () => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const body: Record<string, any> = Object.fromEntries(new FormData(event.currentTarget));
    for (const key of ['dueAt', 'neededBy', 'startsAt', 'endsAt', 'reminderAt']) {
      if (body[key]) body[key] = new Date(body[key]).toISOString(); else delete body[key];
    }
    if (body.estimatedPrice) body.estimatedPrice = Number(body.estimatedPrice); else delete body.estimatedPrice;
    if (!body.assigneeId) delete body.assigneeId;
    try {
      await api(`/family-life/${kind}${item ? `/${item.id}` : ''}`, {
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
  return <Modal title={item ? `Editar · ${item.title ?? item.name}` : config[kind].button} onClose={onClose}><form className="form-grid" onSubmit={submit}>
    <label className="span-2">{kind === 'shopping' ? 'O que precisamos?' : 'Título'}<input name={kind === 'shopping' ? 'name' : 'title'} required defaultValue={item?.title ?? item?.name} placeholder={kind === 'events' ? 'Ex.: Aniversário da tia' : kind === 'shopping' ? 'Ex.: Mesa para a sala' : 'Ex.: Renovar a internet'} /></label>
    <label className="span-2">Detalhes<input name="description" defaultValue={item?.description} placeholder="Notas úteis para os dois" /></label>
    {kind === 'reminders' && <><label>Data e hora<input type="datetime-local" name="dueAt" required defaultValue={localDateTime(item?.dueAt)} /></label><Assignee members={members} value={item?.assigneeId} /></>}
    {kind === 'shopping' && <><label>Loja / local<input name="store" defaultValue={item?.store} placeholder="Ex.: Casa das Loiças" /></label><label>Preço estimado (MT)<input name="estimatedPrice" type="number" min="0" step=".01" defaultValue={item?.estimatedPrice} /></label><label>Precisamos até<input name="neededBy" type="date" defaultValue={item?.neededBy?.slice(0, 10)} /></label><Assignee members={members} value={item?.assigneeId} /></>}
    {kind === 'events' && <><label>Data e hora<input type="datetime-local" name="startsAt" required defaultValue={localDateTime(item?.startsAt)} /></label><label>Termina em<input type="datetime-local" name="endsAt" defaultValue={localDateTime(item?.endsAt)} /></label><label>Local<input name="location" defaultValue={item?.location} placeholder="Ex.: Matola" /></label><label>Anfitrião / casa de<input name="host" defaultValue={item?.host} placeholder="Ex.: Família Ana" /></label><label className="span-2">Lembrar em<input type="datetime-local" name="reminderAt" defaultValue={localDateTime(item?.reminderAt)} /></label></>}
    {kind !== 'events' && <label>Prioridade<select name="priority" defaultValue={item?.priority ?? 'MEDIUM'}><option value="LOW">Baixa</option><option value="MEDIUM">Normal</option><option value="HIGH">Alta</option></select></label>}
    <input type="hidden" name="status" value={item?.status ?? 'PENDING'} />
    {error && <div className="form-message span-2">{error}</div>}
    <div className="form-actions span-2"><button type="button" className="btn secondary" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={busy}>{busy ? 'A guardar...' : 'Guardar'}</button></div>
  </form></Modal>;
}

function Assignee({ members, value }: { members: Member[]; value?: string }) {
  return <label>Responsável<select name="assigneeId" defaultValue={value}><option value="">Toda a família</option>{members.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>;
}
function formatDateTime(value: string) {
  const date = new Date(value);
  return `${shortDate(value)} · ${date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
}
function itemPayload(item: Item, kind: Kind): Record<string, any> {
  if (kind === 'reminders') return { title: item.title, description: item.description, dueAt: item.dueAt, priority: item.priority, status: item.status, assigneeId: item.assigneeId };
  if (kind === 'shopping') return { name: item.name, description: item.description, store: item.store, estimatedPrice: item.estimatedPrice ? Number(item.estimatedPrice) : undefined, neededBy: item.neededBy, priority: item.priority, status: item.status, assigneeId: item.assigneeId };
  return { title: item.title, description: item.description, location: item.location, host: item.host, startsAt: item.startsAt, endsAt: item.endsAt, reminderAt: item.reminderAt, status: item.status };
}
function localDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
