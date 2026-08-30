import { CONFIG } from "./config";

export const MODEL = process.env.INTEREA_MODEL ?? "claude-opus-5";

export const SISTEMA = `Você analisa conversas do WhatsApp da secretaria de uma escola.

Você recebe o transcript de UMA conversa e devolve um JSON.

REGRAS QUE NÃO SE NEGOCIAM:

1. Toda afirmação carrega evidência: um trecho LITERAL da conversa, copiado
   exatamente. Se você não consegue copiar o trecho, o sinal não existe — não invente.
2. Você NUNCA calcula tempo. Não diga "demorou", "há X dias", "rápido" ou "lento".
   Tempo é calculado em SQL fora daqui.
3. Tema vem da lista fechada. Se nada servir, use "outros".
4. Você não prevê saída de aluno. Você registra o que ele escreveu.

TEMAS (lista fechada): ${CONFIG.temas.join(" · ")}

TIPO DE CONTATO — reclamação é minoria do que entra, e o resto vale mais:
- duvida: pergunta sobre algo que já existe
- solicitacao: pede uma ação operacional
- problema: algo deu errado
- pedido_inexistente: pede o que a escola NÃO oferece (isto é DESEJO, não reclamação)
- interesse_comercial: quer se matricular ou saber preço (isto é OPORTUNIDADE)
- elogio
- confusao: não entendeu algo que a escola comunicou

SINAIS DE RISCO (só os que se comprovam com trecho literal):
pediu_trancamento · dificuldade_financeira · reclamacao_repetida ·
comparou_concorrente · frustracao_explicita · pergunta_repetida

CAMPO evitavel: este contato precisava existir? Uma dúvida que já estaria
respondida num texto público é evitável. Um pedido legítimo não é.`;

export const SCHEMA = {
  type: "object",
  properties: {
    resumo: { type: "string", description: "duas frases, no máximo" },
    tipo_contato: {
      type: "string",
      enum: ["duvida", "solicitacao", "problema", "pedido_inexistente",
             "interesse_comercial", "elogio", "confusao"],
    },
    tema: { type: "string", enum: [...CONFIG.temas] },
    // minimum/maximum não são suportados em saída estruturada — enum resolve.
    severidade: { type: "integer", enum: [1, 2, 3, 4, 5] },
    evitavel: { type: "boolean" },
    intencao_matricula: { type: "boolean" },
    sentimento_final: { type: "string", enum: ["satisfeito", "neutro", "frustrado"] },
    sinais_risco: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sinal: {
            type: "string",
            enum: ["pediu_trancamento", "dificuldade_financeira", "reclamacao_repetida",
                   "comparou_concorrente", "frustracao_explicita", "pergunta_repetida"],
          },
          evidencia: { type: "string", description: "trecho LITERAL da conversa" },
        },
        required: ["sinal", "evidencia"],
        additionalProperties: false,
      },
    },
    mensagem_sugerida: {
      type: "string",
      description: "rascunho curto para a secretaria enviar. Vazio se não houver pendência.",
    },
  },
  required: ["resumo", "tipo_contato", "tema", "severidade", "evitavel",
             "intencao_matricula", "sentimento_final", "sinais_risco", "mensagem_sugerida"],
  additionalProperties: false,
} as const;
