"use client";

import { useEffect, useState } from "react";
import { AppShell, Titulo } from "@/components/app-shell";
import { SeletorMes } from "@/components/seletor-mes";
import { Bolinha, Cartao, Erro } from "@/components/ui";
import { faturaAtual, faturasDoMes, FaturasDoMes, SituacaoFatura } from "@/lib/api";
import { brl, dataBr, diaMes, mesLongo } from "@/lib/format";
import { useSessaoObrigatoria } from "@/lib/use-sessao";

const SITUACAO: Record<SituacaoFatura, { texto: string; icone: string; classe: string }> = {
  aberta: { texto: "Aberta", icone: "○", classe: "bg-blue-50 text-blue-700" },
  fechada: { texto: "Fechada", icone: "◐", classe: "bg-amber-50 text-amber-800" },
  vencida: { texto: "Venceu", icone: "●", classe: "bg-slate-100 text-slate-600" },
};

/** Mês ?mes=2026-12 vindo do painel; lido direto da URL (sem useSearchParams, que exigiria
 * Suspense só para isso). */
function mesDaUrl(): string | null {
  const m = new URLSearchParams(window.location.search).get("mes");
  return m && /^\d{4}-\d{2}$/.test(m) ? m : null;
}

export default function FaturasPage() {
  const sessao = useSessaoObrigatoria();
  // ?mes= vindo do painel; senão, a fatura em aberto hoje (vem do backend).
  const [mes, setMes] = useState<string | null>(() => (typeof window === "undefined" ? null : mesDaUrl()));
  const [atual, setAtual] = useState<string | null>(null);
  const [dados, setDados] = useState<FaturasDoMes | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [abertas, setAbertas] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!sessao) return;
    faturaAtual()
      .then((r) => {
        setAtual(r.mes);
        setMes((m) => m ?? r.mes);
      })
      .catch((e) => setErro(e.message));
  }, [sessao]);

  useEffect(() => {
    if (!sessao || !mes) return;
    faturasDoMes(mes)
      .then((d) => {
        setDados(d);
        setErro(null);
        // Abre de cara as faturas com lançamento (ou recorrente previsto).
        setAbertas(new Set(d.faturas.filter((f) => f.itens.length + f.previstos.length > 0).map((f) => f.cartao.id!)));
      })
      .catch((e) => setErro(e.message));
  }, [sessao, mes]);

  if (!sessao || !mes) return null;

  function alternar(id: number) {
    setAbertas((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  return (
    <AppShell sessao={sessao}>
      <Titulo acoes={<SeletorMes mes={mes} atual={atual} onChange={setMes} />}>Faturas</Titulo>
      <Erro mensagem={erro} />

      {dados && (
        <>
          <p className="mb-4 text-sm text-slate-500">
            Total das faturas de {mesLongo(dados.competencia)}:{" "}
            <strong className="text-slate-900">{brl(dados.total)}</strong>
            {dados.totalPrevisto > 0 && (
              <span className="text-slate-500">
                {" "}
                + {brl(dados.totalPrevisto)} de recorrentes previstos (ainda não lançados)
              </span>
            )}
          </p>
          {dados.faturas.length === 0 && <Cartao><p className="text-sm text-slate-500">Nenhum cartão cadastrado.</p></Cartao>}
          <div className="space-y-3">
            {dados.faturas.map((f) => {
              const id = f.cartao.id!;
              const s = SITUACAO[f.situacao];
              return (
                <Cartao key={id} className="!p-0">
                  <button onClick={() => alternar(id)} className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left">
                    <span className="flex items-center gap-2.5">
                      <Bolinha cor={f.cartao.cor} className="h-3 w-3" />
                      <span className="font-medium text-slate-900">{f.cartao.nome}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${s.classe}`}>
                        {s.icone} {s.texto}
                      </span>
                    </span>
                    <span className="flex items-center gap-4">
                      <span className="text-xs text-slate-400">
                        fecha {diaMes(f.dataFechamento)} · vence {diaMes(f.dataVencimento)}
                      </span>
                      <span className="text-right">
                        <span className="block font-semibold text-slate-900">{brl(f.total)}</span>
                        {f.totalPrevisto > 0 && <span className="block text-xs text-slate-500">+ {brl(f.totalPrevisto)} previsto</span>}
                      </span>
                      <span className="text-slate-400">{abertas.has(id) ? "▾" : "▸"}</span>
                    </span>
                  </button>
                  {abertas.has(id) && (
                    <div className="border-t border-slate-100 px-5 pb-4">
                      {f.itens.length + f.previstos.length === 0 ? (
                        <p className="pt-4 text-sm text-slate-400">Sem lançamentos nesta fatura.</p>
                      ) : (
                        <table className="mt-2 w-full table-fixed text-sm">
                          <thead>
                            <tr className="text-left text-xs text-slate-400">
                              {/* No celular a Parcela vai para baixo da descrição (sobra largura para o nome). */}
                              <th className="w-12 py-2 font-medium sm:w-14">Data</th>
                              <th className="py-2 font-medium">Descrição</th>
                              <th className="hidden w-44 py-2 font-medium sm:table-cell">Categoria</th>
                              <th className="hidden w-20 py-2 text-center font-medium sm:table-cell">Parcela</th>
                              <th className="w-24 py-2 text-right font-medium sm:w-28">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {f.itens.map((i) => (
                              <tr key={`${i.compraId}-${i.numeroParcela}`} className="border-t border-slate-100">
                                <td className="py-2 text-slate-500">{dataBr(i.dataCompra).slice(0, 5)}</td>
                                <td className="py-2 pr-2 text-slate-900">
                                  <span className="block truncate">{i.descricao}</span>
                                  {i.qtdParcelas > 1 && (
                                    <span className="block text-xs text-slate-500 sm:hidden">
                                      parcela {i.numeroParcela}/{i.qtdParcelas}
                                    </span>
                                  )}
                                </td>
                                <td className="hidden py-2 sm:table-cell">
                                  {i.categoria ? (
                                    <span className="flex items-center gap-1.5 text-slate-600">
                                      <Bolinha cor={i.categoria.cor} /> {i.categoria.nome}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )}
                                </td>
                                <td className="hidden py-2 text-center text-slate-500 sm:table-cell">
                                  {i.qtdParcelas > 1 ? `${i.numeroParcela}/${i.qtdParcelas}` : "à vista"}
                                </td>
                                <td className="py-2 text-right text-slate-900">{brl(i.valor)}</td>
                              </tr>
                            ))}
                            {/* Recorrentes que ainda vão ser lançados: listrados, fora do total. */}
                            {f.previstos.map((i) => (
                              <tr
                                key={`prev-${i.recorrenciaId}-${i.dataCobranca}-${i.numeroParcela}`}
                                className="border-t border-dashed border-slate-200 text-slate-500"
                                style={{ background: "repeating-linear-gradient(135deg, transparent 0 6px, #f8fafc 6px 12px)" }}
                                title="Recorrente: vira compra no dia da cobrança"
                              >
                                <td className="py-2">{dataBr(i.dataCobranca).slice(0, 5)}</td>
                                <td className="py-2 pr-2">
                                  <span className="flex items-center gap-2">
                                    <span className="truncate italic">{i.descricao}</span>
                                    <span className="hidden shrink-0 rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[10px] not-italic sm:inline">
                                      previsto
                                    </span>
                                  </span>
                                  {/* No celular: "previsto" e a parcela numa linha embaixo do nome. */}
                                  <span className="block text-xs sm:hidden">
                                    previsto{i.qtdParcelas > 1 && ` · parcela ${i.numeroParcela}/${i.qtdParcelas}`}
                                  </span>
                                </td>
                                <td className="hidden py-2 sm:table-cell">
                                  {i.categoria ? (
                                    <span className="flex items-center gap-1.5">
                                      <Bolinha cor={i.categoria.cor} /> {i.categoria.nome}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )}
                                </td>
                                <td className="hidden py-2 text-center sm:table-cell">
                                  {i.qtdParcelas > 1 ? `${i.numeroParcela}/${i.qtdParcelas}` : "à vista"}
                                </td>
                                <td className="py-2 text-right">{brl(i.valor)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </Cartao>
              );
            })}
          </div>
        </>
      )}
    </AppShell>
  );
}
