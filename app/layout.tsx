import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import { Nav, NavMobile } from "@/components/nav";
import { movimentos } from "@/lib/analytics";
import { CONFIG, PRODUTO } from "@/lib/config";
import "./globals.css";

const serifada = Newsreader({
  variable: "--font-newsreader", subsets: ["latin"],
  weight: ["300", "400", "500", "600"], style: ["normal", "italic"],
});
const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Pulso",
  description: "Tudo o que chega no WhatsApp da secretaria, virado em decisão.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  let n = 0;
  try { n = movimentos().filter((m) => m.estado !== "feito").length; } catch { /* npm run seed */ }

  return (
    <html lang="pt-BR" className={`${serifada.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--oliva-fundo)]">
        <div className="flex min-h-screen">
          {/* A moldura é oliva; o conteúdo é papel. Três superfícies, como na
              referência: fundo → papel → cartão branco. */}
          <aside className="w-56 shrink-0 hidden md:flex flex-col bg-[var(--oliva)] text-white/90">
            <div className="h-16 flex items-center px-6">
              <Link href="/" className="font-[family-name:var(--font-newsreader)] text-xl
                text-white tracking-tight">
                {PRODUTO}
              </Link>
            </div>
            <div className="px-3 flex-1"><Nav decisoes={n} /></div>
            <div className="p-6 space-y-3 border-t border-white/10">
              <div>
                <p className="text-sm text-white">{CONFIG.escola}</p>
                <p className="rotulo !text-white/55 mt-0.5">{CONFIG.gestor} · diretor</p>
              </div>
              <Link href="/como-funciona" className="block text-sm text-white/60 hover:text-white">
                como o {PRODUTO} decide
              </Link>
            </div>
          </aside>

          <div className="flex-1 min-w-0 bg-background md:rounded-l-xl">
            <header className="h-16 flex items-center px-5 sm:px-8 gap-4 border-b border-border">
              <Link href="/" className="md:hidden font-[family-name:var(--font-newsreader)]
                text-lg tracking-tight">
                {PRODUTO}
              </Link>
              <span className="ml-auto rotulo flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[var(--verde)]" aria-hidden />
                <span className="hidden sm:inline">lendo o whatsapp da secretaria</span>
                <span className="sm:hidden">lendo</span>
              </span>
            </header>
            <main className="px-5 sm:px-8 py-8 pb-24 md:pb-12 max-w-[1140px]">{children}</main>
          </div>
        </div>
        <NavMobile decisoes={n} />
      </body>
    </html>
  );
}
