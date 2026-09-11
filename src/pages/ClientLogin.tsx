import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Lock, Mail, Eye, EyeOff, Loader2, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { resolveMyTomorrowEntry } from '@/lib/travelMatch';
import { toast } from 'sonner';

const ClientLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const enterMyTomorrow = async () => navigate(await resolveMyTomorrowEntry(), { replace: true });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle();
      if (roleData?.role === 'admin') { await supabase.auth.signOut(); toast.info('Faça login com uma conta de cliente'); }
      else if (roleData?.role === 'user') await enterMyTomorrow();
    };
    void checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      const { data: roleData, error: roleError } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
      if (roleError) throw roleError;
      if (roleData?.role === 'admin') { await supabase.auth.signOut(); toast.error('Acesso negado. Use a área de administração para fazer login.'); return; }
      if (roleData?.role !== 'user') { await supabase.auth.signOut(); toast.error('Sua conta ainda não está habilitada para a área do cliente.'); return; }
      toast.success('Login realizado com sucesso!');
      await enterMyTomorrow();
    } catch (error) { console.error('Auth error:', error); toast.error('E-mail ou senha incorretos'); }
    finally { setIsLoading(false); }
  };

  return <div className="min-h-screen bg-background"><Header /><div className="min-h-screen flex items-center justify-center px-4 py-12"><div className="w-full max-w-md">
    <div className="text-center mb-8"><div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6"><Briefcase className="w-8 h-8 text-primary-foreground" /></div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Tomorrow ID</p><h1 className="font-serif text-3xl font-bold text-foreground mb-2">Sua área <span className="gradient-text-teal">Tomorrow</span></h1><p className="text-muted-foreground">Entre para acompanhar suas viagens e seu planejamento.</p></div>
    <form onSubmit={handleSubmit} className="space-y-6">
      <div><label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">E-mail</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full pl-12 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground" required disabled={isLoading} autoComplete="email" /></div></div>
      <div><div className="mb-2 flex items-center justify-between gap-3"><label htmlFor="password" className="block text-sm font-medium text-foreground">Senha</label><Link to="/cliente/esqueci-senha" className="text-xs font-semibold text-primary hover:underline">Esqueci minha senha</Link></div><div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-12 pr-12 py-3 rounded-xl bg-secondary border border-border text-foreground" required disabled={isLoading} minLength={6} autoComplete="current-password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div>
      <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2" disabled={isLoading}>{isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Entrando...</> : 'Entrar'}</button>
    </form>
    <div className="mt-8 p-4 rounded-xl bg-secondary/50 border border-border text-center"><p className="text-muted-foreground text-sm">Ainda não possui Tomorrow ID?</p><Link to="/cliente/criar-conta" className="mt-1 inline-block font-semibold text-primary hover:underline">Criar minha conta</Link></div>
  </div></div></div>;
};
export default ClientLogin;
