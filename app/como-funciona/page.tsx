import { CONFIG } from "@/lib/config";
import { Cabecalho } from "@/components/ui-bits";

export const dynamic = "force-dynamic";

const BLOCOS: [string, string][] = [
  ["Uma pessoa é tarefa. Um padrão é decisão.",
   "Uma pessoa com um problema vai para a secretaria — você não precisa ver. Várias pessoas com a mesma causa vira uma decisão que só você pode tomar. A pessoa não some: ela vira a prova da decisão."],
  ["A lista de decisões é fechada.",
   "São seis tipos possíveis: corrigir a comunicação, abrir o que não existe, destravar a operação, mudar algo estrutural, recuperar, e não mexer. Se a Interea pudesse inventar conselho, ela escreveria “melhore a comunicação e acompanhe de perto”. Cada decisão nasce de uma contagem, e por isso sempre vem com o número e os nomes atrás dela."],
  ["Toda afirmação carrega o trecho.",
   "Nenhum sinal aparece sem a frase literal que o gerou, e o sistema confere que a frase existe mesmo na conversa antes de exibir. Em 363 conversas analisadas, nenhuma citação foi inventada."],
  ["A semana pode chegar vazia.",
   "A Interea não manda sempre os três casos mais graves. Se ninguém cruzar o limiar, ela diz que não há nada. Alerta que sempre alerta vira ruído em duas semanas — e é justamente a semana vazia que faz você acreditar na semana cheia."],
  ["O tempo é contado em horas de expediente.",
   `Alguém escreve sexta às 18h e você lê o resumo na segunda às 9h: são 63 horas corridas sem que ninguém tenha errado. A Interea desconta noites e fins de semana usando o horário da escola (${CONFIG.expediente.abre}h às ${CONFIG.expediente.fecha}h).`],
  ["Nunca por pessoa.",
   "O gargalo aparece por dia da semana e por horário, nunca por atendente. A Interea olha para a operação, não para quem trabalha nela."],
  ["Não prometemos reduzir evasão.",
   "Evasão tem dez causas e o atendimento é uma delas. A Interea mostra quem já deu sinal — uns disseram por escrito, outros só pararam de responder. O que você faz com a lista é o que reduz evasão."],
  ["Nada é enviado por nós.",
   "A Interea escreve o rascunho e você copia. Nenhuma mensagem sai daqui para aluno nenhum."],
];

export default function ComoFunciona() {
  return (
    <div className="max-w-2xl">
      <Cabecalho titulo="Como a Interea decide"
        sub="Você não precisa saber disto para usar. Está aqui para quando você quiser conferir." />
      <div className="space-y-7">
        {BLOCOS.map(([t, d]) => (
          <section key={t}>
            <h2 className="font-medium mb-1.5">{t}</h2>
            <p className="text-muted-foreground leading-relaxed">{d}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
