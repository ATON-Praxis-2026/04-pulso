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
    ["/contexto", "O que sabemos da escola"],
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
    <nav className="space-y-6">
      {SECOES.map((s, i) => (
        <div key={s.titulo || i}>
          {s.titulo && (
            <p className="rotulo !text-white/45 px-3 mb-2">{s.titulo}</p>
          )}
          <ul className="space-y-px">
            {s.itens.map(([href, label, badge]) => (
              <li key={href}>
                <Link href={href}
                  className={`flex items-center gap-2 rounded px-3 py-2 text-[15px] transition-colors ${
                    ativo(path, href)
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/8"}`}>
                  {label}
                  {badge && decisoes > 0 && (
                    <span className="ml-auto font-mono text-xs px-1.5 py-0.5
                      bg-[var(--ocre)] text-[var(--tinta)] leading-none rounded-sm">
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
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-[var(--oliva)] grid grid-cols-3">
      {MOBILE.map(([href, label]) => (
        <Link key={href} href={href}
          className={`flex items-center justify-center gap-1.5 min-h-16 text-[15px] transition-colors ${
            ativo(path, href) ? "text-white" : "text-white/55"}`}>
          {label}
          {href === "/" && decisoes > 0 && (
            <span className="font-mono text-xs px-1.5 py-0.5 bg-[var(--ocre)]
              text-[var(--tinta)] leading-none rounded-sm">{decisoes}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
