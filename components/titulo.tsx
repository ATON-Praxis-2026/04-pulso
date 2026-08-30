"use client";
import { usePathname } from "next/navigation";

/** O nome da seção mora na barra do topo, não numa faixa própria abaixo dela. */
const TITULOS: [string, string][] = [
  ["/decisoes", "O quadro"],
  ["/familias", "Famílias que deram sinal"],
  ["/temas", "Temas e desejos"],
  ["/operacao", "Operação"],
  ["/conversas", "Conversas"],
  ["/numeros", "Os números"],
  ["/contexto", "O que sabemos da escola"],
  ["/como-funciona", "Como o Pulso decide"],
  ["/conversa", "A conversa"],
];

export function TituloDaPagina() {
  const path = usePathname();
  const achado = TITULOS.find(([href]) => path.startsWith(href));
  return (
    <p className="text-[19px] sm:text-[22px] font-bold tracking-[-0.03em] truncate">
      {achado ? achado[1] : "A semana"}
    </p>
  );
}
