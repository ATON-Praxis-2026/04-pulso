"use client";
import { useState } from "react";

import { VIZ } from "@/lib/viz";
export { VIZ };

/** Os valores em texto, para quem não alcança o tooltip do mouse. */
function Tabela({ titulo, linhas }: { titulo: string; linhas: [string, string][] }) {
  return (
    <table className="sr-only">
      <caption>{titulo}</caption>
      <tbody>
        {linhas.map(([k, v]) => (
          <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function Tip({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <foreignObject x={Math.max(0, x - 70)} y={Math.max(0, y - 62)} width={160} height={60}
      style={{ overflow: "visible", pointerEvents: "none" }}>
      <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-[11px] leading-snug shadow-lg whitespace-nowrap inline-block">
        {children}
      </div>
    </foreignObject>
  );
}

/** Volume por semana: o que precisava existir vs. o que não precisava. */
export function AreaSemanal({
  dados,
}: { dados: { semana: string; necessario: number; evitavel: number; total: number }[] }) {
  const [i, setI] = useState<number | null>(null);
  const W = 720, H = 200, P = { t: 12, r: 8, b: 24, l: 34 };
  const max = Math.max(...dados.map((d) => d.total), 1);
  const x = (n: number) => P.l + (n / Math.max(dados.length - 1, 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  const linha = (get: (d: (typeof dados)[0]) => number) =>
    dados.map((d, n) => `${n ? "L" : "M"}${x(n)},${y(get(d))}`).join(" ");
  const area = (get: (d: (typeof dados)[0]) => number) =>
    `${linha(get)} L${x(dados.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;

  const ticks = [0, Math.round(max / 2), max];

  return (
    <figure className="m-0">
      <div className="flex items-center gap-4 mb-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px]" style={{ background: VIZ.s1 }} />
          <span className="text-muted-foreground">Precisava existir</span>
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="8" aria-hidden className="shrink-0">
            <line x1="0" y1="4" x2="16" y2="4" stroke={VIZ.s2} strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          <span className="text-muted-foreground">Evitável (tracejado)</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
        aria-label="Conversas por semana, separadas entre evitáveis e necessárias">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke={VIZ.grid} strokeWidth={1} />
            <text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={VIZ.muted}>{t}</text>
          </g>
        ))}
        <path d={area((d) => d.total)} fill={VIZ.s2} opacity={0.13} />
        <path d={area((d) => d.necessario)} fill="var(--card)" />
        <path d={area((d) => d.necessario)} fill={VIZ.s1} opacity={0.13} />
        <path d={linha((d) => d.total)} fill="none" stroke={VIZ.s2} strokeWidth={2}
          strokeDasharray="5 3" strokeLinejoin="round" strokeLinecap="round" />
        <path d={linha((d) => d.necessario)} fill="none" stroke={VIZ.s1} strokeWidth={2}
          strokeLinejoin="round" strokeLinecap="round" />

        {dados.map((d, n) => (
          <rect key={d.semana} x={x(n) - 12} y={0} width={24} height={H} fill="transparent"
            onMouseEnter={() => setI(n)} onMouseLeave={() => setI(null)} />
        ))}
        {i !== null && (
          <>
            <line x1={x(i)} x2={x(i)} y1={P.t} y2={H - P.b} stroke={VIZ.eixo} strokeWidth={1} />
            <circle cx={x(i)} cy={y(dados[i].total)} r={4} fill={VIZ.s2}
              stroke="var(--card)" strokeWidth={2} />
            <circle cx={x(i)} cy={y(dados[i].necessario)} r={4} fill={VIZ.s1}
              stroke="var(--card)" strokeWidth={2} />
            <Tip x={x(i)} y={y(dados[i].total)}>
              <div className="font-medium">{dados[i].total} conversas</div>
              <div className="text-muted-foreground">{dados[i].evitavel} evitáveis</div>
            </Tip>
          </>
        )}
        <line x1={P.l} x2={W - P.r} y1={y(0)} y2={y(0)} stroke={VIZ.eixo} strokeWidth={1} />
      </svg>
      <Tabela titulo="Conversas por semana"
        linhas={dados.map((d) => [d.semana, `${d.total} conversas, ${d.evitavel} evitáveis`])} />
    </figure>
  );
}

/** Barras horizontais, série única. Identidade entre categorias — uma cor só. */
export function BarrasH({
  dados, cor = VIZ.s1, sufixo = "",
}: {
  dados: { label: string; valor: number; extra?: string; destaque?: boolean }[];
  cor?: string; sufixo?: string;
}) {
  const max = Math.max(...dados.map((d) => d.valor), 1);
  // Ordena sempre: barra menor acima de barra maior lê como defeito.
  const ord = [...dados].sort((a, b) => b.valor - a.valor);
  return (
    <div className="space-y-2.5">
      {ord.map((d) => (
        <div key={d.label} className="group grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-sm truncate ${d.destaque ? "font-medium" : ""}`}>{d.label}</span>
              {d.extra && <span className="text-[11px] font-mono text-muted-foreground shrink-0">{d.extra}</span>}
            </div>
            <div className="h-2 rounded-[3px] bg-muted/40 overflow-hidden">
              <div className="h-full rounded-[3px] transition-[width] duration-500"
                style={{ width: `${(d.valor / max) * 100}%`, background: d.destaque ? cor : `${cor}99` }} />
            </div>
          </div>
          <span className="font-mono text-sm tabular-nums text-right w-12">
            {d.valor}{sufixo}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Barras verticais com extremidade arredondada, ancoradas na linha de base. */
export function BarrasV({
  dados, alerta,
}: { dados: { label: string; valor: number; n: number }[]; alerta?: number }) {
  const [i, setI] = useState<number | null>(null);
  const W = 320, H = 150, P = { t: 16, r: 4, b: 22, l: 28 };
  const max = Math.max(...dados.map((d) => d.valor), 1);
  const bw = (W - P.l - P.r) / dados.length;
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
      aria-label="Tempo de primeira resposta por dia da semana, em horas úteis">
      <line x1={P.l} x2={W - P.r} y1={y(0)} y2={y(0)} stroke={VIZ.eixo} strokeWidth={1} />
      {dados.map((d, n) => {
        const alto = alerta !== undefined && d.valor > alerta;
        const h = Math.max(y(0) - y(d.valor), 2);
        return (
          <g key={d.label} onMouseEnter={() => setI(n)} onMouseLeave={() => setI(null)}>
            <rect x={P.l + n * bw} y={0} width={bw} height={H} fill="transparent" />
            <rect x={P.l + n * bw + bw * 0.22} y={y(d.valor)} width={bw * 0.56} height={h}
              rx={3} fill={alto ? VIZ.atencao : VIZ.s1} opacity={i === null || i === n ? 1 : 0.5} />
            <text x={P.l + n * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize={11} fill={VIZ.muted}>
              {d.label}
            </text>
            <text x={P.l + n * bw + bw / 2} y={y(d.valor) - 5} textAnchor="middle" fontSize={11}
              fill="var(--foreground)" className={alto ? "font-mono font-semibold" : "font-mono"}>
              {alto ? `▲ ${d.valor}h` : `${d.valor}h`}
            </text>
          </g>
        );
      })}
      {i !== null && (
        <Tip x={P.l + i * bw + bw / 2} y={y(dados[i].valor)}>
          <div className="font-medium">{dados[i].valor}h de expediente até a 1ª resposta</div>
          <div className="text-muted-foreground">{dados[i].n} conversas</div>
        </Tip>
      )}
      <foreignObject x={0} y={0} width={1} height={1}>
        <Tabela titulo="Tempo até a primeira resposta por dia"
          linhas={dados.map((d) => [d.label, `${d.valor}h, ${d.n} conversas`])} />
      </foreignObject>
    </svg>
  );
}


/** Distribuição por hora do dia. Colunas finas, base ancorada. */
export function ColunasHora({ dados }: { dados: { hora: number; n: number }[] }) {
  const [i, setI] = useState<number | null>(null);
  const W = 340, H = 150, P = { t: 14, r: 4, b: 20, l: 4 };
  const max = Math.max(...dados.map((d) => d.n), 1);
  const bw = (W - P.l - P.r) / Math.max(dados.length, 1);
  const y0 = H - P.b;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
      aria-label="Mensagens recebidas por hora do dia">
      <line x1={P.l} x2={W - P.r} y1={y0} y2={y0} stroke={VIZ.eixo} strokeWidth={1} />
      {dados.map((d, n) => {
        const h = Math.max((d.n / max) * (y0 - P.t), 2);
        return (
          <g key={d.hora} onMouseEnter={() => setI(n)} onMouseLeave={() => setI(null)}>
            <rect x={P.l + n * bw} y={0} width={bw} height={H} fill="transparent" />
            <rect x={P.l + n * bw + bw * 0.18} y={y0 - h} width={bw * 0.64} height={h}
              rx={2.5} fill={VIZ.s1} opacity={i === null || i === n ? 0.9 : 0.45} />
            {d.hora % 3 === 0 && (
              <text x={P.l + n * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize={11}
                fill={VIZ.muted} className="font-mono">{d.hora}h</text>
            )}
          </g>
        );
      })}
      {i !== null && (
        <Tip x={P.l + i * bw + bw / 2} y={y0 - (dados[i].n / max) * (y0 - P.t)}>
          <div className="font-medium">{dados[i].n} mensagens</div>
          <div className="text-muted-foreground">entre {dados[i].hora}h e {dados[i].hora + 1}h</div>
        </Tip>
      )}
    </svg>
  );
}
