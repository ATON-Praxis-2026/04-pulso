import Link from "next/link";
import { movimentos } from "@/lib/analytics";
import { positivos, familiasDoResumo, temas } from "@/lib/queries";
import { CONFIG, mesesAteRematricula } from "@/lib/config";
import { AGORA } from "@/lib/queries";
import { MovimentoCard } from "@/components/movimento-card";
import { Anel } from "@/components/marca";
import { Copiar } from "@/components/acoes";

export const dynamic = "force-dynamic";

/** O texto exato que saiu no WhatsApp às 9h. A página é ele, aberto. */
function mensagemEnviada() {
  const mov = movimentos().filter((m) => !m.resolvido).slice(0, 2);
  const fam = familiasDoResumo(CONFIG.teto.familias);
  const tema = temas()[0];
  const l: string[] = [`Bom dia, ${CONFIG.gestor}. Resumo da semana.`, ""];
  for (const b of positivos()) l.push(`✅ ${b}`);
  if (mov.length) {
    l.push("", `→ ${mov.length} decisões para você`);
    mov.forEach((m, i) => l.push(
      `${i + 1}. ${m.titulo} — ${m.quantas} ${m.unidade ?? "famílias"}` +
      (m.score?.urgencia === "agora" ? "  ⚡ já te avisei durante a semana" : "")));
  }
  if (fam.length) {
    l.push("", `⚠️ ${fam.length} famílias deram sinal`);
    for (const f of fam) {
      const s = [...new Set(f.sinais.map((x) => CONFIG.sinaisLabel[x.tipo] ?? x.tipo))].slice(0, 2);
      l.push(`• ${f.nome.replace("Família ", "")} — ${s.join(", ")}`);
    }
  }
  if (tema) l.push("", `🔁 ${tema.label} — ${tema.n} famílias este mês`);
  l.push("", `📅 Faltam ${mesesAteRematricula(AGORA)} meses para a rematrícula.`);
  return l.join("\n");
}

export default function Semana() {
  const todos = movimentos();
  const abertos = todos.filter((m) => m.estado !== "feito");
  const agora = abertos.filter((m) => m.score?.urgencia === "agora");
  const naSemana = abertos.filter((m) => m.score?.urgencia !== "agora");
  const resolvidos = todos.filter((m) => m.estado === "feito");
  const bons = positivos();
  const meses = mesesAteRematricula(AGORA);
  const msg = mensagemEnviada();

  return (
    <div className="space-y-3">
      <header className="bg-[var(--creme)] text-[var(--tinta)] rounded-[var(--radius)]
        px-6 sm:px-8 py-8 flex items-start gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-[38px] sm:text-[46px] leading-[1.02] tracking-[-0.04em] font-bold">
            Bom dia, {CONFIG.gestor}.
          </h1>
          {/* O relógio do produto: a data que já existe na vida dele. */}
          <p className="rotulo mt-3">
            segunda, 31 de agosto · faltam {meses} meses para a rematrícula
          </p>
        </div>
        {todos.length > 0 && (
          <div className="hidden sm:flex flex-col items-center gap-1.5 pt-2">
            <Anel total={todos.length} cheios={resolvidos.length} tamanho={52} />
            <span className="rotulo !text-[0.625rem]">{resolvidos.length}/{todos.length}</span>
          </div>
        )}
      </header>

      {bons.length > 0 && (
        <section className="bg-[var(--verde-claro)] text-[var(--tinta)]
          rounded-[var(--radius)] px-6 sm:px-8 py-2">
          {bons.map((b) => (
            <p key={b} className="flex gap-3 py-3.5 border-b border-[var(--tinta)]/12
              last:border-0 prosa">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0 mt-[7px]">
                <path d="M2 7.5 L5.5 11 L12 3.5" fill="none" stroke="var(--tinta)"
                  strokeWidth="2" strokeLinecap="square" />
              </svg>
              <span>{b}</span>
            </p>
          ))}
        </section>
      )}

      <details className="group bg-[var(--creme)] text-[var(--tinta)] rounded-[var(--radius)] px-6 sm:px-8">
        <summary className="flex items-center gap-3 py-5 cursor-pointer list-none
          hover:opacity-70 transition-opacity">
          <span className="size-2 rounded-full bg-[var(--coral)] shrink-0" aria-hidden />
          <span className="rotulo">enviado no seu whatsapp hoje às 9h</span>
          <span className="rotulo ml-auto group-open:hidden">ver a mensagem</span>
          <span className="rotulo ml-auto hidden group-open:inline">fechar</span>
        </summary>
        <div className="pb-5 space-y-4">
          <pre className="bg-[var(--muted)] rounded-2xl p-6 text-[14px] leading-relaxed
            whitespace-pre-wrap max-w-[56ch]">{msg}</pre>
          <Copiar texto={msg} rotulo="Copiar a mensagem" />
        </div>
      </details>

      {abertos.length === 0 ? (
        <section className="bg-[var(--verde-claro)] text-[var(--tinta)]
          rounded-[var(--radius)] p-10 sm:p-16 text-center">
          <div className="flex justify-center mb-5"><Anel total={6} cheios={0} tamanho={72} /></div>
          <p className="text-[28px] tracking-[-0.03em] font-bold">
            Nada exige decisão sua esta semana.
          </p>
          <p className="prosa opacity-75 mt-3 max-w-sm mx-auto">
            Nenhuma família ficou sem resposta e nenhum assunto se repetiu o bastante.
            É uma boa notícia.
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          <h2 className="rotulo !text-[var(--tinta-2)] px-2 pt-3">
            {abertos.length === 1 ? "1 decisão para você" : `${abertos.length} decisões para você`}
            {agora.length > 0 && (
              <span className="!text-[#7a2f2f]"> · {agora.length} não {agora.length === 1 ? "esperou" : "esperaram"} segunda</span>
            )}
          </h2>
          <div className="space-y-3">
            {[...agora, ...naSemana].slice(0, 3).map((m) => <MovimentoCard key={m.chave} m={m} />)}
          </div>
          {abertos.length > 3 && (
            <Link href="/decisoes" className="inline-block rotulo !text-[var(--tinta-2)]
              hover:!text-[var(--tinta)] underline underline-offset-4 px-2 py-2">
              ver as outras {abertos.length - 3}
            </Link>
          )}
        </section>
      )}

      {resolvidos.length > 0 && (
        <p className="rotulo !text-[var(--tinta-2)] px-2">
          <Link href="/decisoes" className="hover:!text-[var(--tinta)] underline underline-offset-4">
            você já fechou {resolvidos.length} no quadro →
          </Link>
        </p>
      )}

      <Link href="/numeros" className="inline-block rotulo !text-[var(--tinta-2)]
        hover:!text-[var(--tinta)] underline underline-offset-4 px-2 py-3">
        ver os números →
      </Link>
    </div>
  );
}
