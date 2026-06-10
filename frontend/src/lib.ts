import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder',
);

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session?.access_token ?? ''}`,
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message ?? 'Ocorreu um erro.');
  }
  return response.json();
}

export const money = (value: number | string = 0) =>
  new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN', currencyDisplay: 'narrowSymbol' })
    .format(Number(value)).replace('MTn', 'MT');
export const shortDate = (value: string) => new Intl.DateTimeFormat('pt-PT').format(new Date(value));
export const currentMonth = () => new Date().toISOString().slice(0, 7);
