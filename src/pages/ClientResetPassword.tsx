import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";

import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ClientResetPassword() {
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setReady(Boolean(data.session));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso.");
      navigate("/minha-area", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a senha.");
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
          <h1 className="mt-2 font-serif text-3xl font-bold text-foreground">Definir nova senha</h1>

          {!ready ? (
            <div className="mt-6 rounded-2xl border border-border bg-secondary/50 p-5 text-sm leading-relaxed text-muted-foreground">
              Este link de recuperação não está ativo ou expirou. <Link className="font-semibold text-primary" to="/cliente/esqueci-senha">Solicitar um novo link</Link>.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-foreground">Nova senha
                <div className="relative mt-2"><Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="w-full rounded-xl border border-border bg-secondary py-3 pl-10 pr-3 text-foreground" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" /></div>
              </label>
              <button className="btn-primary flex w-full items-center justify-center gap-2" disabled={loading}>{loading ? <><Loader2 className="size-4 animate-spin" />Atualizando...</> : "Salvar nova senha"}</button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
