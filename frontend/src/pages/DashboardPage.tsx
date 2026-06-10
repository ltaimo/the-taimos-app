import { AlertCircle, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Landmark, PiggyBank, ShieldAlert, ShoppingBag, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useApi } from '../hooks';
import { currentMonth, money } from '../lib';
import { Report } from '../types';
import { MonthFilter, PageHeader, Spinner, SummaryCard } from '../components/UI';

const empty: Report = { income: 0, expenses: 0, balance: 0, overallBalance: 0, saved: 0, totalSaved: 0, emergencies: 0, spentPercentage: 0, topCategories: [], alerts: [] };
export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const { data, loading } = useApi<Report>(`/reports/monthly?month=${month}`, empty);
  const { data: life } = useApi<{ reminders: any[]; shopping: any[]; events: any[] }>('/family-life/overview', { reminders: [], shopping: [], events: [] });
  return <div className="page">
    <PageHeader title="Olá, Taimo's" subtitle="Tudo o que importa para a vossa casa, num só lugar." actions={<MonthFilter value={month} onChange={setMonth} />} />
    <section className="life-overview">
      <Link to="/lembretes" className="life-overview-card rose"><div><Bell /></div><span>Lembretes</span><strong>{life.reminders.length}</strong><small>{life.reminders[0]?.title ?? 'Nada urgente por agora'}</small></Link>
      <Link to="/compras" className="life-overview-card peach"><div><ShoppingBag /></div><span>Precisamos comprar</span><strong>{life.shopping.length}</strong><small>{life.shopping[0]?.name ?? 'Lista de compras vazia'}</small></Link>
      <Link to="/programas" className="life-overview-card lavender"><div><CalendarDays /></div><span>Próximos programas</span><strong>{life.events.length}</strong><small>{life.events[0]?.title ?? 'Agenda livre'}</small></Link>
    </section>
    <div className="section-title"><div><span className="eyebrow">FINANÇAS DA CASA</span><h2>Resumo do mês</h2></div></div>
    {loading ? <Spinner /> : <>
      <div className="summary-grid">
        <SummaryCard label="Entradas do mês" value={money(data.income)} tone="positive" icon={<ArrowUpRight />} />
        <SummaryCard label="Saídas do mês" value={money(data.expenses)} tone="negative" icon={<ArrowDownRight />} />
        <SummaryCard label="Saldo do mês" value={money(data.balance)} tone={data.balance >= 0 ? 'positive' : 'negative'} icon={<Wallet />} />
        <SummaryCard label="Saldo geral" value={money(data.overallBalance)} icon={<Landmark />} />
        <SummaryCard label="Total poupado" value={money(data.totalSaved)} tone="purple" icon={<PiggyBank />} />
        <SummaryCard label="Emergências" value={money(data.emergencies)} tone="warning" icon={<ShieldAlert />} />
      </div>
      <div className="dashboard-grid">
        <section className="panel spending-panel"><div className="panel-head"><div><span className="eyebrow">RITMO DO MÊS</span><h2>Rendimento utilizado</h2></div><strong>{data.spentPercentage.toFixed(0)}%</strong></div>
          <div className="big-progress"><span style={{ width: `${Math.min(100, data.spentPercentage)}%` }} /></div>
          <p>{data.spentPercentage > 100 ? 'As despesas já ultrapassaram as entradas deste mês.' : `Ainda restam ${money(Math.max(0, data.income - data.expenses))} das entradas do mês.`}</p>
        </section>
        <section className="panel chart-panel"><div className="panel-head"><div><span className="eyebrow">ONDE GASTÁMOS</span><h2>Top categorias</h2></div></div>
          {data.topCategories.length ? <div className="chart-content"><ResponsiveContainer width="48%" height={210}><PieChart><Pie data={data.topCategories} dataKey="amount" innerRadius={58} outerRadius={86} paddingAngle={3}>{data.topCategories.map((x) => <Cell key={x.name} fill={x.color} />)}</Pie><Tooltip formatter={(v) => money(Number(v))} /></PieChart></ResponsiveContainer>
            <div className="legend">{data.topCategories.map((x) => <div key={x.name}><i style={{ background: x.color }} /><span>{x.name}</span><strong>{money(x.amount)}</strong></div>)}</div></div> : <p className="muted">Registe despesas para ver a distribuição por categoria.</p>}
        </section>
        <section className="panel alerts-panel"><div className="panel-head"><div><span className="eyebrow">ATENÇÃO</span><h2>Alertas e sugestões</h2></div><AlertCircle /></div>
          {data.alerts.length ? data.alerts.map((alert) => <div className="alert-item" key={alert}><AlertCircle size={17} /><span>{alert}</span></div>) : <div className="success-note">Tudo sob controlo. Nenhum alerta para este mês.</div>}
        </section>
      </div>
    </>}
  </div>;
}
