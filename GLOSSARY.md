# Glossário

**Livro**: obra publicada (ou a publicar) pela autora, exibida no site com capa, sinopse, slogan e data de lançamento. Cada livro tem um arquivo de conteúdo próprio.

**Edição**: versão de um livro (ex.: 2ª edição). Cada edição é um Livro separado no site, com seu próprio slug.

**Link de compra**: endereço de uma loja onde um Livro pode ser comprado, com um rótulo (ex.: "Amazon"). Um Livro tem zero ou mais.

**Sinopse**: texto descritivo longo de um Livro.

**Último lançamento**: o Livro com a data de lançamento mais recente; ganha destaque na página inicial.

**Conteúdo**: tudo que a autora edita sem mexer em código (livros, sobre, contato, blog). Vive em `content/`.

**Textos do site**: textos gerais editáveis da página (slogan, boas-vindas do Hero, títulos e subtítulos de seção, textos alternativos das fotos). Vivem em `content/site.json`. Rótulos de interface, navegação e aria-labels não entram: ficam no código.

**App de gestão**: aplicativo de desktop usado pela autora para editar o Conteúdo sem tocar em código nem em versionamento. Funciona sem internet para editar e salvar.

**Rascunho**: alterações de Conteúdo feitas no App de gestão que ainda não foram salvas.

**Versão salva**: ponto de restauração criado quando a autora salva seu Rascunho. Fica só no computador dela e não afeta o site.

**Publicação**: envio das Versões salvas para o site no ar. Exige internet e termina com o site atualizado ou com uma falha explicada.

**Em preparação**: marca de um post do blog que a autora ainda está escrevendo. Posts em preparação podem ser salvos e publicados, mas não aparecem no site.
