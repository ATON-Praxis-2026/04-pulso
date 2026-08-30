import Link from "next/link";
import { familiasComSinal } from "@/lib/queries";
import { CONFIG } from "@/lib/config";
import { Cabecalho } from "@/components/ui-bits";
import { Copiar } from "@/components/acoes";
import { dataCurta } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default function Familias() {
  const dados = familiasComSinal();

  return (
    <div className="max-w-3xl">
      <Cabecalho titulo="Famílias que deram sinal"
        sub="Quem já disse alguma coisa — ou quem parou de dizer. Cada linha traz a frase que a família escreveu, com a data." />

      <div className="space-y-3">
        {dados.map((p) => (
          <article key={p.id} className="border border-border rounded-lg bg-card p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-[family-name:var(--font-newsreader)] text-xl">{p.nome}</h2>
              {[...new Set(p.sinais.map((s) => s.tipo))].map((tipo) => (
                <span key={tipo}
                  className="text-xs rounded px-1.5 py-0.5 bg-muted text-muted-foreground">
                  {CONFIG.sinaisLabel[tipo] ?? tipo}
                </span>
              ))}
              {p.dias !== null && (
                <span className="ml-auto rotulo shrink-0">há {p.dias} dias</span>
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
          Nenhuma família deu sinal esta semana. É uma boa notícia.
        </p>
      )}
    </div>
  );
}
