---
status: accepted
---
# App de gestão publica pelo GitHub Actions, não pela Netlify

O App de gestão (desktop, TypeScript/Electron) grava o Conteúdo em `content/` e `public/images/`, cria Versões salvas localmente e, na Publicação, envia para `master`. Um workflow do GitHub Actions roda testes e build e só então faz o deploy com a CLI da Netlify. O build automático da Netlify é desligado: o workflow passa a ser o único caminho para o ar. Isso substitui a frase do ADR 0001 de que o commit/push continua manual.

O app embute o git (sem exigir git instalado) e autentica a autora no GitHub uma única vez; o token fica no cofre do sistema. O código do app vive neste repositório em `desktop/`, e o esquema do Conteúdo é um módulo compartilhado entre o site e o app, para que o contrato não se desencontre.

## Considered Options

- **Push direto com a Netlify construindo em paralelo**: mais simples, mas nada impede que Conteúdo inválido derrube o site, e o build da Netlify não roda testes.
- **Branch de conteúdo com PR e preview a cada Publicação**: mais seguro, mas coloca um passo de revisão que a autora não precisa.
- **Tauri com backend em Rust**: instalador pequeno, mas obriga a duplicar os validadores em Rust e eles divergem do esquema do site.
- **Repositório separado para o app**: isola o app, mas duplica ou publica o esquema como pacote, e uma mudança de esquema deixa de caber em um único commit.

## Consequences

- Falha de build na Publicação deixa o site anterior no ar; o app precisa traduzir a falha para a autora em linguagem simples.
- Exige dois segredos no repositório (token e id do site da Netlify) e desligar o build automático no painel da Netlify.
- O workflow precisa de filtros de caminho para que mudança só no app não republique o site (e o contrário).
- Instalador do Electron é grande (100 MB ou mais); aceito por haver uma única usuária.
- Imagens são redimensionadas na importação para manter o repositório pequeno.
