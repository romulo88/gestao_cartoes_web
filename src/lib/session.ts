/** Sessão no navegador. Diferente do Commander (computador compartilhado na portaria), aqui o
 * uso é pessoal - celular/computador do próprio dono -, então fica em `localStorage` e
 * sobrevive a fechar o navegador. O token vale 7 dias e é renovado enquanto o app é usado
 * (ver `use-renovacao-sessao.ts`). Prefixo próprio na chave: o storage é por origem. */
export type Sessao = {
  token: string;
  usuarioId: number;
  nome: string;
  email: string;
  /** Quando (relógio deste navegador) o token foi obtido - base da renovação. */
  obtidoEm: number;
};

const CHAVE = "cartoes:sessao";

let ultimoBruto: string | null | undefined;
let ultimoParseado: Sessao | null = null;
const listeners = new Set<() => void>();

function ler(): Sessao | null {
  let bruto: string | null;
  try {
    bruto = localStorage.getItem(CHAVE);
  } catch {
    bruto = null;
  }
  // `useSyncExternalStore` exige a MESMA referência enquanto nada mudou.
  if (bruto === ultimoBruto) return ultimoParseado;
  ultimoBruto = bruto;
  try {
    ultimoParseado = bruto ? (JSON.parse(bruto) as Sessao) : null;
  } catch {
    ultimoParseado = null;
  }
  return ultimoParseado;
}

function notificar() {
  for (const l of listeners) l();
}

export function assinarSessao(listener: () => void): () => void {
  listeners.add(listener);
  // Outra aba fez login/logout: acompanha.
  const onStorage = (e: StorageEvent) => {
    if (e.key === CHAVE) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getSessaoSnapshot(): Sessao | null {
  return ler();
}

export function getSessaoServerSnapshot(): Sessao | null {
  return null;
}

export function salvarSessao(dados: Omit<Sessao, "obtidoEm">) {
  localStorage.setItem(CHAVE, JSON.stringify({ ...dados, obtidoEm: Date.now() } satisfies Sessao));
  notificar();
}

export function limparSessao() {
  localStorage.removeItem(CHAVE);
  notificar();
}
