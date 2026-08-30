// Uma chamada de LLM por conversa. Não é multi-agente.
// Saída estruturada obrigatória — o schema é o contrato.
//
//   node scripts/analisar.mjs            analisa tudo que ainda não passou pelo LLM
//   node scripts/analisar.mjs 42         analisa só a conversa 42 (o "analisar agora")
//   node scripts/analisar.mjs --limite 20

import { anthropic } from "../lib/anthropic";
import { DatabaseSync } from "node:sqlite";
import { SISTEMA, SCHEMA, MODEL } from "../lib/prompt";

const db = new DatabaseSync("data/interea.db");
const client = anthropic();

const arg = process.argv[2];
const soUma = arg && /^\d+$/.test(arg) ? Number(arg) : null;
const limite = process.argv.includes("--limite")
  ? Number(process.argv[process.argv.indexOf("--limite") + 1]) : 400;

const alvos: any[] = soUma
  ? db.prepare("SELECT id, contato_id FROM conversas WHERE id = ?").all(soUma) as any[]
  : db.prepare(`SELECT c.id, c.contato_id FROM conversas c
                LEFT JOIN analises a ON a.conversa_id = c.id AND a.origem = 'llm'
                WHERE a.conversa_id IS NULL
                ORDER BY c.ultima_em DESC LIMIT ?`).all(limite) as any[];

console.log(`${alvos.length} conversas · modelo ${MODEL}`);

const upAnalise = db.prepare(`INSERT INTO analises
  (conversa_id, origem, resumo, tipo_contato, tema, severidade, evitavel,
   intencao_matricula, sentimento_final, mensagem_sugerida, json_completo, criada_em)
  VALUES (?,'llm',?,?,?,?,?,?,?,?,?,?)
  ON CONFLICT(conversa_id) DO UPDATE SET
    origem='llm', resumo=excluded.resumo, tipo_contato=excluded.tipo_contato,
    tema=excluded.tema, severidade=excluded.severidade, evitavel=excluded.evitavel,
    intencao_matricula=excluded.intencao_matricula,
    sentimento_final=excluded.sentimento_final,
    mensagem_sugerida=excluded.mensagem_sugerida, json_completo=excluded.json_completo`);

const upSinal = db.prepare(`INSERT OR IGNORE INTO sinais
  (contato_id, conversa_id, tipo, origem, evidencia, detectado_em) VALUES (?,?,?,'llm',?,?)`);

let ok = 0, erro = 0, descartadas = 0;
const uso = { entrada: 0, cache_leitura: 0, cache_escrita: 0, saida: 0 };
const CONCORRENCIA = Number(process.env.INTEREA_CONCORRENCIA ?? 8);

async function processa(alvo: any) {
  const msgs = db.prepare(
    "SELECT direcao, texto, criada_em FROM mensagens WHERE conversa_id = ? ORDER BY criada_em"
  ).all(alvo.id) as any[];
  if (!msgs.length) return;

  // Sem timestamps no transcript: o LLM não deve nem ter como calcular tempo.
  const transcript = msgs
    .map((m: any) => `${m.direcao === "entrada" ? "CLIENTE" : "SECRETARIA"}: ${m.texto}`)
    .join("\n");

  try {
    const r = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: [{ type: "text", text: SISTEMA, cache_control: { type: "ephemeral" } }],
      output_config: { format: { type: "json_schema", schema: SCHEMA }, effort: "low" },
      messages: [{ role: "user", content: `<conversa>\n${transcript}\n</conversa>` }],
    });

    uso.entrada += r.usage.input_tokens ?? 0;
    uso.cache_leitura += r.usage.cache_read_input_tokens ?? 0;
    uso.cache_escrita += r.usage.cache_creation_input_tokens ?? 0;
    uso.saida += r.usage.output_tokens ?? 0;

    const bloco = r.content.find((b) => b.type === "text");
    const texto = bloco && "text" in bloco ? bloco.text : "{}";
    const j = JSON.parse(texto);
    const quando = msgs.at(-1)!.criada_em;

    upAnalise.run(alvo.id, j.resumo, j.tipo_contato, j.tema, j.severidade,
      j.evitavel ? 1 : 0, j.intencao_matricula ? 1 : 0, j.sentimento_final,
      j.mensagem_sugerida ?? "", JSON.stringify(j), quando);

    for (const s of j.sinais_risco ?? []) {
      // Evidência obrigatória E verificável: o trecho tem que existir na conversa.
      // Sem esta checagem, "evidência obrigatória" é só uma instrução no prompt.
      const literal = msgs.some((m: any) => m.texto.includes(String(s.evidencia).slice(0, 30)));
      if (!literal) { descartadas++; continue; }
      upSinal.run(alvo.contato_id, alvo.id, s.sinal, s.evidencia, quando);
    }
    ok++;
    if (ok % 25 === 0) console.log(`  ${ok}/${alvos.length}`);
  } catch (e: any) {
    erro++;
    console.error(`  ✗ conversa ${alvo.id}: ${e.message?.slice(0, 120)}`);
  }
}

// Lotes em paralelo: 363 chamadas em série levariam uma eternidade.
for (let i = 0; i < alvos.length; i += CONCORRENCIA) {
  await Promise.all(alvos.slice(i, i + CONCORRENCIA).map(processa));
}

// Preço Opus 5: $5/MTok entrada, $25/MTok saída.
// Cache: escrita ~1.25x da entrada, leitura ~0.1x.
const custo =
  (uso.entrada / 1e6) * 5 +
  (uso.cache_escrita / 1e6) * 6.25 +
  (uso.cache_leitura / 1e6) * 0.5 +
  (uso.saida / 1e6) * 25;

console.log(`
  tokens   entrada ${uso.entrada.toLocaleString("pt-BR")} · cache lido ${uso.cache_leitura.toLocaleString("pt-BR")} · saída ${uso.saida.toLocaleString("pt-BR")}
  custo    US$ ${custo.toFixed(3)}${ok ? `  (US$ ${(custo / ok).toFixed(4)} por conversa)` : ""}
  descarte ${descartadas} evidências não conferiam e o sinal foi jogado fora`);

console.log(`  ${ok} analisadas · ${erro} erros\n`);
db.close();
