# Sistema visual — Pulso

Derivado de uma referência editorial: fundo verde-oliva, painel de papel, cartão
branco. Serifada de livro nos títulos, monoespaçada em caixa alta nos rótulos.

**Uma superfície só, clara.** Sem modo escuro. A cena de uso é um corredor de
escola de dia, no celular, entre duas aulas — não um editor de código à noite.

## Superfícies

Três, sempre nesta ordem de profundidade:

| Token | Cor | Onde |
|---|---|---|
| `--oliva` | `#363b1d` | Moldura: barra lateral, navegação do celular |
| `--oliva-fundo` | `#2c3017` | Fundo da página, atrás da moldura |
| `--papel` | `#f2f1ea` | Fundo do conteúdo |
| `--papel-2` | `#e2e1d9` | Painel secundário: blocos de texto pronto, gráficos |
| `--branco` | `#ffffff` | Cartão |

Cartões não têm borda. A diferença de superfície faz o trabalho.

## Tinta

| Token | Cor | Contraste |
|---|---|---|
| `--tinta` | `#17150f` | 18.3:1 no branco |
| `--tinta-2` | `#57544b` | 7.6:1 no branco · 6.7:1 no papel |
| `--regua` | `#d7d5cb` | fio de separação, nunca texto |

## Etiquetas

Sólidas, pequenas, saturadas — uma por tipo de decisão. Todas validadas em AA.

| Cor | Hex | Texto | Contraste | Decisão |
|---|---|---|---|---|
| terracota | `#94512c` | branco | 6.05:1 | Recuperar |
| ocre | `#d9a62c` | tinta | 8.21:1 | Abrir o que não existe |
| azul | `#8fbcdd` | tinta | 9.04:1 | Corrigir a comunicação |
| oliva | `#363b1d` | branco | 11.67:1 | Destravar · Estrutural |
| verde | `#4f7f36` | branco | 4.75:1 | Não mexer · estado resolvido |

## Tipografia

**Newsreader** para títulos e prosa. Serifada de livro — a escola é papel, e o
comprador é professor. Escala: 52px na saudação, 38px em título de página, 30px
em título de decisão, 22px em painel, 17px em prosa.

**IBM Plex Mono** para rótulos, números, datas e medidas. Sempre em caixa alta e
espaçada quando é rótulo (`.rotulo`, 11px, `letter-spacing: 0.1em`). Nunca em prosa.

A mono é o sistema de etiquetagem — o que nomeia, nunca o que narra.

## Gráfico

Azul `#2f6d9e` e terracota `#94512c`. O oliva da marca **não serve para série**:
contra a terracota ele dá ΔE 2.1 em daltonismo protan, ou seja, a mesma cor.
Ele fica na moldura.

Validado sobre papel branco: CVD ΔE 17.1 · visão normal ΔE 20.1 · contraste ≥3:1.

Cor nunca carrega significado sozinha. A série "evitável" é tracejada; o dia em
alerta ganha marcador `▲`; todo gráfico traz uma tabela invisível para quem usa
teclado ou leitor de tela.

## Motivo gráfico

Um anel de pontos, alguns preenchidos de verde. Carrega informação — quantas
decisões da semana já foram resolvidas — e volta no estado vazio, com nenhum
preenchido. Vem direto da referência.

## Regras

- Fio fino em vez de caixa. Listas separam linhas com `border-b`, não com card.
- Nunca aninhar cartão dentro de cartão.
- Nada de tipo abaixo de 12px, exceto o rótulo mono a 11px.
- Nada de glifo Unicode fazendo papel de ícone: as marcas são SVG desenhado.
- Medida de leitura entre 52 e 62 caracteres.
