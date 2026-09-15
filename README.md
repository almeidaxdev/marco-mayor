# Marco Mayor — site institucional

Site de apresentação e acompanhamento das publicações relacionadas à atuação de Marco Mayor, vereador de Pindamonhangaba e presidente da Câmara Municipal no biênio 2025–2026.

Não é o portal oficial da Câmara Municipal.

O projeto tem duas partes:

- **Site público** (`/`): Hero, Atuação em destaque (carrossel filtrável), Sobre Marco, Contato e redes.
- **Área administrativa** (`/admin`): gerenciamento das publicações e das categorias, sem banco de dados. Conteúdo em `content/posts.json`, imagens em `public/posts/`.

---

## Stack

| Camada | Escolha |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions, `proxy.ts`) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS v4 com tokens em `src/app/globals.css` |
| Componentes do admin | shadcn/ui (Radix) + Lucide |
| Validação | Zod |
| Sessão | JWT HS256 assinado com `jose`, em cookie HttpOnly |
| Senha | `scrypt` nativo do Node (`node:crypto`) |
| Imagens | `next/image`; uploads reprocessados com `sharp` |
| Notificações | Sonner |

Sem Prisma, Supabase, Firebase ou qualquer banco.

---

## Executar localmente

Requisitos: Node.js 20.9+.

```bash
npm install
cp .env.example .env.local
npm run hash-password      # digite a senha; copie ADMIN_PASSWORD_HASH para .env.local
npm run session-secret     # copie SESSION_SECRET para .env.local
npm run dev
```

Preencha também `ADMIN_USERNAME` e mantenha `CONTENT_DRIVER=local`.

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin

### Scripts

| Script | Uso |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servir o build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run hash-password` | Gera `ADMIN_PASSWORD_HASH` (entrada oculta; não fica no histórico do shell) |
| `npm run session-secret` | Gera `SESSION_SECRET` aleatório |

---

## Estrutura

```
content/posts.json              Fonte única do conteúdo (categorias + publicações)
public/images/marco-mayor.jpg   Fotografia (única) usada na Hero
public/posts/                   Imagens das publicações (inicia vazia)
scripts/hash-password.mjs       Gerador de hash de senha
src/
  proxy.ts                      Redirecionamento otimista de /admin
  app/
    (site)/page.tsx             Página pública
    admin/
      actions.ts                Server Actions (login, CRUD) — todas verificam sessão
      login/                    /admin/login
      (panel)/                  /admin, /admin/posts(/new, /[id]), /admin/categories(/new, /[id])
  components/
    site/                       Hero, header, cards, carrossel, seções, footer
    admin/                      Sidebar, tabela, formulário, diálogos
    ui/                         Primitivos shadcn/ui (usados no admin)
  lib/
    auth/                       Senha, token, sessão, rate limit
    content/                    Schema, repositórios local/GitHub, imagens, leitura pública
    validations/                Schema do formulário
    site.ts                     Dados institucionais e redes sociais
```

---

## Conteúdo (`content/posts.json`)

Categorias e publicações ficam no mesmo arquivo: cada gravação é validada inteira (inclusive as referências entre publicação e categoria) e vira um único commit.

```json
{
  "categories": [
    {
      "id": "1110b540-d087-4078-9d64-4576e8c42485",
      "name": "Saúde",
      "slug": "saude",
      "icon": "health",
      "order": 1
    }
  ],
  "posts": [
    {
      "id": "uuid",
      "slug": "farmacia-da-solidariedade",
      "categoryId": "1110b540-d087-4078-9d64-4576e8c42485",
      "title": "Farmácia da Solidariedade",
      "excerpt": "Conheça o tema apresentado por Marco Mayor em suas redes sociais.",
      "image": null,
      "externalUrl": null,
      "published": true,
      "featured": false,
      "order": 1,
      "publishedAt": null,
      "createdAt": "2026-09-14T22:38:55.112Z",
      "updatedAt": "2026-09-14T22:38:55.112Z"
    }
  ]
}
```

### Categorias

- `id`: UUID estável. As publicações referenciam a categoria por `categoryId`, então renomear não altera nenhuma publicação.
- `name`: 2 a 40 caracteres; letras, números, espaços e `& ' ( ) , . / -`. Não pode repetir outro nome (ignorando maiúsculas, espaços e acentos).
- `slug`: gerado a partir do nome na criação e mantido ao renomear.
- `icon`: chave de uma lista fechada (`src/lib/content/category-icons.ts`). `health`, `inclusion` e `neighborhoods` são os símbolos originais de Saúde, Inclusão e Bairros; as demais usam Lucide. Nenhum SVG vem do conteúdo.
- `order`: menor aparece antes nos filtros e nas listas.
- Uma categoria só pode ser excluída quando nenhuma publicação a usa (não há exclusão em cascata).
- No site, os filtros são gerados a partir das categorias que têm publicações publicadas. “Todos os assuntos” é filtro, não categoria.
- O formato antigo (`"category": "Saúde"`, sem `categories`) ainda é lido e convertido em memória com os mesmos IDs; a primeira gravação salva no formato novo.

### Publicações

- `categoryId`: ID de uma categoria existente.
- `image`: `null` ou `/posts/<arquivo>.webp`. Sem imagem, o card usa a versão tipográfica com o símbolo da categoria.
- `externalUrl`: link `https://` da publicação original. Sem link, o card leva à seção Contato e redes.
- `featured`: aparece primeiro, em card azul com a etiqueta “Destaque”.
- `order`: menor aparece antes.
- `publishedAt`: preenchido pelo admin ao publicar; não é exibido no site.

O arquivo é validado com Zod na leitura e antes de cada gravação. Um JSON inválido quebra o build de propósito.

---

## Autenticação

- Um único administrador, definido por `ADMIN_USERNAME` e `ADMIN_PASSWORD_HASH`. A senha nunca fica no repositório.
- O hash usa `scrypt` (N=32768, r=8, p=1, salt aleatório de 16 bytes) no formato `scrypt:N:r:p:salt:hash`. Os separadores são `:` porque `$` seria expandido pelo dotenv.
- Ao entrar, o servidor emite um JWT HS256 assinado com `SESSION_SECRET` (mínimo de 32 caracteres) no cookie `mm_admin_session`:
  - `HttpOnly`, `SameSite=Lax`, `Path=/`;
  - `Secure` em produção;
  - validade de 8 horas.
- A comparação do usuário é em tempo constante, e usuários inexistentes também pagam o custo do scrypt.
- Rate limit de 5 tentativas a cada 15 minutos por IP. Ele é mantido em memória por instância: dificulta força bruta, mas não é global em serverless.
- Trocar `ADMIN_USERNAME` ou `SESSION_SECRET` invalida as sessões existentes.

### Proteção das rotas

1. `src/proxy.ts` redireciona `/admin/*` (exceto `/admin/login`) quando não há sessão válida. É apenas uma checagem otimista.
2. `src/app/admin/(panel)/layout.tsx` chama `requireAdmin()` no servidor.
3. **Toda Server Action** (`savePost`, `setPublished`, `setFeatured`, `movePost`, `deletePost`, `saveCategory`, `moveCategory`, `deleteCategory`) chama `requireAdmin()` antes de qualquer leitura ou escrita. Isso vale mesmo quando a action é invocada fora da interface.

---

## Armazenamento: local × GitHub

A UI usa apenas a interface `PostRepository` (`src/lib/content/repository.ts`):

| Driver | Quando | Como grava |
| --- | --- | --- |
| `LocalPostRepository` | `CONTENT_DRIVER=local` (desenvolvimento) | Escreve `content/posts.json` de forma atômica e salva as imagens em `public/posts/` |
| `GitHubPostRepository` | `CONTENT_DRIVER=github` (produção) | Cria um commit no repositório via API do GitHub |

Na Vercel, o driver local é recusado, porque o filesystem não é persistente.

O **site público** sempre lê o `content/posts.json` do build atual. O **admin** lê pelo repositório configurado; no GitHub, ele vê a versão mais recente do branch mesmo antes do deploy terminar.

### Fluxo de um salvamento em produção

1. O admin carrega a página com a `version` do arquivo (o SHA do blob de `posts.json`).
2. Ao salvar, o servidor lê o SHA atual do branch e do `posts.json`.
3. Se o SHA mudou, a action retorna **conflito**: a interface mostra “O conteúdo foi alterado por outra sessão. Recarregue a página…” e nada é sobrescrito.
4. Se não mudou, aplica a alteração validada e cria **um único commit** pela Git Data API (blobs → tree → commit). Esse commit inclui o `posts.json` e as imagens enviadas ou removidas.
5. O branch é atualizado com `force: false`. Se alguém fez commit no intervalo, o GitHub rejeita, e isso também vira conflito.
6. A Vercel detecta o commit e publica um novo deploy. O admin avisa: “O site público será atualizado após o próximo deploy.”

Um salvamento gera um commit, que gera um deploy. Mensagens de commit: `content: atualiza publicação "Título"`.

---

## Upload de imagens

- Formatos aceitos: `.jpg`, `.jpeg`, `.png`, `.webp`. SVG é recusado.
- No navegador, a imagem é reduzida para no máximo 2000 px e convertida para WebP antes do envio. Isso fica abaixo do limite de 4,5 MB por requisição da Vercel.
- No servidor, a imagem passa por várias verificações:
  - extensão e MIME permitidos;
  - tamanho de até 3,5 MB;
  - **magic bytes** reais (JPEG, PNG ou RIFF/WEBP);
  - decodificação com `sharp`, com limite de pixels;
  - re-encode para WebP com no máximo 1600 px, o que remove metadados.
- O nome do arquivo é gerado pelo servidor: `<slug>-<6 hex>.webp`. Nada do nome original entra no caminho. Caminhos são validados por regex e, no driver local, confinados a `public/posts/`, sem path traversal.
- Ao substituir ou remover uma imagem, o arquivo antigo é apagado **somente se nenhuma outra publicação o referencia**. A exclusão de uma publicação oferece a opção de remover a imagem, com a mesma regra.

---

## Variáveis de ambiente

| Variável | Onde | Descrição |
| --- | --- | --- |
| `ADMIN_USERNAME` | servidor | Usuário do admin |
| `ADMIN_PASSWORD_HASH` | servidor | Saída de `npm run hash-password` |
| `SESSION_SECRET` | servidor | ≥ 32 caracteres (`npm run session-secret`) |
| `CONTENT_DRIVER` | servidor | `local` ou `github` |
| `GITHUB_TOKEN` | servidor | Token fine-grained (ver abaixo) |
| `GITHUB_OWNER` | servidor | Dono do repositório |
| `GITHUB_REPO` | servidor | Nome do repositório |
| `GITHUB_BRANCH` | servidor | Branch de produção (padrão `main`) |
| `NEXT_PUBLIC_SITE_URL` | público | URL do site, sem barra final. Ativa canonical e URLs absolutas de Open Graph |

`GITHUB_TOKEN` **nunca** deve ter prefixo `NEXT_PUBLIC_`. `.env.local` está no `.gitignore`.

---

## Deploy na Vercel

> Nada foi publicado automaticamente. Os passos abaixo são para quando você decidir publicar.

### 1. Repositório no GitHub

```bash
git remote add origin git@github.com:<owner>/<repo>.git
git push -u origin main
```

### 2. Token do GitHub (fine-grained)

GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → *Generate new token*:

- **Repository access:** *Only select repositories* → apenas este repositório.
- **Permissions → Repository → Contents: Read and write**. Nenhuma outra permissão é necessária (Metadata: read-only é incluída automaticamente).
- Defina uma data de expiração e renove antes de vencer.

Se o branch tiver regras de proteção que exigem pull request, os commits do admin serão recusados. Use um branch sem essa exigência ou ajuste a regra.

### 3. Projeto na Vercel

1. *Add New → Project* e importe o repositório. O framework é detectado como Next.js.
2. Em *Settings → Environment Variables* (Production), defina:
   `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `CONTENT_DRIVER=github`, `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`, `NEXT_PUBLIC_SITE_URL`.
3. Faça o deploy. A cada commit no branch configurado, a Vercel publica automaticamente.

---

## Como adicionar uma publicação

1. Acesse `/admin` e entre.
2. **Nova publicação** → escolha categoria, título e resumo (apenas o que a publicação original apresenta) e, opcionalmente, o link.
3. Confira a pré-visualização do card.
4. Ative **Publicada** para exibir no site e **Criar publicação**.

## Como gerenciar categorias

1. Acesse `/admin/categories`.
2. **Nova categoria** → nome, ícone (com prévia) e ordem. O slug é gerado automaticamente.
3. A categoria passa a aparecer no campo **Categoria** das publicações. No site, o filtro surge quando houver ao menos uma publicação publicada nela.
4. Para excluir, mova antes as publicações da categoria; o painel mostra quantas são e leva à lista filtrada.

Em produção, cada criação, edição, reordenação ou exclusão gera um commit e um deploy, como as publicações.

## Como adicionar a foto de uma publicação

1. Abra a publicação em `/admin/posts`.
2. **Escolher imagem** → selecione o arquivo. A pré-visualização muda para o card com foto.
3. **Salvar alterações**.

Em produção, a imagem entra no mesmo commit do `posts.json` e aparece no site após o deploy.

---

## Segurança — resumo

- Segredos apenas no servidor; nenhuma variável sensível com `NEXT_PUBLIC_`.
- Senha com hash `scrypt`; sessão assinada; cookie HttpOnly/Secure/SameSite.
- Todas as mutações verificam a sessão no servidor, não só na interface.
- As Server Actions do Next.js validam `Origin` × `Host` (proteção contra CSRF).
- Entradas validadas com Zod; links apenas `https`.
- Uploads verificados por conteúdo, re-encodados e salvos com nome gerado.
- Controle de concorrência por SHA; conflitos nunca sobrescrevem dados.
- Cabeçalhos: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`; `/admin` com `noindex` e `no-store`.

---

## Troubleshooting

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| “O acesso administrativo ainda não foi configurado” | Faltam `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` ou `SESSION_SECRET` (≥ 32) | Defina as variáveis e reinicie |
| Senha correta recusada | Hash colado com aspas ou espaço, ou gerado para outra senha | Gere de novo com `npm run hash-password` e cole sem aspas |
| “Muitas tentativas” | Rate limit de login | Aguarde 15 min ou reinicie o servidor local |
| “Configure CONTENT_DRIVER=github” | Driver local rodando na Vercel | Use `CONTENT_DRIVER=github` em produção |
| “GitHub recusou o acesso (401/403)” | Token expirado, sem acesso ao repo ou sem *Contents: Read and write* | Gere novo token fine-grained |
| “Alterado por outra sessão” | Outro commit mudou `posts.json` | Clique em **Recarregar** e refaça a alteração |
| “Esta categoria possui N publicações” | Exclusão de categoria em uso | Mova as publicações para outra categoria antes |
| Alteração salva não aparece no site | Deploy ainda em andamento | Acompanhe o deploy na Vercel |
| Imagem nova não aparece no admin em produção | O arquivo só é servido após o deploy | Aguarde o deploy terminar |
| Build falha em `posts.json` | JSON editado manualmente ficou inválido (ex.: `categoryId` inexistente) | Corrija o campo indicado pelo Zod |
