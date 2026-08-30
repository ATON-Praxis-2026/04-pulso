import { all } from "./db";

export type Contexto = { chave: string; rotulo: string; valor: string; ordem: number };

/** O que a equipe levantou com a escola no onboarding. */
export const contexto = () =>
  all<Contexto>("SELECT chave, rotulo, valor, ordem FROM contexto ORDER BY ordem");

/** O que esta escola já fez diante de cada padrão. Isto é o treinamento: o
 *  agente deixa de sugerir o genérico e passa a sugerir o que esta escola faz. */
export const decisoesFeitas = () =>
  all<{ chave: string; o_que_fiz: string; atualizado_em: string }>(
    `SELECT chave, o_que_fiz, atualizado_em FROM decisoes_estado
     WHERE estado = 'feito' AND o_que_fiz IS NOT NULL AND o_que_fiz <> ''
     ORDER BY atualizado_em DESC LIMIT 12`);

/** O bloco que entra no prompt. Sem ele o agente analisa "uma escola";
 *  com ele, analisa esta escola. */
export function blocoDeContexto() {
  const ctx = contexto();
  const feitas = decisoesFeitas();
  if (!ctx.length && !feitas.length) return "";

  const partes: string[] = [];
  if (ctx.length) {
    partes.push("SOBRE ESTA ESCOLA — levantado com a direção no onboarding:\n" +
      ctx.map((c) => `- ${c.rotulo}: ${c.valor}`).join("\n"));
  }
  if (feitas.length) {
    partes.push("O QUE ESTA ESCOLA JÁ FEZ diante de padrões parecidos. Use para " +
      "ajustar o tom e a viabilidade do que você sugere — não repita sugestão que " +
      "já foi feita, e prefira o caminho que esta escola costuma tomar:\n" +
      feitas.map((d) => `- ${d.o_que_fiz}`).join("\n"));
  }
  return "\n\n" + partes.join("\n\n");
}
