import Link from "next/link";
import { movimentos } from "@/lib/analytics";
import { Quadro } from "@/components/quadro";
import { Cabecalho } from "@/components/ui-bits";

export const dynamic = "force-dynamic";

export default function Decisoes() {
  const mov = movimentos();
  const feitas = mov.filter((m) => m.estado === "feito").length;

  return (
    <div>
      <Cabecalho titulo="O quadro"
        sub="O que só você pode decidir. Ao fechar um cartão, conte o que fez — é assim que o Pulso aprende o jeito desta escola." />

      {mov.length === 0 ? (
        <p className="bg-card p-10 text-center text-muted-foreground">
          Nenhum padrão cruzou o limiar esta semana. Nada exige decisão sua.
        </p>
      ) : (
        <Quadro movimentos={mov} />
      )}

      <p className="mt-10 pt-5 border-t border-border max-w-2xl text-[15px] text-muted-foreground">
        {feitas > 0
          ? `${feitas} ${feitas === 1 ? "decisão fechada alimenta" : "decisões fechadas alimentam"} o contexto que o Pulso usa nas próximas análises. `
          : "Cada decisão fechada com um registro do que foi feito alimenta o contexto das próximas análises. "}
        <Link href="/contexto" className="underline underline-offset-4 decoration-[var(--regua)] hover:decoration-current">
          ver o que o Pulso sabe sobre a escola
        </Link>
      </p>
    </div>
  );
}
