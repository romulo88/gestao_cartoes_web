"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  atualizarCompra,
  Cartao,
  Categoria,
  Compra,
  CompraRequest,
  criarCompra,
  excluirCompra,
  OrigemSugestao,
  preverFatura,
  PrevisaoFatura,
  sugerirCategoria,
} from "@/lib/api";
import { brl, diaMes, hojeIso, lerValor, mesCurto, somarMeses, valorParaInput } from "@/lib/format";
import { Button, Campo, Erro, Input, Modal, Select } from "@/components/ui";
import { SeletorCategoria } from "@/components/seletor-categoria";

/** Modal de lançar/editar compra. Mostra, antes de salvar, em qual fatura cai a 1ª parcela
 * (pelo dia de fechamento do cartão) e permite trocar o mês na mão - é o caso do
 * fechamento antecipado por fim de semana/feriado. */
export function FormCompra({
  aberto,
  compra,
  cartoes,
  categorias,
  onFechar,
  onSalvo,
  onCategoriaCriada,
}: {
  aberto: boolean;
  compra: Compra | null;
  cartoes: Cartao[];
  categorias: Categoria[];
  onFechar: () => void;
  onSalvo: () => void;
  /** Categoria criada pelo "+ Nova categoria" do formulário: o pai recarrega a lista. */
  onCategoriaCriada?: () => void;
}) {
  const ativos = cartoes.filter((c) => c.ativo || c.id === compra?.cartao.id);

  // O pai remonta o formulário (prop `key`) a cada abertura, então o estado nasce daqui.
  const [cartaoId, setCartaoId] = useState<number | "">(compra?.cartao.id ?? ativos[0]?.id ?? "");
  const [descricao, setDescricao] = useState(compra?.descricao ?? "");
  const [valor, setValor] = useState(compra ? valorParaInput(compra.valorTotal) : "");
  const [parcelas, setParcelas] = useState(compra ? String(compra.qtdParcelas) : "1");
  const [data, setData] = useState(compra?.dataCompra ?? hojeIso());
  const [categoriaId, setCategoriaId] = useState<number | "">(compra?.categoria?.id ?? "");
  // Categoria escolhida na mão (ou compra já existente): a sugestão automática não mexe mais.
  const [categoriaManual, setCategoriaManual] = useState(!!compra);
  const [origemSugestao, setOrigemSugestao] = useState<OrigemSugestao | null>(null);
  const [observacao, setObservacao] = useState(compra?.observacao ?? "");
  const [faturaManual, setFaturaManual] = useState<string | null>(compra?.primeiraFatura ?? null);
  const [previsao, setPrevisao] = useState<PrevisaoFatura | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Sugere a categoria enquanto a descrição é digitada (histórico -> palavras-chave -> Outros).
  useEffect(() => {
    if (categoriaManual || descricao.trim().length < 2) return;
    let cancelado = false;
    const t = setTimeout(() => {
      sugerirCategoria(descricao)
        .then((s) => {
          if (cancelado) return;
          setCategoriaId(s.categoria?.id ?? "");
          setOrigemSugestao(s.categoria ? s.origem : null);
        })
        .catch(() => {
          /* sem sugestão: o campo fica como está */
        });
    }, 300);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [descricao, categoriaManual]);

  // "Em qual fatura cai?" - recalcula ao trocar cartão/data.
  useEffect(() => {
    if (!aberto || cartaoId === "" || !data) return;
    let cancelado = false;
    preverFatura(cartaoId, data)
      .then((p) => !cancelado && setPrevisao(p))
      .catch(() => !cancelado && setPrevisao(null));
    return () => {
      cancelado = true;
    };
  }, [aberto, cartaoId, data]);

  const valorNum = lerValor(valor);
  const qtd = Math.max(1, Math.min(72, Number(parcelas) || 1));
  const valorParcela = valorNum ? Math.floor((valorNum * 100) / qtd) / 100 : null;
  const primeira = faturaManual ?? previsao?.competencia ?? null;

  const opcoesFatura = useMemo(() => {
    const base = previsao?.competencia ?? primeira;
    if (!base) return [];
    return [-2, -1, 0, 1, 2].map((d) => somarMeses(base, d));
  }, [previsao, primeira]);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (cartaoId === "") return setErro("Escolha o cartão.");
    if (!valorNum || valorNum <= 0) return setErro("Informe um valor válido.");
    const req: CompraRequest = {
      cartaoId,
      categoriaId: categoriaId === "" ? null : categoriaId,
      descricao: descricao.trim(),
      valorTotal: valorNum,
      qtdParcelas: qtd,
      dataCompra: data,
      // Só manda se o usuário escolheu um mês diferente do calculado.
      primeiraFatura: faturaManual && faturaManual !== previsao?.competencia ? faturaManual : null,
      observacao: observacao.trim() || null,
    };
    setSalvando(true);
    try {
      if (compra) await atualizarCompra(compra.id, req);
      else await criarCompra(req);
      onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!compra || !confirm(`Excluir "${compra.descricao}" e todas as ${compra.qtdParcelas} parcela(s)?`)) return;
    setSalvando(true);
    try {
      await excluirCompra(compra.id);
      onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível excluir.");
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={compra ? "Editar compra" : "Nova compra"} aberto={aberto} onFechar={onFechar}>
      {ativos.length === 0 ? (
        <p className="text-sm text-slate-600">Cadastre um cartão primeiro, na tela Cartões.</p>
      ) : (
        <form onSubmit={salvar} className="space-y-4">
          <Campo label="Descrição">
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} required maxLength={160} placeholder="Ex.: Geladeira, Mercado, Uber" autoFocus />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Valor total (R$)">
              <Input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="0,00" required />
            </Campo>
            <Campo label="Parcelas" dica={valorParcela && qtd > 1 ? `${qtd}x de ${brl(valorParcela)}` : undefined}>
              <Input type="number" min={1} max={72} value={parcelas} onChange={(e) => setParcelas(e.target.value)} required />
            </Campo>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Cartão">
              <Select
                value={cartaoId}
                onChange={(e) => {
                  setCartaoId(Number(e.target.value));
                  setFaturaManual(null);
                }}
              >
                {ativos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </Campo>
            <Campo label="Data da compra">
              <Input
                type="date"
                value={data}
                onChange={(e) => {
                  setData(e.target.value);
                  setFaturaManual(null);
                }}
                required
              />
            </Campo>
          </div>
          <Campo
            label="Categoria"
            dica={
              !categoriaManual && origemSugestao
                ? origemSugestao === "historico"
                  ? "Sugerida pelas suas compras anteriores"
                  : origemSugestao === "palavra_chave"
                    ? "Sugerida pela descrição"
                    : "Nenhuma regra reconheceu a descrição"
                : undefined
            }
          >
            <SeletorCategoria
              valor={categoriaId}
              categorias={categorias}
              onChange={(id) => {
                setCategoriaId(id);
                setCategoriaManual(true);
              }}
              onCriada={onCategoriaCriada}
            />
          </Campo>

          {primeira && (
            <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  1ª parcela na fatura de <strong>{mesCurto(primeira)}</strong>
                  {qtd > 1 && <> · última em {mesCurto(somarMeses(primeira, qtd - 1))}</>}
                </span>
                <Select
                  value={primeira}
                  onChange={(e) => setFaturaManual(e.target.value)}
                  className="!w-auto !bg-white !py-1.5 !text-xs"
                  aria-label="Mudar fatura da 1ª parcela"
                >
                  {opcoesFatura.map((m) => (
                    <option key={m} value={m}>
                      {mesCurto(m)}
                      {m === previsao?.competencia ? " (calculada)" : ""}
                    </option>
                  ))}
                </Select>
              </div>
              {previsao && primeira === previsao.competencia && (
                <p className="mt-1 text-xs text-slate-500">
                  Fecha {diaMes(previsao.dataFechamento)} · vence {diaMes(previsao.dataVencimento)}
                </p>
              )}
              {previsao && primeira !== previsao.competencia && (
                <p className="mt-1 text-xs text-amber-700">Mês ajustado na mão (ex.: fechamento antecipado).</p>
              )}
            </div>
          )}

          <Campo label="Observação (opcional)">
            <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} maxLength={500} />
          </Campo>

          <Erro mensagem={erro} />

          <div className="flex items-center justify-between gap-2 pt-1">
            {compra ? (
              <Button type="button" variant="danger" onClick={excluir} disabled={salvando}>
                Excluir
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onFechar}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
