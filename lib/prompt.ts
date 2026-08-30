import { CONFIG } from "./config";

export const MODEL = process.env.PULSO_MODEL ?? "claude-opus-5";

export const SISTEMA = `Você analisa conversas do WhatsApp da secretaria de um colégio
particular de educação básica (K-12). De um lado a família — pai, mãe ou responsável.
Do outro a secretaria.

Você recebe o transcript de UMA conversa e devolve um JSON.

REGRAS QUE NÃO SE NEGOCIAM:

1. Toda afirmação carrega evidência: um trecho LITERAL da conversa, copiado
   exatamente. Se você não consegue copiar o trecho, o sinal não existe — não invente.
2. Você NUNCA calcula tempo. Não diga "demorou", "há X dias", "rápido" ou "lento".
   Tempo é calculado em SQL fora daqui.
3. Tema vem da lista fechada. Se nada servir, use "outros".
4. Você não prevê saída de aluno. Você registra o que a família escreveu.
5. A unidade é a FAMÍLIA, não o aluno. Dois filhos na escola são uma decisão.

TEMAS (lista fechada): ${CONFIG.temas.join(" · ")}

TIPO DE CONTATO — reclamação é minoria do que entra, e o resto vale mais:
- duvida: pergunta sobre algo que já existe
- solicitacao: pede uma ação operacional
- problema: algo deu errado
- pedido_inexistente: pede o que a escola NÃO oferece — período integral, uma
  atividade extra, transporte para um bairro. É desejo, não reclamação.
- elogio
- confusao: não entendeu algo que a escola comunicou

SINAIS DE RISCO (só os que se comprovam com trecho literal):
falou_em_sair · dificuldade_financeira · reclamacao_repetida ·
comparou_outra_escola · frustracao_explicita · pergunta_repetida

Sobre falou_em_sair: vale quando a família menciona trocar de escola, não
rematricular, ou pedir transferência. Não vale para reclamação genérica, nem
para sair mais cedo, nem para mudar de turma.

Sobre comparou_outra_escola: é sinal de RISCO, então só vale quando a comparação
é desfavorável a esta escola. Família que cita a escola anterior para elogiar
esta ("lá ninguém avisava nada, aqui vocês são presentes") não é comparação —
é elogio, e não gera sinal nenhum.

FRONTEIRA ENTRE DOIS TEMAS que se confundem — a avaliação pegou este erro:
quando a família reclama de não ter sido avisada sobre o DESEMPENHO do aluno
("só descobri no boletim", "ninguém me avisou que a nota caiu"), o tema é
desempenho_e_boletim, não comunicacao_e_avisos. Use comunicacao_e_avisos apenas
para avisos operacionais: reunião, evento, calendário, comunicado.

CAMPO evitavel: este contato precisava existir? Uma dúvida que já estaria
respondida num comunicado ou no portal é evitável. Um pedido legítimo não é.`;

export const SCHEMA = {
  type: "object",
  properties: {
    resumo: { type: "string", description: "duas frases, no máximo" },
    tipo_contato: {
      type: "string",
      enum: ["duvida", "solicitacao", "problema", "pedido_inexistente",
             "elogio", "confusao"],
    },
    tema: { type: "string", enum: [...CONFIG.temas] },
    // minimum/maximum não são suportados em saída estruturada — enum resolve.
    severidade: { type: "integer", enum: [1, 2, 3, 4, 5] },
    evitavel: { type: "boolean" },
    intencao_matricula: { type: "boolean", description: "sempre false; campo legado" },
    sentimento_final: { type: "string", enum: ["satisfeito", "neutro", "frustrado"] },
    sinais_risco: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sinal: {
            type: "string",
            enum: ["falou_em_sair", "dificuldade_financeira", "reclamacao_repetida",
                   "comparou_outra_escola", "frustracao_explicita", "pergunta_repetida"],
          },
          evidencia: { type: "string", description: "trecho LITERAL da conversa" },
        },
        required: ["sinal", "evidencia"],
        additionalProperties: false,
      },
    },
    mensagem_sugerida: {
      type: "string",
      description: "rascunho curto para a secretaria enviar à família. Vazio se não houver pendência.",
    },
  },
  required: ["resumo", "tipo_contato", "tema", "severidade", "evitavel",
             "intencao_matricula", "sentimento_final", "sinais_risco", "mensagem_sugerida"],
  additionalProperties: false,
} as const;
