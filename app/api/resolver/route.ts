import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const { chave, desfazer } = await req.json().catch(() => ({}));
  if (!chave) return Response.json({ ok: false }, { status: 400 });

  const conn = db();
  if (desfazer) {
    conn.prepare("DELETE FROM resolvidos WHERE chave = ?").run(chave);
  } else {
    conn.prepare(
      "INSERT OR REPLACE INTO resolvidos (chave, resolvido_em) VALUES (?, datetime('now'))"
    ).run(chave);
  }
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
