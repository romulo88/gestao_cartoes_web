const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_LONGOS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** API manda dinheiro como número (BigDecimal serializado). */
export function brl(valor: number | null | undefined): string {
  return moeda.format(valor ?? 0);
}

/** "2026-11" -> "nov/26" */
export function mesCurto(competencia: string): string {
  const [a, m] = competencia.split("-");
  return `${MESES[Number(m) - 1]}/${a.slice(2)}`;
}

/** "2026-11" -> "novembro de 2026" (`maiuscula` -> "Novembro de 2026") */
export function mesLongo(competencia: string, maiuscula = false): string {
  const [a, m] = competencia.split("-");
  const nome = MESES_LONGOS[Number(m) - 1];
  return `${maiuscula ? nome[0].toUpperCase() + nome.slice(1) : nome} de ${a}`;
}

/** "2026-11-18" -> "18/11/2026" (sem passar por Date, para não depender de fuso). */
export function dataBr(iso: string | null | undefined): string {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/** "2026-11-18" -> "18/11" */
export function diaMes(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function hojeIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function mesAtual(): string {
  return hojeIso().slice(0, 7);
}

export function somarMeses(competencia: string, delta: number): string {
  const [a, m] = competencia.split("-").map(Number);
  const total = a * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/** Aceita "1.234,56", "1234,56", "1234.56" -> 1234.56 (null se inválido). */
export function lerValor(texto: string): number | null {
  const limpo = texto.trim().replace(/\s|R\$/g, "");
  if (!limpo) return null;
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normalizado);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/** 1234.5 -> "1234,50" (para preencher input de edição). */
export function valorParaInput(n: number | null | undefined): string {
  return n == null ? "" : n.toFixed(2).replace(".", ",");
}
