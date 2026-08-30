import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const ESTADOS = ["decidir", "fazendo", "feito"];

/** Move um cartão no quadro. Quando vai para "feito", o diretor conta o que
 *  fez — e é isso que o agente passa a saber sobre esta escola. */
export async function POST(req: Request) {
  const { chave, estado, o_que_fiz } = await req.json().catch(() => ({}));
  if (!chave || !ESTADOS.includes(estado))
    return Response.json({ ok: false }, { status: 400 });

  db().prepare(
    `INSERT INTO decisoes_estado (chave, estado, o_que_fiz, atualizado_em)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(chave) DO UPDATE SET
       estado = excluded.estado,
       o_que_fiz = COALESCE(NULLIF(excluded.o_que_fiz, ''), decisoes_estado.o_que_fiz),
       atualizado_em = excluded.atualizado_em`
  ).run(chave, estado, o_que_fiz ?? null);

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
