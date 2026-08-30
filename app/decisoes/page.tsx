import { movimentos } from "@/lib/analytics";
import { MovimentoCard } from "@/components/movimento-card";
import { Cabecalho } from "@/components/ui-bits";

export const dynamic = "force-dynamic";

export default function Decisoes() {
  const mov = movimentos();
  return (
    <div>
      <Cabecalho titulo="Decisões"
        sub="O que só você pode decidir, do mais caro para o menos." />

      <h2 className="sr-only">Decisões desta semana</h2>

      {mov.length === 0 ? (
        <p className="border border-border rounded-lg p-10 text-center text-muted-foreground">
          Nenhum padrão cruzou o limiar esta semana. Nada exige decisão sua.
        </p>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {mov.map((m) => <MovimentoCard key={m.chave} m={m} />)}
        </div>
      )}

      <p className="mt-8 border-t border-border pt-5 max-w-3xl text-sm text-muted-foreground">
        <a href="/como-funciona" className="hover:text-foreground underline underline-offset-4">
          como a Interea decide o que aparece aqui
        </a>
      </p>
    </div>
  );
}
