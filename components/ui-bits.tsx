import Link from "next/link";

/** A cor diz o que o bloco é. Não decora. */
export const COR = {
  creme: "bg-[var(--creme)] text-[var(--tinta)]",
  coral: "bg-[var(--coral)] text-[var(--tinta)]",
  coralClaro: "bg-[var(--coral-claro)] text-[var(--tinta)]",
  azul: "bg-[var(--azul)] text-[var(--tinta)]",
  verdeClaro: "bg-[var(--verde-claro)] text-[var(--tinta)]",
  verde: "bg-[var(--verde)] text-white",
  tinta: "bg-[var(--tinta)] text-[var(--creme)]",
} as const;
export type Cor = keyof typeof COR;

export function Tile({
  valor, rotulo, nota, cor = "creme", href,
}: { valor: string | number; rotulo: string; nota?: string; cor?: Cor; href?: string }) {
  const corpo = (
    <>
      <p className="text-[30px] leading-none tabular-nums font-bold tracking-[-0.03em]">{valor}</p>
      <p className="text-sm mt-3">{rotulo}</p>
      {nota && <p className="rotulo mt-1.5 opacity-70">{nota}</p>}
    </>
  );
  const cls = `${COR[cor]} rounded-[var(--radius)] p-6`;
  return href
    ? <Link href={href} className={`${cls} block transition-opacity hover:opacity-90`}>{corpo}</Link>
    : <div className={cls}>{corpo}</div>;
}

export function Painel({
  titulo, sub, acao, cor = "creme", children, className = "",
}: {
  titulo: string; sub?: string; acao?: React.ReactNode; cor?: Cor;
  children: React.ReactNode; className?: string;
}) {
  return (
    <section className={`${COR[cor]} rounded-[var(--radius)] p-6 sm:p-7 ${className}`}>
      <header className="flex items-baseline gap-4 mb-5">
        <div className="min-w-0">
          <h2 className="text-[19px] font-bold tracking-[-0.02em] leading-tight">{titulo}</h2>
          {sub && <p className="prosa !text-[15px] opacity-70 mt-1.5 max-w-[58ch]">{sub}</p>}
        </div>
        {acao && <div className="ml-auto shrink-0">{acao}</div>}
      </header>
      {children}
    </section>
  );
}

export function Cabecalho({ titulo, sub, cor = "creme" }: { titulo: string; sub?: string; cor?: Cor }) {
  // O título visível está na barra do topo. Aqui ele fica só para leitor de tela,
  // porque a página precisa do seu h1.
  return (
    <>
      <h1 className="sr-only">{titulo}</h1>
      {sub && (
        <header className={`${COR[cor]} rounded-[var(--radius)] px-6 sm:px-8 py-5 mb-3`}>
          <p className="prosa opacity-75 max-w-[68ch]">{sub}</p>
        </header>
      )}
    </>
  );
}
