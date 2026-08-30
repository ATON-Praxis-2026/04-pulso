import { kpis, serieSemanal, tiposContato, gargaloPorDia, semSerRespondidas } from "@/lib/analytics";
import { temas } from "@/lib/queries";
import { Tile, Painel, Cabecalho } from "@/components/ui-bits";
import { AreaSemanal, BarrasH, BarrasV } from "@/components/charts";
import { VIZ } from "@/lib/viz";
import { brl, numero } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default function Numeros() {
  const k = kpis();
  const serie = serieSemanal();
  const tipos = tiposContato();
  const ts = temas().slice(0, 7);
  const dias = gargaloPorDia();
  const reclamacao = tipos.find((t) => t.tipo === "problema")?.pct ?? 0;

  return (
    <div className="space-y-6">
      <Cabecalho titulo="Os números"
        sub="Últimos 30 dias. Serve para conferir de onde vêm as decisões da semana." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile valor={k.conversasMes} rotulo="conversas no mês"
          nota={`${numero(k.mensagens)} mensagens lidas`} />
        <Tile valor={`${k.evitavelPct}%`} rotulo="não precisava chegar"
          nota={`${k.evitaveis} contatos`} tom={k.evitavelPct > 40 ? "alerta" : "normal"} />
        <Tile valor={`${k.primeiraResposta}h`} rotulo="até a primeira resposta"
          nota="contando só horas de expediente" />
        <Tile valor={brl(k.exposicao)} rotulo="parado esperando resposta"
          href="/pessoas?lista=interessados" tom="alerta"
          nota={`${semSerRespondidas()} conversas sem resposta nenhuma`} />
      </div>

      <Painel titulo="Volume por semana"
        sub="Quanto do que chega não precisava ter chegado.">
        <AreaSemanal dados={serie} />
      </Painel>

      <div className="grid lg:grid-cols-2 gap-6">
        <Painel titulo="O que mais dói" sub="temas do mês"
          acao={<a href="/temas" className="text-sm text-muted-foreground hover:text-foreground">ver todos</a>}>
          <BarrasH dados={ts.map((t, i) => ({
            label: t.label, valor: t.n, destaque: i === 0,
            extra: t.variacao ? `${t.variacao > 0 ? "+" : ""}${t.variacao}` : undefined,
          }))} />
        </Painel>

        <Painel titulo="Do que as pessoas falam"
          sub={`Reclamação é ${reclamacao}% do que entra. O resto vale mais.`}>
          <BarrasH cor={VIZ.s2}
            dados={tipos.map((t) => ({
              label: t.label, valor: t.n, extra: `${t.pct}%`,
              destaque: t.tipo === "pedido_inexistente" || t.tipo === "interesse_comercial",
            }))} />
        </Painel>
      </div>

      <Painel titulo="Onde a operação trava"
        sub={`Tempo até a primeira resposta, em horas de expediente. Média de ${k.primeiraResposta}h.`}
        acao={<a href="/operacao" className="text-sm text-muted-foreground hover:text-foreground">detalhar</a>}>
        <div className="max-w-sm">
          <BarrasV dados={dias.map((d) => ({ label: d.dia, valor: d.horas, n: d.n }))}
            alerta={(dias.reduce((a, b) => a + b.horas, 0) / (dias.length || 1)) * 1.5} />
        </div>
      </Painel>
    </div>
  );
}
