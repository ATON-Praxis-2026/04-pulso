// Avaliação do agente. Roda contra casos com gabarito, metade deles armadilhas,
// e mede o que dá para medir hoje — não eficácia de retenção, que exige um
// semestre, mas se o detector acerta, se ele sabe dizer NÃO, se ele é estável e
// se ele nunca inventa uma citação.
//
//   npm run avaliar            tudo
//   npm run avaliar -- --rapido  pula o teste de estabilidade (5× por caso)

import { DatabaseSync } from "node:sqlite";
import { anthropic } from "../lib/anthropic";
import { SISTEMA, SCHEMA, MODEL } from "../lib/prompt";
import { CASOS, type Caso } from "../avaliacao/casos";
import { CONFIG } from "../lib/config";

const client = anthropic();
const rapido = process.argv.includes("--rapido");

const transcript = (c: Caso) =>
  c.transcript.map(([q, t]) => `${q === "familia" ? "CLIENTE" : "SECRETARIA"}: ${t}`).join("\n");

async function analisa(c: Caso) {
  const r = await client.messages.create({
    model: MODEL, max_tokens: 4000,
    system: [{ type: "text", text: SISTEMA, cache_control: { type: "ephemeral" } }],
    output_config: { format: { type: "json_schema", schema: SCHEMA }, effort: "low" },
    messages: [{ role: "user", content: `<conversa>\n${transcript(c)}\n</conversa>` }],
  });
  const b = r.content.find((x) => x.type === "text");
  return JSON.parse(b && "text" in b ? b.text : "{}");
}

const cinza = (s: string) => `\x1b[90m${s}\x1b[0m`;
const verde = (s: string) => `\x1b[32m${s}\x1b[0m`;
const vermelho = (s: string) => `\x1b[31m${s}\x1b[0m`;

console.log(`\n  Avaliação do agente · modelo ${MODEL}\n`);

// ─────────────────────────────────────────────── 1. Acerto e recusa
console.log("  1. ACERTA E SABE DIZER NÃO");
console.log(cinza("     " + "─".repeat(64)));

let vp = 0, fp = 0, fn = 0, temasOk = 0, temasTot = 0;
const falhas: string[] = [];

const resultados = await Promise.all(
  CASOS.map(async (c) => ({ c, j: await analisa(c) }))
);

for (const { c, j } of resultados) {
  const saiu: string[] = (j.sinais_risco ?? []).map((s: { sinal: string }) => s.sinal);
  const faltou = c.esperado.filter((e) => !saiu.includes(e));
  const indevidos = saiu.filter((s) => (c.proibido ?? []).includes(s));
  const extras = saiu.filter((s) => !c.esperado.includes(s));

  vp += c.esperado.filter((e) => saiu.includes(e)).length;
  fn += faltou.length;
  fp += indevidos.length;

  if (c.tema) {
    temasTot++;
    if (j.tema === c.tema) temasOk++;
    else falhas.push(`${c.id}: tema ${j.tema}, esperado ${c.tema}`);
  }

  const ok = faltou.length === 0 && indevidos.length === 0;
  const armadilha = (c.proibido?.length ?? 0) > 0;
  console.log(`     ${ok ? verde("✓") : vermelho("✗")} ${c.id.padEnd(30)} ${
    cinza(armadilha ? "armadilha" : "positivo ")}  ${
    saiu.length ? saiu.join(", ") : cinza("nenhum sinal")}`);
  if (faltou.length) falhas.push(`${c.id}: não achou ${faltou.join(", ")}`);
  if (indevidos.length) falhas.push(`${c.id}: disparou indevidamente ${indevidos.join(", ")}`);
  if (extras.length && !indevidos.length)
    console.log(cinza(`        extra (não penalizado): ${extras.join(", ")}`));
}

const precisao = vp + fp ? (vp / (vp + fp)) * 100 : 100;
const cobertura = vp + fn ? (vp / (vp + fn)) * 100 : 100;
console.log(`\n     precisão ${precisao.toFixed(0)}%  ·  cobertura ${cobertura.toFixed(0)}%  ·  ${
  vp} certos, ${fp} falsos positivos, ${fn} perdidos`);
if (temasTot) console.log(`     consolidação de tema: ${temasOk}/${temasTot} redações diferentes no mesmo tema`);

// ─────────────────────────────────────────────── 2. Estabilidade
if (!rapido) {
  console.log(`\n  2. DÁ A MESMA RESPOSTA TODA VEZ`);
  console.log(cinza("     " + "─".repeat(64)));
  const amostra = CASOS.filter((c) => ["sair-velado", "armadilha-sair-cedo", "financeiro"].includes(c.id));
  for (const c of amostra) {
    const runs = await Promise.all(Array.from({ length: 5 }, () => analisa(c)));
    const chaves = runs.map((j) =>
      ((j.sinais_risco ?? []).map((s: { sinal: string }) => s.sinal).sort().join("+") || "nenhum") + "|" + j.tema);
    const unicos = new Set(chaves);
    console.log(`     ${unicos.size === 1 ? verde("✓") : vermelho("✗")} ${c.id.padEnd(30)} ${
      unicos.size === 1 ? "5/5 idênticas" : `${unicos.size} respostas diferentes em 5`}`);
    if (unicos.size > 1) falhas.push(`${c.id}: instável, ${unicos.size} resultados em 5 execuções`);
  }
}

// ─────────────────────────────────────────────── 3. Corpus
console.log(`\n  3. SOBRE AS ${(() => {
  const db = new DatabaseSync("data/pulso.db");
  const r = db.prepare("SELECT COUNT(*) n FROM analises WHERE origem='llm'").get() as { n: number };
  return r.n;
})()} CONVERSAS JÁ ANALISADAS`);
console.log(cinza("     " + "─".repeat(64)));

const db = new DatabaseSync("data/pulso.db");
const q = (s: string) => db.prepare(s).get() as Record<string, number>;

// Toda evidência precisa existir literalmente na conversa que a gerou.
const ev = db.prepare(`SELECT s.evidencia, s.conversa_id FROM sinais s WHERE s.origem='llm'`).all() as
  { evidencia: string; conversa_id: number }[];
let inventadas = 0;
for (const e of ev) {
  const achou = db.prepare("SELECT 1 FROM mensagens WHERE conversa_id = ? AND texto LIKE ?")
    .get(e.conversa_id, `%${e.evidencia.slice(0, 30)}%`);
  if (!achou) inventadas++;
}
console.log(`     ${inventadas === 0 ? verde("✓") : vermelho("✗")} evidência literal          ${
  ev.length - inventadas}/${ev.length} citações existem na conversa`);

// O limiar precisa separar: quem foi plantado cruza, o resto não.
const PLANTADAS = ["Sofia Menezes", "Bruno Tavares", "Helena Rocha", "Caio Prado", "Lara Bittencourt"];
const pesoSQL = Object.entries(CONFIG.pesos).map(([k, v]) => `WHEN '${k}' THEN ${v}`).join(" ");
const comSinal = db.prepare(
  `SELECT c.nome, SUM(p.peso) pontos FROM contatos c
   JOIN (SELECT DISTINCT contato_id, tipo, CASE tipo ${pesoSQL} ELSE 0 END peso FROM sinais) p
     ON p.contato_id = c.id
   GROUP BY c.id HAVING pontos >= ${CONFIG.limiar}`).all() as { nome: string; pontos: number }[];
const achadas = PLANTADAS.filter((p) => comSinal.some((c) => c.nome.includes(p)));
const total = q("SELECT COUNT(*) n FROM contatos").n;
const ruido = comSinal.filter((c) => !PLANTADAS.some((p) => c.nome.includes(p)));

console.log(`     ${achadas.length === PLANTADAS.length ? verde("✓") : vermelho("✗")} famílias plantadas        ${
  achadas.length}/${PLANTADAS.length} cruzaram o limiar`);
console.log(`     ${ruido.length <= 3 ? verde("✓") : vermelho("✗")} ruído                     ${
  ruido.length} de ${total - PLANTADAS.length} famílias normais cruzaram (${
  ((ruido.length / (total - PLANTADAS.length)) * 100).toFixed(0)}%)`);

// Antecedência: quantos dias antes da rematrícula o sinal apareceu.
const cedo = q(`SELECT CAST(MIN(julianday('${CONFIG.rematricula}') - julianday(detectado_em)) AS INTEGER) n
  FROM sinais`);
const tarde = q(`SELECT CAST(MAX(julianday('${CONFIG.rematricula}') - julianday(detectado_em)) AS INTEGER) n
  FROM sinais`);
console.log(`     ${verde("✓")} antecedência              o sinal mais recente apareceu ${
  cedo.n} dias antes da rematrícula; o mais antigo, ${tarde.n}`);

console.log("");
if (falhas.length) {
  console.log(vermelho(`  ${falhas.length} falha(s):`));
  for (const f of falhas) console.log(`     · ${f}`);
} else {
  console.log(verde("  Tudo passou."));
}
console.log("");
db.close();
