import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import BudgetsPage from './pages/BudgetsPage';
import DashboardPage from './pages/DashboardPage';
import FixedExpensesPage from './pages/FixedExpensesPage';
import ReportsPage from './pages/ReportsPage';
import SavingsPage from './pages/SavingsPage';
import SettingsPage from './pages/SettingsPage';
import TransactionsPage from './pages/TransactionsPage';
import FamilyLifePage from './pages/FamilyLifePage';

function Protected() {
  const { session, loading } = useAuth();
  if (loading) return <div className="splash"><img className="splash-mark" src="/app-icon-192.png" alt="" /><p>A preparar a vossa vida...</p></div>;
  if (!session) return <Navigate to="/login" replace />;
  return <Layout />;
}
function AppRoutes() {
  return <Routes>
    <Route path="/login" element={<AuthPage />} />
    <Route element={<Protected />}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/movimentos" element={<TransactionsPage />} />
      <Route path="/despesas-fixas" element={<FixedExpensesPage />} />
      <Route path="/orcamento" element={<BudgetsPage />} />
      <Route path="/poupanca" element={<SavingsPage />} />
      <Route path="/relatorios" element={<ReportsPage />} />
      <Route path="/definicoes" element={<SettingsPage />} />
      <Route path="/lembretes" element={<FamilyLifePage kind="reminders" />} />
      <Route path="/compras" element={<FamilyLifePage kind="shopping" />} />
      <Route path="/programas" element={<FamilyLifePage kind="events" />} />
    </Route>
  </Routes>;
}
export default function App() { return <AuthProvider><AppRoutes /></AuthProvider>; }
