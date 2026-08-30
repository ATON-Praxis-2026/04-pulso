# Pulso

> Tudo o que chega no WhatsApp da secretaria, virado em decisão.

Colégio K-12 privado. Lê 100% das conversas com as famílias e entrega ao diretor
as decisões que só ele pode tomar — antes da rematrícula, não depois.

**O que o produto não faz:** não fala de receita perdida, não persegue lead, não
avalia atendente, não envia mensagem por ninguém, não prevê evasão.

Lê 100% das conversas, decide o que importa e entrega ao gestor da escola as
decisões que só ele pode tomar. Não é caixa de entrada, não é chatbot, não
responde por ninguém.

## Rodar

```bash
npm install
npm run seed     # massa sintética com padrão plantado (~290 conversas, 3 meses)
npm run dev      # http://localhost:3000
```

O dashboard funciona **sem chave de API** — a massa vem com análise de base,
marcada `origem = 'seed'` no banco e rotulada como tal na tela. A procedência
fica visível, nunca escondida.

```bash
cp .env.example .env.local     # ANTHROPIC_API_KEY (+ ANTHROPIC_WORKSPACE_ID se a chave for identity-linked)
npm run analisar               # 1 chamada por conversa, saída estruturada
npm run analisar -- 42         # só a conversa 42
```

## As telas

| | |
|---|---|
| **A semana** (`/`) | A saudação, o que melhorou, três decisões com botão, e a mensagem que saiu no WhatsApp num expansível |
| **Decisões** | O que só o gestor decide, ordenado por dinheiro em jogo e alcance |
| **Os números** | KPIs e gráficos, fora do caminho principal |
| **Pessoas** | Alunos com sinal e interessados sem retorno, cada linha com o trecho literal |
| **Temas e desejos** | O que mais dói, o texto pronto para publicar, e o que pedem e não existe |
| **Operação** | Primeira resposta por dia e por hora, volume que não precisava existir |
| **Conversas** | Busca e filtros sobre tudo — é onde se confere qualquer afirmação |
| **Como funciona** | A metodologia, fora do caminho de quem só quer decidir |

## A ideia central: pessoa é tarefa, padrão é decisão

Uma pessoa com um problema vai para a secretaria — o gestor não precisa ver.
Várias pessoas com a mesma causa vira **movimento**, e isso só ele decide.
A pessoa não some: ela vira a evidência do movimento.

Os movimentos são **lista fechada** de seis. Se você pedir a um modelo para dizer
"o que o gestor deve fazer", ele escreve *"melhorar a comunicação e acompanhar de
perto"* — horóscopo. O modelo só classifica cada conversa; o movimento nasce de
uma contagem, em `lib/analytics.ts`.

| Movimento | Dispara quando |
|---|---|
| Corrigir a comunicação | um tema passa de 12 contatos no mês |
| Abrir o que não existe | 4+ pedidos do que a escola não oferece |
| Destravar a operação | um dia da semana demora 1,5× a média |
| Mudar algo estrutural | 2+ alunos sinalizam pela mesma causa |
| Recuperar | interessados sem retorno |
| Não mexer | 4+ elogios no mês |

## Os dois tipos de sinal

Metade do produto não precisa de IA, e é a metade que nunca falha.

**Comportamento (SQL, em `scripts/seed.mjs`)**

| Sinal | Regra |
|---|---|
| `ultima_palavra_do_aluno` | Última mensagem é do aluno, sem resposta há > 24h **úteis** |
| `promessa_nao_cumprida` | A escola disse "vou verificar e te aviso" e nunca voltou |
| `silencio` | Contato regular (cadência ≤ 12 dias) parado há ≥ 21 dias |

Horas **úteis**, nunca corridas: sexta 18h → segunda 9h são 63h corridas sem que
ninguém tenha errado. Contando corrido, toda segunda chegaria cheia de falso
positivo e o alerta viraria ruído em duas semanas.

Um `"obrigada!"` no fim da conversa **não** é pendência. Sem essa regra a primeira
calibração marcou 116 falsos positivos de uma vez.

**Conteúdo (LLM)** — `pediu_trancamento`, `reclamacao_repetida`,
`dificuldade_financeira`, `comparou_concorrente`, `frustracao_explicita`,
`pergunta_repetida`. Caem na mesma tabela `sinais`, então pontuar é somar.

## Regras que não se negociam

- **Evidência obrigatória e verificada.** Todo sinal carrega o trecho literal, e o
  código confere que o trecho existe na conversa antes de gravar. Sem isso,
  "evidência obrigatória" seria só uma frase no prompt.
- **Tempo nunca passa pelo LLM.** O transcript enviado não tem timestamps.
- **Limiar, não ranking.** Se ninguém cruzar o limiar, o resumo chega vazio — e é
  isso que faz o gestor confiar quando alguém aparece.
- **Nunca por pessoa.** O gargalo aparece por dia e por horário. Software que
  dedura funcionário não entra na escola.
- **Nunca "vai sair".** Sempre "deu sinal". Reconhece padrão, não prevê.

## Configuração

Tudo o que é específico de um cliente está em [`lib/config.ts`](lib/config.ts):
temas, pesos, limiar, expediente, teto. O código não sabe o que é uma escola —
trocar de segmento é copiar o arquivo e mudar ~10 linhas.

## WhatsApp ao vivo

```bash
docker compose up -d
# http://localhost:8080/manager → criar instância → ler o QR code
```

**Chip descartável.** Baileys é WhatsApp Web não oficial e ban acontece.

O banco é o centro: sinais, análise e telas leem dele e não sabem de onde a
mensagem veio. O Evolution é um alimentador entre outros — se cair, troca-se o
alimentador e o produto continua de pé.

Na demo a conversa está **aberta** e o gatilho por inatividade não dispara:

```bash
curl -X POST localhost:3000/api/analisar -H 'content-type: application/json' -d '{}'
```

## Padrões plantados na massa

`scripts/seed.mjs` é determinístico — mesma saída toda vez.

- **Marina Souza** — pediu trancamento e ninguém respondeu
- **Pedro Lima** — reclamou do horário três vezes no mês
- **Ana Ribeiro** — escrevia toda semana e parou há 25 dias
- **Juliana Castro** — perguntou do certificado três vezes
- **Rafael Monteiro** — a escola prometeu retorno e não voltou *(o sinal que "sem resposta" perde)*
- **5 interessados** sem retorno — R$ 41 mil parados
- **Reposição de aula** — 40 conversas, 40 redações diferentes *(o teste de consolidação)*
- **Turma às 19h** — pedida 7 vezes no mês e não existe *(o desejo)*
- **Segunda-feira** — 5,5h úteis até a primeira resposta contra 2,8h nos outros dias
- **Material didático** — caiu de 27 para 4 *(dá ao resumo um positivo verdadeiro)*

## Estrutura

```
lib/config.ts        temas, pesos, limiar, expediente — tudo do cliente
lib/viz.ts           paleta de dados validada (CVD, contraste)
lib/schema.sql       6 tabelas
lib/queries.ts       pontuação, temas, desejos, positivos
lib/analytics.ts     KPIs, séries, gargalo e o motor de movimentos
lib/prompt.ts        system prompt + JSON schema da saída
scripts/seed.mjs     massa sintética + sinais de comportamento (SQL)
scripts/analisar.mts análise por LLM, 1 chamada por conversa
components/charts.tsx  gráficos em SVG, sem biblioteca
app/                 7 telas
app/api/             webhook do Evolution · analisar agora
```


## Sistema visual

Ver [DESIGN.md](DESIGN.md). Resumo: moldura verde-oliva, conteúdo em papel,
cartão branco. Newsreader nos títulos, IBM Plex Mono nos rótulos em caixa alta.
Etiqueta sólida colorida por tipo de decisão. Uma superfície só, clara — a cena
de uso é um corredor de escola de dia, não um editor de código à noite.


## Os três blocos e a consequência

**1. Quem parou de falar.** A família regular que sumiu. Zero ocorrências, zero
reclamações — invisível para qualquer sistema que dispare em evento. É o único
sinal que nenhum concorrente vê, e por isso tem vaga garantida no resumo mesmo
quando não é a de maior pontuação.

**2. Quem ficou no ar.** Perguntou e ninguém respondeu, ou ouviu "vou verificar
e te aviso" e ninguém voltou. O segundo caso é o mais grave: a escola respondeu,
só não cumpriu.

**3. O que se repetiu.** 25 famílias dizendo a mesma coisa com 25 palavras
diferentes. Vem com o texto pronto — é o único movimento que faz o mês seguinte
ter menos trabalho que o atual.

**A consequência: volte e avise.** Quando o diretor marca uma decisão como
resolvida, o Pulso devolve na semana seguinte a lista de quem tinha reclamado
daquilo, com o aviso escrito. É o único movimento que **mexe** na experiência da
família em vez de medi-la.

## O relógio é a rematrícula

Não existe SLA inventado. A régua é a data que já está na vida do diretor:
*faltam 2 meses*. Configurada em `lib/config.ts`.

## Provar que o agente funciona

```bash
npm run avaliar              # tudo
npm run avaliar -- --rapido  # pula o teste de estabilidade (5× por caso)
```

Não prova que o Pulso reduz evasão — isso exige um semestre, coorte e grupo de
controle, e não prometemos. Prova que **o agente acerta, sabe dizer não, é
estável e nunca inventa uma citação.**

Metade dos casos em `avaliacao/casos.ts` são **armadilhas**: conversas escritas
para fazer o modelo disparar quando não deveria. "Preciso que a Júlia saia mais
cedo hoje" tem a palavra sair. "A gente saiu da escola anterior, aqui vocês são
muito mais presentes" cita outra escola. Um detector testado só com casos
positivos mede vontade de acertar, não acurácia.

Resultado da última execução, sobre `claude-opus-5`:

| | |
|---|---|
| Precisão · cobertura | 100% · 100% |
| Armadilhas recusadas | 8 de 8 |
| Estabilidade | 5 de 5 execuções idênticas |
| Evidência literal | 30/30 citações existem na conversa |
| Famílias plantadas encontradas | 5 de 5 |
| Ruído | 3 de 45 famílias normais cruzaram o limiar (7%) |
| Antecedência | sinal mais recente 66 dias antes da rematrícula |

Duas regras do prompt nasceram de falhas que esta avaliação pegou: a fronteira
entre `desempenho_e_boletim` e `comunicacao_e_avisos`, e o fato de que uma
comparação favorável a esta escola é elogio, não sinal de risco.
