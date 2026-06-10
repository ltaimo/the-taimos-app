import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api, supabase } from '../lib';

export default function AuthPage() {
  const { session } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [join, setJoin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (session) return <Navigate to="/dashboard" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email')), password = String(form.get('password'));
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const metadata = data.user.user_metadata;
        await api('/auth/bootstrap', {
          method: 'POST',
          body: JSON.stringify({
            name: metadata.name ?? email.split('@')[0],
            ...(metadata.inviteCode ? { inviteCode: metadata.inviteCode } : { householdName: metadata.householdName ?? `Família de ${metadata.name ?? email.split('@')[0]}` }),
          }),
        });
        window.location.href = '/dashboard';
      } else {
        const name = String(form.get('name'));
        const familyData = join
          ? { inviteCode: String(form.get('inviteCode')).toUpperCase() }
          : { householdName: String(form.get('householdName')) };
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, ...familyData } } });
        if (error) throw error;
        if (!data.session) {
          setMessage('Conta criada. Confirme o email e depois inicie sessão.');
          setMode('login'); return;
        }
        await api('/auth/bootstrap', {
          method: 'POST',
          body: JSON.stringify({
            name,
            ...familyData,
          }),
        });
        window.location.href = '/dashboard';
      }
    } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }
  return <div className="auth-page">
    <section className="auth-visual">
      <img className="auth-full-logo" src="/taimos-logo-full.png" alt="The Taimo's, Building Our Future Together" />
      <div className="auth-copy"><span>A NOSSA VIDA, ORGANIZADA</span><h1>Planear, lembrar<br />e crescer juntos.</h1><p>Finanças, compras, objetivos, lembretes e programas da família, sempre à mão.</p></div>
      <div className="quote">“A nossa casa, os nossos planos, o nosso ritmo.”</div>
    </section>
    <section className="auth-form-wrap"><form className="auth-form" onSubmit={submit}>
      <div className="mobile-auth-brand"><img className="brand-mark" src="/app-icon-192.png" alt="Símbolo The Taimo's" /><div><strong>The Taimo's App</strong><small>by Jasvania & Layton</small></div></div>
      <div><span className="eyebrow">{mode === 'login' ? 'BEM-VINDO DE VOLTA' : 'COMEÇAR AGORA'}</span><h2>{mode === 'login' ? 'Entre na sua conta' : 'Crie a conta da família'}</h2><p>{mode === 'login' ? 'Os planos da vossa casa estão à espera.' : 'Em poucos passos, tudo fica organizado.'}</p></div>
      {mode === 'register' && <label>Seu nome<input name="name" required minLength={2} placeholder="Ex.: Amélia" /></label>}
      <label>Email<input type="email" name="email" required placeholder="nome@exemplo.com" /></label>
      <label>Palavra-passe<input type="password" name="password" required minLength={6} placeholder="Mínimo 6 caracteres" /></label>
      {mode === 'register' && <>
        <div className="segment"><button type="button" className={!join ? 'active' : ''} onClick={() => setJoin(false)}>Criar família</button><button type="button" className={join ? 'active' : ''} onClick={() => setJoin(true)}>Usar convite</button></div>
        {join ? <label>Código de convite<input name="inviteCode" required maxLength={8} placeholder="AB12CD34" /></label>
          : <label>Nome da família<input name="householdName" required placeholder="Ex.: Família Matola" /></label>}
      </>}
      {message && <div className="form-message">{message}</div>}
      <button className="btn primary full" disabled={busy}>{busy ? 'A processar...' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
      <p className="switch-auth">{mode === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage(''); }}>{mode === 'login' ? 'Criar conta' : 'Entrar'}</button></p>
    </form></section>
  </div>;
}
