import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Mail, Lock, UserRound } from "lucide-react";

import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ClientSignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const navigate = useNavigate();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const emailRedirectTo = `${window.location.origin}/cliente`;
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() }, emailRedirectTo },
      });
      if (error) throw error;

      if (data.session) {
        toast.success("Tomorrow ID criado com sucesso.");
        navigate("/minha-area", { replace: true });
      } else {
        setConfirmationPending(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível criar sua conta.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="min-h-[calc(100vh-5rem)] px-4 py-12 grid place-items-center">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card/80 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Tomorrow ID</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-foreground">Crie sua conta</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Uma identidade para acompanhar viagens, planejamento e futuros radares.</p>

          {confirmationPending ? (
            <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 text-sm leading-relaxed text-foreground">
              Enviamos um link de confirmação para <strong>{email}</strong>. Depois de confirmar, volte para entrar na sua conta.
              <div className="mt-4"><Link className="font-semibold text-primary underline underline-offset-4" to="/cliente">Voltar para entrar</Link></div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-foreground">Nome completo
                <div className="relative mt-2"><UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="w-full rounded-xl border border-border bg-secondary py-3 pl-10 pr-3 text-foreground" value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} autoComplete="name" /></div>
              </label>
              <label className="block text-sm font-medium text-foreground">E-mail
                <div className="relative mt-2"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="w-full rounded-xl border border-border bg-secondary py-3 pl-10 pr-3 text-foreground" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
              </label>
              <label className="block text-sm font-medium text-foreground">Senha
                <div className="relative mt-2"><Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="w-full rounded-xl border border-border bg-secondary py-3 pl-10 pr-3 text-foreground" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" /></div>
              </label>
              <button className="btn-primary flex w-full items-center justify-center gap-2" disabled={loading}>{loading ? <><Loader2 className="size-4 animate-spin" />Criando...</> : "Criar Tomorrow ID"}</button>
            </form>
          )}

          {!confirmationPending ? <p className="mt-6 text-center text-sm text-muted-foreground">Já possui conta? <Link className="font-semibold text-primary" to="/cliente">Entrar</Link></p> : null}
        </div>
      </main>
    </div>
  );
}
