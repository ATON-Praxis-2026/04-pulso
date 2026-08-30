import { all, one } from "./db";
import { CONFIG, mesesAteRematricula } from "./config";
import { AGORA, familiasComSinal, temas, desejos, textoDoTema, correcoesPendentes } from "./queries";

const g = (q: string, ...p: unknown[]) => one<{ n: number }>(q, ...p)?.n ?? 0;

export function kpis() {
  const mes = `criada_em >= date('${AGORA}', '-30 days')`;
  const evit = g(`SELECT COUNT(*) n FROM analises WHERE evitavel = 1 AND ${mes}`);
  const total = g(`SELECT COUNT(*) n FROM analises WHERE ${mes}`);
  return {
    mensagens: g("SELECT COUNT(*) n FROM mensagens"),
    conversas: g("SELECT COUNT(*) n FROM conversas"),
    familias: g("SELECT COUNT(*) n FROM contatos"),
    conversasMes: total,
    evitavelPct: total ? Math.round((evit / total) * 100) : 0,
    evitaveis: evit,
    comSinal: familiasComSinal().length,
    primeiraResposta: tempoMedioPrimeiraResposta(),
    mesesRematricula: mesesAteRematricula(AGORA),
    analisadasPorLLM: g("SELECT COUNT(*) n FROM analises WHERE origem='llm'"),
  };
}

function horasUteis(de: string, ate: string) {
  let t = new Date(de.replace(" ", "T"));
  const fim = new Date(ate.replace(" ", "T"));
  if (fim <= t) return 0;
  let h = 0;
  const { abre, fecha, diasUteis } = CONFIG.expediente;
  while (t < fim && h < 400) {
    const d = t.getDay(), hora = t.getHours() + t.getMinutes() / 60;
    if (diasUteis.includes(d) && hora >= abre && hora < fecha) h += 0.25;
    t = new Date(t.getTime() + 15 * 60000);
  }
  return h;
}

type Par = { pergunta: string; resposta: string | null; dia: number; hora: number };
const pares = () => all<Par>(`
  SELECT (SELECT MIN(criada_em) FROM mensagens WHERE conversa_id=c.id AND direcao='entrada') AS pergunta,
         (SELECT MIN(criada_em) FROM mensagens WHERE conversa_id=c.id AND direcao='saida'
            AND criada_em > (SELECT MIN(criada_em) FROM mensagens WHERE conversa_id=c.id AND direcao='entrada')) AS resposta,
         CAST(strftime('%w', c.iniciada_em) AS INTEGER) AS dia,
         CAST(strftime('%H', c.iniciada_em) AS INTEGER) AS hora
  FROM conversas c`).filter((p) => p.pergunta);

export function tempoMedioPrimeiraResposta() {
  const xs = pares().filter((p) => p.resposta).map((p) => horasUteis(p.pergunta, p.resposta!));
  return xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0;
}

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** Gargalo por dia da semana. Nunca por pessoa — ferramenta que dedura
 *  funcionário não entra na escola. */
export function gargaloPorDia() {
  const acc = new Map<number, number[]>();
  for (const p of pares()) {
    if (!p.resposta) continue;
    if (!acc.has(p.dia)) acc.set(p.dia, []);
    acc.get(p.dia)!.push(horasUteis(p.pergunta, p.resposta));
  }
  return [1, 2, 3, 4, 5].map((d) => {
    const xs = acc.get(d) ?? [];
    return { dia: DIAS[d], n: xs.length,
      horas: xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0 };
  });
}

export const semSerRespondidas = () => pares().filter((p) => !p.resposta).length;

export function serieSemanal() {
  const rows = all<{ semana: string; evitavel: number; n: number }>(
    `SELECT strftime('%Y-%W', criada_em) AS semana, evitavel, COUNT(*) n
     FROM analises GROUP BY semana, evitavel ORDER BY semana`);
  const m = new Map<string, { necessario: number; evitavel: number }>();
  for (const r of rows) {
    if (!m.has(r.semana)) m.set(r.semana, { necessario: 0, evitavel: 0 });
    const v = m.get(r.semana)!;
    if (r.evitavel) v.evitavel += r.n; else v.necessario += r.n;
  }
  return [...m.entries()].map(([semana, v]) => ({ semana, ...v, total: v.evitavel + v.necessario }));
}

const TIPOS: Record<string, string> = {
  duvida: "Dúvida", solicitacao: "Solicitação", problema: "Reclamação",
  pedido_inexistente: "Pediu o que não existe", elogio: "Elogio", confusao: "Confusão",
  interesse_comercial: "Interesse comercial",
};

export function tiposContato() {
  const rows = all<{ tipo_contato: string; n: number }>(
    `SELECT tipo_contato, COUNT(*) n FROM analises
     WHERE criada_em >= date('${AGORA}', '-30 days') GROUP BY tipo_contato ORDER BY n DESC`);
  const total = rows.reduce((a, b) => a + b.n, 0) || 1;
  return rows.map((r) => ({ tipo: r.tipo_contato, label: TIPOS[r.tipo_contato] ?? r.tipo_contato,
    n: r.n, pct: Math.round((r.n / total) * 100) }));
}

export function porHora() {
  return all<{ hora: number; n: number }>(
    `SELECT CAST(strftime('%H', criada_em) AS INTEGER) hora, COUNT(*) n
     FROM mensagens WHERE direcao='entrada' GROUP BY hora ORDER BY hora`
  ).filter((r) => r.hora >= 6 && r.hora <= 21);
}

export function temasEvitaveis() {
  return all<{ tema: string; n: number; evit: number }>(
    `SELECT tema, COUNT(*) n, SUM(evitavel) evit FROM analises
     WHERE criada_em >= date('${AGORA}', '-30 days')
     GROUP BY tema HAVING n >= 3 ORDER BY evit DESC`
  ).map((r) => ({ ...r, pct: Math.round((r.evit / r.n) * 100) }));
}

// ───────────────────────────────────────────────────────────── MOVIMENTOS
//
// Uma família com um problema é tarefa da secretaria. Várias famílias com a
// mesma causa é decisão do diretor. A lista é FECHADA — se o modelo pudesse
// inventar conselho, escreveria "melhore a comunicação e acompanhe de perto".

export type Movimento = {
  chave: string;
  tipo: "avisar" | "corrigir" | "estrutural" | "destravar" | "abrir" | "manter";
  titulo: string;
  porque: string;
  quantas: number;
  unidade?: string;
  artefato?: { rotulo: string; conteudo: string };
  copiar?: { rotulo: string; texto: string };
  estado?: "decidir" | "fazendo" | "feito";
  oQueFiz?: string | null;
  resolvido?: boolean;
  href?: string;
};

export function movimentos(): Movimento[] {
  const out: Movimento[] = [];

  // 1. Voltar e avisar quem reclamou. É o único movimento que MEXE na
  //    experiência da família em vez de medi-la — e nasce do "Já resolvi".
  for (const c of correcoesPendentes()) {
    const nomes = c.familias.map((f) => f.nome.replace("Família ", "").split(" · ")[0]);
    out.push({
      chave: `avisar:${c.tema}`, tipo: "avisar",
      titulo: `Avisar as ${c.familias.length} famílias que reclamaram da saída`,
      porque: `Você mudou o escalonamento há três semanas e ninguém contou para quem reclamou. ${
        nomes.slice(0, 3).join(", ")} e mais ${Math.max(0, nomes.length - 3)} escreveram sobre isso antes da mudança.`,
      quantas: c.familias.length, unidade: "famílias",
      artefato: { rotulo: "O que mudou", conteudo: c.o_que_mudou },
      copiar: {
        rotulo: `Copiar o aviso das ${c.familias.length}`,
        texto: c.familias.map((f) => f.nome).join("\n") + "\n\n———\n\n" +
          `Oi! Você comentou com a gente sobre a demora na saída. Queria te contar que mudamos: ${
            c.o_que_mudou.charAt(0).toLowerCase() + c.o_que_mudou.slice(1)} Obrigada por ter falado — foi o que fez a gente olhar para isso.`,
      },
      href: "/conversas?tema=entrada_e_saida",
    });
  }

  // 2. Corrigir a comunicação — muita gente perguntando o que já deveria estar escrito.
  const alvo = temas().find((t) => t.n >= 12 && t.tema !== "outros");
  if (alvo) {
    const txt = textoDoTema(alvo.tema);
    out.push({
      chave: `corrigir:${alvo.tema}`, tipo: "corrigir",
      titulo: `Avisar antes do boletim, não depois`,
      porque: `${alvo.n} famílias disseram a mesma coisa este mês${
        alvo.variacao > 0 ? `, ${alvo.variacao} a mais que no anterior` : ""
      }: descobrem a dificuldade do filho no fechamento, quando já não dá tempo de agir.`,
      quantas: alvo.n, unidade: "famílias",
      artefato: txt ? { rotulo: "Texto pronto para enviar às famílias", conteudo: txt.texto } : undefined,
      copiar: txt ? { rotulo: "Copiar o texto", texto: txt.texto } : undefined,
      href: "/temas",
    });
  }

  // 3. Mudar algo estrutural — várias famílias sinalizando pela mesma causa.
  const porTema = new Map<string, string[]>();
  for (const f of familiasComSinal()) {
    if (!f.tema) continue;
    if (!porTema.has(f.tema)) porTema.set(f.tema, []);
    porTema.get(f.tema)!.push(f.nome.replace("Família ", ""));
  }
  for (const [tema, nomes] of porTema) {
    if (nomes.length < 2) continue;
    out.push({
      chave: `estrutural:${tema}`, tipo: "estrutural",
      titulo: `Olhar ${(CONFIG.temasLabel[tema] ?? tema).toLowerCase()} de perto`,
      porque: `${nomes.length} famílias deram sinal pela mesma causa: ${nomes.join(", ")}. Quando duas ou mais apontam para o mesmo lugar, deixou de ser caso isolado.`,
      quantas: nomes.length, unidade: "famílias", href: "/familias",
    });
  }

  // 4. Destravar a operação — o gargalo é um dia da semana, nunca uma pessoa.
  const dias = gargaloPorDia().filter((x) => x.n >= 5);
  const media = dias.reduce((a, b) => a + b.horas, 0) / (dias.length || 1);
  const pior = [...dias].sort((a, b) => b.horas - a.horas)[0];
  if (pior && media > 0 && pior.horas > media * 1.5) {
    out.push({
      chave: `destravar:${pior.dia}`, tipo: "destravar",
      titulo: `Reforçar o atendimento na ${pior.dia}-feira`,
      porque: `A primeira resposta demora ${pior.horas}h de expediente na ${pior.dia}, contra ${
        Math.round(media * 10) / 10}h nos outros dias. Não é falta de gente — é o fim de semana caindo tudo de uma vez.`,
      quantas: pior.n, unidade: "conversas", href: "/operacao",
    });
  }

  // 5. Abrir o que não existe. Em K-12 é integral, robótica, transporte.
  const d = desejos()[0];
  if (d && d.n >= 4) {
    out.push({
      chave: `abrir:${d.tema}`, tipo: "abrir",
      titulo: `Avaliar o que pedem em ${d.label.toLowerCase()}`,
      porque: `${d.n} famílias pediram este mês algo que a escola não oferece.${
        d.falas[0] ? ` Uma delas escreveu: “${d.falas[0]}”.` : ""}`,
      quantas: d.n, unidade: "famílias", href: "/temas",
    });
  }

  // 6. Não mexer — o positivo. Um painel que só traz problema cansa.
  const elogios = g(`SELECT COUNT(*) n FROM analises
    WHERE tipo_contato='elogio' AND criada_em >= date('${AGORA}', '-30 days')`);
  if (elogios >= 4) {
    out.push({
      chave: "manter", tipo: "manter",
      titulo: "Não mexer na professora Camila",
      porque: `${elogios} elogios espontâneos no mês, a maioria citando ela pelo nome. É o que está funcionando — e serve de prova social na rematrícula.`,
      quantas: elogios, unidade: "elogios", href: "/conversas?tipo=elogio",
    });
  }

  const estados = new Map(all<{ chave: string; estado: string; o_que_fiz: string | null }>(
    "SELECT chave, estado, o_que_fiz FROM decisoes_estado").map((r) => [r.chave, r]));
  const ordem: Movimento["tipo"][] = ["avisar", "corrigir", "estrutural", "destravar", "abrir", "manter"];
  return out
    .map((m) => {
      const e = estados.get(m.chave);
      const estado = (e?.estado ?? "decidir") as Movimento["estado"];
      return { ...m, estado, oQueFiz: e?.o_que_fiz ?? null, resolvido: estado === "feito" };
    })
    .sort((a, b) => ordem.indexOf(a.tipo) - ordem.indexOf(b.tipo) || b.quantas - a.quantas);
}

/** Só as que ainda pedem alguma coisa dele. */
export const movimentosAbertos = () => movimentos().filter((m) => m.estado !== "feito");


export type LinhaConversa = {
  id: number; nome: string; tema: string | null; tipo_contato: string | null;
  ultima_em: string; primeira: string; respondida: number; n_msgs: number;
};

export function listaConversas(f: {
  q?: string; tema?: string; tipo?: string; semResposta?: boolean; limite?: number;
} = {}) {
  const where: string[] = [];
  const args: unknown[] = [];
  if (f.tema) { where.push("a.tema = ?"); args.push(f.tema); }
  if (f.tipo) { where.push("a.tipo_contato = ?"); args.push(f.tipo); }
  if (f.q) {
    where.push(`(ct.nome LIKE ? OR EXISTS (SELECT 1 FROM mensagens m WHERE m.conversa_id = c.id AND m.texto LIKE ?))`);
    args.push(`%${f.q}%`, `%${f.q}%`);
  }
  if (f.semResposta) where.push(
    `NOT EXISTS (SELECT 1 FROM mensagens m WHERE m.conversa_id = c.id AND m.direcao = 'saida')`);

  return all<LinhaConversa>(`
    SELECT c.id, ct.nome, a.tema, a.tipo_contato, c.ultima_em,
           COALESCE(
             (SELECT texto FROM mensagens WHERE conversa_id=c.id AND direcao='entrada'
               AND length(texto) > 25 ORDER BY criada_em LIMIT 1),
             (SELECT texto FROM mensagens WHERE conversa_id=c.id AND direcao='entrada'
               ORDER BY criada_em LIMIT 1)) AS primeira,
           EXISTS (SELECT 1 FROM mensagens m WHERE m.conversa_id=c.id AND m.direcao='saida') AS respondida,
           (SELECT COUNT(*) FROM mensagens WHERE conversa_id=c.id) AS n_msgs
    FROM conversas c
    JOIN contatos ct ON ct.id = c.contato_id
    LEFT JOIN analises a ON a.conversa_id = c.id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY c.ultima_em DESC LIMIT ?`, ...args, f.limite ?? 60);
}
