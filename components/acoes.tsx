"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const BASE = "inline-flex items-center gap-1.5 px-5 py-2.5 text-sm min-h-11 rounded-full transition-opacity";

/** Copiar é o único caminho entre "decidi" e "aconteceu". */
export function Copiar({
  texto, rotulo = "Copiar", className = "",
}: { texto: string; rotulo?: string; className?: string }) {
  const [feito, setFeito] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(texto); }
        catch {
          const el = document.createElement("textarea");
          el.value = texto; document.body.appendChild(el);
          el.select(); document.execCommand("copy"); el.remove();
        }
        setFeito(true);
        setTimeout(() => setFeito(false), 2000);
      }}
      aria-live="polite"
      className={`${BASE} bg-[var(--tinta)] text-[var(--creme)] hover:opacity-85 ${className}`}
    >
      {feito ? "Copiado ✓" : rotulo}
    </button>
  );
}

export function Resolver({ chave, resolvido }: { chave: string; resolvido: boolean }) {
  const [pendente, iniciar] = useTransition();
  const router = useRouter();
  return (
    <button type="button" disabled={pendente}
      onClick={() =>
        iniciar(async () => {
          await fetch("/api/resolver", {
            method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({ chave, desfazer: resolvido }),
          });
          router.refresh();
        })}
      className={`${BASE} border border-[var(--tinta)]/25 hover:border-[var(--tinta)] disabled:opacity-50`}>
      {resolvido ? "Reabrir" : "Já resolvi"}
    </button>
  );
}
