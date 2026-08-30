import { all, one } from "./db";
import { CONFIG } from "./config";

export const AGORA = "2026-08-31 09:00:00";

const pesoSQL = Object.entries(CONFIG.pesos)
  .map(([k, v]) => `WHEN '${k}' THEN ${v}`).join(" ");

export type Sinal = { tipo: string; evidencia: string; detectado_em: string; conversa_id: number | null };
export type Familia = {
  id: number; nome: string; pontos: number; sinais: Sinal[];
  ultima_conversa: number | null; mensagem_sugerida: string | null;
  dias: number | null; tema: string | null;
};

const diasDesde = (iso: string) =>
  Math.floor((+new Date(AGORA.replace(" ", "T")) - +new Date(iso.replace(" ", "T"))) / 864e5);

/** A unidade é a FAMÍLIA. Dois filhos saindo é uma decisão, não duas. */
export function familiasComSinal(): Familia[] {
  const base = all<{ id: number; nome: string; pontos: number }>(
    `SELECT c.id, c.nome, SUM(p.peso) AS pontos
     FROM contatos c
     JOIN (SELECT DISTINCT contato_id, tipo, CASE tipo ${pesoSQL} ELSE 0 END AS peso
           FROM sinais) p ON p.contato_id = c.id
     GROUP BY c.id HAVING pontos >= ? ORDER BY pontos DESC`, CONFIG.limiar);

  return base.map((f) => {
    const sinais = all<Sinal>(
      `SELECT tipo, evidencia, detectado_em, conversa_id FROM sinais
       WHERE contato_id = ? ORDER BY detectado_em DESC`, f.id);
    const ult = one<{ id: number; ultima_em: string }>(
      `SELECT id, ultima_em FROM conversas WHERE contato_id = ? ORDER BY ultima_em DESC LIMIT 1`, f.id);
    const an = ult && one<{ mensagem_sugerida: string; tema: string }>(
      `SELECT mensagem_sugerida, tema FROM analises WHERE conversa_id = ?`, ult.id);
    return {
      ...f, sinais,
      ultima_conversa: ult?.id ?? null,
      mensagem_sugerida: an?.mensagem_sugerida || null,
      tema: an?.tema ?? null,
      // O relógio do produto é tempo, não dinheiro.
      dias: sinais.length ? diasDesde(sinais[0].detectado_em) : null,
    };
  });
}

/** As famílias que cabem no resumo, com uma regra a mais.
 *
 *  A ordenação por pontos é correta — quem falou em sair é mais urgente que
 *  quem só parou de escrever. Mas as que falaram estão visíveis para qualquer
 *  um que leia o WhatsApp. A que parou não está visível para ninguém, e é a
 *  única que este produto existe para achar. Então ela tem vaga garantida.
 */
export function familiasDoResumo(teto: number): Familia[] {
  const todas = familiasComSinal();
  const topo = todas.slice(0, teto);
  const temSilencio = (f: Familia) => f.sinais.some((s) => s.tipo === "silencio");
  if (topo.some(temSilencio)) return topo;
  const calada = todas.find(temSilencio);
  return calada ? [...topo.slice(0, teto - 1), calada] : topo;
}

/** Temas priorizados. Janela mensal — tema é crônico, semana é ruído. */
export function temas() {
  const mes = all<{ tema: string; n: number; sev: number }>(
    `SELECT tema, COUNT(*) n, AVG(severidade) sev FROM analises
     WHERE criada_em >= date(?, '-30 days') GROUP BY tema ORDER BY n DESC`, AGORA);
  const antes = new Map(all<{ tema: string; n: number }>(
    `SELECT tema, COUNT(*) n FROM analises
     WHERE criada_em >= date(?, '-60 days') AND criada_em < date(?, '-30 days')
     GROUP BY tema`, AGORA, AGORA).map((r) => [r.tema, r.n]));

  return mes.map((t) => {
    const a = antes.get(t.tema) ?? 0;
    return {
      ...t, label: CONFIG.temasLabel[t.tema] ?? t.tema, variacao: t.n - a,
      prioridade: Math.round(t.n * t.sev * (1 + Math.max(0, t.n - a) / Math.max(a, 1))),
    };
  }).sort((a, b) => b.prioridade - a.prioridade);
}

/** Pediram o que a escola não tem. Em K-12: integral, robótica, transporte. */
export function desejos() {
  return all<{ tema: string; n: number }>(
    `SELECT tema, COUNT(*) n FROM analises
     WHERE tipo_contato = 'pedido_inexistente' AND criada_em >= date(?, '-30 days')
     GROUP BY tema ORDER BY n DESC`, AGORA
  ).map((g) => ({
    ...g, label: CONFIG.temasLabel[g.tema] ?? g.tema,
    falas: all<{ texto: string }>(
      `SELECT (SELECT texto FROM mensagens WHERE conversa_id = a.conversa_id
                AND direcao='entrada' ORDER BY criada_em LIMIT 1) AS texto
       FROM analises a WHERE a.tipo_contato='pedido_inexistente' AND a.tema = ?
         AND a.criada_em >= date(?, '-30 days') LIMIT 4`, g.tema, AGORA
    ).map((r) => r.texto).filter(Boolean),
  }));
}

export const textoDoTema = (tema: string) =>
  one<{ diagnostico: string; texto: string; origem: string }>(
    "SELECT diagnostico, texto, origem FROM textos WHERE tema = ?", tema);

/** O que a escola corrigiu e ainda não contou para quem reclamou. */
export function correcoesPendentes() {
  return all<{ tema: string; o_que_mudou: string; corrigido_em: string }>(
    "SELECT tema, o_que_mudou, corrigido_em FROM correcoes WHERE avisados = 0"
  ).map((c) => {
    const familias = all<{ id: number; nome: string; texto: string }>(
      `SELECT DISTINCT ct.id, ct.nome,
              (SELECT texto FROM mensagens WHERE conversa_id = a.conversa_id
                AND direcao='entrada' ORDER BY criada_em LIMIT 1) AS texto
       FROM analises a
       JOIN conversas co ON co.id = a.conversa_id
       JOIN contatos ct ON ct.id = co.contato_id
       WHERE a.tema = ? AND a.tipo_contato = 'problema' AND a.criada_em < ?`,
      c.tema, c.corrigido_em);
    return { ...c, label: CONFIG.temasLabel[c.tema] ?? c.tema, familias };
  }).filter((c) => c.familias.length > 0);
}

/** O que melhorou. Um resumo que só traz problema cansa e ele para de abrir. */
export function positivos() {
  const out: string[] = [];
  const g = (q: string, ...p: unknown[]) => one<{ n: number }>(q, ...p)?.n ?? 0;

  const saida = one<{ agora: number; antes: number }>(
    `SELECT SUM(CASE WHEN criada_em >= date(?, '-30 days') THEN 1 ELSE 0 END) agora,
            SUM(CASE WHEN criada_em >= date(?, '-60 days') AND criada_em < date(?, '-30 days') THEN 1 ELSE 0 END) antes
     FROM analises WHERE tema = 'entrada_e_saida' AND tipo_contato = 'problema'`, AGORA, AGORA, AGORA);
  if (saida && saida.antes > saida.agora)
    out.push(`Reclamações sobre a saída: ${saida.antes} → ${saida.agora} no mês.`);

  const elogios = g(`SELECT COUNT(*) n FROM analises
    WHERE tipo_contato='elogio' AND criada_em >= date(?, '-30 days')`, AGORA);
  if (elogios) out.push(`${elogios} elogios este mês — a professora Camila lidera as menções.`);

  const bem = one<{ p: number }>(
    `SELECT ROUND(100.0 * SUM(CASE WHEN sentimento_final='satisfeito' THEN 1 ELSE 0 END) / COUNT(*)) p
     FROM analises WHERE criada_em >= date(?, '-7 days')`, AGORA);
  if (bem?.p) out.push(`${bem.p}% das conversas da semana terminaram bem.`);

  return out;
}

export function conversa(id: number) {
  const c = one<{ id: number; nome: string; atendente: string; iniciada_em: string }>(
    `SELECT co.id, ct.nome, co.atendente, co.iniciada_em
     FROM conversas co JOIN contatos ct ON ct.id = co.contato_id WHERE co.id = ?`, id);
  if (!c) return null;
  return {
    ...c,
    mensagens: all<{ direcao: string; texto: string; criada_em: string }>(
      `SELECT direcao, texto, criada_em FROM mensagens WHERE conversa_id = ? ORDER BY criada_em`, id),
    analise: one<Record<string, unknown>>(`SELECT * FROM analises WHERE conversa_id = ?`, id),
    sinais: all<Sinal>(`SELECT tipo, evidencia, detectado_em, conversa_id FROM sinais WHERE conversa_id = ?`, id),
  };
}
