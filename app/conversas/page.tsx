import Link from "next/link";
import { listaConversas } from "@/lib/analytics";
import { CONFIG } from "@/lib/config";
import { temas } from "@/lib/queries";
import { Cabecalho } from "@/components/ui-bits";
import { dataNumerica } from "@/lib/formato";

export const dynamic = "force-dynamic";

const TIPOS: Record<string, string> = {
  duvida: "Dúvida", solicitacao: "Solicitação", problema: "Reclamação",
  pedido_inexistente: "Pediu o que não existe", interesse_comercial: "Interesse comercial",
  elogio: "Elogio", confusao: "Confusão",
};

export default async function Conversas({
  searchParams,
}: { searchParams: Promise<{ q?: string; tema?: string; tipo?: string; sem?: string }> }) {
  const sp = await searchParams;
  const linhas = listaConversas({
    q: sp.q, tema: sp.tema, tipo: sp.tipo, semResposta: sp.sem === "1",
  });
  const ts = temas();

  // Clicar num filtro não pode apagar o que a pessoa digitou na busca.
  const url = (troca: Record<string, string>) => {
    const q = new URLSearchParams();
    if (sp.q) q.set("q", sp.q);
    for (const [k, v] of Object.entries(troca)) q.set(k, v);
    return `/conversas?${q}`;
  };

  const chip = (ativo: boolean) =>
    `text-sm rounded-md px-3 py-1.5 min-h-9 inline-flex items-center border transition-colors ${
      ativo ? "border-foreground/40 bg-accent text-accent-foreground"
            : "border-border text-muted-foreground hover:text-foreground"}`;

  return (
    <div>
      <Cabecalho titulo="Conversas"
        sub="Tudo o que entrou. É aqui que você confere qualquer coisa que a Interea disser." />

      <form className="flex flex-wrap gap-2 mb-4" action="/conversas">
        <input name="q" defaultValue={sp.q ?? ""} aria-label="Buscar por nome ou trecho da conversa"
          placeholder="buscar por nome ou trecho…"
          className="flex-1 min-w-[220px] rounded-md border border-border bg-card px-3 py-2 text-sm
                     placeholder:text-muted-foreground focus:border-foreground/40" />
        {sp.tema && <input type="hidden" name="tema" value={sp.tema} />}
        {sp.tipo && <input type="hidden" name="tipo" value={sp.tipo} />}
        <button className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent transition-colors">
          buscar
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5 mb-2">
        <Link href="/conversas" className={chip(!sp.tipo && !sp.tema && sp.sem !== "1")}>tudo</Link>
        <Link href={url({ sem: "1" })} className={chip(sp.sem === "1")}>sem resposta</Link>
        {Object.entries(TIPOS).map(([k, v]) => (
          <Link key={k} href={url({ tipo: k })} className={chip(sp.tipo === k)}>{v}</Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {ts.slice(0, 8).map((t) => (
          <Link key={t.tema} href={url({ tema: t.tema })} className={chip(sp.tema === t.tema)}>
            {t.label} <span className="font-mono opacity-70">{t.n}</span>
          </Link>
        ))}
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="px-4 py-2.5 border-b border-border flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {linhas.length} conversa{linhas.length === 1 ? "" : "s"}
            {linhas.length === 60 && " (mostrando as 60 mais recentes)"}
          </p>
        </div>
        <ul className="divide-y divide-border">
          {linhas.map((l) => (
            <li key={l.id}>
              <Link href={`/conversa/${l.id}`}
                className="flex items-start gap-4 px-4 py-3 hover:bg-accent/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium">{l.nome}</span>
                    {l.tipo === "interessado" && (
                      <span className="text-xs rounded px-1.5 py-0.5 bg-[#0ca30c]/20 text-[#0ca30c]">
                        interessado
                      </span>
                    )}
                    {!l.respondida && (
                      <span className="text-xs rounded px-1.5 py-0.5 bg-[#fab219]/20 text-[#fab219]">
                        sem resposta
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{l.primeira}</p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <p className="text-xs text-muted-foreground">
                    {l.tema ? CONFIG.temasLabel[l.tema] ?? l.tema : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground font-mono">
{dataNumerica(l.ultima_em)} · {l.n_msgs} msgs
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {linhas.length === 0 && (
          <div className="p-10 text-center space-y-2">
            <p className="text-muted-foreground">Nenhuma conversa com esse filtro.</p>
            <Link href="/conversas"
              className="inline-block text-sm underline underline-offset-4 hover:text-foreground">
              limpar os filtros
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
