import type { Metadata } from "next";
import Link from "next/link";
import { Nav, NavMobile } from "@/components/nav";
import { TituloDaPagina } from "@/components/titulo";
import { movimentos } from "@/lib/analytics";
import { CONFIG, PRODUTO } from "@/lib/config";
import "./globals.css";


export const metadata: Metadata = {
  title: "Pulso",
  description: "Tudo o que chega no WhatsApp da secretaria, virado em decisão.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  let n = 0;
  try { n = movimentos().filter((m) => m.estado !== "feito").length; } catch { /* npm run seed */ }

  return (
    <html lang="pt-BR" className="h-full antialiased">
      {/* Carregado direto do Google em vez de pelo pipeline do Next: o
          `next/font` do Turbopack quebra a resolução do módulo interno, e a
          fonte aqui é a identidade — não pode depender disso. */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Newsreader:ital,wght@0,300..500;1,400&display=swap" />
      </head>
      <body className="min-h-full bg-background text-[var(--tinta)]">
        <div className="flex min-h-screen gap-3 p-3">
          {/* O preto é o vão entre os blocos, como na referência. */}
          <aside className="w-60 shrink-0 hidden md:flex flex-col gap-3">
            <div className="bg-[var(--coral)] rounded-[var(--radius)] px-6 py-5">
              <Link href="/" className="text-[24px] tracking-[0.06em] text-[var(--tinta)] font-bold">
                {PRODUTO.toUpperCase()}
              </Link>
              <p className="rotulo !text-[var(--tinta)]/65 mt-1">
                {CONFIG.escola.toLowerCase()}
              </p>
            </div>

            <div className="bg-[var(--creme)] rounded-[var(--radius)] p-3 flex-1">
              <Nav decisoes={n} />
            </div>

            <Link href="/como-funciona"
              className="bg-[var(--verde)] rounded-[var(--radius)] px-6 py-4 block
                transition-opacity hover:opacity-90">
              <p className="rotulo !text-white/70">{CONFIG.gestor} · diretor</p>
              <p className="text-white text-sm mt-1">como o {PRODUTO.toLowerCase()} decide →</p>
            </Link>
          </aside>

          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <header className="bg-[var(--creme)] rounded-[var(--radius)] px-6 sm:px-8 h-16
              flex items-center gap-4 shrink-0">
              <Link href="/" className="md:hidden text-lg font-bold tracking-[0.06em]
                text-[var(--tinta)] shrink-0">{PRODUTO.toUpperCase()}</Link>
              <div className="hidden md:block min-w-0"><TituloDaPagina /></div>
              <span className="ml-auto rotulo flex items-center gap-2 shrink-0">
                <span className="size-2 rounded-full bg-[var(--coral)]" aria-hidden />
                <span className="hidden sm:inline">lendo o whatsapp da secretaria</span>
                <span className="sm:hidden">lendo</span>
              </span>
            </header>

            <main className="flex-1 pb-24 md:pb-0 min-w-0">{children}</main>
          </div>
        </div>
        <NavMobile decisoes={n} />
      </body>
    </html>
  );
}
