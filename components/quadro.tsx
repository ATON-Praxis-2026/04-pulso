"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copiar } from "@/components/acoes";
import type { Movimento } from "@/lib/analytics";

const TIPO: Record<string, { nome: string; fundo: string; tinta: string }> = {
  avisar:     { nome: "Volte e avise",  fundo: "var(--verde)",     tinta: "#ffffff" },
  corrigir:   { nome: "Corrigir",       fundo: "var(--azul)",      tinta: "var(--tinta)" },
  estrutural: { nome: "Estrutural",     fundo: "var(--terracota)", tinta: "#ffffff" },
  destravar:  { nome: "Destravar",      fundo: "var(--oliva)",     tinta: "#ffffff" },
  abrir:      { nome: "Avaliar",        fundo: "var(--ocre)",      tinta: "var(--tinta)" },
  manter:     { nome: "Não mexer",      fundo: "var(--verde)",     tinta: "#ffffff" },
};

const COLUNAS = [
  ["decidir", "Para decidir", "chegou esta semana"],
  ["fazendo", "Em andamento", "você decidiu, está acontecendo"],
  ["feito", "Feito", "com o que você fez registrado"],
] as const;

function Cartao({ m }: { m: Movimento }) {
  const [abrindo, setAbrindo] = useState(false);
  const [texto, setTexto] = useState(m.oQueFiz ?? "");
  const [pendente, iniciar] = useTransition();
  const router = useRouter();
  const t = TIPO[m.tipo];

  const mover = (estado: string, o_que_fiz?: string) =>
    iniciar(async () => {
      await fetch("/api/decisao", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ chave: m.chave, estado, o_que_fiz }),
      });
      setAbrindo(false);
      router.refresh();
    });

  return (
    <article className="bg-card p-5 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="rotulo !text-[0.625rem] px-1.5 py-[3px] leading-none"
          style={{ background: t.fundo, color: t.tinta }}>{t.nome}</span>
        <span className="rotulo">{m.quantas} {m.unidade ?? "famílias"}</span>
      </div>

      <h3 className="font-[family-name:var(--font-newsreader)] text-[21px] leading-snug">
        {m.titulo}
      </h3>
      <p className="text-[15px] text-muted-foreground leading-relaxed">{m.porque}</p>

      {m.oQueFiz && (
        <div className="bg-[var(--papel-2)] p-3.5">
          <p className="rotulo mb-1.5">o que você fez</p>
          <p className="text-[15px] leading-relaxed">{m.oQueFiz}</p>
        </div>
      )}

      {abrindo ? (
        <div className="space-y-2 pt-1">
          <label className="rotulo block" htmlFor={`fiz-${m.chave}`}>
            o que você fez? o Pulso aprende com isso
          </label>
          <textarea id={`fiz-${m.chave}`} rows={3} value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ex.: conversei com a coordenação e mudamos o aviso para a 5ª semana"
            className="w-full bg-[var(--papel-2)] border border-border p-3 text-[15px]
              leading-relaxed placeholder:text-muted-foreground" />
          <div className="flex gap-2">
            <button type="button" disabled={pendente} onClick={() => mover("feito", texto)}
              className="px-4 py-2 text-[15px] min-h-10 border border-[var(--tinta)]
                bg-[var(--tinta)] text-white hover:bg-[var(--oliva)] disabled:opacity-50">
              Marcar como feito
            </button>
            <button type="button" onClick={() => setAbrindo(false)}
              className="px-4 py-2 text-[15px] min-h-10 border border-[var(--regua)]
                hover:border-[var(--tinta)]">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          {m.copiar && <Copiar texto={m.copiar.texto} rotulo={m.copiar.rotulo} />}
          {m.estado === "decidir" && (
            <button type="button" disabled={pendente} onClick={() => mover("fazendo")}
              className="px-4 py-2 text-[15px] min-h-10 border border-[var(--regua)]
                hover:border-[var(--tinta)] disabled:opacity-50">
              Vou fazer
            </button>
          )}
          {m.estado !== "feito" && (
            <button type="button" onClick={() => setAbrindo(true)}
              className="px-4 py-2 text-[15px] min-h-10 border border-[var(--regua)]
                hover:border-[var(--tinta)]">
              Já fiz
            </button>
          )}
          {m.estado === "feito" && (
            <button type="button" disabled={pendente} onClick={() => mover("decidir")}
              className="rotulo hover:text-foreground underline underline-offset-4
                decoration-[var(--regua)]">
              reabrir
            </button>
          )}
          {m.href && (
            <Link href={m.href} className="rotulo hover:text-foreground ml-1
              underline underline-offset-4 decoration-[var(--regua)]">
              ver a evidência
            </Link>
          )}
        </div>
      )}
    </article>
  );
}

export function Quadro({ movimentos }: { movimentos: Movimento[] }) {
  return (
    <div className="grid lg:grid-cols-3 gap-5 items-start">
      {COLUNAS.map(([estado, titulo, sub]) => {
        const cartoes = movimentos.filter((m) => (m.estado ?? "decidir") === estado);
        return (
          <section key={estado} className="space-y-3">
            <header className="pb-2 border-b border-border">
              <h2 className="font-[family-name:var(--font-newsreader)] text-xl">
                {titulo} <span className="font-mono text-sm">{cartoes.length}</span>
              </h2>
              <p className="rotulo mt-1">{sub}</p>
            </header>
            {cartoes.map((m) => <Cartao key={m.chave} m={m} />)}
            {cartoes.length === 0 && (
              <p className="text-[15px] text-muted-foreground py-6 text-center">
                {estado === "decidir" ? "Nada novo esta semana." :
                 estado === "fazendo" ? "Nada em andamento." : "Nada concluído ainda."}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
