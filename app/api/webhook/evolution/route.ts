import { db } from "@/lib/db";

// Recebe toda mensagem do WhatsApp via Evolution API.
//
// O banco é o centro. Este webhook é só UM alimentador — a análise, os sinais
// e as telas leem do banco e não sabem de onde a mensagem veio. Se o Baileys
// cair no dia da demo, troca-se o alimentador e o produto continua de pé.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ ok: false }, { status: 400 });

  const ev = body.event ?? body.type;
  if (ev !== "messages.upsert") return Response.json({ ok: true, ignorado: ev });

  const d = body.data ?? {};
  const jid: string = d.key?.remoteJid ?? "";
  const telefone = jid.split("@")[0];
  const daEscola: boolean = Boolean(d.key?.fromMe);
  const texto: string =
    d.message?.conversation ??
    d.message?.extendedTextMessage?.text ??
    d.message?.imageMessage?.caption ??
    "";
  if (!telefone || !texto) return Response.json({ ok: true, ignorado: "sem texto" });

  const nome = d.pushName || telefone;
  const quando = new Date((d.messageTimestamp ?? Date.now() / 1000) * 1000)
    .toISOString().slice(0, 19).replace("T", " ");

  const conn = db();
  conn.prepare(
    `INSERT INTO contatos (nome, telefone, tipo, criado_em) VALUES (?, ?, 'aluno', ?)
     ON CONFLICT(telefone) DO NOTHING`
  ).run(nome, telefone, quando);

  const contato = conn.prepare("SELECT id FROM contatos WHERE telefone = ?")
    .get(telefone) as { id: number };

  // Mesma conversa se houve mensagem nas últimas 12h; senão, abre outra.
  const aberta = conn.prepare(
    `SELECT id FROM conversas WHERE contato_id = ?
       AND ultima_em >= datetime(?, '-12 hours') ORDER BY ultima_em DESC LIMIT 1`
  ).get(contato.id, quando) as { id: number } | undefined;

  const conversaId = aberta?.id ?? Number(
    conn.prepare(
      `INSERT INTO conversas (contato_id, atendente, iniciada_em, ultima_em, encerrada)
       VALUES (?, NULL, ?, ?, 0)`
    ).run(contato.id, quando, quando).lastInsertRowid
  );

  conn.prepare(
    "INSERT INTO mensagens (conversa_id, direcao, texto, criada_em) VALUES (?, ?, ?, ?)"
  ).run(conversaId, daEscola ? "saida" : "entrada", texto, quando);
  conn.prepare("UPDATE conversas SET ultima_em = ? WHERE id = ?").run(quando, conversaId);

  return Response.json({ ok: true, conversa: conversaId });
}
