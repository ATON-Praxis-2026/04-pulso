# Sistema visual — Pulso

Blocos de cor sólida sobre preto, raio generoso, monoespaçada como voz
principal. A cor não decora: ela diz o que o bloco é.

**Uma superfície só, clara sobre fundo escuro.** O preto é o vão entre os
cartões, nunca o fundo de leitura.

## Superfícies

| Token | Cor | Onde | Texto |
|---|---|---|---|
| `--preto` | `#0d0d0d` | fundo da página e vãos | creme, 19.4:1 |
| `--creme` | `#f5f1e8` | superfície padrão | tinta, 16.0:1 |
| `--coral-claro` | `#f5c0a8` | pede atenção sem gritar | tinta, 11.2:1 |
| `--coral` | `#f4633a` | o que não espera — usar pouco | tinta, 5.8:1 |
| `--azul` | `#c5d0e6` | o que se corrige | tinta, 11.6:1 |
| `--verde-claro` | `#c8e6a0` | o que está bom, e o que volta | tinta, 13.1:1 |
| `--verde` | `#4e7a5c` | profundidade | branco, 4.9:1 |
| `--tinta` | `#181613` | texto sobre superfície clara | |
| `--tinta-2` | `#6b665c` | texto secundário | |

Raio de 20px em tudo. Cartões não têm borda — a diferença de superfície faz o
trabalho.

**Cuidado que já queimou duas vezes:** o `<body>` tem cor de texto para o fundo
preto. Todo cartão claro precisa declarar a sua (`text-[var(--tinta)]`), senão
o texto sai creme sobre creme e some.

## Tipografia

**Space Mono** carrega a identidade: títulos, rótulos, números, navegação,
botões. Rótulo do sistema em caixa alta com `letter-spacing: 0.14em`.

**Newsreader** só onde há parágrafo para ler — as citações das famílias, os
rascunhos, os textos prontos. Mono em prosa longa cansa a vista.

Carregadas por `<link>` no `<head>`, não por `next/font`: o pipeline do
Turbopack quebra a resolução do módulo interno, e a fonte aqui é a identidade.

## Cor por tipo de decisão

| Decisão | Cor do cartão |
|---|---|
| Voltou (reincidência) | coral — é o mais caro que existe |
| Volte e avise · Não mexer | verde claro |
| Corrigir | azul |
| Estrutural | coral claro |
| Destravar · Avaliar | creme |

O selo `não espera segunda` é preto sobre a cor do cartão, em qualquer um deles.

## Gráfico

Azul `#2f6d9e` e coral escuro `#c2451a`, validados sobre o creme:
CVD ΔE 18.5 · visão normal ΔE 26.5 · contraste ≥3:1.

Cor nunca carrega significado sozinha: a série evitável é tracejada, o dia em
alerta ganha marcador, e todo gráfico traz uma tabela invisível para teclado e
leitor de tela.

## Regras

- Nada de tipo abaixo de 12px, exceto o rótulo mono a 11px.
- Nada de glifo Unicode fazendo papel de ícone — as marcas são SVG desenhado.
- Medida de leitura entre 52 e 62 caracteres.
- Nunca aninhar cartão dentro de cartão com a mesma cor.
