"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell, Titulo } from "@/components/app-shell";
import { Bolinha, Button, Campo, Cartao, EscolhaCor, Erro, Input, Modal, proximaCor } from "@/components/ui";
import { atualizarCategoria, Categoria, criarCategoria, excluirCategoria, listarCategorias } from "@/lib/api";
import { brl, lerValor, valorParaInput } from "@/lib/format";
import { useSessaoObrigatoria } from "@/lib/use-sessao";

export default function CategoriasPage() {
  const sessao = useSessaoObrigatoria();
  const [lista, setLista] = useState<Categoria[] | null>(null);
  const [editando, setEditando] = useState<Categoria | "nova" | null>(null);
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("");
  const [limite, setLimite] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function carregar() {
    listarCategorias().then(setLista).catch((e) => setErro(e.message));
  }

  useEffect(() => {
    if (sessao) carregar();
  }, [sessao]);

  if (!sessao) return null;

  function abrir(c: Categoria | "nova") {
    setErro(null);
    setEditando(c);
    setNome(c === "nova" ? "" : c.nome);
    setCor(c === "nova" ? proximaCor((lista ?? []).map((x) => x.cor)) : c.cor);
    setLimite(c === "nova" ? "" : valorParaInput(c.limiteMensal));
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!editando) return;
    const req = { nome: nome.trim(), cor, limiteMensal: limite.trim() ? lerValor(limite) : null };
    try {
      if (editando === "nova") await criarCategoria(req);
      else await atualizarCategoria(editando.id, req);
      setEditando(null);
      carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
    }
  }

  async function excluir() {
    if (!editando || editando === "nova" || !confirm(`Excluir a categoria ${editando.nome}? As compras dela ficam sem categoria.`)) return;
    try {
      await excluirCategoria(editando.id);
      setEditando(null);
      carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível excluir.");
    }
  }

  return (
    <AppShell sessao={sessao}>
      <Titulo acoes={<Button onClick={() => abrir("nova")}>+ Nova categoria</Button>}>Categorias</Titulo>
      <p className="mb-4 text-sm text-slate-500">
        O limite mensal é comparado com a soma das parcelas que caem em cada fatura - o painel avisa quando passa.
      </p>
      {lista && (
        <Cartao className="!p-0">
          <ul className="divide-y divide-slate-100">
            {lista.map((c) => (
              <li key={c.id}>
                <button onClick={() => abrir(c)} className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-slate-50">
                  <span className="flex items-center gap-2.5 text-sm text-slate-900">
                    <Bolinha cor={c.cor} className="h-3 w-3" /> {c.nome}
                  </span>
                  <span className="text-sm text-slate-500">{c.limiteMensal != null ? `limite ${brl(c.limiteMensal)}/mês` : "sem limite"}</span>
                </button>
              </li>
            ))}
          </ul>
        </Cartao>
      )}

      <Modal titulo={editando === "nova" ? "Nova categoria" : "Editar categoria"} aberto={!!editando} onFechar={() => setEditando(null)}>
        <form onSubmit={salvar} className="space-y-4">
          <Campo label="Nome">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={60} autoFocus />
          </Campo>
          <Campo label="Limite mensal (opcional)">
            <Input value={limite} onChange={(e) => setLimite(e.target.value)} inputMode="decimal" placeholder="0,00" />
          </Campo>
          <Campo label="Cor">
            <EscolhaCor valor={cor} onChange={setCor} />
          </Campo>
          <Erro mensagem={erro} />
          <div className="flex items-center justify-between gap-2 pt-1">
            {editando !== "nova" ? (
              <Button type="button" variant="danger" onClick={excluir}>
                Excluir
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditando(null)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
