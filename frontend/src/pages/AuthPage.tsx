import { FormEvent, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api, supabase } from '../lib';

type Mode = 'login' | 'register' | 'forgot' | 'reset';

export default function AuthPage() {
  const { session } = useAuth();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>(params.get('reset') === '1' ? 'reset' : 'login');
  const [join, setJoin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (session && mode !== 'reset') return <Navigate to="/dashboard" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login?reset=1`,
        });
        if (error) throw error;
        setMessage('Enviámos um link de recuperação para o seu email.');
        return;
      }
      if (mode === 'reset') {
        const confirmation = String(form.get('confirmation'));
        if (password !== confirmation) throw new Error('As palavras-passe não coincidem.');
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        window.location.href = '/dashboard';
        return;
      }
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
          setMode('login');
          return;
        }
        await api('/auth/bootstrap', { method: 'POST', body: JSON.stringify({ name, ...familyData }) });
        window.location.href = '/dashboard';
      }
    } catch (caught) {
      setMessage(authMessage((caught as Error).message));
    } finally {
      setBusy(false);
    }
  }

  const title = mode === 'login' ? 'Entre na sua conta' : mode === 'register' ? 'Crie a conta da família' : mode === 'forgot' ? 'Recuperar acesso' : 'Definir nova palavra-passe';
  return <div className="auth-page">
    <section className="auth-visual">
      <img className="auth-full-logo" src="/taimos-logo-full.png" alt="The Taimo's, Building Our Future Together" />
      <div className="auth-copy"><span>A NOSSA VIDA, ORGANIZADA</span><h1>Planear, lembrar<br />e crescer juntos.</h1><p>Finanças, compras, objetivos, lembretes e programas da família, sempre à mão.</p></div>
      <div className="quote">“A nossa casa, os nossos planos, o nosso ritmo.”</div>
    </section>
    <section className="auth-form-wrap"><form className="auth-form" onSubmit={submit}>
      <div className="mobile-auth-brand"><img className="brand-mark" src="/app-icon-192.png" alt="Símbolo The Taimo's" /><div><strong>The Taimo's App</strong><small>by Jasvania & Layton</small></div></div>
      <div><span className="eyebrow">{mode === 'register' ? 'COMEÇAR AGORA' : mode === 'login' ? 'BEM-VINDO DE VOLTA' : 'RECUPERAR CONTA'}</span><h2>{title}</h2><p>{mode === 'forgot' ? 'Indique o email da conta para receber o link.' : mode === 'reset' ? 'Escolha uma palavra-passe nova e segura.' : mode === 'login' ? 'Os planos da vossa casa estão à espera.' : 'Em poucos passos, tudo fica organizado.'}</p></div>
      {mode === 'register' && <label>Seu nome<input name="name" required minLength={2} placeholder="Ex.: Amélia" /></label>}
      {mode !== 'reset' && <label>Email<input type="email" name="email" required placeholder="nome@exemplo.com" /></label>}
      {mode !== 'forgot' && <label>Palavra-passe<input type="password" name="password" required minLength={6} placeholder="Mínimo 6 caracteres" /></label>}
      {mode === 'reset' && <label>Confirmar palavra-passe<input type="password" name="confirmation" required minLength={6} /></label>}
      {mode === 'register' && <>
        <div className="segment"><button type="button" className={!join ? 'active' : ''} onClick={() => setJoin(false)}>Criar família</button><button type="button" className={join ? 'active' : ''} onClick={() => setJoin(true)}>Usar convite</button></div>
        {join ? <label>Código de convite<input name="inviteCode" required maxLength={8} placeholder="AB12CD34" /></label>
          : <label>Nome da família<input name="householdName" required placeholder="Ex.: Família Matola" /></label>}
      </>}
      {message && <div className="form-message" role="status">{message}</div>}
      <button className="btn primary full" disabled={busy}>{busy ? 'A processar...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : mode === 'forgot' ? 'Enviar link' : 'Guardar palavra-passe'}</button>
      {mode === 'login' && <button className="auth-text-button" type="button" onClick={() => { setMode('forgot'); setMessage(''); }}>Esqueci a palavra-passe</button>}
      <p className="switch-auth">{mode === 'register' ? 'Já tem uma conta?' : mode === 'login' ? 'Ainda não tem conta?' : 'Já consegue entrar?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage(''); }}>{mode === 'login' ? 'Criar conta' : 'Entrar'}</button></p>
    </form></section>
  </div>;
}

function authMessage(message: string) {
  if (message.includes('Invalid login credentials')) return 'Email ou palavra-passe incorretos.';
  if (message.includes('Email not confirmed')) return 'Confirme primeiro o email da conta.';
  if (message.includes('User already registered')) return 'Este email já está registado.';
  return message;
}
