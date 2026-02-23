

# Integrar Blog do Soro ao Site

## O que sera feito
Criar uma nova pagina de Blog no site que carrega o conteudo do Soro automaticamente, e adicionar o link "Blog" na navegacao do site.

## Alteracoes

### 1. Nova pagina `src/pages/Blog.tsx`
- Criar um componente React que monta o `<div id="soro-blog">` e carrega o script do Soro dinamicamente via `useEffect`
- O script lera o parametro `?post=` da URL automaticamente para exibir artigos individuais
- A pagina tera o Header e Footer do site para manter a identidade visual

### 2. Rota no `src/App.tsx`
- Adicionar a rota `/blog` apontando para a nova pagina Blog

### 3. Navegacao no `src/components/Header.tsx`
- Adicionar o item "Blog" no array `navItems` para que apareca no menu desktop e mobile

---

## Detalhes tecnicos

### Carregamento do script Soro

Como o React nao executa tags `<script>` em JSX diretamente, o script sera injetado via `useEffect`:

```text
useEffect -> criar elemento <script>
          -> ler parametro "post" da URL
          -> definir src com o endpoint do Soro
          -> inserir no DOM dentro do container
          -> cleanup: remover script ao desmontar
```

### Arquivos afetados (3 arquivos)

| Arquivo | Mudanca |
|---|---|
| `src/pages/Blog.tsx` | Novo arquivo - pagina do blog com embed do Soro |
| `src/App.tsx` | Adicionar rota `/blog` |
| `src/components/Header.tsx` | Adicionar "Blog" ao menu de navegacao |

