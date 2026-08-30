import { contexto, decisoesFeitas } from "@/lib/contexto";
import { movimentos } from "@/lib/analytics";
import { Cabecalho } from "@/components/ui-bits";
import { dataCurta } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default function Contexto() {
  const ctx = contexto();
  const feitas = decisoesFeitas();
  const titulos = new Map(movimentos().map((m) => [m.chave, m.titulo]));

  return (
    <div className="max-w-[760px] space-y-12">
      <Cabecalho titulo="O que o Pulso sabe sobre a escola"
        sub="É isto que faz o agente analisar esta escola, e não “uma escola”. Sem este contexto ele sugeriria o genérico." />

      <section>
        <div className="flex items-baseline gap-3 mb-5 pb-2 border-b border-border">
          <h2 className="font-[family-name:var(--font-newsreader)] text-2xl">Do onboarding</h2>
          <p className="rotulo ml-auto">levantado por uma pessoa, em 20 minutos</p>
        </div>

        <dl className="space-y-6">
          {ctx.map((c) => (
            <div key={c.chave}>
              <dt className="rotulo mb-1.5">{c.rotulo}</dt>
              <dd className="text-[17px] leading-relaxed">{c.valor}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 bg-[var(--papel-2)] p-5 text-[15px] leading-relaxed">
          <span className="rotulo block mb-2">por que isto é humano hoje</span>
          Uma pessoa da nossa equipe senta com a direção e levanta isto na primeira
          conversa. É de propósito: metade destas respostas ninguém escreve num
          formulário, e a escola que se sente ouvida na primeira semana é a que
          continua respondendo na décima. Automatizar este levantamento é o próximo
          passo — e é o que permite entrar em outro nicho sem reconstruir o produto.
        </p>
      </section>

      <section>
        <div className="flex items-baseline gap-3 mb-5 pb-2 border-b border-border">
          <h2 className="font-[family-name:var(--font-newsreader)] text-2xl">Do uso</h2>
          <p className="rotulo ml-auto">{feitas.length} decisões fechadas</p>
        </div>

        {feitas.length === 0 ? (
          <p className="text-[17px] text-muted-foreground leading-relaxed">
            Ainda nenhuma. Quando você fecha um cartão no quadro e conta o que fez,
            aquilo passa a fazer parte do que o Pulso sabe — e ele para de sugerir
            o que esta escola já tentou.
          </p>
        ) : (
          <ul className="space-y-5">
            {feitas.map((d) => (
              <li key={d.chave} className="border-l border-border pl-4">
                <p className="rotulo mb-1">
                  {titulos.get(d.chave) ?? d.chave} · {dataCurta(d.atualizado_em)}
                </p>
                <p className="text-[17px] leading-relaxed">{d.o_que_fiz}</p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 bg-[var(--papel-2)] p-5 text-[15px] leading-relaxed">
          <span className="rotulo block mb-2">por que isto é a defesa</span>
          O onboarding qualquer um copia. Esta lista, não: são meses de decisões
          desta escola específica, com o que funcionou e o que não funcionou. No
          terceiro mês, trocar o Pulso por outra ferramenta significa começar do
          zero — não perder funcionalidade, perder a memória.
        </p>
      </section>
    </div>
  );
}
