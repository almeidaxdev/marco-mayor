@AGENTS.md

# Marco Mayor — regras permanentes

## Conteúdo
- Nunca inventar informação factual sobre Marco Mayor: datas, números, resultados, nomes, leis, declarações, biografia. Campo sem informação fica `null` ou vazio.
- Única fotografia: `public/images/marco-mayor.jpg`. Não gerar, buscar ou usar stock photo para representá-lo.
- Site institucional/informacional, não propaganda eleitoral. Sem depoimentos ou métricas falsas.

## Dados
- Sem banco de dados. Fonte única das publicações: `content/posts.json` (validado por Zod em `src/lib/content/schema.ts`).
- Imagens de posts ficam em `public/posts/`. Nunca adicionar imagem de exemplo.
- A UI não acessa armazenamento direto: use `getPostRepository()` (local em dev, GitHub em produção). O site público lê `getPublishedPosts()`.
- Nunca escrever no filesystem da Vercel; em produção `CONTENT_DRIVER=github`.

## Segurança
- Segredos só no servidor (`GITHUB_TOKEN`, `SESSION_SECRET`, `ADMIN_PASSWORD_HASH`). Nunca `NEXT_PUBLIC_` para eles; nunca commitar `.env.local`.
- Toda página, layout e Server Action do admin chama `requireAdmin()`. O `proxy.ts` é só uma checagem otimista.

## Design
- Direção "Plenário aberto": editorial institucional, azul `#0D2437`/`#142F46` + amarelo `#F3CE4B` só como acento, Schibsted Grotesk.
- Tokens em `src/app/globals.css` (`@theme`). Não espalhar cores hardcoded.
- Site público com identidade própria; shadcn/ui fica evidente apenas no admin.
- Mobile é obrigatório e projetado (390/430px), não apenas empilhado.
- Acessibilidade: HTML semântico, foco visível, `prefers-reduced-motion`, labels, contraste.

## Antes de finalizar qualquer mudança visual
- `npm run lint`, `npm run typecheck`, `npm run build`.
- Validar no navegador (desktop e mobile) com screenshots; checar console e network.
