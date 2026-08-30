import { kpis, gargaloPorDia, porHora, temasEvitaveis, semSerRespondidas } from "@/lib/analytics";
import { CONFIG } from "@/lib/config";
import { Painel, Cabecalho, Tile } from "@/components/ui-bits";
import { VIZ } from "@/lib/viz";
import { BarrasH, BarrasV, ColunasHora } from "@/components/charts";

export const dynamic = "force-dynamic";

export default function Operacao() {
  const k = kpis();
  const dias = gargaloPorDia();
  const media = dias.reduce((a, b) => a + b.horas, 0) / (dias.length || 1);
  const horas = porHora();
  const evit = temasEvitaveis();

  return (
    <div className="space-y-6">
      <Cabecalho titulo="Operação"
        sub="Onde o atendimento trava. Por dia e por horário — nunca por pessoa." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile valor={`${k.primeiraResposta}h`} rotulo="1ª resposta, média" nota="em horas úteis" />
        <Tile valor={semSerRespondidas()} rotulo="nunca respondidas" tom="alerta" />
        <Tile valor={`${k.evitavelPct}%`} rotulo="do volume é evitável"
          nota={`${k.evitaveis} contatos no mês`} tom={k.evitavelPct > 40 ? "alerta" : "normal"} />
        <Tile valor={CONFIG.expediente.abre + "h–" + CONFIG.expediente.fecha + "h"}
          rotulo="expediente" nota="base do cálculo de horas úteis" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Painel titulo="Por dia da semana"
          sub={`Tempo até a primeira resposta. Média geral de ${k.primeiraResposta}h úteis.`}>
          <BarrasV dados={dias.map((d) => ({ label: d.dia, valor: d.horas, n: d.n }))}
            alerta={media * 1.5} />
          <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
            Contamos só horas de expediente. Sexta 18h → segunda 9h são 63 horas corridas
            sem que ninguém tenha errado.
          </p>
        </Painel>

        <Painel titulo="Por horário" sub="quando as mensagens entram">
          <ColunasHora dados={horas} />

        </Painel>
      </div>

      <Painel titulo="Volume que não precisava existir"
        sub="Contato evitável é aquele que já estaria respondido num texto público. Separa ter muito volume de ter muito volume desnecessário.">
        <BarrasH cor={VIZ.s2}
          dados={evit.slice(0, 8).map((e, i) => ({
            label: CONFIG.temasLabel[e.tema] ?? e.tema,
            valor: e.evit, destaque: i === 0, extra: `${e.pct}% de ${e.n}`,
          }))} />
        <p className="text-sm text-muted-foreground mt-5 pt-4 border-t border-border">
          Corrigir o texto que gera {evit[0]?.evit ?? 0} perguntas é o único movimento que
          diminui trabalho no mês seguinte em vez de aumentar.
        </p>
      </Painel>
    </div>
  );
}
