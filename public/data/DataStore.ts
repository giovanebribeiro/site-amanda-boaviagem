import type { Book } from "@/types";

interface DataStoreType {
  items: Book[];
}

const DataStore: DataStoreType = {
  items: [
    {
      id: 1,
      title: "Amor nos Tempos de Quarentena - Amanda Boaviagem",
      description:
        "Amor e Morte andam lado a lado. O dia a dia da jovem médica Manuela no hospital em que trabalha em tempos de pandemia do Covid19. Flashes de um passado não tão distante mas feliz, a lua de mel dela e Pedro na Riviera Maya, nas cálidas águas do Caribe. O medo e a insegurança que sente ao ter de encarar a pandemia sozinha. O marido preso em outro país sem poder voltar ao Brasil. Amizades, sonhos, descobertas. Uma luz em sua vida quando tudo parecia perdido. Um antídoto para a pandemia? Acompanhe Manuela nesses tempos difusos (e confusos) em que a verdade é desmentida e o que era solução se torna problema. Sua sanidade mental está sendo posta à prova a todo o momento nessa pandemia? Manuela está pronta pro jogo e disposta a arriscar tudo. E você? O que você seria capaz de fazer por amor?",
      image: "/images/session03/book1.png",
      linkAmazon:
        "https://www.amazon.com.br/gp/product/B095L64BDN/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B095L64BDN&linkCode=as2&tag=amandaboaviag-20&linkId=6c8777f4c063d10938dc2ffcbe3883d5",
      linkUiclap: "https://loja.uiclap.com/titulo/ua8461/",
      direction: "right",
    },
    {
      id: 2,
      title:
        "Contrônicas: Histórias Amorfas de Quarentena - Amanda Boaviagem, Claudia Assis, Livia Messias e Poliana Costa",
      description:
        "Como você se sente em relação ao covid-19? Quais as dores, medos e inseguranças que isso gerou na sua vida e no seu dia a dia? Nas \"Contrônicas: Histórias Amorfas de Quarentena\" o herói, ou melhor os heróis e heroínas, somos todos nós, pessoas comuns, na nossa luta diária pra vencer os desafios que essa pandemia que chegou sem avisar trouxe. Quem diria que a ida ao mercado seria um acontecimento, por exemplo? Mas o brasileiro é sempre criativo e... Quer saber? Que tal descobrir você mesmo nessas páginas? Talvez você descubra a solidariedade que aflora nas pessoas, apesar de tudo, a esperança e uma luz no fim do túnel. Talvez você descubra VOCÊ.",
      image: "/images/session03/book2.jpg",
      linkAmazon: "",
      linkUiclap: "https://loja.uiclap.com/titulo/ua13180/",
      direction: "left",
    },
    {
      id: 3,
      title:
        "Contrônicas: Histórias Amorfas de Quarentena - Amanda Boaviagem, Claudia Assis, Livia Messias e Poliana Costa (2a Ed.)",
      description:
        "Como você se sente em relação ao covid-19? Quais as dores, medos e inseguranças que isso gerou na sua vida e no seu dia a dia? Nas \"Contrônicas: Histórias Amorfas de Quarentena\" o herói, ou melhor os heróis e heroínas, somos todos nós, pessoas comuns, na nossa luta diária pra vencer os desafios que essa pandemia que chegou sem avisar trouxe. Quem diria que a ida ao mercado seria um acontecimento, por exemplo? Mas o brasileiro é sempre criativo e... Quer saber? Que tal descobrir você mesmo nessas páginas? Talvez você descubra a solidariedade que aflora nas pessoas, apesar de tudo, a esperança e uma luz no fim do túnel. Talvez você descubra VOCÊ.",
      image: "/images/session03/book2.jpg",
      linkAmazon: "",
      linkUiclap: "https://loja.uiclap.com/titulo/ua13180/",
      direction: "left",
    },
    {
      id: 4,
      title: "Amor nos Tempos de Quarentena - Amanda Boaviagem (2a Ed.)",
      description:
        "Amor e Morte andam lado a lado. O dia a dia da jovem médica Manuela no hospital em que trabalha em tempos de pandemia do Covid19. Flashes de um passado não tão distante mas feliz, a lua de mel dela e Pedro na Riviera Maya, nas cálidas águas do Caribe. O medo e a insegurança que sente ao ter de encarar a pandemia sozinha. O marido preso em outro país sem poder voltar ao Brasil. Amizades, sonhos, descobertas. Uma luz em sua vida quando tudo parecia perdido. Um antídoto para a pandemia? Acompanhe Manuela nesses tempos difusos (e confusos) em que a verdade é desmentida e o que era solução se torna problema. Sua sanidade mental está sendo posta à prova a todo o momento nessa pandemia? Manuela está pronta pro jogo e disposta a arriscar tudo. E você? O que você seria capaz de fazer por amor?",
      image: "/images/session03/book1.png",
      linkAmazon:
        "https://www.amazon.com.br/gp/product/B095L64BDN/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B095L64BDN&linkCode=as2&tag=amandaboaviag-20&linkId=6c8777f4c063d10938dc2ffcbe3883d5",
      linkUiclap: "https://loja.uiclap.com/titulo/ua8461/",
      direction: "right",
    },
  ],
};

export default DataStore;
