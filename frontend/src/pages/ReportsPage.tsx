import { ArrowDownRight, ArrowUpRight, Download, PiggyBank, ShieldAlert, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MonthFilter, PageHeader, Spinner, SummaryCard } from '../components/UI';
import { useApi } from '../hooks';
import { currentMonth, money } from '../lib';
import { Report } from '../types';
const empty: Report = { income: 0, expenses: 0, balance: 0, overallBalance: 0, saved: 0, totalSaved: 0, emergencies: 0, spentPercentage: 0, topCategories: [], alerts: [] };
export default function ReportsPage() {
  const [month, setMonth] = useState(currentMonth());
  const { data, loading } = useApi<Report>(`/reports/monthly?month=${month}`, empty);
  const print = () => window.print();
  return <div className="page"><PageHeader title="Relatório mensal" subtitle="Uma leitura clara das decisões financeiras do mês." actions={<button className="btn secondary" onClick={print}><Download /> Guardar PDF</button>} />
    <div className="inline-filter"><MonthFilter value={month} onChange={setMonth} /></div>{loading ? <Spinner /> : <>
      <div className="summary-grid compact"><SummaryCard label="Entradas" value={money(data.income)} tone="positive" icon={<ArrowUpRight />} /><SummaryCard label="Saídas" value={money(data.expenses)} tone="negative" icon={<ArrowDownRight />} /><SummaryCard label="Saldo final" value={money(data.balance)} icon={<Wallet />} /><SummaryCard label="Poupado" value={money(data.saved)} tone="purple" icon={<PiggyBank />} /><SummaryCard label="Emergências" value={money(data.emergencies)} tone="warning" icon={<ShieldAlert />} /></div>
      <div className="report-grid"><section className="panel"><span className="eyebrow">TOP 5 CATEGORIAS</span><h2>Maiores gastos</h2><ResponsiveContainer width="100%" height={300}><BarChart data={data.topCategories} layout="vertical" margin={{ left: 25 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={105} tickLine={false} axisLine={false} /><Tooltip formatter={(v) => money(Number(v))} /><Bar dataKey="amount" fill="#1c7c70" radius={[0,6,6,0]} /></BarChart></ResponsiveContainer></section>
      <section className="panel report-comments"><span className="eyebrow">LEITURA AUTOMÁTICA</span><h2>O que este mês nos diz</h2>{data.alerts.length ? data.alerts.map((x, i) => <article key={x}><span>0{i + 1}</span><p>{x}</p></article>) : <article><span>01</span><p>O mês está equilibrado e não existem alertas de orçamento.</p></article>}</section></div>
    </>}</div>;
}
