# Publicação do site pelo GitHub Actions

Decisão: ADR 0002. O workflow `.github/workflows/publish-site.yml` roda a cada push em `master`:
testes, build e, só se ambos passarem, deploy com a CLI da Netlify. Se qualquer passo falhar, o
deploy não acontece e o site anterior continua no ar.

## Pré-requisitos (issue #44)

- Segredos do repositório (Settings > Secrets and variables > Actions): `NETLIFY_AUTH_TOKEN` e `NETLIFY_SITE_ID`.
- Build automático da Netlify desligado, depois de validar este pipeline.

## Filtros de caminho

| Mudança em | Publica o site | Roda testes do app |
|---|---|---|
| somente `desktop/**` | não | sim |
| somente `docs/**` ou `*.md` | não | não |
| `content/**`, `public/**`, código do site | sim | não |
| `shared/**` | sim | sim |

## Verificação manual

1. Conteúdo válido: edite o texto de `content/site.json`, faça push em `master`. Em Actions, o
   workflow "Publish site" passa e a alteração aparece no site.
2. Conteúdo inválido: remova um campo obrigatório de `content/books/<slug>.md` (ex.: `title`) e
   faça push. O workflow falha no Build, nenhum deploy ocorre e o site anterior continua no ar.
   Reverta o commit depois.
3. Filtro, app: altere só um arquivo em `desktop/`. "Publish site" não deve disparar;
   "Desktop tests" deve.
4. Filtro, site: altere só `content/site.json`. "Desktop tests" não deve disparar.
5. Resultado pela API: `gh run list --workflow publish-site.yml --limit 1 --json status,conclusion`.
