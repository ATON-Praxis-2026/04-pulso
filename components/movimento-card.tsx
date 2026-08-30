import Link from "next/link";
import { Copiar, Resolver } from "@/components/acoes";
import type { Movimento } from "@/lib/analytics";

/** A cor do cartão inteiro diz o tipo. Nada de etiqueta pendurada. */
const TIPO: Record<Movimento["tipo"], { nome: string; fundo: string; tinta: string }> = {
  reincidencia: { nome: "Voltou",         fundo: "var(--coral)",       tinta: "var(--tinta)" },
  avisar:       { nome: "Volte e avise",  fundo: "var(--verde-claro)", tinta: "var(--tinta)" },
  corrigir:     { nome: "Corrigir",       fundo: "var(--azul)",        tinta: "var(--tinta)" },
  estrutural:   { nome: "Estrutural",     fundo: "var(--coral-claro)", tinta: "var(--tinta)" },
  destravar:    { nome: "Destravar",      fundo: "var(--creme)",       tinta: "var(--tinta)" },
  abrir:        { nome: "Avaliar",        fundo: "var(--creme)",       tinta: "var(--tinta)" },
  manter:       { nome: "Não mexer",      fundo: "var(--verde-claro)", tinta: "var(--tinta)" },
};

export function MovimentoCard({ m, compacto = false }: { m: Movimento; compacto?: boolean }) {
  const t = TIPO[m.tipo];
  return (
    <article className={`rounded-[var(--radius)] p-6 sm:p-8 ${m.resolvido ? "opacity-55" : ""}`}
      style={{ background: t.fundo, color: t.tinta }}>
      <div className="flex items-center gap-3 flex-wrap mb-5">
        <span className="rotulo !text-current opacity-70">{t.nome}</span>
        <span className="rotulo !text-current opacity-55">
          {m.quantas} {m.unidade ?? "famílias"}
        </span>
        {m.score?.urgencia === "agora" && !m.resolvido && (
          <span className="rotulo !text-[var(--creme)] bg-[var(--tinta)] px-2.5 py-1 rounded-full">
            não espera segunda
          </span>
        )}
        {m.resolvido && <span className="rotulo !text-current opacity-70">· feito</span>}
      </div>

      <h3 className="text-[26px] sm:text-[30px] leading-[1.1] tracking-[-0.03em] font-bold
        max-w-[20ch]">
        {m.titulo}
      </h3>

      <p className="prosa mt-4 opacity-80 max-w-[58ch]">{m.porque}</p>

      {m.score && !m.resolvido && (
        <p className="rotulo !text-current opacity-55 mt-4">{m.score.porque}</p>
      )}

      {!compacto && m.artefato && (
        <div className="mt-6 bg-[var(--creme)] rounded-2xl p-5">
          <p className="rotulo mb-2">{m.artefato.rotulo}</p>
          <p className="prosa max-w-[58ch]">{m.artefato.conteudo}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5 mt-7">
        {m.copiar && <Copiar texto={m.copiar.texto} rotulo={m.copiar.rotulo} />}
        <Resolver chave={m.chave} resolvido={Boolean(m.resolvido)} />
        {m.href && (
          <Link href={m.href}
            className="rotulo !text-current opacity-65 hover:opacity-100 ml-1
              underline underline-offset-4">
            ver a evidência
          </Link>
        )}
      </div>
    </article>
  );
}
