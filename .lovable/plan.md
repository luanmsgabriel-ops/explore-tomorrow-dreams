
# Plano: Resolver Cache do Service Worker (PWA) e Sessão Antiga

## Diagnóstico

O problema está claro agora:
- **Janela anônima funciona** = código novo + nenhum cache = nenhuma sessão antiga
- **Aba normal não funciona** = Service Worker cache + possível sessão JWT expirada/corrompida

O projeto usa **VitePWA com Workbox** que cacheia agressivamente arquivos JS/CSS/HTML. Quando você republica, o navegador normal pode estar:

1. **Usando JavaScript antigo** do Service Worker cache (código que ainda chama políticas RLS antigas)
2. **Com token JWT expirado** ou corrompido no localStorage

## Solução em 3 Partes

### Parte 1: Forçar Atualização do Service Worker

Modificar `vite.config.ts` para usar estratégia de atualização mais agressiva:

```text
workbox: {
  // Adicionar skip waiting para ativar novo SW imediatamente
  skipWaiting: true,
  clientsClaim: true,
  // Não cachear chamadas API do Supabase
  navigateFallbackDenylist: [/^\/rest\//, /supabase/]
}
```

### Parte 2: Adicionar Lógica de Refresh no AdminDashboard

Adicionar tratamento de erro que detecta timeout/500 e força:
1. Limpar cache do Service Worker
2. Fazer logout e re-login automático se token estiver inválido
3. Mostrar botão de "Forçar Atualização" para o usuário

### Parte 3: Cache-Busting no Cliente Supabase

Adicionar headers para evitar cache em requisições ao banco:

```typescript
// Em chamadas críticas
.select('*', { 
  headers: { 'Cache-Control': 'no-cache' }
})
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `vite.config.ts` | Adicionar skipWaiting, clientsClaim, excluir API do cache |
| `src/pages/AdminDashboard.tsx` | Adicionar error handling com retry e clear cache |
| `src/components/admin/SalesManager.tsx` | Adicionar error handling para tabela de vendas |

## Detalhes Técnicos

### vite.config.ts - Modificações no PWA

```typescript
VitePWA({
  registerType: "autoUpdate",
  workbox: {
    skipWaiting: true,        // Ativa novo SW imediatamente
    clientsClaim: true,       // Toma controle de todas as tabs
    globPatterns: ["**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp}"],
    // Excluir API calls do cache
    navigateFallbackDenylist: [/^\/rest\//],
    runtimeCaching: [
      // ... configurações existentes de fonts
      {
        // NÃO cachear chamadas Supabase
        urlPattern: /\.supabase\.co/,
        handler: "NetworkOnly",
      }
    ]
  }
})
```

### AdminDashboard.tsx - Error Handling com Clear Cache

```typescript
const handleLoadError = async (error: any) => {
  console.error('Load error:', error);
  
  // Se erro 500 ou timeout, tentar limpar cache
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      await registration.unregister();
    }
    // Limpar caches
    if ('caches' in window) {
      const names = await caches.keys();
      for (let name of names) {
        await caches.delete(name);
      }
    }
  }
  
  // Verificar se sessão ainda é válida
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    toast.error('Sessão expirada. Faça login novamente.');
    navigate('/admin');
    return;
  }
  
  // Tentar refresh do token
  await supabase.auth.refreshSession();
  
  toast.error('Erro de conexão. Recarregando...');
  window.location.reload();
};
```

### SalesManager.tsx - Tratamento Específico

```typescript
const fetchSales = async () => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('sale_date', { ascending: false })
      .limit(200);

    if (error) {
      if (error.message?.includes('timeout') || error.code === '500') {
        // Tentar refresh da sessão e retry
        await supabase.auth.refreshSession();
        // Retry uma vez
        const retry = await supabase.from('sales').select('*').limit(100);
        if (retry.error) throw retry.error;
        setSales(retry.data || []);
        return;
      }
      throw error;
    }
    setSales(data || []);
  } catch (error) {
    console.error('Error fetching sales:', error);
    toast.error('Erro ao carregar vendas. Tente atualizar a página.');
  } finally {
    setLoading(false);
  }
};
```

## Solução Imediata para Você (Enquanto Aplico as Mudanças)

Para resolver agora no seu navegador:

1. **Limpar dados do site manualmente:**
   - Chrome: F12 → Application → Storage → "Clear site data"
   - Ou: Configurações → Privacidade → Limpar dados de navegação → Selecione apenas o site

2. **Desinstalar o PWA se instalado:**
   - Se você instalou o app, desinstale e reinstale após publicar

3. **Forçar refresh:**
   - Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)

## Após Aprovação

1. Modificarei os 3 arquivos listados
2. Você republica o projeto
3. Limpa os dados do site no navegador (uma única vez)
4. Faz login novamente
5. O problema estará resolvido permanentemente
