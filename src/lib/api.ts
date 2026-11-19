// Client da API (Spring Boot). Mesma origem do site: o Next faz proxy de /api/* para o
// backend (ver next.config.ts).
import { getSessaoSnapshot, limparSessao } from "./session";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// ---------- Tipos (espelham os DTOs do backend) ----------

export type SessaoResponse = { token: string; usuarioId: number; nome: string; email: string };

export type Ref = { id: number | null; nome: string; cor: string };

export type Cartao = {
  id: number;
  nome: string;
  bandeira: string | null;
  finalCartao: string | null;
  diaFechamento: number;
  diaVencimento: number;
  limite: number | null;
  cor: string;
  ativo: boolean;
};
export type CartaoRequest = Omit<Cartao, "id">;

export type Categoria = { id: number; nome: string; cor: string; limiteMensal: number | null };
export type CategoriaRequest = Omit<Categoria, "id">;

export type Parcela = { numero: number; valor: number; competencia: string };

export type Compra = {
  id: number;
  cartao: Ref;
  categoria: Ref | null;
  descricao: string;
  valorTotal: number;
  qtdParcelas: number;
  valorParcela: number;
  dataCompra: string;
  primeiraFatura: string;
  ultimaFatura: string;
  parcelasRestantes: number;
  observacao: string | null;
  /** Recorrência que gerou a compra (null = lançada à mão). */
  recorrenciaId: number | null;
  parcelas: Parcela[];
};

export type Periodicidade = "MENSAL" | "ANUAL";

export type Recorrencia = {
  id: number;
  cartao: Ref;
  categoria: Ref | null;
  descricao: string;
  valor: number;
  qtdParcelas: number;
  periodicidade: Periodicidade;
  diaCobranca: number;
  proximaCobranca: string;
  proximaFatura: string;
  dataFim: string | null;
  ativa: boolean;
  /** Data de fim já passou: não gera mais nada. */
  encerrada: boolean;
  /** Custo por mês (anual / 12). */
  valorMensal: number;
  observacao: string | null;
};

export type RecorrenciaRequest = {
  cartaoId: number;
  categoriaId: number | null;
  descricao: string;
  valor: number;
  qtdParcelas: number;
  periodicidade: Periodicidade;
  proximaCobranca: string;
  dataFim: string | null;
  ativa: boolean;
  observacao: string | null;
};

export type CompraRequest = {
  cartaoId: number;
  categoriaId: number | null;
  descricao: string;
  valorTotal: number;
  qtdParcelas: number;
  dataCompra: string;
  primeiraFatura: string | null;
  observacao: string | null;
};

export type Pagina<T> = { itens: T[]; pagina: number; totalPaginas: number; totalItens: number };

export type PrevisaoFatura = { competencia: string; dataFechamento: string; dataVencimento: string };

export type ItemFatura = {
  compraId: number;
  descricao: string;
  dataCompra: string;
  numeroParcela: number;
  qtdParcelas: number;
  valor: number;
  categoria: Ref | null;
};

/** Parcela de cobrança recorrente que ainda não virou compra (só previsão). */
export type ItemPrevisto = {
  recorrenciaId: number;
  descricao: string;
  dataCobranca: string;
  numeroParcela: number;
  qtdParcelas: number;
  valor: number;
  categoria: Ref | null;
};

export type SituacaoFatura = "aberta" | "fechada" | "vencida";

export type Fatura = {
  cartao: Ref;
  competencia: string;
  dataFechamento: string;
  dataVencimento: string;
  situacao: SituacaoFatura;
  /** Só o que já foi lançado. */
  total: number;
  itens: ItemFatura[];
  /** Recorrentes previstos (fora do total). */
  totalPrevisto: number;
  previstos: ItemPrevisto[];
};

export type FaturasDoMes = { competencia: string; total: number; totalPrevisto: number; faturas: Fatura[] };

export type Dashboard = {
  competencia: string;
  totalMes: number;
  totalMesAnterior: number;
  comprometidoFuturo: number;
  cartoes: {
    cartao: Ref;
    totalMes: number;
    limite: number | null;
    emAberto: number;
    limiteDisponivel: number | null;
    dataFechamento: string;
    dataVencimento: string;
  }[];
  categorias: { categoria: Ref; total: number; limiteMensal: number | null }[];
  /** previstoRecorrente: cobranças recorrentes ainda não geradas que cairiam no mês (só previsão). */
  serie: { competencia: string; total: number; porCartao: { chave: number; total: number }[]; previstoRecorrente: number }[];
};

type ErrorResponse = { message?: string; detalhes?: string[] | null };

// ---------- Infra ----------

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function chamar<T>(caminho: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.body) headers["Content-Type"] = "application/json";
  const t = token ?? getSessaoSnapshot()?.token;
  if (t) headers["Authorization"] = `Bearer ${t}`;

  const res = await fetch(`${API_URL}${caminho}`, { ...init, headers });
  if (res.status === 401 && t) {
    // Token vencido/inválido: encerra a sessão; as telas protegidas redirecionam para o login.
    limparSessao();
  }
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const corpo = (await res.json()) as ErrorResponse;
      if (corpo.detalhes?.length) msg = corpo.detalhes.join("; ");
      else if (corpo.message) msg = corpo.message;
    } catch {
      /* corpo vazio */
    }
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const json = (body: unknown) => JSON.stringify(body);

function query(params: Record<string, string | number | boolean | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

// ---------- Auth ----------

export const login = (email: string, senha: string) =>
  chamar<SessaoResponse>("/api/auth/login", { method: "POST", body: json({ email, senha }) });

export const cadastrar = (nome: string, email: string, senha: string) =>
  chamar<SessaoResponse>("/api/auth/cadastro", { method: "POST", body: json({ nome, email, senha }) });

export const renovarSessao = (token: string) =>
  chamar<SessaoResponse>("/api/auth/renovar", { method: "POST" }, token);

export const trocarSenha = (senhaAtual: string, novaSenha: string) =>
  chamar<void>("/api/auth/trocar-senha", { method: "POST", body: json({ senhaAtual, novaSenha }) });

// ---------- Cartões ----------

export const listarCartoes = () => chamar<Cartao[]>("/api/cartoes");
export const criarCartao = (c: CartaoRequest) => chamar<Cartao>("/api/cartoes", { method: "POST", body: json(c) });
export const atualizarCartao = (id: number, c: CartaoRequest) =>
  chamar<Cartao>(`/api/cartoes/${id}`, { method: "PUT", body: json(c) });
export const excluirCartao = (id: number) => chamar<void>(`/api/cartoes/${id}`, { method: "DELETE" });

// ---------- Categorias ----------

export const listarCategorias = () => chamar<Categoria[]>("/api/categorias");
export const criarCategoria = (c: CategoriaRequest) =>
  chamar<Categoria>("/api/categorias", { method: "POST", body: json(c) });
export const atualizarCategoria = (id: number, c: CategoriaRequest) =>
  chamar<Categoria>(`/api/categorias/${id}`, { method: "PUT", body: json(c) });
export const excluirCategoria = (id: number) => chamar<void>(`/api/categorias/${id}`, { method: "DELETE" });

export type OrigemSugestao = "historico" | "palavra_chave" | "padrao";
export type SugestaoCategoria = { categoria: Categoria | null; origem: OrigemSugestao | null };

export const sugerirCategoria = (descricao: string) =>
  chamar<SugestaoCategoria>(`/api/categorias/sugestao${query({ descricao })}`);

// ---------- Compras ----------

export const listarCompras = (f: {
  cartaoId?: number | null;
  categoriaId?: number | null;
  busca?: string;
  emAberto?: boolean;
  pagina?: number;
}) => chamar<Pagina<Compra>>(`/api/compras${query(f)}`);

export const preverFatura = (cartaoId: number, dataCompra: string) =>
  chamar<PrevisaoFatura>(`/api/compras/previsao-fatura${query({ cartaoId, dataCompra })}`);

export const criarCompra = (c: CompraRequest) => chamar<Compra>("/api/compras", { method: "POST", body: json(c) });
export const atualizarCompra = (id: number, c: CompraRequest) =>
  chamar<Compra>(`/api/compras/${id}`, { method: "PUT", body: json(c) });
export const excluirCompra = (id: number) => chamar<void>(`/api/compras/${id}`, { method: "DELETE" });

// ---------- Recorrências (assinaturas, anuidades) ----------

export const listarRecorrencias = () => chamar<Recorrencia[]>("/api/recorrencias");
export const criarRecorrencia = (r: RecorrenciaRequest) =>
  chamar<Recorrencia>("/api/recorrencias", { method: "POST", body: json(r) });
export const atualizarRecorrencia = (id: number, r: RecorrenciaRequest) =>
  chamar<Recorrencia>(`/api/recorrencias/${id}`, { method: "PUT", body: json(r) });
export const excluirRecorrencia = (id: number) => chamar<void>(`/api/recorrencias/${id}`, { method: "DELETE" });

// ---------- Faturas / painel ----------

// ---------- Compartilhamento do painel (link somente leitura) ----------

export type Compartilhamento = { id: number; nome: string; criadoEm: string; ultimoAcesso: string | null };
/** `token` só vem na criação - depois disso não dá para recuperar o link. */
export type CompartilhamentoCriado = { compartilhamento: Compartilhamento; token: string };

export const listarCompartilhamentos = () => chamar<Compartilhamento[]>("/api/compartilhamentos");
export const criarCompartilhamento = (nome: string) =>
  chamar<CompartilhamentoCriado>("/api/compartilhamentos", { method: "POST", body: json({ nome }) });
export const revogarCompartilhamento = (id: number) => chamar<void>(`/api/compartilhamentos/${id}`, { method: "DELETE" });

/** Link que o dono manda. O token vai depois do # (nunca chega a servidor nenhum na URL). */
export const linkCompartilhamento = (token: string) => `${window.location.origin}/ver#${token}`;

/** Chamadas da página pública: sem sessão, token no header. Não mexe na sessão de quem
 * estiver logado no mesmo navegador. */
async function chamarPublico<T>(caminho: string, token: string): Promise<T> {
  const res = await fetch(`${API_URL}${caminho}`, { headers: { "X-Painel-Token": token } });
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const corpo = (await res.json()) as ErrorResponse;
      if (corpo.message) msg = corpo.message;
    } catch {
      /* corpo vazio */
    }
    throw new ApiError(res.status, msg);
  }
  return (await res.json()) as T;
}

export const painelPublicoInfo = (token: string) =>
  chamarPublico<{ dono: string; mesAtual: string }>("/api/publico/painel/info", token);
export const painelPublicoDashboard = (token: string, mes: string) =>
  chamarPublico<Dashboard>(`/api/publico/painel/dashboard${query({ mes })}`, token);
export const painelPublicoFaturas = (token: string, mes: string) =>
  chamarPublico<FaturasDoMes>(`/api/publico/painel/faturas${query({ mes })}`, token);

/** Mês da fatura em aberto hoje (onde Painel e Faturas abrem). */
export const faturaAtual = () => chamar<{ mes: string }>("/api/faturas/atual");

export const faturasDoMes = (mes: string) => chamar<FaturasDoMes>(`/api/faturas${query({ mes })}`);
export const dashboard = (mes: string) => chamar<Dashboard>(`/api/dashboard${query({ mes })}`);
