// Paleta de dados. Fora de qualquer módulo "use client": num arquivo de cliente
// os exports viram referências e chegam `undefined` no Server Component.
//
// Azul e terracota, as duas cores frias/quentes da referência.
// O oliva da marca não serve para série: contra a terracota ele dá ΔE 2.1 em
// daltonismo protan — a mesma cor. Ele fica na moldura, não no gráfico.
//
// Validado sobre papel branco: CVD ΔE 17.1 · visão normal ΔE 20.1 · contraste ≥3:1.
export const VIZ = {
  s1: "#2f6d9e",   // azul — o que precisava existir
  s2: "#94512c",   // terracota — o que não precisava (sempre tracejado)
  grid: "#e6e4db",
  eixo: "#c9c6b9",
  muted: "#57544b",
  bom: "#4f7f36",
  atencao: "#b07b12",
  critico: "#94512c",
};
