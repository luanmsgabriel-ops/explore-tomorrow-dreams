import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";

import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";

export default function ClientForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/cliente/redefinir-senha`,
      });
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="min-h-[calc(100vh-5rem)] px-4 py-12 grid place-items-center">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card/80 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Tomorrow ID</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-foreground">Recuperar acesso</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Informe seu e-mail. Por segurança, a resposta é a mesma exista ou não uma conta cadastrada.</p>

          {sent ? (
            <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 text-sm leading-relaxed text-foreground">
              Se houver uma conta vinculada a esse e-mail, você receberá as instruções para redefinir sua senha.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-foreground">E-mail
                <div className="relative mt-2"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="w-full rounded-xl border border-border bg-secondary py-3 pl-10 pr-3 text-foreground" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
              </label>
              <button className="btn-primary flex w-full items-center justify-center gap-2" disabled={loading}>{loading ? <><Loader2 className="size-4 animate-spin" />Enviando...</> : "Enviar instruções"}</button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground"><Link className="font-semibold text-primary" to="/cliente">Voltar para entrar</Link></p>
        </div>
      </main>
    </div>
  );
}
