/** O motivo gráfico da referência: um anel de pontos, alguns preenchidos.
 *  Aqui ele carrega informação — quantas decisões da semana já foram resolvidas. */
export function Anel({
  total, cheios, tamanho = 44,
}: { total: number; cheios: number; tamanho?: number }) {
  const n = Math.max(total, 1);
  const r = tamanho / 2 - 3;
  const pontos = Math.max(n * 3, 12);
  const preenchidos = Math.round((cheios / n) * pontos);

  return (
    <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`}
      role="img" aria-label={`${cheios} de ${total} resolvidas`} className="shrink-0">
      {Array.from({ length: pontos }, (_, i) => {
        const a = (i / pontos) * Math.PI * 2 - Math.PI / 2;
        return (
          <circle key={i} r={1.8}
            cx={tamanho / 2 + Math.cos(a) * r}
            cy={tamanho / 2 + Math.sin(a) * r}
            fill={i < preenchidos ? "var(--verde)" : "var(--oliva)"}
            opacity={i < preenchidos ? 1 : 0.28} />
        );
      })}
    </svg>
  );
}

/** Etiqueta sólida, pequena, saturada — como `MINDSET` e `SKILLSET` na referência. */
export function Etiqueta({
  children, fundo, tinta = "#ffffff",
}: { children: React.ReactNode; fundo: string; tinta?: string }) {
  return (
    <span className="rotulo !text-[0.625rem] px-1.5 py-[3px] inline-block leading-none"
      style={{ background: fundo, color: tinta }}>
      {children}
    </span>
  );
}
