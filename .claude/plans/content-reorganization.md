# Plano: reorganização dos arquivos de conteúdo

Status: APROVADO, NÃO IMPLEMENTADO. Implementar somente após "go" explícito.

## Objetivo
Eliminar a duplicação .js/.ts em `public/data/` e adotar um formato de conteúdo simples,
editável à mão e compatível com um futuro app desktop de gestão de conteúdo.

## Decisões (todas aprovadas)
| # | Decisão |
|---|---------|
| 1 | Remover dados órfãos (Intro, HopeWriter, Testimonials) e todos os `.js` duplicados |
| 2 | Conteúdo sai de `public/data/` para `content/` |
| 3 | Livros: um `.md` por livro em `content/books/<slug>.md` (frontmatter + corpo = sinopse) |
| 4 | `about` e `contact`: `content/about.json` e `content/contact.json` |
| 5 | `linkAmazon`/`linkUiclap` viram `links: [{ label, url }]` |
| 6 | Reviews placeholder removidas; `reviews` opcional (default `[]`); a UI já trata lista vazia |
| 7 | Capas em `public/images/books/`; campo `image` explícito no frontmatter |
| 8 | `DataStore` renomeado para `books`; `id` e `direction` derivados em `lib/books.ts`, `slug` = nome do arquivo |
| 9 | Persistência do app desktop: grava direto nos arquivos do repo (commit/push manual) |
| 10 | Q9: `pages/index.tsx` ganha `getStaticProps`; `Books` e `UltimoLancamento` recebem `books` por props |
| 11 | Edições 2ª reutilizam a capa da 1ª (mesmo arquivo de imagem, sem duplicar) |

## Estrutura alvo
```
content/
  books/
    amor-nos-tempos-de-quarentena.md
    amor-nos-tempos-de-quarentena-2a-ed.md
    contronicas-historias-amorfas-de-quarentena.md
    contronicas-historias-amorfas-de-quarentena-2a-ed.md
  about.json
  contact.json
  blog/            (inalterado)
public/images/books/   (capas movidas de session03/)
```

Exemplo de livro:
```
---
title: "..."
releaseDate: "2021-05-01"
slogan: "..."
image: "/images/books/amor-nos-tempos-de-quarentena.png"
links:
  - { label: "Amazon", url: "https://..." }
  - { label: "Uiclap", url: "https://..." }
---
Sinopse em markdown...
```

## Tipos (`types/index.ts`)
- `BookLink { label: string; url: string }`
- `Book`: remover `linkAmazon`, `linkUiclap`; adicionar `links: BookLink[]`; `id` e `direction` continuam no tipo (derivados, nao armazenados); `reviews: Review[]`.
- `AboutData`, manter `ContactData`.
- Remover `BannerItem`, `TestimonialItem` (sem uso apos a limpeza).

## Passos (TDD, commits atomicos)
1. **Testes primeiro (red)**
   - `__tests__/lib/books.test.ts`: lê `.md` reais; slug vem do arquivo; `id` estavel; `direction` alterna por indice; `links` default `[]`; `reviews` default `[]`; ordenacao por data; livro inexistente -> null; frontmatter invalido falha com mensagem clara.
   - `Countdown`, `BookCard`, `BookCover`: trocar props `linkAmazon/linkUiclap` por `links`; rotulo vem de `label`; lista vazia nao renderiza botoes.
   - `Books`, `UltimoLancamento`, `index`: recebem `books` por props.
   - `slug.test.tsx`: mockBook com `links`.
2. **lib/books.ts**: ler `content/books` com `fs` + `gray-matter` (mesmo padrao de `lib/blog.ts`); validar campos obrigatorios (title, releaseDate, image); derivar `id` e `direction`. Extrair helper compartilhado de leitura de frontmatter se reduzir duplicacao com `lib/blog.ts`.
3. **lib/site.ts** (ou similar): `getAbout()` e `getContact()` lendo os `.json`.
4. **Migracao de conteudo**: criar os 4 `.md` (descricao completa vai no corpo, sem reviews placeholder); criar os 2 `.json`; mover capas com `git mv`.
5. **Componentes e paginas**
   - `BookCard`, `Countdown`: renderizar `links.map`.
   - `Books`, `UltimoLancamento`: aceitar `books`/`book` por props; `UltimoLancamento` continua `ssr: false` por causa do Countdown.
   - `pages/index.tsx`: `getStaticProps` chama a lib e passa `books`, `about`, `contact`.
   - `pages/livros/[slug].tsx`: passar `links`.
   - `About`, `Contact`, `Footer`: receber dados por props em vez de import estatico (Footer tambem aparece em `/livros/[slug]` e `/blog`, entao cada `getStaticProps` precisa fornecer `contact`; avaliar helper unico).
6. **Limpeza**: apagar `public/data/`; remover `pages/components/` e `pages/store/` legados (JS do site antigo). Remocao CONFIRMADA pelo usuario. Fazer em commit proprio (`chore: remove paginas do site antigo`). Antes, `grep` para garantir que nada fora delas as importa; remover tambem dependencias que ficarem sem uso (ex.: NextUI, slider) apenas se confirmado.
7. **Docs**: atualizar `CLAUDE.md` (secao Content Management e arquitetura estao desatualizadas); manter `GLOSSARY.md`.
8. **Verificacao**: `npm test`, `npm run lint`, `tsc --noEmit`, `npm run build` (confirma que `fs` nao vaza para o bundle cliente) e `npm run app` (export estatico).

## ADR
Escrito: `docs/adr/0001-conteudo-em-markdown-e-json-versionados.md` (status accepted).

## Riscos e pontos abertos
- `pages/components/` e `pages/store/` (site antigo) viram rotas Next; remocao confirmada, ver passo 6. Verificar se `/store` e linkada em Header/Footer/netlify redirects antes de apagar.
- Footer em varias paginas: todas as paginas que o usam precisam de `getStaticProps` com `contact`.
- Campo `image` com extensoes diferentes (png/jpg) por isso explicito.
- Descricao em Markdown no corpo: renderizar como texto simples hoje; se o app desktop permitir markdown rico, sera preciso renderizador (fora do escopo).
- Datas: `releaseDate` como string ISO; o gray-matter pode converter datas YAML sem aspas em `Date`; sempre usar aspas ou normalizar na lib.
