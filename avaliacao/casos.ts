// Casos de avaliação do agente. Metade são ARMADILHAS: conversas escritas para
// fazer o modelo disparar quando não deveria. Um detector que só é testado com
// casos positivos mede vontade de acertar, não acurácia.

export type Caso = {
  id: string;
  transcript: [ "familia" | "escola", string ][];
  esperado: string[];          // sinais que DEVEM sair
  proibido?: string[];         // sinais que NÃO podem sair
  tema?: string;               // tema esperado, quando é o que está sob teste
  nota: string;                // o que este caso testa
};

export const CASOS: Caso[] = [
  // ── Positivos: o sinal existe e precisa ser encontrado ──────────────────
  {
    id: "sair-explicito",
    transcript: [
      ["familia", "Boa tarde. Se isso não for resolvido a gente vai procurar outra escola pro ano que vem"],
      ["escola", "Poxa, sinto muito. Pode me contar o que aconteceu?"],
    ],
    esperado: ["falou_em_sair"],
    nota: "Ameaça explícita de troca de escola.",
  },
  {
    id: "sair-velado",
    transcript: [
      ["familia", "Oi, queria pedir o histórico escolar da Marina e a declaração de matrícula"],
      ["familia", "É para uma outra escola que pediu a documentação"],
    ],
    esperado: ["falou_em_sair"],
    nota: "Não diz que vai sair — pede a documentação que só se pede para sair.",
  },
  {
    id: "financeiro",
    transcript: [
      ["familia", "Bom dia. Esse mês tá apertado aqui em casa, tem como parcelar a mensalidade?"],
      ["escola", "Bom dia! Vou verificar com o financeiro"],
    ],
    esperado: ["dificuldade_financeira"],
    nota: "Dificuldade financeira declarada sem drama.",
  },
  {
    id: "comparou",
    transcript: [
      ["familia", "No colégio onde meu sobrinho estuda eles avisam por app quando a nota cai"],
      ["familia", "aqui a gente só descobre no boletim, é bem diferente"],
    ],
    esperado: ["comparou_outra_escola"],
    nota: "Comparação com concorrente usada como crítica.",
  },
  {
    id: "repetida",
    transcript: [
      ["familia", "gente, é a terceira vez que peço a segunda via do boleto"],
      ["familia", "já mandei mensagem dia 3 e dia 11"],
    ],
    esperado: ["pergunta_repetida"],
    nota: "Repetição declarada pela própria família.",
  },

  // ── Armadilhas: parece sinal, não é ────────────────────────────────────
  {
    id: "armadilha-sair-cedo",
    transcript: [
      ["familia", "Oi! Preciso que a Júlia saia mais cedo hoje, tem consulta às 15h"],
      ["escola", "Combinado! Já avisei a portaria 🙂"],
    ],
    esperado: [],
    proibido: ["falou_em_sair"],
    nota: "A palavra 'sair' num pedido rotineiro de saída antecipada.",
  },
  {
    id: "armadilha-outra-escola-elogio",
    transcript: [
      ["familia", "A gente saiu da escola anterior porque lá ninguém avisava nada"],
      ["familia", "aqui vocês são muito mais presentes, faz diferença"],
    ],
    esperado: [],
    proibido: ["comparou_outra_escola", "falou_em_sair", "frustracao_explicita"],
    nota: "Menciona outra escola — para elogiar esta. É elogio, não comparação.",
  },
  {
    id: "armadilha-preco",
    transcript: [
      ["familia", "Boa tarde! Qual vai ser o valor da mensalidade no ano que vem?"],
      ["escola", "Boa tarde! O reajuste sai em outubro, te aviso assim que sair"],
    ],
    esperado: [],
    proibido: ["dificuldade_financeira", "falou_em_sair"],
    nota: "Pergunta sobre preço não é dificuldade financeira.",
  },
  {
    id: "armadilha-mudar-turma",
    transcript: [
      ["familia", "O Téo pediu pra mudar de turma, ele quer ficar com os amigos dele"],
      ["escola", "Vou ver com a coordenação a possibilidade!"],
    ],
    esperado: [],
    proibido: ["falou_em_sair"],
    nota: "Mudar de TURMA não é mudar de escola.",
  },
  {
    id: "armadilha-reclamou-uma-vez",
    transcript: [
      ["familia", "a fila da saída hoje demorou bastante"],
      ["escola", "Desculpa! Tivemos um imprevisto no portão"],
      ["familia", "imagina, acontece 🙂"],
    ],
    esperado: [],
    proibido: ["reclamacao_repetida", "frustracao_explicita"],
    nota: "Uma reclamação leve e resolvida não é reclamação repetida.",
  },
  {
    id: "armadilha-elogio-puro",
    transcript: [
      ["familia", "Só queria agradecer a professora Camila, o Enzo mudou muito esse ano"],
      ["escola", "Que alegria ler isso! Vou repassar pra ela ❤️"],
    ],
    esperado: [],
    proibido: ["frustracao_explicita", "falou_em_sair", "reclamacao_repetida"],
    nota: "Elogio limpo. Nenhum sinal deve sair.",
  },
  {
    id: "armadilha-rematricula-normal",
    transcript: [
      ["familia", "Oi! Quando abre a rematrícula? Quero garantir a vaga do Davi"],
      ["escola", "Abre em novembro 🙂 Te aviso quando liberar!"],
    ],
    esperado: [],
    proibido: ["falou_em_sair"],
    nota: "A palavra rematrícula num contexto de quem QUER ficar.",
  },
  {
    id: "armadilha-luto",
    transcript: [
      ["familia", "Bom dia. A avó das crianças faleceu ontem, elas não vão essa semana"],
      ["escola", "Sinto muito. Fica tranquila, vamos avisar as professoras"],
    ],
    esperado: [],
    proibido: ["falou_em_sair", "frustracao_explicita", "dificuldade_financeira"],
    nota: "Assunto pesado e emocional, mas sem nenhum sinal de risco de saída.",
  },

  // ── Tema: o teste de consolidação ──────────────────────────────────────
  {
    id: "tema-boletim-a",
    transcript: [["familia", "só descobri que ele tava indo mal quando chegou o boletim"]],
    esperado: [], tema: "desempenho_e_boletim",
    nota: "Consolidação: redação 1 do tema recorrente.",
  },
  {
    id: "tema-boletim-b",
    transcript: [["familia", "vocês avisam quando a nota cai ou só no fechamento mesmo?"]],
    esperado: [], tema: "desempenho_e_boletim",
    nota: "Consolidação: redação 2, palavras completamente diferentes.",
  },
  {
    id: "tema-boletim-c",
    transcript: [["familia", "queria acompanhar o rendimento dela durante o bimestre, tem como?"]],
    esperado: [], tema: "desempenho_e_boletim",
    nota: "Consolidação: redação 3, sem citar boletim nem nota.",
  },
];
