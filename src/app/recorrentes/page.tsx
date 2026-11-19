"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell, Titulo } from "@/components/app-shell";
import { Bolinha, Button, Campo, Cartao, Erro, Input, Modal, Select } from "@/components/ui";
import {
  atualizarRecorrencia,
  Cartao as CartaoT,
  Categoria,
  criarRecorrencia,
  excluirRecorrencia,
  listarRecorrencias,
  Periodicidade,
  Recorrencia,
  RecorrenciaRequest,
  sugerirCategoria,
} from "@/lib/api";
import { brl, dataBr, hojeIso, lerValor, mesCurto, valorParaInput } from "@/lib/format";
import { SeletorCategoria } from "@/components/seletor-categoria";
import { useDadosBase } from "@/lib/use-dados-base";
import { useSessaoObrigatoria } from "@/lib/use-sessao";

/** "R$ 39,90/mês", "R$ 480,00/ano em 12x" */
function descreverValor(r: Pick<Recorrencia, "valor" | "periodicidade" | "qtdParcelas">) {
  const sufixo = r.periodicidade === "ANUAL" ? "/ano" : "/mês";
  return `${brl(r.valor)}${sufixo}${r.qtdParcelas > 1 ? ` em ${r.qtdParcelas}x` : ""}`;
}

export default function RecorrentesPage() {
  const sessao = useSessaoObrigatoria();
  const { cartoes, categorias, recarregar } = useDadosBase(!!sessao);
  const [itens, setItens] = useState<Recorrencia[] | null>(null);
  const [editando, setEditando] = useState<Recorrencia | "novo" | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function carregar() {
    listarRecorrencias().then(setItens).catch((e) => setErro(e.message));
  }

  useEffect(() => {
    if (sessao) carregar();
  }, [sessao]);

  if (!sessao) return null;

  const vigentes = (itens ?? []).filter((r) => r.ativa && !r.encerrada);
  const custoMensal = vigentes.reduce((s, r) => s + r.valorMensal, 0);

  return (
    <AppShell sessao={sessao}>
      <Titulo acoes={<Button onClick={() => setEditando("novo")}>+ Nova recorrência</Button>}>Recorrentes</Titulo>
      {!editando && <Erro mensagem={erro} />}

      {itens && itens.length === 0 && (
        <Cartao>
          <p className="text-sm text-slate-600">
            Cadastre assinaturas (Netflix, Spotify...) e anuidades uma vez só. No dia da cobrança o sistema lança a compra
            sozinho, e as cobranças futuras aparecem como previsão no painel.
          </p>
        </Cartao>
      )}

      {vigentes.length > 0 && (
        <Cartao className="mb-4">
          <p className="text-xs text-slate-500">Custo mensal das recorrências ativas</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{brl(custoMensal)}</p>
          <p className="mt-1 text-xs text-slate-400">
            {vigentes.length} ativa(s) · anuidades contam 1/12 por mês · {brl(custoMensal * 12)} por ano
          </p>
        </Cartao>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {itens?.map((r) => {
          const parada = !r.ativa || r.encerrada;
          return (
            <button key={r.id} onClick={() => setEditando(r)} className={`text-left ${parada ? "opacity-60" : ""}`}>
              <Cartao className="h-full transition hover:border-slate-300">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 truncate font-medium text-slate-900">{r.descricao}</span>
                  {!r.ativa ? (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Pausada</span>
                  ) : r.encerrada ? (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Encerrada</span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      {r.periodicidade === "ANUAL" ? "Anual" : "Mensal"}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-lg font-semibold text-slate-900">{descreverValor(r)}</p>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Bolinha cor={r.cartao.cor} /> {r.cartao.nome}
                  </span>
                  {r.categoria && (
                    <span className="flex items-center gap-1.5">
                      <Bolinha cor={r.categoria.cor} /> {r.categoria.nome}
                    </span>
                  )}
                </p>
                {!parada && (
                  <p className="mt-3 text-xs text-slate-500">
                    Próxima cobrança <strong className="text-slate-700">{dataBr(r.proximaCobranca)}</strong> · fatura de{" "}
                    {mesCurto(r.proximaFatura)}
                    {r.dataFim && <> · até {dataBr(r.dataFim)}</>}
                  </p>
                )}
              </Cartao>
            </button>
          );
        })}
      </div>

      {editando && (
        <FormRecorrencia
          key={editando === "novo" ? "novo" : editando.id}
          recorrencia={editando === "novo" ? null : editando}
          cartoes={cartoes}
          categorias={categorias}
          onFechar={() => setEditando(null)}
          onSalvo={() => {
            setEditando(null);
            carregar();
          }}
          onCategoriaCriada={recarregar}
        />
      )}
    </AppShell>
  );
}

function FormRecorrencia({
  recorrencia: rec,
  cartoes,
  categorias,
  onFechar,
  onSalvo,
  onCategoriaCriada,
}: {
  recorrencia: Recorrencia | null;
  cartoes: CartaoT[];
  categorias: Categoria[];
  onFechar: () => void;
  onSalvo: () => void;
  onCategoriaCriada: () => void;
}) {
  const ativos = cartoes.filter((c) => c.ativo || c.id === rec?.cartao.id);
  const [descricao, setDescricao] = useState(rec?.descricao ?? "");
  const [valor, setValor] = useState(rec ? valorParaInput(rec.valor) : "");
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>(rec?.periodicidade ?? "MENSAL");
  const [parcelas, setParcelas] = useState(rec ? String(rec.qtdParcelas) : "1");
  const [cartaoId, setCartaoId] = useState<number | "">(rec?.cartao.id ?? "");
  const [proxima, setProxima] = useState(rec?.proximaCobranca ?? "");
  const [dataFim, setDataFim] = useState(rec?.dataFim ?? "");
  const [categoriaId, setCategoriaId] = useState<number | "">(rec?.categoria?.id ?? "");
  const [categoriaManual, setCategoriaManual] = useState(!!rec);
  const [ativa, setAtiva] = useState(rec?.ativa ?? true);
  const [observacao, setObservacao] = useState(rec?.observacao ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Cartões chegam depois da 1ª renderização: escolhe o primeiro ativo quando chegarem.
  const cartaoEscolhido: number | "" = cartaoId === "" ? (ativos[0]?.id ?? "") : cartaoId;

  // Mesma sugestão de categoria do lançamento de compra.
  useEffect(() => {
    if (categoriaManual || descricao.trim().length < 2) return;
    let cancelado = false;
    const t = setTimeout(() => {
      sugerirCategoria(descricao)
        .then((s) => !cancelado && setCategoriaId(s.categoria?.id ?? ""))
        .catch(() => {});
    }, 300);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [descricao, categoriaManual]);

  const qtd = Math.max(1, Math.min(72, Number(parcelas) || 1));
  const valorNum = lerValor(valor);
  const noPassado = !!proxima && proxima <= hojeIso() && ativa;

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (cartaoEscolhido === "") return setErro("Escolha o cartão.");
    if (!valorNum || valorNum <= 0) return setErro("Informe um valor válido.");
    if (!proxima) return setErro("Informe a data da próxima cobrança.");
    const req: RecorrenciaRequest = {
      cartaoId: cartaoEscolhido,
      categoriaId: categoriaId === "" ? null : categoriaId,
      descricao: descricao.trim(),
      valor: valorNum,
      qtdParcelas: qtd,
      periodicidade,
      proximaCobranca: proxima,
      dataFim: dataFim || null,
      ativa,
      observacao: observacao.trim() || null,
    };
    setSalvando(true);
    try {
      if (rec) await atualizarRecorrencia(rec.id, req);
      else await criarRecorrencia(req);
      onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!rec || !confirm(`Excluir a recorrência "${rec.descricao}"? As compras já lançadas por ela continuam.`)) return;
    setSalvando(true);
    try {
      await excluirRecorrencia(rec.id);
      onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível excluir.");
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={rec ? "Editar recorrência" : "Nova recorrência"} aberto onFechar={onFechar}>
      {ativos.length === 0 ? (
        <p className="text-sm text-slate-600">Cadastre um cartão primeiro, na tela Cartões.</p>
      ) : (
        <form onSubmit={salvar} className="space-y-4">
          <Campo label="Descrição">
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} required maxLength={160} placeholder="Ex.: Netflix, Anuidade Inter" autoFocus />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Valor de cada cobrança (R$)">
              <Input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="0,00" required />
            </Campo>
            <Campo label="Repete">
              <Select value={periodicidade} onChange={(e) => setPeriodicidade(e.target.value as Periodicidade)}>
                <option value="MENSAL">Todo mês</option>
                <option value="ANUAL">Todo ano</option>
              </Select>
            </Campo>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Cartão">
              <Select value={cartaoEscolhido} onChange={(e) => setCartaoId(Number(e.target.value))}>
                {ativos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </Campo>
            <Campo
              label="Parcelas por cobrança"
              dica={valorNum && qtd > 1 ? `${qtd}x de ${brl(Math.floor((valorNum * 100) / qtd) / 100)}` : "Anuidade em 12x: 12"}
            >
              <Input type="number" min={1} max={72} value={parcelas} onChange={(e) => setParcelas(e.target.value)} required />
            </Campo>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Próxima cobrança" dica={rec ? `Dia ${rec.diaCobranca} de cada ${periodicidade === "ANUAL" ? "ano" : "mês"}` : "Repete nesse dia"}>
              <Input type="date" value={proxima} onChange={(e) => setProxima(e.target.value)} required />
            </Campo>
            <Campo label="Termina em (opcional)">
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} min={proxima || undefined} />
            </Campo>
          </div>
          {noPassado && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
              Data de hoje ou anterior: ao salvar, as cobranças até hoje são lançadas como compras.
            </p>
          )}
          <Campo label="Categoria">
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
          <Campo label="Observação (opcional)">
            <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} maxLength={500} />
          </Campo>
          {rec && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={ativa} onChange={(e) => setAtiva(e.target.checked)} className="h-4 w-4 accent-slate-900" />
              Ativa (pausada não lança cobranças)
            </label>
          )}
          {rec && <p className="text-xs text-slate-400">Mudanças valem para as próximas cobranças; as já lançadas não mudam.</p>}

          <Erro mensagem={erro} />

          <div className="flex items-center justify-between gap-2 pt-1">
            {rec ? (
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
