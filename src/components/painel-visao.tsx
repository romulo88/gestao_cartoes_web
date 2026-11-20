"use client";

import { useMemo } from "react";
import Link from "next/link";
import { agruparPorCategoria, BarraLimite, BarrasCategorias, GraficoMeses, RoscasPorCartao } from "@/components/graficos";
import { Bolinha, Cartao } from "@/components/ui";
import type { Dashboard, FaturasDoMes } from "@/lib/api";
import { brl, diaMes, mesCurto } from "@/lib/format";

/**
 * Conteúdo do painel (números, cartões, gráfico, categorias). Usado pelo painel do dono e
 * pela visualização por link (`somenteLeitura`: sem links para telas que pedem login).
 */
export function PainelVisao({
  dados,
  atual,
  onEscolherMes,
  faturas,
  somenteLeitura = false,
}: {
  dados: Dashboard;
  atual: string | null;
  onEscolherMes: (mes: string) => void;
  /** Itens das faturas do mês: hint das categorias e roscas por cartão (null = sem esses extras). */
  faturas: FaturasDoMes | null;
  somenteLeitura?: boolean;
}) {
  const itensPorCategoria = useMemo(() => (faturas ? agruparPorCategoria(faturas) : null), [faturas]);
  const variacao = dados.totalMesAnterior > 0 ? ((dados.totalMes - dados.totalMesAnterior) / dados.totalMesAnterior) * 100 : null;
  const comLimite = dados.cartoes.filter((c) => c.limite != null);
  const livreTotal = comLimite.reduce((s, c) => s + Math.max(0, c.limiteDisponivel ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Números do mês */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Cartao>
          <p className="text-xs font-medium text-slate-500">Faturas de {mesCurto(dados.competencia)}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{brl(dados.totalMes)}</p>
          {variacao != null && (
            <p className="mt-1 text-xs text-slate-500">
              {variacao >= 0 ? "▲" : "▼"} {Math.abs(variacao).toFixed(0)}% vs. {mesCurto(dados.serie[5]?.competencia ?? dados.competencia)}
            </p>
          )}
        </Cartao>
        <Cartao>
          <p className="text-xs font-medium text-slate-500">Já comprometido depois deste mês</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{brl(dados.comprometidoFuturo)}</p>
          <p className="mt-1 text-xs text-slate-500">parcelas que ainda vão cair</p>
        </Cartao>
        <Cartao>
          <p className="text-xs font-medium text-slate-500">Limite livre (todos os cartões)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{comLimite.length ? brl(livreTotal) : "—"}</p>
          <p className="mt-1 text-xs text-slate-500">
            {comLimite.length ? "descontadas as parcelas a vencer" : somenteLeitura ? "limite não cadastrado" : "cadastre o limite nos cartões"}
          </p>
        </Cartao>
      </div>

      {/* Um cartão por cartão */}
      {dados.cartoes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dados.cartoes.map((c) => {
            const conteudo = (
              <Cartao className={`h-full ${somenteLeitura ? "" : "transition hover:border-slate-300"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Bolinha cor={c.cartao.cor} className="h-3 w-3" />
                    {c.cartao.nome}
                  </span>
                  <span className="text-xs text-slate-400">
                    fecha {diaMes(c.dataFechamento)} · vence {diaMes(c.dataVencimento)}
                  </span>
                </div>
                <p className="mt-3 text-xl font-semibold text-slate-900">{brl(c.totalMes)}</p>
                <div className="mt-3">
                  {c.limite != null ? (
                    <BarraLimite usado={c.emAberto} limite={c.limite} />
                  ) : (
                    <p className="text-xs text-slate-400">{brl(c.emAberto)} a vencer · sem limite cadastrado</p>
                  )}
                </div>
              </Cartao>
            );
            return somenteLeitura ? (
              <div key={c.cartao.id}>{conteudo}</div>
            ) : (
              <Link key={c.cartao.id} href={`/faturas?mes=${dados.competencia}`} className="block">
                {conteudo}
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Cartao className="lg:col-span-3">
          <h2 className="mb-5 text-sm font-semibold text-slate-900">Faturas mês a mês</h2>
          <GraficoMeses
            serie={dados.serie}
            cartoes={dados.cartoes.map((c) => c.cartao)}
            mesSelecionado={dados.competencia}
            mesAtual={atual ?? dados.competencia}
            onEscolherMes={onEscolherMes}
          />
        </Cartao>
        <Cartao className="lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Por categoria</h2>
            {!somenteLeitura && (
              <Link href="/categorias" className="text-xs text-blue-600 hover:underline">
                limites
              </Link>
            )}
          </div>
          <BarrasCategorias categorias={dados.categorias} itens={itensPorCategoria} />
        </Cartao>
      </div>

      {/* Só aparece com gasto no mês (e só se os itens das faturas carregaram). */}
      {faturas && faturas.faturas.some((f) => f.itens.length > 0) && (
        <Cartao>
          <h2 className="mb-5 text-sm font-semibold text-slate-900">Categorias por cartão</h2>
          <RoscasPorCartao faturas={faturas} />
        </Cartao>
      )}
    </div>
  );
}
