---
status: accepted (publicação e commit manual substituídos pelo ADR 0002)
---
# Conteúdo do site em Markdown e JSON versionados em `content/`

O conteúdo editável do site (livros, sobre, contato, blog) fica em arquivos versionados no repositório: um Markdown com frontmatter por livro (`content/books/<slug>.md`), e JSON para os dados únicos (`content/about.json`, `content/contact.json`). Não há CMS nem backend; o site é exportado de forma estática e publicado na Netlify. Um futuro app desktop de gestão de conteúdo grava direto nesses arquivos, e o commit/push continua manual.

## Considered Options

- **Arquivos `.js`/`.ts` com objetos exportados** (formato anterior): fáceis de editar à mão, mas um programa só consegue alterá-los com uma biblioteca de AST, que reformata o arquivo e quebra com template literals. Também gerou duplicação `.js`/`.ts` em `public/data/`.
- **Um único `.json` por coleção**: simples para o app, mas as sinopses longas viram strings escapadas em uma linha, ruins para edição manual e para diffs.
- **CMS headless ou API remota**: resolveria a edição, mas adiciona serviço, custo e autenticação para um site de uma única autora.

## Consequences

- O formato é o contrato com o app desktop: mudar o esquema do frontmatter exige atualizar o app.
- A leitura usa `fs`, então só pode rodar em build time (`getStaticProps`), nunca em componentes renderizados no cliente.
- Arquivos de conteúdo não são validados pelo compilador; a validação fica em `lib/` (campos obrigatórios com erro claro).
