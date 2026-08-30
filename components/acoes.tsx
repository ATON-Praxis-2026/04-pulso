"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/** Copiar é o único caminho entre "decidi" e "aconteceu".
 *  Sem isto, a alternativa é arrastar as alças de seleção dentro de uma div. */
export function Copiar({
  texto, rotulo = "Copiar", className = "",
}: { texto: string; rotulo?: string; className?: string }) {
  const [feito, setFeito] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
        } catch {
          // Navegador sem permissão de clipboard: seleciona para o usuário copiar.
          const el = document.createElement("textarea");
          el.value = texto; document.body.appendChild(el);
          el.select(); document.execCommand("copy"); el.remove();
        }
        setFeito(true);
        setTimeout(() => setFeito(false), 2000);
      }}
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 px-4 py-2 text-[15px] min-h-10
        border border-[var(--tinta)] bg-[var(--tinta)] text-white
        transition-colors hover:bg-[var(--oliva)] hover:border-[var(--oliva)] ${className}`}
    >
      {feito ? "Copiado ✓" : rotulo}
    </button>
  );
}

export function Resolver({ chave, resolvido }: { chave: string; resolvido: boolean }) {
  const [pendente, iniciar] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pendente}
      onClick={() =>
        iniciar(async () => {
          await fetch("/api/resolver", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ chave, desfazer: resolvido }),
          });
          router.refresh();
        })
      }
      className="inline-flex items-center gap-1.5 px-4 py-2 text-[15px] min-h-10
        border border-[var(--regua)] bg-transparent
        transition-colors hover:border-[var(--tinta)] disabled:opacity-50"
    >
      {resolvido ? "Reabrir" : "Já resolvi"}
    </button>
  );
}
