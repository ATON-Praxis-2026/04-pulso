// Massa sintética de colégio K-12 privado, com padrão plantado de propósito.
// Determinística: mesma saída toda vez, então a demo não muda entre execuções.

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DB_PATH = path.join(ROOT, "data", "pulso.db");
fs.mkdirSync(path.join(ROOT, "data"), { recursive: true });

// Dropar tabelas em vez de apagar o arquivo: se o `next dev` estiver com o banco
// aberto, apagar o arquivo o deixa lendo um inode fantasma e a tela congela.
const db = new DatabaseSync(DB_PATH);
for (const t of ["sinais", "analises", "mensagens", "conversas", "contatos",
                 "textos", "resolvidos", "correcoes", "contexto", "decisoes_estado"])
  db.exec(`DROP TABLE IF EXISTS ${t}`);
db.exec(fs.readFileSync(path.join(ROOT, "lib", "schema.sql"), "utf8"));

let _s = 20261103;
const rnd = () => {
  _s |= 0; _s = (_s + 0x6d2b79f5) | 0;
  let t = Math.imul(_s ^ (_s >>> 15), 1 | _s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));

const HOJE = new Date("2026-08-31T09:00:00");
const iso = (d) => d.toISOString().slice(0, 19).replace("T", " ");
const dias = (d, n) => new Date(d.getTime() + n * 864e5);

function horaComercial(d) {
  const x = new Date(d);
  while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() + 1);
  x.setHours(int(7, 17), int(0, 59), int(0, 59), 0);
  return x;
}

// Uma secretaria de colégio com 500 alunos não responde em uma hora.
// Segunda é a pior: cai em cima o que chegou no fim de semana.
const ATRASO_POR_DIA = { 1: 9.2, 2: 4.3, 3: 3.5, 4: 3.8, 5: 5.7 };

const insContato = db.prepare(
  "INSERT INTO contatos (nome, telefone, tipo, criado_em) VALUES (?, ?, ?, ?)");
const insConversa = db.prepare(
  "INSERT INTO conversas (contato_id, atendente, iniciada_em, ultima_em, encerrada) VALUES (?,?,?,?,1)");
const insMsg = db.prepare(
  "INSERT INTO mensagens (conversa_id, direcao, texto, criada_em) VALUES (?,?,?,?)");
const insAnalise = db.prepare(`INSERT INTO analises
  (conversa_id, origem, resumo, tipo_contato, tema, severidade, evitavel,
   intencao_matricula, sentimento_final, mensagem_sugerida, json_completo, criada_em)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);

const ATENDENTES = ["Cláudia", "Rose", "Marcos", "Bia"];
let _tel = 990000000;

/** Contato é a FAMÍLIA, não o aluno. Dois filhos saindo é uma decisão, não duas. */
function familia(nome) {
  return Number(insContato.run(nome, "5511" + ++_tel, "familia", iso(dias(HOJE, -200))).lastInsertRowid);
}

function conversa(contatoId, inicio, msgs, analise) {
  const t0 = horaComercial(inicio);
  const fator = (ATRASO_POR_DIA[t0.getDay()] ?? 1.5) * (0.6 + rnd() * 0.9);
  let extra = 0;
  const stamps = msgs.map(([dir, , off]) => {
    if (dir === "saida") extra = Math.round((off ?? 0) * (fator - 1));
    return new Date(t0.getTime() + ((off ?? 0) + extra) * 60000);
  });
  const ultima = stamps[stamps.length - 1];
  const id = Number(insConversa.run(contatoId, pick(ATENDENTES), iso(t0), iso(ultima)).lastInsertRowid);
  msgs.forEach(([dir, txt], i) => insMsg.run(id, dir, txt, iso(stamps[i])));
  if (analise) {
    insAnalise.run(id, "seed", analise.resumo ?? "", analise.tipo ?? "duvida",
      analise.tema ?? "outros", analise.severidade ?? 1, analise.evitavel ? 1 : 0, 0,
      analise.sentimento ?? "neutro", analise.sugerida ?? "", JSON.stringify(analise), iso(ultima));
  }
  return id;
}

// ══════════════════════════════════════════════════ PADRÕES PLANTADOS

// 1. A família que parou de escrever. Zero ocorrências, zero reclamações —
//    invisível para qualquer sistema que dispare em evento.
const sofia = familia("Família Sofia Menezes · 4º ano");
for (let s = 24; s >= 4; s -= 2) {
  conversa(sofia, dias(HOJE, -s * 7), [
    ["entrada", pick([
      "Bom dia! A Sofia vai faltar hoje, está com febre",
      "Oi, boa tarde. Tem lição para amanhã?",
      "Bom dia! A reunião de sexta é presencial mesmo?",
      "Oi! A Sofia esqueceu o casaco na sala ontem",
      "Boa tarde, o passeio de setembro já tem valor?",
    ]), 0],
    ["saida", pick(["Bom dia! Já anotei aqui 🙂", "Oi! Sim, tudo certo", "Boa tarde! Vou confirmar e te falo"]), int(20, 200)],
  ], { resumo: "Contato de rotina da família.", tema: "comunicacao_e_avisos",
       tipo: "duvida", severidade: 1, evitavel: false, sentimento: "satisfeito" });
}

// 2. Falou em sair, e ninguém respondeu.
const bruno = familia("Família Bruno Tavares · 8º ano");
conversa(bruno, dias(HOJE, -6), [
  ["entrada", "Boa tarde. Queria conversar sobre a rematrícula do Bruno pro ano que vem", 0],
  ["entrada", "Ele está desanimado com a escola desde o meio do ano e a gente tá pensando em mudar", 3],
  ["entrada", "Tem como marcar um horário com a coordenação?", 5],
], {
  resumo: "Família pede conversa sobre rematrícula e diz que está considerando trocar de escola.",
  tema: "matricula_e_documentos", tipo: "problema", severidade: 5, evitavel: true,
  sentimento: "frustrado",
  sugerida: "Oi! Desculpa a demora. Quero muito ouvir você sobre o Bruno — a coordenação tem horário amanhã às 8h ou quinta às 17h. Qual fica melhor?",
  sinais: [{ sinal: "falou_em_sair", evidencia: "a gente tá pensando em mudar" }],
});

// 3. A escola prometeu retorno e não voltou. "Sem resposta" perde isto:
//    a escola RESPONDEU. Só não cumpriu.
const helena = familia("Família Helena Rocha · 2º ano");
conversa(helena, dias(HOJE, -12), [
  ["entrada", "Oi, bom dia. A Helena chega chorando da escola faz duas semanas", 0],
  ["entrada", "Ela não fala o que houve. Vocês notaram alguma coisa na sala?", 2],
  ["saida", "Bom dia! Vou verificar com a professora e te aviso ainda hoje", 40],
], {
  resumo: "Mãe relata mudança de comportamento da filha e pede que a escola verifique. Secretaria prometeu retorno no mesmo dia e não retornou.",
  tema: "convivencia_e_conflito", tipo: "problema", severidade: 5, evitavel: true,
  sentimento: "neutro",
  sugerida: "Oi! Me desculpa o retorno que prometi e não dei. Falei com a professora e queria te contar pessoalmente — consegue passar aqui amanhã na saída?",
  sinais: [{ sinal: "promessa_nao_cumprida", evidencia: "Vou verificar com a professora e te aviso ainda hoje" }],
});

// 4. Reclamou duas vezes do mesmo, com frustração.
const caio = familia("Família Caio Prado · 6º ano");
conversa(caio, dias(HOJE, -29), [
  ["entrada", "gente, a fila da saída hoje demorou 40 minutos de novo", 0],
  ["saida", "Oi! Desculpa, tivemos um imprevisto no portão hoje", 120],
  ["entrada", "é sempre um imprevisto. toda semana a mesma coisa", 160],
], { resumo: "Reclamação sobre demora na saída, segunda ocorrência.",
     tema: "entrada_e_saida", tipo: "problema", severidade: 3, evitavel: true, sentimento: "frustrado",
     sinais: [{ sinal: "reclamacao_repetida", evidencia: "toda semana a mesma coisa" }] });
conversa(caio, dias(HOJE, -8), [
  ["entrada", "fiquei 35 min na fila hoje. já falei sobre isso duas vezes esse mês", 0],
  ["saida", "Caio, vamos revisar o escalonamento dos horários", 90],
  ["entrada", "espero mesmo. assim fica difícil, eu perco a tarde inteira", 130],
], { resumo: "Terceira reclamação sobre a fila da saída no mesmo mês.",
     tema: "entrada_e_saida", tipo: "problema", severidade: 4, evitavel: true, sentimento: "frustrado",
     sugerida: "Você tem razão e a falha foi nossa. Mudamos o escalonamento a partir de segunda: 4º e 5º saem 10 min antes. Me avisa se melhorar?",
     sinais: [{ sinal: "reclamacao_repetida", evidencia: "já falei sobre isso duas vezes esse mês" },
              { sinal: "frustracao_explicita", evidencia: "assim fica difícil" }] });

// 5. Perguntou a mesma coisa três vezes.
const lara = familia("Família Lara Bittencourt · 1º ano");
for (const [off, txt, resp] of [
  [-34, "Oi! Como faço para ver o boletim parcial da Lara no portal?", "Oi! Vou verificar o acesso e te retorno"],
  [-20, "Voltando aqui sobre o acesso ao portal, consegui não", "Oi! Ainda estamos ajustando, qualquer coisa te aviso"],
  [-5, "gente, é a terceira vez que pergunto do portal. já faz mais de um mês", null],
]) {
  conversa(lara, dias(HOJE, off),
    resp ? [["entrada", txt, 0], ["saida", resp, int(120, 300)]] : [["entrada", txt, 0],
      ["entrada", "eu queria acompanhar as notas dela e não consigo", 2]],
    { resumo: "Pedido de acesso ao portal de notas, repetido.",
      tema: "desempenho_e_boletim", tipo: off === -5 ? "problema" : "duvida",
      severidade: off === -5 ? 4 : 2, evitavel: true,
      sentimento: off === -5 ? "frustrado" : "neutro",
      sugerida: off === -5 ? "Lara, desculpa a demora — seu acesso está liberado e mandei o link no seu e-mail. Se preferir, te mostro pelo telefone agora." : "",
      sinais: off === -5 ? [
        { sinal: "pergunta_repetida", evidencia: "é a terceira vez que pergunto do portal" },
        { sinal: "frustracao_explicita", evidencia: "já faz mais de um mês" }] : [] });
}

console.log("famílias plantadas");

// ══════════════════════════════════════════════════ O TEMA RECORRENTE
// 30 famílias dizendo a mesma coisa com 30 redações diferentes.
// É o teste de consolidação: todas precisam cair no mesmo tema.

const BOLETIM = [
  "só fiquei sabendo que ele tava indo mal no fim do bimestre",
  "tem como avisar antes quando a nota cai? só vi no boletim",
  "descobri as notas do meu filho tarde demais pra ajudar",
  "por que ninguém avisou que ela estava com dificuldade em matemática?",
  "recebi o boletim ontem e foi um susto, nada tinha sido comunicado",
  "queria acompanhar as notas durante o bimestre, tem como?",
  "meu filho foi mal e eu não tinha ideia",
  "vocês avisam quando a nota está baixa ou só no boletim mesmo?",
  "a professora podia ter falado comigo antes do fechamento",
  "tem algum relatório no meio do bimestre?",
  "fui pega de surpresa com a nota de ciências",
  "gostaria de saber antes, pra poder colocar reforço a tempo",
  "não dá pra esperar o boletim pra descobrir que ele não está acompanhando",
  "existe algum aviso quando o aluno tira nota vermelha?",
  "a gente só descobre no fim, aí não dá mais tempo",
  "queria entender por que a dificuldade dela não foi comunicada",
  "o boletim veio com duas vermelhas e ninguém tinha falado nada",
  "tem como a escola avisar no meio do caminho?",
  "só soube na reunião de pais, já era o segundo bimestre",
  "meu marido perguntou se vocês avisam quando cai o rendimento",
  "acompanho pelo caderno mas isso não mostra nota",
  "sinto que sou a última a saber como ele está indo",
  "podiam mandar um parcial, nem que fosse por mensagem",
  "descobri agora que ela está de recuperação, isso vinha de longe",
  "não recebi nenhum aviso sobre o desempenho dele esse bimestre",
  "queria ter sido avisada quando começou a cair",
  "vocês têm boletim parcial? na escola anterior tinha",
  "a nota apareceu no portal mas ninguém me ligou",
  "achei que estava tudo bem até o boletim chegar",
  "como faço pra saber se meu filho está acompanhando a turma?",
];
const RESP_BOLETIM = [
  "Oi! O boletim sai no fim de cada bimestre 🙂",
  "Bom dia! Vou passar para a coordenação pedagógica",
  "Oi! As notas ficam no portal assim que a professora lança",
  "Boa tarde! Pode falar com a professora no horário de atendimento",
];
const NOMES_BOL = ["Família Alice Ferraz · 3º ano","Família Théo Nunes · 7º ano","Família Manu Sales · 5º ano",
  "Família Davi Correia · 1º ano","Família Isis Ramires · 9º ano","Família Otto Klein · 2º ano",
  "Família Nina Barreto · 6º ano","Família Vicente Aguiar · 4º ano","Família Cecília Pontes · 8º ano",
  "Família Rafael Ourives · 3º ano","Família Laís Domingues · 7º ano","Família Enzo Vilela · 5º ano",
  "Família Bia Fagundes · 2º ano","Família Noah Espíndola · 9º ano","Família Olívia Bastos · 6º ano"];
const contatosBol = NOMES_BOL.map(familia);
BOLETIM.forEach((txt, i) => {
  conversa(contatosBol[i % contatosBol.length], dias(HOJE, i < 22 ? -int(2, 29) : -int(31, 58)), [
    ["entrada", txt, 0],
    ["saida", pick(RESP_BOLETIM), int(30, 260)],
    ...(rnd() > 0.6 ? [["entrada", pick(["entendi", "obrigada", "tá bom, obrigada"]), int(280, 420)]] : []),
  ], { resumo: "Família quer saber do desempenho antes do fechamento do bimestre.",
       tema: "desempenho_e_boletim", tipo: "duvida", severidade: 2, evitavel: true,
       sentimento: "neutro" });
});

// ══════════════════════════════════════════════════ O TEMA JÁ CORRIGIDO
// Muita reclamação sobre a fila da saída no bimestre passado. A escola mudou
// o escalonamento. Ninguém avisou as famílias — é o movimento que falta.

const SAIDA = [
  "a fila da saída hoje demorou quase 40 minutos",
  "todo dia a mesma coisa no portão, dá pra melhorar?",
  "perdi compromisso por causa da demora na saída",
  "a saída do fundamental 1 está muito lenta",
  "esperei 35 minutos hoje, isso é normal?",
  "tem como escalonar melhor os horários de saída?",
  "a fila dobra o quarteirão, os vizinhos já reclamaram",
  "meu filho fica esperando muito tempo no pátio",
  "a saída das 17h30 está impossível",
  "com dois filhos em séries diferentes a espera dobra",
  "não dá pra sair do trabalho e enfrentar 40 min de fila",
  "algum plano pra organizar melhor a saída?",
];
const NOMES_SAIDA = ["Família Pedro Salles · 5º ano","Família Clara Mendonça · 3º ano","Família Gael Portela · 8º ano",
  "Família Íris Damasceno · 2º ano","Família Murilo Krause · 6º ano","Família Sara Bertoldo · 4º ano"];
const contatosSaida = NOMES_SAIDA.map(familia);
SAIDA.forEach((txt, i) => {
  conversa(contatosSaida[i % contatosSaida.length], dias(HOJE, -int(46, 88)), [
    ["entrada", txt, 0],
    ["saida", pick(["Oi! Estamos revendo o escalonamento", "Desculpa! Vamos ajustar os horários",
                    "Bom dia! Já levamos isso para a direção"]), int(40, 260)],
  ], { resumo: "Reclamação sobre demora na fila da saída.", tema: "entrada_e_saida",
       tipo: "problema", severidade: 3, evitavel: true, sentimento: "frustrado" });
});

// ══════════════════════════════════════════════════ ROTINA
// O contraste sem o qual o limiar não significa nada. Tudo respondido.

const NORMAIS = [
  ["comunicacao_e_avisos", "a reunião de pais é presencial ou online?", "Oi! Presencial, dia 12 às 19h 🙂", "duvida", true],
  ["comunicacao_e_avisos", "recebi o comunicado só ontem à noite, deu pouco tempo", "Desculpa! Vamos antecipar os próximos", "problema", true],
  ["comunicacao_e_avisos", "onde vejo o calendário de provas?", "Está no portal, aba Calendário 🙂", "duvida", true],
  ["mensalidade_e_material", "o boleto de setembro já saiu?", "Já sim! Te reenvio agora", "duvida", true],
  ["mensalidade_e_material", "a lista de material do ano que vem sai quando?", "Em novembro, junto com a rematrícula", "duvida", true],
  ["mensalidade_e_material", "consigo mudar o vencimento para o dia 10?", "Consegue sim, já ajustei aqui", "solicitacao", false],
  ["licao_e_carga", "a lição de casa está bem pesada essa semana", "Vou passar para a coordenação, obrigada por avisar", "problema", false],
  ["licao_e_carga", "quantas horas de lição vocês recomendam por dia?", "No 5º ano, cerca de 40 minutos 🙂", "duvida", false],
  ["alimentacao", "o lanche da cantina subiu de preço?", "Houve reajuste em agosto, te mando a tabela", "duvida", false],
  ["alimentacao", "minha filha tem alergia a amendoim, a cantina sabe?", "Sabe sim, está na ficha dela", "duvida", false],
  ["professor", "queria elogiar a professora Camila, meu filho melhorou muito", "Que alegria ler isso! Vou repassar ❤️", "elogio", false],
  ["professor", "a professora Camila é maravilhosa, ele não quer faltar", "Muito obrigada! Vou contar pra ela 🙂", "elogio", false],
  ["professor", "o professor de matemática continua no ano que vem?", "Continua sim!", "duvida", false],
  ["atividades_extras", "tem vaga no futsal do contraturno?", "Tem sim! Te mando a ficha", "duvida", false],
  ["atividades_extras", "vocês têm aula de robótica?", "Ainda não oferecemos robótica", "pedido_inexistente", false],
  ["atividades_extras", "tem período integral para o 2º ano?", "Não temos integral no fundamental 1", "pedido_inexistente", false],
  ["entrada_e_saida", "posso deixar meu filho 15 min antes do horário?", "Pode sim, o portão abre 7h 🙂", "duvida", true],
  ["matricula_e_documentos", "quais documentos preciso para a rematrícula?", "RG, CPF e comprovante de residência", "duvida", true],
  ["matricula_e_documentos", "a rematrícula abre quando?", "Em novembro 🙂", "duvida", true],
  ["convivencia_e_conflito", "meu filho disse que foi empurrado no recreio", "Vamos apurar hoje mesmo e te retorno", "problema", false],
  ["outros", "parabéns pela festa junina, foi linda!", "Obrigada! Ficamos muito felizes 🙂", "elogio", false],
  ["outros", "vocês têm transporte para o bairro Jardim?", "Não atendemos esse bairro ainda", "pedido_inexistente", false],
];
const NOMES_BG = ["Família Ana Ribas","Família Fábio Nardi","Família Juliana Tavares","Família Marcelo Xavier",
  "Família Roberta Fontes","Família Henrique Leal","Família Camila Sampaio","Família Paulo Veloso",
  "Família Sabrina Pontes","Família Igor Vilela","Família Tatiana Aguiar","Família Nelson Bittencourt",
  "Família Bruna Ramires","Família Ricardo Espíndola","Família Clara Krause","Família Márcia Bastos",
  "Família André Fagundes","Família Luana Carvalho","Família Joaquim Sá","Família Silvia Correia",
  "Família Adriano Moreira","Família Michele Duarte","Família Rui Nogueira","Família Priscila Freitas"];
const contatosBg = NOMES_BG.map(familia);

for (let i = 0; i < 230; i++) {
  const [tema, pergunta, resposta, tipo, evitavel] = NORMAIS[i % NORMAIS.length];
  const msgs = []; let t = 0;
  if (rnd() > 0.45) msgs.push(["entrada", pick(["Oi, bom dia!", "Boa tarde!", "Oi!", "Olá, boa tarde"]), (t += int(0, 2))]);
  msgs.push(["entrada", pergunta, (t += int(0, 2))]);
  msgs.push(["saida", resposta, (t += int(10, 180))]);
  if (rnd() > 0.4) {
    msgs.push(["entrada", pick(["ah entendi", "e precisa avisar antes?", "certo, e onde faço isso?", "hmm, e se não der?"]), (t += int(3, 40))]);
    msgs.push(["saida", pick(["Sem custo 🙂", "É só falar com a gente aqui", "Não precisa avisar antes não", "Pode ser por aqui mesmo"]), (t += int(10, 120))]);
  }
  if (rnd() > 0.25) msgs.push(["entrada", pick(["obrigada!", "valeu!", "perfeito 🙂", "muito obrigada, viu", "ok, obrigado!"]), (t += int(5, 90))]);
  conversa(pick(contatosBg), dias(HOJE, -int(2, 88)), msgs,
    { resumo: "Contato de rotina, resolvido.", tema, tipo, severidade: 1, evitavel, sentimento: "satisfeito" });
}

console.log("rotina plantada");

// ══════════════════════════════════════════════════ SINAIS

const insSinal = db.prepare(
  "INSERT OR IGNORE INTO sinais (contato_id, conversa_id, tipo, origem, evidencia, detectado_em) VALUES (?,?,?,?,?,?)");

// Sinais de CONTEÚDO (viriam do LLM; aqui, do seed).
for (const a of db.prepare(`SELECT a.conversa_id, a.json_completo, a.criada_em, c.contato_id
    FROM analises a JOIN conversas c ON c.id = a.conversa_id`).all()) {
  for (const s of JSON.parse(a.json_completo).sinais ?? [])
    insSinal.run(a.contato_id, a.conversa_id, s.sinal, "llm", s.evidencia, a.criada_em);
}

// Sinais de COMPORTAMENTO: SQL puro. Não passam por LLM, não alucinam.
const AGORA = "2026-08-31 09:00:00";

/** Horas de EXPEDIENTE entre dois instantes. Sexta 18h → segunda 9h são 63h
 *  corridas sem que ninguém tenha errado; contando corrido, toda segunda chega
 *  cheia de falso positivo. */
function horasUteis(deISO, ateISO) {
  let t = new Date(deISO.replace(" ", "T"));
  const fim = new Date(ateISO.replace(" ", "T"));
  let h = 0;
  while (t < fim) {
    const d = t.getDay(), hora = t.getHours() + t.getMinutes() / 60;
    if (d >= 1 && d <= 5 && hora >= 7 && hora < 18) h += 0.25;
    t = new Date(t.getTime() + 15 * 60000);
  }
  return h;
}

// Um "obrigada!" no fim da conversa NÃO é pendência. Sem isto, metade da base
// vira alerta e o gestor para de abrir na terceira semana.
const AGRADECE = /(obrigad|valeu|vlw|blz|beleza|^ok\b|perfeito|show|entendi|t[áa] bom|isso mesmo|👍|🙏|❤️|😊)/i;
const pendente = (txt) => {
  const s = txt.trim();
  if (s.length <= 12) return false;
  if (AGRADECE.test(s) && !s.includes("?") && s.length < 45) return false;
  return true;
};
const PROMESSA = /(vou verificar|te aviso|vou confirmar|te retorno|já te falo|vou checar|confirmo com|vamos apurar)/i;

let nUlt = 0, nProm = 0, nSil = 0;
for (const u of db.prepare(`SELECT c.id AS conversa_id, c.contato_id, m.texto, m.criada_em, m.direcao
  FROM conversas c JOIN mensagens m ON m.id = (
    SELECT id FROM mensagens WHERE conversa_id = c.id ORDER BY criada_em DESC, id DESC LIMIT 1)`).all()) {
  if (u.direcao === "entrada") {
    if (!pendente(u.texto)) continue;
    if (horasUteis(u.criada_em, AGORA) >= 24) {
      insSinal.run(u.contato_id, u.conversa_id, "ultima_palavra_da_familia", "sql", u.texto.slice(0, 160), u.criada_em);
      nUlt++;
    }
  } else if (PROMESSA.test(u.texto) && horasUteis(u.criada_em, AGORA) >= 24) {
    // A escola RESPONDEU. Só não cumpriu. "Sem resposta" não pega isto.
    insSinal.run(u.contato_id, u.conversa_id, "promessa_nao_cumprida", "sql", u.texto.slice(0, 160), u.criada_em);
    nProm++;
  }
}

// Silêncio: a família regular que parou de escrever. Ausência não é evento —
// só existe olhando o histórico. É o único sinal que nenhum concorrente vê.
for (const r of db.prepare(`SELECT c.id AS contato_id, COUNT(DISTINCT co.id) n,
    MAX(co.ultima_em) ultima, MIN(co.iniciada_em) primeira
  FROM contatos c JOIN conversas co ON co.contato_id = c.id
  GROUP BY c.id HAVING n >= 8`).all()) {
  const diasSem = (new Date(AGORA.replace(" ", "T")) - new Date(r.ultima.replace(" ", "T"))) / 864e5;
  const janela = (new Date(r.ultima.replace(" ", "T")) - new Date(r.primeira.replace(" ", "T"))) / 864e5;
  const cadencia = janela / r.n;
  if (cadencia <= 20 && diasSem >= 21 && diasSem > cadencia * 1.6) {
    insSinal.run(r.contato_id, null, "silencio", "sql",
      `escrevia a cada ~${Math.round(cadencia)} dias e está há ${Math.round(diasSem)} dias sem escrever`,
      r.ultima);
    nSil++;
  }
}

// ══════════════════════════════════════════════════ TEXTO E CORREÇÃO

db.prepare(`INSERT OR REPLACE INTO textos (tema, origem, diagnostico, texto, criada_em) VALUES (?,?,?,?,?)`).run(
  "desempenho_e_boletim", "seed",
  "As famílias não estão pedindo nota melhor — estão pedindo para saber antes. As 22 mensagens deste mês dizem a mesma coisa com palavras diferentes: quando a dificuldade aparece, elas descobrem no fechamento do bimestre, quando já não dá tempo de agir.",
  "A partir deste bimestre, toda família recebe um parcial na 5ª semana, por mensagem: como o aluno está indo em cada disciplina e o que a escola sugere. Se a nota cair abaixo da média em qualquer momento, a professora entra em contato na mesma semana — você não vai mais descobrir no boletim.",
  AGORA);

// A escola já corrigiu a fila da saída e ninguém avisou as famílias que
// reclamaram. É o movimento que mexe na experiência em vez de medi-la.
db.prepare(`INSERT OR REPLACE INTO correcoes (tema, o_que_mudou, corrigido_em, avisados) VALUES (?,?,?,0)`).run(
  "entrada_e_saida",
  "O escalonamento da saída mudou: 1º ao 5º ano saem 10 minutos antes, e o portão da rua lateral passou a operar das 17h às 18h.",
  iso(dias(HOJE, -20)));

// O que a equipe levantou com a escola no onboarding. Vinte minutos de conversa
// que o agente carrega em toda análise depois disso.
const insCtx = db.prepare("INSERT OR REPLACE INTO contexto (chave, rotulo, valor, ordem) VALUES (?,?,?,?)");
[
  ["porte", "Porte e séries", "500 alunos, da Educação Infantil ao 9º ano. Turmas de 25 a 30.", 1],
  ["oferece", "O que a escola oferece", "Período parcial manhã e tarde. Contraturno de futsal, teatro e xadrez. Reforço de matemática às quartas.", 2],
  ["nao_oferece", "O que a escola NÃO oferece", "Não tem período integral, robótica, ensino médio, nem transporte próprio. Não trabalha com material digital.", 3],
  ["calendario", "Datas que mandam no ano", "Rematrícula abre 3 de novembro. Boletim fecha no fim de cada bimestre. Reunião de pais em março, junho e setembro.", 4],
  ["equipe", "Quem é quem", "Secretaria: Cláudia, Rose, Marcos e Bia. Coordenação pedagógica: Renata (fund. 1) e Paulo (fund. 2). Direção: Ricardo.", 5],
  ["sensivel", "Assuntos sensíveis nesta escola", "A saída às 17h30 é ponto histórico de reclamação. A professora Camila é muito querida e citada pelo nome. Houve troca de professor de matemática em julho.", 6],
  ["jeito", "Como a escola fala", "Trata as famílias por você, não por senhor. Assina como 'Secretaria do Colégio Modelo'. Evita formalidade excessiva.", 7],
].forEach((r) => insCtx.run(...r));

const n = (q) => db.prepare(q).get().n;
console.log(`
  famílias   ${n("SELECT COUNT(*) n FROM contatos")}
  conversas  ${n("SELECT COUNT(*) n FROM conversas")}
  mensagens  ${n("SELECT COUNT(*) n FROM mensagens")}
  sinais     ${n("SELECT COUNT(*) n FROM sinais")}  (silêncio ${nSil} · sem resposta ${nUlt} · promessa ${nProm})
`);
db.close();
