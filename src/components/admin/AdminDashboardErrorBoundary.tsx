import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AdminDashboardErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Admin dashboard render error:', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-background px-4 flex items-center justify-center">
        <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-destructive" aria-hidden="true" />
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Não foi possível exibir o painel
          </h1>
          <p className="mt-3 text-muted-foreground">
            Seus dados continuam preservados. Recarregue a página para tentar novamente.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              className="btn-primary flex items-center justify-center gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Recarregar painel
            </button>
            <a className="btn-outline text-center" href="/admin">
              Voltar ao acesso
            </a>
          </div>
        </section>
      </main>
    );
  }
}
