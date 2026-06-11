import { Copy, Users } from 'lucide-react';
import { ErrorState, PageHeader, Spinner } from '../components/UI';
import { useApi } from '../hooks';
type Household = { name: string; inviteCode: string; members: { role: string; user: { id: string; name: string; email: string } }[] };
export default function SettingsPage() {
  const household = useApi<Household | null>('/households/current', null);
  const { data, loading } = household;
  return <div className="page"><PageHeader title="Definições" subtitle="Gerir a família e o acesso partilhado." />{household.error ? <ErrorState message={household.error} onRetry={household.reload} /> : loading || !data ? <Spinner /> : <div className="settings-grid"><section className="panel"><span className="eyebrow">A VOSSA CASA</span><h2>{data.name}</h2><p className="muted">Partilhe este código apenas com membros da sua família.</p><div className="invite-code"><strong>{data.inviteCode}</strong><button onClick={() => navigator.clipboard.writeText(data.inviteCode)}><Copy /> Copiar</button></div></section><section className="panel"><div className="panel-head"><div><span className="eyebrow">MEMBROS</span><h2>Acesso familiar</h2></div><Users /></div><div className="member-list">{data.members.map((x) => <article key={x.user.id}><div className="avatar">{x.user.name.slice(0,2).toUpperCase()}</div><div><strong>{x.user.name}</strong><span>{x.user.email}</span></div><span className="badge ok">{x.role === 'OWNER' ? 'Administrador' : 'Membro'}</span></article>)}</div></section></div>}</div>;
}
