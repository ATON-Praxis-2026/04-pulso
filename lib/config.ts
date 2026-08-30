// Tudo o que é específico de um cliente mora aqui.
// O código não sabe o que é uma escola — ele lê este arquivo.

export const PRODUTO = "Pulso";   // um lugar só: trocar o nome é trocar esta linha

export const CONFIG = {
  escola: "Colégio Modelo",
  gestor: "Ricardo",
  alunos: 500,

  // Horário de funcionamento. Usado para contar HORAS DE EXPEDIENTE, nunca corridas.
  // Sexta 18h -> segunda 9h são 63h corridas e ninguém errou.
  expediente: { diasUteis: [1, 2, 3, 4, 5], abre: 7, fecha: 18 },

  // A régua do produto não é SLA inventado — é a data que já existe na vida dele.
  rematricula: "2026-11-03",

  // Lista FECHADA, de escola K-12. Lista aberta produz centenas de categorias
  // e nada priorizado.
  temas: [
    "comunicacao_e_avisos",
    "desempenho_e_boletim",
    "professor",
    "licao_e_carga",
    "entrada_e_saida",
    "mensalidade_e_material",
    "alimentacao",
    "convivencia_e_conflito",
    "atividades_extras",
    "matricula_e_documentos",
    "outros",
  ] as const,

  temasLabel: {
    comunicacao_e_avisos: "Comunicação e avisos",
    desempenho_e_boletim: "Desempenho e boletim",
    professor: "Professor",
    licao_e_carga: "Lição e carga de estudo",
    entrada_e_saida: "Entrada e saída",
    mensalidade_e_material: "Mensalidade e material",
    alimentacao: "Alimentação",
    convivencia_e_conflito: "Convivência e conflito",
    atividades_extras: "Atividades extras",
    matricula_e_documentos: "Matrícula e documentos",
    outros: "Outros",
  } as Record<string, string>,

  // Pesos arbitrários de propósito. O que importa é estarem escritos, num lugar
  // só, e serem ajustáveis. Calibre o LIMIAR, não os pesos.
  //
  // O silêncio pesa como o mais alto: é o único sinal que nenhuma outra
  // ferramenta enxerga, porque todas disparam em ocorrência e ele dispara em
  // ausência.
  pesos: {
    silencio: 4,                  // família regular que parou de escrever
    ultima_palavra_da_familia: 4, // >24h de expediente sem resposta
    promessa_nao_cumprida: 3,     // "vou verificar e te aviso" — e nunca voltou
    falou_em_sair: 3,
    dificuldade_financeira: 2,
    reclamacao_repetida: 3,
    pergunta_repetida: 2,         // mesma dúvida 3+ vezes
    comparou_outra_escola: 1,
    frustracao_explicita: 1,
  } as Record<string, number>,

  sinaisLabel: {
    silencio: "parou de escrever",
    ultima_palavra_da_familia: "sem resposta",
    promessa_nao_cumprida: "prometeram e não voltaram",
    falou_em_sair: "falou em sair",
    dificuldade_financeira: "falou em dinheiro",
    reclamacao_repetida: "reclamou mais de uma vez",
    pergunta_repetida: "perguntou 3 vezes",
    comparou_outra_escola: "comparou com outra escola",
    frustracao_explicita: "demonstrou frustração",
  } as Record<string, string>,

  // Limiar, não ranking. Se ninguém cruzar, a semana chega vazia — e isso é bom.
  limiar: 3,

  // Teto rígido. Se exigir rolagem no celular, virou relatório com outro nome.
  teto: { familias: 3, temas: 1 },

  horasSemResposta: 24,
  diasSilencio: 21,
};

export type Tema = (typeof CONFIG.temas)[number];

/** Meses até a rematrícula. É o relógio do produto — não um SLA inventado. */
export function mesesAteRematricula(hoje: string) {
  const a = new Date(hoje.slice(0, 10) + "T00:00:00");
  const b = new Date(CONFIG.rematricula + "T00:00:00");
  return Math.max(0, Math.round((+b - +a) / 2629800000));
}
