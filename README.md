# site-amanda-boaviagem
[![Netlify Status](https://api.netlify.com/api/v1/badges/198c8a6e-b87c-49d0-809d-ff81959891df/deploy-status)](https://app.netlify.com/sites/epic-pare-6a511b/deploys)

Projeto referente ao site da escritora Amanda Boaviagem. 

## Dependências/stack:

* Node.JS 16+
* React 18
* Next JS 14+

Após o clone do projeto, instalar as dependências:

`$ npm install`

## Executando a aplicação

```shell

# Executar a aplicação local (acessar http://localhost:3000)
$ npm run dev

# Executar apenas o lint
$ npm run lint

# Preparando a aplicação para deploy (Aplicação estará disponível na pasta out/)
$ npm run build

# Executando a aplicação local com compilação otimizada para produção (acessar http://localhost:3000)
$ npm run start

# Executando procedimentos de release, changelog, etc.
$ npm run release

```

## Gerenciamento de conteúdo

Todo o conteúdo editável fica na pasta `content/`. A pasta `public/` guarda apenas imagens.

```
content/
  books/<slug>.md   um livro por arquivo (o nome do arquivo vira a URL /livros/<slug>)
  about.json        seção "Sobre"
  contact.json      Instagram e e-mail
  blog/             posts em MDX
```

### Adicionar um livro

1. Coloque a capa em `public/images/books/`.
2. Crie `content/books/<slug>.md`. O cabeçalho (frontmatter) guarda os dados curtos e o corpo do arquivo é a sinopse:

```md
---
title: "Título do livro"
releaseDate: "2021-05-01"
slogan: "Frase de destaque"
image: "/images/books/capa.png"
links:
  - { label: "Amazon", url: "https://...", primary: true }
  - { label: "Uiclap", url: "https://..." }
---
Texto da sinopse, em texto corrido.
```

- Obrigatórios: `title`, `releaseDate` (sempre entre aspas, `AAAA-MM-DD`) e `image`.
- Opcionais: `slogan`, `links` (lista de `label` e `url`, quantos forem necessários) e `reviews` (lista de `author` e `text`).
- `id` e o lado da capa na lista são calculados automaticamente.
- Uma 2ª edição é um livro separado, que pode reutilizar a mesma imagem de capa.
- Se um arquivo estiver com campo obrigatório faltando ou inválido, o build falha com uma mensagem indicando o arquivo e o campo.

### Sobre e Contato

Edite `content/about.json` (`title`, `body`, `body2`, `image`) e `content/contact.json` (`instagram`, `instagramUrl`, `email`).

**OBS:** Extensão preferencial de qualquer imagem: *SVG*.
