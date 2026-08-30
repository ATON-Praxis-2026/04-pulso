import Link from "next/link";
import { alunosComSinal, interessadosSemRetorno } from "@/lib/queries";
import { VALOR_ALUNO } from "@/lib/analytics";
import { CONFIG } from "@/lib/config";
import { Cabecalho } from "@/components/ui-bits";
import { Copiar } from "@/components/acoes";
import { brl, dataCurta } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function Pessoas({
  searchParams,
}: { searchParams: Promise<{ lista?: string }> }) {
  const { lista } = await searchParams;
  const emInteressados = lista === "interessados";
  const alunos = alunosComSinal();
  const inter = interessadosSemRetorno();
  const dados = emInteressados ? inter : alunos;

  const todosRascunhos = dados
    .filter((p) => p.mensagem_sugerida)
    .map((p) => `${p.nome}\n${p.mensagem_sugerida}`)
    .join("\n\n———\n\n");

  return (
    <div className="max-w-3xl">
      <Cabecalho titulo="Pessoas"
        sub="Quem já disse alguma coisa — ou quem parou de dizer. Cada linha traz a frase que a pessoa escreveu." />

      <div className="flex gap-1 mb-5 border-b border-border">
        {[["", "Alunos com sinal", alunos.length],
          ["interessados", "Interessados sem retorno", inter.length]].map(([k, label, n]) => {
          const ativo = (k === "interessados") === emInteressados;
          return (
            <Link key={String(k)} href={k ? `/pessoas?lista=${k}` : "/pessoas"}
              className={`px-3 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
                ativo ? "border-foreground font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {label} <span className="font-mono text-xs ml-1">{String(n)}</span>
            </Link>
          );
        })}
      </div>

      {emInteressados && inter.length > 0 && (
        <div className="mb-5 border border-border rounded-lg bg-card p-5 flex flex-wrap
          items-center justify-between gap-4">
          <div>
            <p className="font-mono text-2xl tabular-nums text-[#fab219]">
              {brl(inter.length * VALOR_ALUNO)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              esperando resposta · {inter.length} pessoas × mensalidade × 2 anos
            </p>
          </div>
          {todosRascunhos && (
            <Copiar texto={todosRascunhos} rotulo={`Copiar os ${inter.length} rascunhos`} />
          )}
        </div>
      )}

      <div className="space-y-3">
        {dados.map((p) => (
          <article key={p.id} className="border border-border rounded-lg bg-card p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-medium">{p.nome}</h2>
              {[...new Set(p.sinais.map((s) => s.tipo))].map((tipo) => (
                <span key={tipo}
                  className="text-xs rounded px-1.5 py-0.5 bg-muted text-muted-foreground">
                  {CONFIG.sinaisLabel[tipo] ?? tipo}
                </span>
              ))}
              {p.dias_esperando !== null && (
                <span className="ml-auto text-sm text-muted-foreground shrink-0">
                  há {p.dias_esperando} dias
                </span>
              )}
            </div>

            <ul className="space-y-2">
              {p.sinais.map((s) => (
                <li key={s.tipo + s.evidencia} className="text-sm">
                  <span className="text-xs text-muted-foreground">
                    {CONFIG.sinaisLabel[s.tipo] ?? s.tipo} ·{" "}
{dataCurta(s.detectado_em)}
                  </span>
                  <p className="border-l border-border pl-3 mt-1 italic text-foreground/90">
                    “{s.evidencia}”
                  </p>
                </li>
              ))}
            </ul>

            {p.mensagem_sugerida && (
              <div className="rounded-md bg-muted/40 border border-border p-4 space-y-3">
                <p className="text-xs text-muted-foreground">Rascunho para a secretaria enviar</p>
                <p className="text-sm leading-relaxed">{p.mensagem_sugerida}</p>
                <Copiar texto={p.mensagem_sugerida} />
              </div>
            )}

            {p.ultima_conversa && (
              <Link href={`/conversa/${p.ultima_conversa}`}
                className="inline-block text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
                ver a conversa
              </Link>
            )}
          </article>
        ))}
      </div>

      {dados.length === 0 && (
        <p className="border border-border rounded-lg p-10 text-center text-muted-foreground">
          Ninguém deu sinal esta semana. É uma boa notícia.
        </p>
      )}
    </div>
  );
}
