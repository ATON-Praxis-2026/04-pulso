import Link from "next/link";

export function Tile({
  valor, rotulo, nota, tom = "normal", href,
}: {
  valor: string | number; rotulo: string; nota?: string;
  tom?: "normal" | "alerta" | "bom"; href?: string;
}) {
  const cor = tom === "alerta" ? "text-[var(--terracota)]"
            : tom === "bom" ? "text-[var(--verde)]" : "";
  const corpo = (
    <>
      <p className={`font-mono text-[28px] leading-none tabular-nums ${cor}`}>{valor}</p>
      <p className="text-[15px] mt-3">{rotulo}</p>
      {nota && <p className="rotulo mt-1">{nota}</p>}
    </>
  );
  const cls = "bg-card p-5";
  return href
    ? <Link href={href} className={`${cls} block transition-colors hover:bg-[var(--papel-2)]`}>{corpo}</Link>
    : <div className={cls}>{corpo}</div>;
}

export function Painel({
  titulo, sub, acao, children, className = "",
}: {
  titulo: string; sub?: string; acao?: React.ReactNode;
  children: React.ReactNode; className?: string;
}) {
  return (
    <section className={`bg-card ${className}`}>
      <header className="flex items-baseline gap-4 px-6 pt-6 pb-5">
        <div className="min-w-0">
          <h2 className="font-[family-name:var(--font-newsreader)] text-[22px] leading-tight">
            {titulo}
          </h2>
          {sub && <p className="text-[15px] text-muted-foreground mt-1 max-w-[58ch]">{sub}</p>}
        </div>
        {acao && <div className="ml-auto shrink-0">{acao}</div>}
      </header>
      <div className="px-6 pb-6">{children}</div>
    </section>
  );
}

export function Cabecalho({ titulo, sub }: { titulo: string; sub?: string }) {
  return (
    <header className="mb-8">
      <h1 className="font-[family-name:var(--font-newsreader)] text-[38px] leading-[1.1]
        tracking-[-0.02em]">
        {titulo}
      </h1>
      {sub && <p className="text-[17px] text-muted-foreground mt-2 max-w-[62ch]">{sub}</p>}
    </header>
  );
}
