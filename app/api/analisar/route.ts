import { anthropic } from "@/lib/anthropic";
import { db } from "@/lib/db";
import { SISTEMA, SCHEMA, MODEL } from "@/lib/prompt";

// "Analisar agora" — o caminho seguro da demo ao vivo.
//
// O gatilho normal é conversa encerrada por inatividade, detectada por cron.
// Na demo a conversa está ABERTA, então nada dispara e a lista não atualiza.
// Este endpoint força a análise. É o único passo que precisa funcionar ao vivo.
export async function POST(req: Request) {
  const { conversa_id } = await req.json().catch(() => ({}));
  const conn = db();

  const alvo = (conversa_id
    ? conn.prepare("SELECT id, contato_id FROM conversas WHERE id = ?").get(conversa_id)
    : conn.prepare(`SELECT c.id, c.contato_id FROM conversas c
        LEFT JOIN analises a ON a.conversa_id = c.id AND a.origem='llm'
        WHERE a.conversa_id IS NULL ORDER BY c.ultima_em DESC LIMIT 1`).get()
  ) as { id: number; contato_id: number } | undefined;

  if (!alvo) return Response.json({ ok: false, erro: "nada para analisar" }, { status: 404 });

  const msgs = conn.prepare(
    "SELECT direcao, texto, criada_em FROM mensagens WHERE conversa_id = ? ORDER BY criada_em"
  ).all(alvo.id) as { direcao: string; texto: string; criada_em: string }[];
  if (!msgs.length) return Response.json({ ok: false, erro: "conversa vazia" }, { status: 400 });

  const transcript = msgs
    .map((m) => `${m.direcao === "entrada" ? "CLIENTE" : "SECRETARIA"}: ${m.texto}`)
    .join("\n");

  const r = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: [{ type: "text", text: SISTEMA, cache_control: { type: "ephemeral" } }],
    output_config: { format: { type: "json_schema", schema: SCHEMA }, effort: "low" },
    messages: [{ role: "user", content: `<conversa>\n${transcript}\n</conversa>` }],
  });

  const bloco = r.content.find((b) => b.type === "text");
  const j = JSON.parse(bloco && "text" in bloco ? bloco.text : "{}");
  const quando = msgs[msgs.length - 1].criada_em;

  conn.prepare(`INSERT INTO analises
    (conversa_id, origem, resumo, tipo_contato, tema, severidade, evitavel,
     intencao_matricula, sentimento_final, mensagem_sugerida, json_completo, criada_em)
    VALUES (?,'llm',?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(conversa_id) DO UPDATE SET origem='llm', resumo=excluded.resumo,
      tipo_contato=excluded.tipo_contato, tema=excluded.tema,
      severidade=excluded.severidade, evitavel=excluded.evitavel,
      intencao_matricula=excluded.intencao_matricula,
      sentimento_final=excluded.sentimento_final,
      mensagem_sugerida=excluded.mensagem_sugerida, json_completo=excluded.json_completo`
  ).run(alvo.id, j.resumo, j.tipo_contato, j.tema, j.severidade,
        j.evitavel ? 1 : 0, j.intencao_matricula ? 1 : 0, j.sentimento_final,
        j.mensagem_sugerida ?? "", JSON.stringify(j), quando);

  const ins = conn.prepare(`INSERT OR IGNORE INTO sinais
    (contato_id, conversa_id, tipo, origem, evidencia, detectado_em) VALUES (?,?,?,'llm',?,?)`);
  let descartados = 0;
  for (const s of j.sinais_risco ?? []) {
    // O trecho tem que existir na conversa. Sem esta checagem,
    // "evidência obrigatória" é só uma frase no prompt.
    if (!msgs.some((m) => m.texto.includes(String(s.evidencia).slice(0, 30)))) {
      descartados++; continue;
    }
    ins.run(alvo.contato_id, alvo.id, s.sinal, s.evidencia, quando);
  }

  return Response.json({ ok: true, conversa: alvo.id, analise: j, evidencias_descartadas: descartados });
}
