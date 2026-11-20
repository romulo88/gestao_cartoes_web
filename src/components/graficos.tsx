"use client";

import { useState } from "react";
import type { Dashboard, FaturasDoMes, ItemFatura, Ref } from "@/lib/api";
import { brl, diaMes, mesCurto } from "@/lib/format";
import { Bolinha } from "@/components/ui";

/** Listras do segmento "previsto" (recorrência ainda não lançada). */
const LISTRAS = "repeating-linear-gradient(135deg, #cbd5e1 0 3px, #f1f5f9 3px 6px)";

/** Barras empilhadas por cartão, 13 meses (6 antes, o escolhido, 6 depois). A partir do mês
 * de hoje o que aparece é o que já está parcelado - uma projeção mínima, separada por uma
 * linha tracejada. Hover em qualquer coluna mostra o detalhe. */
export function GraficoMeses({
  serie,
  cartoes,
  mesSelecionado,
  mesAtual,
  onEscolherMes,
}: {
  serie: Dashboard["serie"];
  cartoes: Ref[];
  mesSelecionado: string;
  /** Fatura em aberto hoje - a linha tracejada separa o que já passou do que vem. */
  mesAtual: string;
  onEscolherMes: (mes: string) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...serie.map((p) => p.total + p.previstoRecorrente));
  const temPrevisto = serie.some((p) => p.previstoRecorrente > 0);
  const idxHoje = serie.findIndex((p) => p.competencia === mesAtual);
  const corDe = new Map(cartoes.map((c) => [c.id, c]));
  const ALTURA = 180;
  const ponto = hover != null ? serie[hover] : null;

  return (
    <div>
      {(cartoes.length > 1 || temPrevisto) && (
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {cartoes.length > 1 &&
            cartoes.map((c) => (
              <span key={c.id} className="flex items-center gap-1.5">
                <Bolinha cor={c.cor} /> {c.nome}
              </span>
            ))}
          {temPrevisto && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full border border-dashed border-slate-500" style={{ background: LISTRAS }} />
              Recorrentes previstos
            </span>
          )}
        </div>
      )}
      <div className="relative">
        {/* Grade recessiva: só a linha do máximo e a base. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-slate-200" />
        <span className="pointer-events-none absolute -top-2 right-0 bg-white pl-1 text-[10px] text-slate-400">{brl(max)}</span>
        <div className="flex items-end gap-1 sm:gap-2" style={{ height: ALTURA }} onMouseLeave={() => setHover(null)}>
          {serie.map((p, i) => {
            const altura = (p.total / max) * ALTURA;
            const alturaPrevisto = (p.previstoRecorrente / max) * ALTURA;
            const segmentos = [...p.porCartao].sort((a, b) => a.chave - b.chave);
            const selecionado = p.competencia === mesSelecionado;
            return (
              <button
                key={p.competencia}
                type="button"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onClick={() => onEscolherMes(p.competencia)}
                className={`relative flex h-full flex-1 flex-col justify-end rounded-md ${hover === i ? "bg-slate-100" : ""} ${
                  i === idxHoje ? "border-l border-dashed border-slate-300" : ""
                }`}
                aria-label={`${mesCurto(p.competencia)}: ${brl(p.total)}${p.previstoRecorrente > 0 ? ` + ${brl(p.previstoRecorrente)} previstos` : ""}`}
              >
                {/* Recorrentes que ainda não viraram compra: em cima, tracejado = só previsão. */}
                {p.previstoRecorrente > 0 && (
                  <div
                    className="mx-auto mb-[2px] w-full max-w-[34px] rounded-t border border-dashed border-slate-400"
                    style={{ height: Math.max(alturaPrevisto, 3), background: LISTRAS }}
                  />
                )}
                <div className="mx-auto flex w-full max-w-[34px] flex-col-reverse gap-[2px]" style={{ height: altura }}>
                  {segmentos.map((s, j) => (
                    <div
                      key={s.chave}
                      className={j === segmentos.length - 1 && p.previstoRecorrente === 0 ? "rounded-t" : ""}
                      style={{
                        height: `${(s.total / Math.max(p.total, 0.01)) * 100}%`,
                        backgroundColor: corDe.get(s.chave)?.cor ?? "#94a3b8",
                        minHeight: 2,
                      }}
                    />
                  ))}
                </div>
                {selecionado && <span className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-slate-900" />}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex gap-1 border-t border-slate-200 pt-2 sm:gap-2">
          {serie.map((p) => (
            <span
              key={p.competencia}
              className={`flex-1 text-center text-[10px] sm:text-xs ${p.competencia === mesSelecionado ? "font-semibold text-slate-900" : "text-slate-400"}`}
            >
              {mesCurto(p.competencia).split("/")[0]}
            </span>
          ))}
        </div>
        {idxHoje >= 0 && <p className="mt-1 text-[11px] text-slate-400">A partir da linha tracejada (fatura em aberto): parcelas já lançadas, o mínimo que vem por aí.</p>}

        {ponto && (
          <div
            className="pointer-events-none absolute -top-2 z-10 min-w-[180px] -translate-y-full rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
            // Acompanha a coluna; perto da borda direita, ancora pela direita para não vazar.
            style={
              hover! > serie.length / 2
                ? { right: `${((serie.length - hover! - 1) / serie.length) * 100}%` }
                : { left: `${(hover! / serie.length) * 100}%` }
            }
          >
            <p className="font-semibold">
              {mesCurto(ponto.competencia)} · {brl(ponto.total)}
            </p>
            {ponto.porCartao.map((s) => (
              <p key={s.chave} className="mt-0.5 flex items-center justify-between gap-3 text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Bolinha cor={corDe.get(s.chave)?.cor ?? "#94a3b8"} /> {corDe.get(s.chave)?.nome ?? "Cartão"}
                </span>
                <span>{brl(s.total)}</span>
              </p>
            ))}
            {ponto.previstoRecorrente > 0 && (
              <p className="mt-1 flex items-center justify-between gap-3 border-t border-slate-700 pt-1 text-slate-300">
                <span>+ recorrentes previstos</span>
                <span>{brl(ponto.previstoRecorrente)}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Parcela da fatura do mês com o cartão (para o hint da categoria). */
export type ItemComCartao = ItemFatura & { cartao: Ref };
/** Chave = id da categoria, ou "sem" para sem categoria. */
export type ItensPorCategoria = Map<number | "sem", ItemComCartao[]>;

/** Itens de todas as faturas do mês agrupados por categoria, maiores primeiro. */
export function agruparPorCategoria(f: FaturasDoMes): ItensPorCategoria {
  const mapa: ItensPorCategoria = new Map();
  for (const fatura of f.faturas) {
    for (const item of fatura.itens) {
      const chave = item.categoria?.id ?? "sem";
      const lista = mapa.get(chave) ?? [];
      lista.push({ ...item, cartao: fatura.cartao });
      mapa.set(chave, lista);
    }
  }
  for (const lista of mapa.values()) lista.sort((a, b) => b.valor - a.valor);
  return mapa;
}

const MAX_NO_HINT = 8;

/** Hint com os gastos da categoria na fatura (só mostra se houver itens). */
function HintCategoria({ itens, total }: { itens: ItemComCartao[]; total: number }) {
  const visiveis = itens.slice(0, MAX_NO_HINT);
  const resto = itens.slice(MAX_NO_HINT);
  const variosCartoes = new Set(itens.map((i) => i.cartao.id)).size > 1;
  return (
    <div className="absolute inset-x-0 top-full z-20 mt-1 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
      <ul className="space-y-1">
        {visiveis.map((i) => (
          <li key={`${i.compraId}-${i.numeroParcela}`} className="flex items-baseline justify-between gap-3">
            <span className="flex min-w-0 items-baseline gap-1.5">
              <span className="shrink-0 text-slate-400">{diaMes(i.dataCompra)}</span>
              {variosCartoes && <Bolinha cor={i.cartao.cor} className="h-2 w-2 self-center" />}
              <span className="truncate">{i.descricao}</span>
              {i.qtdParcelas > 1 && (
                <span className="shrink-0 text-slate-400">
                  {i.numeroParcela}/{i.qtdParcelas}
                </span>
              )}
            </span>
            <span className="shrink-0">{brl(i.valor)}</span>
          </li>
        ))}
      </ul>
      {resto.length > 0 && (
        <p className="mt-1 flex justify-between gap-3 text-slate-400">
          <span>+ {resto.length} outro(s)</span>
          <span>{brl(resto.reduce((s, i) => s + i.valor, 0))}</span>
        </p>
      )}
      <p className="mt-1.5 flex justify-between gap-3 border-t border-slate-700 pt-1.5 font-semibold">
        <span>
          {itens.length} lançamento(s)
        </span>
        <span>{brl(total)}</span>
      </p>
    </div>
  );
}

/** Gasto por categoria no mês: barras horizontais de um só tom (a identidade vem do nome,
 * não da cor). Com limite mensal, mostra a marca do limite e avisa quando passou. Passar o
 * mouse (ou tocar, no celular) mostra os gastos da categoria nessa fatura. */
export function BarrasCategorias({
  categorias,
  itens,
}: {
  categorias: Dashboard["categorias"];
  itens?: ItensPorCategoria | null;
}) {
  const [aberta, setAberta] = useState<number | "sem" | null>(null);
  if (categorias.length === 0) return <p className="text-sm text-slate-400">Nada lançado nesta fatura.</p>;
  const max = Math.max(...categorias.map((c) => Math.max(c.total, c.limiteMensal ?? 0)), 1);
  return (
    // Hover só para mouse de verdade: no toque o navegador dispara "entrou" + "clique" juntos,
    // e o clique (que alterna) fecharia o hint que acabou de abrir.
    <ul className="space-y-3" onPointerLeave={(e) => e.pointerType === "mouse" && setAberta(null)}>
      {categorias.map((c) => {
        const passou = c.limiteMensal != null && c.total > c.limiteMensal;
        const chave = c.categoria.id ?? "sem";
        const daCategoria = itens?.get(chave) ?? [];
        return (
          <li
            key={chave}
            className={`relative -mx-2 rounded-lg px-2 py-1 ${daCategoria.length ? "cursor-default" : ""} ${aberta === chave ? "bg-slate-50" : ""}`}
            onPointerEnter={(e) => e.pointerType === "mouse" && setAberta(chave)}
            onClick={() => setAberta((a) => (a === chave ? null : chave))}
          >
            {aberta === chave && daCategoria.length > 0 && <HintCategoria itens={daCategoria} total={c.total} />}
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-slate-700">
                <Bolinha cor={c.categoria.cor} />
                <span className="truncate">{c.categoria.nome}</span>
              </span>
              <span className="shrink-0 text-slate-900">
                {brl(c.total)}
                {c.limiteMensal != null && <span className="text-xs text-slate-400"> / {brl(c.limiteMensal)}</span>}
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${passou ? "bg-[#e34948]" : "bg-[#2a78d6]"}`}
                style={{ width: `${Math.min(100, (c.total / max) * 100)}%` }}
              />
              {c.limiteMensal != null && (
                <span className="absolute -top-1 h-4 w-0.5 rounded bg-slate-500" style={{ left: `${(c.limiteMensal / max) * 100}%` }} />
              )}
            </div>
            {passou && <p className="mt-1 text-xs text-red-600">⚠ {brl(c.total - (c.limiteMensal ?? 0))} acima do limite</p>}
          </li>
        );
      })}
    </ul>
  );
}

/** Uso do limite: quanto do limite já está comprometido com parcelas a vencer. */
export function BarraLimite({ usado, limite }: { usado: number; limite: number }) {
  const pct = limite > 0 ? (usado / limite) * 100 : 0;
  const cor = pct >= 90 ? "bg-[#e34948]" : pct >= 70 ? "bg-[#eda100]" : "bg-[#2a78d6]";
  return (
    <div>
      <div className="h-1.5 rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full ${cor}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {Math.round(pct)}% do limite comprometido · {brl(Math.max(0, limite - usado))} livre
      </p>
    </div>
  );
}

// ---------- Categorias por cartão (rosca) ----------

/** Fatias além desta quantidade viram "Outras" (pizza com muita fatia não se lê). */
const MAX_FATIAS = 6;
const COR_OUTRAS = "#cbd5e1";
const COR_SEM_CATEGORIA = "#94a3b8";

type Fatia = { chave: string; nome: string; cor: string; total: number };

/** Gasto por categoria de UMA fatura (cartão), maiores primeiro, cauda dobrada em "Outras". */
function fatiasDaFatura(fatura: FaturasDoMes["faturas"][number]): Fatia[] {
  const mapa = new Map<string, Fatia>();
  for (const i of fatura.itens) {
    const chave = String(i.categoria?.id ?? "sem");
    const f = mapa.get(chave) ?? {
      chave,
      nome: i.categoria?.nome ?? "Sem categoria",
      cor: i.categoria?.cor ?? COR_SEM_CATEGORIA,
      total: 0,
    };
    f.total += i.valor;
    mapa.set(chave, f);
  }
  const ordenadas = [...mapa.values()].sort((a, b) => b.total - a.total);
  if (ordenadas.length <= MAX_FATIAS) return ordenadas;
  const cabeca = ordenadas.slice(0, MAX_FATIAS - 1);
  const resto = ordenadas.slice(MAX_FATIAS - 1);
  return [
    ...cabeca,
    { chave: "outras", nome: `Outras (${resto.length})`, cor: COR_OUTRAS, total: resto.reduce((s, f) => s + f.total, 0) },
  ];
}

const RAIO = 40;
const ESPESSURA = 16;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

/** Rosca de uma fatura: total no miolo; hover/toque numa fatia (ou na legenda) mostra a fatia. */
function RoscaCartao({ cartao, fatias }: { cartao: Ref; fatias: Fatia[] }) {
  const [ativa, setAtiva] = useState<string | null>(null);
  const total = fatias.reduce((s, f) => s + f.total, 0);
  const destaque = fatias.find((f) => f.chave === ativa) ?? null;
  // 2px de "respiro" entre fatias (cor da superfície), só quando há mais de uma.
  const vao = fatias.length > 1 ? 1.5 : 0;

  // Cada arco começa onde a soma das fatias anteriores termina.
  const comprimentos = fatias.map((f) => (f.total / total) * CIRCUNFERENCIA);
  const arcos = fatias.map((f, i) => ({
    ...f,
    comprimento: comprimentos[i],
    inicio: comprimentos.slice(0, i).reduce((s, c) => s + c, 0),
  }));

  const pct = (v: number) => `${Math.round((v / total) * 100)}%`;
  const entrar = (chave: string) => (e: React.PointerEvent) => e.pointerType === "mouse" && setAtiva(chave);
  const alternar = (chave: string) => () => setAtiva((a) => (a === chave ? null : chave));

  return (
    <div onPointerLeave={(e) => e.pointerType === "mouse" && setAtiva(null)}>
      <p className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
        <Bolinha cor={cartao.cor} className="h-3 w-3" /> {cartao.nome}
      </p>
      {/* Legenda ao lado quando cabe; senão desce para baixo da rosca (celular). */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={`Categorias do cartão ${cartao.nome}`}>
            {arcos.map((a) => (
              <circle
                key={a.chave}
                cx="50"
                cy="50"
                r={RAIO}
                fill="none"
                stroke={a.cor}
                strokeWidth={ativa === a.chave ? ESPESSURA + 3 : ESPESSURA}
                strokeDasharray={`${Math.max(a.comprimento - vao, 0.5)} ${CIRCUNFERENCIA}`}
                strokeDashoffset={-a.inicio}
                opacity={ativa && ativa !== a.chave ? 0.35 : 1}
                className="cursor-pointer transition-[opacity,stroke-width]"
                onPointerEnter={entrar(a.chave)}
                onClick={alternar(a.chave)}
              >
                <title>{`${a.nome}: ${brl(a.total)} (${pct(a.total)})`}</title>
              </circle>
            ))}
          </svg>
          {/* Miolo: total da fatura, ou a fatia destacada. */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            {destaque ? (
              <>
                <span className="w-full truncate text-[10px] text-slate-500">{destaque.nome}</span>
                <span className="text-xs font-semibold text-slate-900">{brl(destaque.total)}</span>
                <span className="text-[10px] text-slate-500">{pct(destaque.total)}</span>
              </>
            ) : (
              <>
                <span className="text-[10px] text-slate-500">total</span>
                <span className="text-xs font-semibold text-slate-900">{brl(total)}</span>
              </>
            )}
          </div>
        </div>
        <ul className="min-w-[180px] flex-1 space-y-1 text-xs">
          {fatias.map((f) => (
            <li
              key={f.chave}
              onPointerEnter={entrar(f.chave)}
              onClick={alternar(f.chave)}
              className={`flex cursor-pointer items-center justify-between gap-2 rounded px-1 py-0.5 ${ativa === f.chave ? "bg-slate-100" : ""}`}
            >
              <span className="flex min-w-0 items-center gap-1.5 text-slate-700">
                <Bolinha cor={f.cor} />
                <span className="truncate">{f.nome}</span>
              </span>
              <span className="shrink-0 text-slate-900">
                {brl(f.total)} <span className="text-slate-400">{pct(f.total)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Uma rosca por cartão com gasto na fatura do mês. Nada lançado = não mostra nada. */
export function RoscasPorCartao({ faturas }: { faturas: FaturasDoMes }) {
  const comGasto = faturas.faturas.filter((f) => f.itens.length > 0);
  if (comGasto.length === 0) return null;
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {comGasto.map((f) => (
        <RoscaCartao key={f.cartao.id} cartao={f.cartao} fatias={fatiasDaFatura(f)} />
      ))}
    </div>
  );
}
