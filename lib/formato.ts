// Formatação determinística: `Intl` e `new Date()` divergem entre servidor e
// navegador (fuso, dados de locale, espaço fino no R$) e isso quebra a
// hidratação. As strings do banco são "YYYY-MM-DD HH:MM:SS" — basta fatiar.

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun",
               "jul", "ago", "set", "out", "nov", "dez"];
const MESES_LONGOS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
                      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const partes = (iso: string) => {
  const [d, h = ""] = iso.split(/[ T]/);
  const [ano, mes, dia] = d.split("-");
  const [hora, min] = h.split(":");
  return { ano, mes: Number(mes), dia, hora, min };
};

/** "25 ago" */
export function dataCurta(iso: string) {
  const p = partes(iso);
  return `${p.dia} ${MESES[p.mes - 1]}`;
}

/** "25 de agosto de 2026" */
export function dataLonga(iso: string) {
  const p = partes(iso);
  return `${Number(p.dia)} de ${MESES_LONGOS[p.mes - 1]} de ${p.ano}`;
}

/** "25/08" */
export function dataNumerica(iso: string) {
  const p = partes(iso);
  return `${p.dia}/${String(p.mes).padStart(2, "0")}`;
}

/** "25/08, 14:30" */
export function dataHora(iso: string) {
  const p = partes(iso);
  return `${dataNumerica(iso)}, ${p.hora}:${p.min}`;
}

/** "1.451" — separador de milhar com ponto, como em pt-BR. */
export function numero(n: number) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** "R$ 41.033" */
export function brl(n: number) {
  return `R$ ${numero(n)}`;
}
