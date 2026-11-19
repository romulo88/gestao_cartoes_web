"use client";

import { KeyboardEvent, useState } from "react";
import { Button, Input, proximaCor, Select } from "@/components/ui";
import { Categoria, criarCategoria } from "@/lib/api";

const NOVA = "__nova";

/**
 * Select de categoria com "+ Nova categoria…" no fim: cria ali mesmo, sem sair do
 * formulário (lançamento de compra, recorrência). Cor = próxima livre da paleta; limite
 * mensal fica vazio (ajusta depois na tela Categorias).
 *
 * Fica dentro de um <form>: o Enter no nome cria a categoria em vez de enviar o formulário.
 */
export function SeletorCategoria({
  valor,
  categorias,
  onChange,
  onCriada,
}: {
  valor: number | "";
  categorias: Categoria[];
  /** Escolha do usuário (inclusive a categoria recém-criada). */
  onChange: (id: number | "") => void;
  /** Para o pai recarregar a lista (os outros formulários também passam a ver a nova). */
  onCriada?: (c: Categoria) => void;
}) {
  // Criadas aqui ficam visíveis na hora, mesmo antes de o pai recarregar a lista.
  const [criadas, setCriadas] = useState<Categoria[]>([]);
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const todas = [...categorias, ...criadas.filter((c) => !categorias.some((x) => x.id === c.id))].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR"),
  );

  function cancelar() {
    setCriando(false);
    setNome("");
    setErro(null);
  }

  async function criar() {
    const n = nome.trim();
    if (!n) return setErro("Digite o nome.");
    setSalvando(true);
    setErro(null);
    try {
      const c = await criarCategoria({ nome: n, cor: proximaCor(todas.map((x) => x.cor)), limiteMensal: null });
      setCriadas((l) => [...l, c]);
      onChange(c.id);
      onCriada?.(c);
      cancelar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível criar a categoria.");
    } finally {
      setSalvando(false);
    }
  }

  function teclas(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault(); // não envia o formulário da compra
      criar();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation(); // não fecha o modal
      cancelar();
    }
  }

  if (criando) {
    return (
      <div>
        <div className="flex gap-2">
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={teclas}
            placeholder="Nome da nova categoria"
            maxLength={60}
            autoFocus
            aria-label="Nome da nova categoria"
          />
          <Button type="button" onClick={criar} disabled={salvando} className="shrink-0 !px-4">
            {salvando ? "..." : "Criar"}
          </Button>
          <Button type="button" variant="secondary" onClick={cancelar} className="shrink-0 !px-4">
            Cancelar
          </Button>
        </div>
        {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
      </div>
    );
  }

  return (
    <Select
      value={valor}
      onChange={(e) => {
        if (e.target.value === NOVA) setCriando(true);
        else onChange(e.target.value ? Number(e.target.value) : "");
      }}
    >
      <option value="">Sem categoria</option>
      {todas.map((c) => (
        <option key={c.id} value={c.id}>
          {c.nome}
        </option>
      ))}
      <option disabled>──────────</option>
      <option value={NOVA}>+ Nova categoria…</option>
    </Select>
  );
}
