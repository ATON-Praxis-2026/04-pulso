import Link from "next/link";
import { Copiar, Resolver } from "@/components/acoes";
import { Etiqueta } from "@/components/marca";
import type { Movimento } from "@/lib/analytics";

/** As etiquetas sólidas da referência, uma por tipo de decisão.
 *  Terracota, azul-céu, ocre e oliva — todas validadas em AA. */
const TIPO: Record<Movimento["tipo"], { nome: string; fundo: string; tinta: string }> = {
  reincidencia: { nome: "Voltou", fundo: "#7a2f2f", tinta: "#ffffff" },
  avisar:     { nome: "Volte e avise",  fundo: "var(--verde)",     tinta: "#ffffff" },
  corrigir:   { nome: "Corrigir",       fundo: "var(--azul)",      tinta: "var(--tinta)" },
  estrutural: { nome: "Estrutural",     fundo: "var(--terracota)", tinta: "#ffffff" },
  destravar:  { nome: "Destravar",      fundo: "var(--oliva)",     tinta: "#ffffff" },
  abrir:      { nome: "Avaliar",        fundo: "var(--ocre)",      tinta: "var(--tinta)" },
  manter:     { nome: "Não mexer",      fundo: "var(--verde)",     tinta: "#ffffff" },
};

export function MovimentoCard({ m, compacto = false }: { m: Movimento; compacto?: boolean }) {
  const t = TIPO[m.tipo];
  return (
    <article className={`bg-card p-6 sm:p-7 ${m.resolvido ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3 mb-4">
        <Etiqueta fundo={t.fundo} tinta={t.tinta}>{t.nome}</Etiqueta>
        <span className="rotulo">{m.quantas} {m.unidade ?? "famílias"}</span>
        {m.resolvido && <span className="rotulo !text-[var(--verde)]">resolvido</span>}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-6 mb-3">
        <h3 className="font-[family-name:var(--font-newsreader)] text-[26px] sm:text-[30px]
          leading-[1.15] tracking-[-0.01em] flex-1 min-w-0">
          {m.titulo}
        </h3>
        
      </div>

      <p className="text-[17px] leading-relaxed text-muted-foreground max-w-[62ch]">
        {m.porque}
      </p>

      {!compacto && m.artefato && (
        <div className="mt-5 bg-[var(--papel-2)] p-5">
          <p className="rotulo mb-2">{m.artefato.rotulo}</p>
          <p className="text-[17px] leading-relaxed max-w-[62ch]">{m.artefato.conteudo}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-border">
        {m.copiar && <Copiar texto={m.copiar.texto} rotulo={m.copiar.rotulo} />}
        <Resolver chave={m.chave} resolvido={Boolean(m.resolvido)} />
        {m.href && (
          <Link href={m.href}
            className="rotulo hover:text-foreground ml-1 underline underline-offset-4
              decoration-[var(--regua)]">
            ver a evidência
          </Link>
        )}
      </div>
    </article>
  );
}
