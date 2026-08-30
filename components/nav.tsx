"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SECOES: { titulo: string; itens: [string, string, boolean?][] }[] = [
  { titulo: "", itens: [["/", "A semana", true], ["/decisoes", "O quadro"]] },
  { titulo: "Conferir", itens: [
    ["/familias", "Famílias"],
    ["/temas", "Temas e desejos"],
    ["/operacao", "Operação"],
    ["/conversas", "Conversas"],
    ["/numeros", "Os números"],
    ["/contexto", "O que sabemos"],
  ]},
];

export const MOBILE: [string, string][] = [
  ["/", "Semana"],
  ["/familias", "Famílias"],
  ["/conversas", "Conversas"],
];

const ativo = (path: string, href: string) =>
  href === "/" ? path === "/" : path.startsWith(href);

export function Nav({ decisoes }: { decisoes: number }) {
  const path = usePathname();
  return (
    <nav className="space-y-5">
      {SECOES.map((s, i) => (
        <div key={s.titulo || i}>
          {s.titulo && <p className="rotulo px-3 mb-2">{s.titulo}</p>}
          <ul className="space-y-1">
            {s.itens.map(([href, label, badge]) => (
              <li key={href}>
                <Link href={href}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm
                    transition-colors ${ativo(path, href)
                      ? "bg-[var(--tinta)] text-[var(--creme)]"
                      : "text-[var(--tinta)] hover:bg-[var(--muted)]"}`}>
                  {label}
                  {badge && decisoes > 0 && (
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full leading-none
                      ${ativo(path, href) ? "bg-[var(--coral)] text-[var(--tinta)]"
                                          : "bg-[var(--coral)] text-[var(--tinta)]"}`}>
                      {decisoes}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function NavMobile({ decisoes }: { decisoes: number }) {
  const path = usePathname();
  return (
    <nav className="md:hidden fixed bottom-3 inset-x-3 z-20 bg-[var(--creme)]
      rounded-[var(--radius)] grid grid-cols-3 overflow-hidden">
      {MOBILE.map(([href, label]) => (
        <Link key={href} href={href}
          className={`flex items-center justify-center gap-2 min-h-16 text-sm transition-colors ${
            ativo(path, href) ? "bg-[var(--tinta)] text-[var(--creme)]" : "text-[var(--tinta)]"}`}>
          {label}
          {href === "/" && decisoes > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full leading-none
              bg-[var(--coral)] text-[var(--tinta)]">{decisoes}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
