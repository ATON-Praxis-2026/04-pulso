-- Interea — schema do protótipo
-- Uma linha por mensagem. Tudo o mais é derivado por consulta.

CREATE TABLE IF NOT EXISTS contatos (
  id            INTEGER PRIMARY KEY,
  nome          TEXT NOT NULL,
  telefone      TEXT NOT NULL UNIQUE,
  tipo          TEXT NOT NULL,              -- aluno | interessado | responsavel
  criado_em     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversas (
  id            INTEGER PRIMARY KEY,
  contato_id    INTEGER NOT NULL REFERENCES contatos(id),
  atendente     TEXT,                       -- quem da secretaria respondeu (só p/ gargalo por dia/hora)
  iniciada_em   TEXT NOT NULL,
  ultima_em     TEXT NOT NULL,
  encerrada     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS mensagens (
  id            INTEGER PRIMARY KEY,
  conversa_id   INTEGER NOT NULL REFERENCES conversas(id),
  direcao       TEXT NOT NULL,              -- entrada (contato) | saida (escola)
  texto         TEXT NOT NULL,
  criada_em     TEXT NOT NULL
);

-- Saída da chamada de LLM. Uma por conversa.
CREATE TABLE IF NOT EXISTS analises (
  conversa_id        INTEGER PRIMARY KEY REFERENCES conversas(id),
  origem             TEXT NOT NULL,          -- llm | seed  (honestidade sobre a procedência)
  resumo             TEXT,
  tipo_contato       TEXT,
  tema               TEXT,
  severidade         INTEGER,
  evitavel           INTEGER,
  intencao_matricula INTEGER,
  sentimento_final   TEXT,
  mensagem_sugerida  TEXT,
  json_completo      TEXT,
  criada_em          TEXT NOT NULL
);

-- Sinais materializados: os de SQL e os de LLM caem na mesma tabela,
-- então pontuar é somar. Evidência é obrigatória.
CREATE TABLE IF NOT EXISTS sinais (
  id            INTEGER PRIMARY KEY,
  contato_id    INTEGER NOT NULL REFERENCES contatos(id),
  conversa_id   INTEGER REFERENCES conversas(id),
  tipo          TEXT NOT NULL,
  origem        TEXT NOT NULL,              -- sql | llm
  evidencia     TEXT NOT NULL,
  detectado_em  TEXT NOT NULL,
  UNIQUE(contato_id, conversa_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_msg_conversa ON mensagens(conversa_id, criada_em);
CREATE INDEX IF NOT EXISTS idx_conv_contato ON conversas(contato_id);
CREATE INDEX IF NOT EXISTS idx_sinais_contato ON sinais(contato_id);

-- Texto pronto para publicar, por tema. Segunda chamada de LLM.
-- Sem isto o bloco de temas vira constatação; com isto vira correção.
CREATE TABLE IF NOT EXISTS textos (
  tema        TEXT PRIMARY KEY,
  origem      TEXT NOT NULL,        -- llm | seed
  diagnostico TEXT NOT NULL,
  texto       TEXT NOT NULL,
  criada_em   TEXT NOT NULL
);

-- O que o gestor já resolveu. Sem isto, a segunda-feira seguinte é idêntica à
-- anterior e ele aprende que abrir não muda nada.
CREATE TABLE IF NOT EXISTS resolvidos (
  chave       TEXT PRIMARY KEY,
  resolvido_em TEXT NOT NULL
);

-- O que a escola já corrigiu. Alimenta o único movimento que mexe na
-- experiência da família em vez de medi-la: voltar e avisar quem reclamou.
CREATE TABLE IF NOT EXISTS correcoes (
  tema         TEXT PRIMARY KEY,
  o_que_mudou  TEXT NOT NULL,
  corrigido_em TEXT NOT NULL,
  avisados     INTEGER NOT NULL DEFAULT 0
);
