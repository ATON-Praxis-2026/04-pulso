import { temas, desejos, textoDoTema } from "@/lib/queries";

import { Painel, Cabecalho } from "@/components/ui-bits";
import { Copiar } from "@/components/acoes";
import { BarrasH } from "@/components/charts";

export const dynamic = "force-dynamic";

export default function Temas() {
  const lista = temas();
  const d = desejos()[0];
  const principal = lista[0];
  const txt = principal && textoDoTema(principal.tema);

  return (
    <div className="space-y-6">
      <Cabecalho titulo="Temas e desejos"
        sub="O que mais se repete no último mês, e o que pedem que a escola não tem." />

      {principal && (
        <Painel
          titulo={`O que mais dói: ${principal.label.toLowerCase()}`}
          sub={`${principal.n} contatos no mês${principal.variacao > 0 ? `, ${principal.variacao} a mais que no anterior` : ""}`}
        >
          {txt ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{txt.diagnostico}</p>
              <div className="rounded-md border border-border bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Texto pronto para publicar no site e no WhatsApp Business
                </p>
                <p className="leading-relaxed">{txt.texto}</p>
              </div>
              <Copiar texto={txt.texto} rotulo="Copiar o texto" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Texto ainda não gerado para este tema.</p>
          )}
        </Painel>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Painel titulo="Todos os temas do mês">
          <BarrasH dados={lista.map((t, i) => ({
            label: t.label, valor: t.n, destaque: i === 0,
            extra: t.variacao ? `${t.variacao > 0 ? "+" : ""}${t.variacao}` : undefined,
          }))} />
        </Painel>

        <div className="space-y-6">
          <Painel titulo="O que pedem e não existe">
            {d ? (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-medium text-lg">{d.label}</p>
                  <p className="font-mono text-3xl tabular-nums">{d.n}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  pessoas pediram no mês algo que a escola não oferece. Nas palavras delas:
                </p>
                <ul className="space-y-1.5">
                  {d.falas.map((f) => (
                    <li key={f} className="text-sm border-l-2 border-border pl-3 italic text-foreground/90">
                      “{f}”
                    </li>
                  ))}
                </ul>
              </div>
            ) : <p className="text-sm text-muted-foreground">Nenhum pedido recorrente fora da oferta.</p>}
          </Painel>


        </div>
      </div>
    </div>
  );
}
