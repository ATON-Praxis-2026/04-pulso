import { all, one } from "./db";
import { AGORA } from "./queries";

/** A conta que separa o que é grave do que é só volume.
 *
 *  Uma família furiosa vale mais que cinquenta perguntando sobre uniforme —
 *  mas cinquenta perguntando a mesma coisa também é caro, de outro jeito.
 *  Por isso gravidade e alcance entram na mesma conta com pesos diferentes,
 *  e a gravidade máxima fura o volume: não se espera a oitava ocorrência de
 *  um conflito entre crianças.
 */
export type Score = {
  total: number;                    // 0 a 100
  gravidade: number;                // 0 a 40
  alcance: number;                   // 0 a 30
  tendencia: number;                 // 0 a 20
  reincidencia: number;              // 0 a 10
  urgencia: "agora" | "segunda";
  porque: string;                    // em português, para aparecer na tela
};

const teto = (v: number, max: number) => Math.min(Math.round(v), max);

export function calcularScore(opts: {
  familias: number;
  gravidadeMedia: number;      // 1 a 5
  gravidadeMaximaRecente: number;  // 1 a 5, últimos 7 dias — "grave" é grave AGORA
  variacao: number;            // vs. período anterior
  jaFoiCorrigido: boolean;
}): Score {
  const { familias, gravidadeMedia, gravidadeMaximaRecente, variacao, jaFoiCorrigido } = opts;

  const gravidade = teto(((gravidadeMedia - 1) / 4) * 40, 40);
  const alcance = teto(Math.min(familias / 20, 1) * 30, 30);
  const tendencia = teto(Math.max(0, variacao) / 10 * 20, 20);
  const reincidencia = jaFoiCorrigido ? 10 : 0;
  const total = gravidade + alcance + tendencia + reincidencia;

  // A gravidade fura o volume — mas só a gravidade RECENTE. Um caso grave de
  // três semanas atrás já passou por um resumo de segunda; ele não vira urgente
  // de novo só por existir. Sem esta janela, quase todo assunto vira urgente e
  // o "não espera segunda" deixa de significar qualquer coisa.
  const critico = gravidadeMaximaRecente >= 5 || total >= 70;

  const razoes: string[] = [];
  if (gravidadeMaximaRecente >= 5) razoes.push("há um caso grave esta semana");
  if (familias >= 15) razoes.push(`${familias} famílias`);
  if (variacao >= 5) razoes.push(`cresceu ${variacao} no mês`);
  if (jaFoiCorrigido) razoes.push("já foi resolvido uma vez e voltou");

  return {
    total, gravidade, alcance, tendencia, reincidencia,
    urgencia: critico ? "agora" : "segunda",
    porque: razoes.length ? razoes.join(" · ") : "acumulou sem gravidade alta",
  };
}

/** Assuntos que a escola já tentou resolver — com o que foi feito e quando.
 *  Se voltarem, a solução anterior não pode ser sugerida de novo. */
export function jaTentado() {
  return all<{ tema: string; o_que_fiz: string; quando: string }>(
    `SELECT tema, o_que_fiz, atualizado_em AS quando FROM decisoes_estado
     WHERE estado='feito' AND tema IS NOT NULL AND o_que_fiz IS NOT NULL AND o_que_fiz <> ''`);
}

/** Um assunto reincidente: foi tratado, e voltou depois disso. */
export function reincidencias() {
  return jaTentado().map((t) => {
    const depois = one<{ n: number }>(
      `SELECT COUNT(*) n FROM analises
       WHERE tema = ? AND criada_em > ? AND criada_em >= date(?, '-30 days')`,
      t.tema, t.quando, AGORA)?.n ?? 0;
    const diasDesde = Math.floor(
      (+new Date(AGORA.replace(" ", "T")) - +new Date(t.quando.replace(" ", "T"))) / 864e5);
    return { ...t, voltou: depois, diasDesde };
  }).filter((r) => r.voltou >= 5);
}
