import Link from "next/link";
import { notFound } from "next/navigation";
import { conversa } from "@/lib/queries";
import { CONFIG } from "@/lib/config";
import { Painel } from "@/components/ui-bits";
import { dataLonga, dataHora } from "@/lib/formato";

export const dynamic = "force-dynamic";

const TIPOS: Record<string, string> = {
  duvida: "Dúvida", solicitacao: "Solicitação", problema: "Reclamação",
  pedido_inexistente: "Pediu o que não existe", interesse_comercial: "Interesse comercial",
  elogio: "Elogio", confusao: "Confusão",
};

export default async function Conversa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = conversa(Number(id));
  if (!c) notFound();

  const a = c.analise as Record<string, string | number | null> | undefined;
  const trechos = c.sinais.map((s) => s.evidencia).filter(Boolean);
  const marcada = (txt: string) =>
    trechos.some((e) => txt.includes(e) || e.includes(txt.slice(0, 40)));

  return (
    <div>
      <Link href="/conversas"
        className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
        ← conversas
      </Link>

      <header className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{c.nome}</h1>
        <p className="text-sm text-muted-foreground">
          atendida por {c.atendente ?? "—"} ·{" "}
{dataLonga(c.iniciada_em)}
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="border border-border rounded-lg bg-card p-5 space-y-2">
          {c.mensagens.map((m, i) => (
            <div key={i} className={m.direcao === "entrada" ? "" : "flex justify-end"}>
              <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                m.direcao === "entrada"
                  ? `bg-[#1f2c33] rounded-tl-sm ${marcada(m.texto) ? "ring-2 ring-[#fab219]/70" : ""}`
                  : "bg-emerald-900/30 rounded-tr-sm"}`}>
                <p className="leading-relaxed">{m.texto}</p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
{dataHora(m.criada_em)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {c.sinais.length > 0 && (
            <Painel titulo="Sinais nesta conversa" sub="destacados no transcript ao lado">
              <ul className="space-y-3">
                {c.sinais.map((s) => (
                  <li key={s.tipo}>
                    <p className="text-sm font-medium">{CONFIG.sinaisLabel[s.tipo] ?? s.tipo}</p>
                    <p className="text-sm text-muted-foreground border-l-2 border-border pl-3 mt-1 italic">
                      “{s.evidencia}”
                    </p>
                  </li>
                ))}
              </ul>
            </Painel>
          )}

          {a && (
            <Painel titulo="Análise"
              sub={a.origem === "llm" ? "gerada pelo modelo" : "análise de base — o modelo ainda não rodou"}>
              <dl className="space-y-3 text-sm">
                {a.resumo ? (
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Resumo</dt>
                    <dd className="leading-relaxed">{a.resumo}</dd>
                  </div>
                ) : null}
                {([
                  ["Tema", CONFIG.temasLabel[String(a.tema)] ?? a.tema],
                  ["Tipo", TIPOS[String(a.tipo_contato)] ?? a.tipo_contato],
                  ["Sentimento no fim", a.sentimento_final],
                  ["Gravidade", ["", "baixa", "baixa", "média", "alta", "alta"][Number(a.severidade) || 1]],
                  ["Precisava existir?", a.evitavel ? "não — era evitável" : "sim"],
                  ["Intenção de matrícula", a.intencao_matricula ? "sim" : "não"],
                ] as [string, unknown][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-t border-border pt-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right">{String(v ?? "—")}</dd>
                  </div>
                ))}
              </dl>
            </Painel>
          )}

          {a?.mensagem_sugerida ? (
            <Painel titulo="Rascunho para a secretaria">
              <p className="text-sm leading-relaxed">{String(a.mensagem_sugerida)}</p>
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                A Interea não envia. O gestor aprova, a secretaria copia e manda pelo número dela.
              </p>
            </Painel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
