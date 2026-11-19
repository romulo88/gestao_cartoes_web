"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell, Titulo } from "@/components/app-shell";
import { FormCompra } from "@/components/form-compra";
import { Bolinha, Button, Cartao, Erro, Input, Select } from "@/components/ui";
import { Compra, listarCompras, Pagina } from "@/lib/api";
import { brl, dataBr, mesCurto } from "@/lib/format";
import { useDadosBase } from "@/lib/use-dados-base";
import { useSessaoObrigatoria } from "@/lib/use-sessao";

export default function LancamentosPage() {
  const sessao = useSessaoObrigatoria();
  const { cartoes, categorias, recarregar } = useDadosBase(!!sessao);
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [cartaoId, setCartaoId] = useState<number | null>(null);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [emAberto, setEmAberto] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [dados, setDados] = useState<Pagina<Compra> | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState<{ aberto: boolean; compra: Compra | null }>({ aberto: false, compra: null });

  // Busca só depois de parar de digitar.
  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaAplicada(busca);
      setPagina(0);
    }, 350);
    return () => clearTimeout(t);
  }, [busca]);

  const carregar = useCallback(() => {
    listarCompras({ busca: buscaAplicada, cartaoId, categoriaId, emAberto, pagina })
      .then((d) => {
        setDados(d);
        setErro(null);
      })
      .catch((e) => setErro(e.message));
  }, [buscaAplicada, cartaoId, categoriaId, emAberto, pagina]);

  useEffect(() => {
    if (sessao) carregar();
  }, [sessao, carregar]);

  if (!sessao) return null;

  return (
    <AppShell sessao={sessao}>
      <Titulo acoes={<Button onClick={() => setForm({ aberto: true, compra: null })}>+ Nova compra</Button>}>Lançamentos</Titulo>

      {/* Filtros numa linha só, acima da lista */}
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_180px_180px_auto]">
        <Input placeholder="Buscar descrição" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <Select value={cartaoId ?? ""} onChange={(e) => {
            setCartaoId(e.target.value ? Number(e.target.value) : null);
            setPagina(0);
          }}>
          <option value="">Todos os cartões</option>
          {cartoes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
        <Select value={categoriaId ?? ""} onChange={(e) => {
            setCategoriaId(e.target.value ? Number(e.target.value) : null);
            setPagina(0);
          }}>
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 whitespace-nowrap px-2 text-sm text-slate-600">
          <input type="checkbox" checked={emAberto} onChange={(e) => {
              setEmAberto(e.target.checked);
              setPagina(0);
            }} className="h-4 w-4 accent-slate-900" />
          Só com parcelas a vencer
        </label>
      </div>

      <Erro mensagem={erro} />

      {dados && (
        <Cartao className="!p-0">
          {dados.itens.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Nenhuma compra encontrada.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {dados.itens.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setForm({ aberto: true, compra: c })} className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-slate-50">
                    <Bolinha cor={c.cartao.cor} className="h-3 w-3" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        <span className="truncate">{c.descricao}</span>
                        {c.recorrenciaId != null && (
                          <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700" title="Lançada por uma recorrência">
                            ↻ recorrente
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {dataBr(c.dataCompra)} · {c.cartao.nome}
                        {c.categoria && <> · {c.categoria.nome}</>}
                        {" · "}
                        {c.qtdParcelas > 1 ? `${mesCurto(c.primeiraFatura)} a ${mesCurto(c.ultimaFatura)}` : `fatura ${mesCurto(c.primeiraFatura)}`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-slate-900">{brl(c.valorTotal)}</p>
                      <p className="text-xs text-slate-500">
                        {c.qtdParcelas > 1 ? `${c.qtdParcelas}x ${brl(c.valorParcela)}` : "à vista"}
                        {c.qtdParcelas > 1 && c.parcelasRestantes > 0 && <span className="text-blue-600"> · faltam {c.parcelasRestantes}</span>}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {dados.totalPaginas > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
              <span>
                {dados.totalItens} compras · página {dados.pagina + 1} de {dados.totalPaginas}
              </span>
              <span className="flex gap-2">
                <Button variant="secondary" className="!px-4 !py-1.5" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  className="!px-4 !py-1.5"
                  disabled={pagina + 1 >= dados.totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Próxima
                </Button>
              </span>
            </div>
          )}
        </Cartao>
      )}

      <FormCompra
        key={form.aberto ? (form.compra?.id ?? "nova") : "fechado"}
        aberto={form.aberto}
        compra={form.compra}
        cartoes={cartoes}
        categorias={categorias}
        onFechar={() => setForm({ aberto: false, compra: null })}
        onSalvo={() => {
          setForm({ aberto: false, compra: null });
          carregar();
        }}
        onCategoriaCriada={recarregar}
      />
    </AppShell>
  );
}
