"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell, Titulo } from "@/components/app-shell";
import { Bolinha, Button, Campo, Cartao, EscolhaCor, Erro, Input, Modal, proximaCor } from "@/components/ui";
import { atualizarCartao, Cartao as CartaoT, CartaoRequest, criarCartao, excluirCartao, listarCartoes } from "@/lib/api";
import { brl, lerValor, valorParaInput } from "@/lib/format";
import { useSessaoObrigatoria } from "@/lib/use-sessao";

type Form = { nome: string; bandeira: string; finalCartao: string; diaFechamento: string; diaVencimento: string; limite: string; cor: string; ativo: boolean };

export default function CartoesPage() {
  const sessao = useSessaoObrigatoria();
  const [cartoes, setCartoes] = useState<CartaoT[] | null>(null);
  const [editando, setEditando] = useState<CartaoT | "novo" | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    listarCartoes().then(setCartoes).catch((e) => setErro(e.message));
  }

  useEffect(() => {
    if (sessao) carregar();
  }, [sessao]);

  if (!sessao) return null;

  function abrir(c: CartaoT | "novo") {
    setErro(null);
    setEditando(c);
    setForm(
      c === "novo"
        ? { nome: "", bandeira: "", finalCartao: "", diaFechamento: "", diaVencimento: "", limite: "", cor: proximaCor((cartoes ?? []).map((x) => x.cor)), ativo: true }
        : {
            nome: c.nome,
            bandeira: c.bandeira ?? "",
            finalCartao: c.finalCartao ?? "",
            diaFechamento: String(c.diaFechamento),
            diaVencimento: String(c.diaVencimento),
            limite: valorParaInput(c.limite),
            cor: c.cor,
            ativo: c.ativo,
          },
    );
  }

  function fechar() {
    setEditando(null);
    setForm(null);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!form || !editando) return;
    const req: CartaoRequest = {
      nome: form.nome.trim(),
      bandeira: form.bandeira.trim() || null,
      finalCartao: form.finalCartao.trim() || null,
      diaFechamento: Number(form.diaFechamento),
      diaVencimento: Number(form.diaVencimento),
      limite: form.limite.trim() ? lerValor(form.limite) : null,
      cor: form.cor,
      ativo: form.ativo,
    };
    setSalvando(true);
    setErro(null);
    try {
      if (editando === "novo") await criarCartao(req);
      else await atualizarCartao(editando.id, req);
      fechar();
      carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!editando || editando === "novo" || !confirm(`Excluir o cartão ${editando.nome}?`)) return;
    try {
      await excluirCartao(editando.id);
      fechar();
      carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível excluir.");
    }
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <AppShell sessao={sessao}>
      <Titulo acoes={<Button onClick={() => abrir("novo")}>+ Novo cartão</Button>}>Cartões</Titulo>
      {!editando && <Erro mensagem={erro} />}

      {cartoes && cartoes.length === 0 && (
        <Cartao>
          <p className="text-sm text-slate-600">
            Nenhum cartão ainda. Cadastre cada cartão com o <strong>dia de fechamento</strong> (compras a partir desse dia vão para a
            fatura seguinte) e o <strong>dia de vencimento</strong>.
          </p>
        </Cartao>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cartoes?.map((c) => (
          <button key={c.id} onClick={() => abrir(c)} className={`text-left ${c.ativo ? "" : "opacity-60"}`}>
            <Cartao className="h-full transition hover:border-slate-300">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-slate-900">
                  <Bolinha cor={c.cor} className="h-3 w-3" /> {c.nome}
                </span>
                {!c.ativo && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Inativo</span>}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {[c.bandeira, c.finalCartao && `final ${c.finalCartao}`].filter(Boolean).join(" · ") || " "}
              </p>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-slate-400">Fecha</dt>
                  <dd className="font-medium text-slate-900">dia {c.diaFechamento}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Vence</dt>
                  <dd className="font-medium text-slate-900">dia {c.diaVencimento}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Limite</dt>
                  <dd className="font-medium text-slate-900">{c.limite != null ? brl(c.limite) : "—"}</dd>
                </div>
              </dl>
            </Cartao>
          </button>
        ))}
      </div>

      <Modal titulo={editando === "novo" ? "Novo cartão" : "Editar cartão"} aberto={!!form} onFechar={fechar}>
        {form && (
          <form onSubmit={salvar} className="space-y-4">
            <Campo label="Nome">
              <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} required maxLength={60} placeholder="Ex.: Inter, XP, Azul" autoFocus />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Bandeira (opcional)">
                <Input value={form.bandeira} onChange={(e) => set("bandeira", e.target.value)} maxLength={30} placeholder="Mastercard" />
              </Campo>
              <Campo label="Final (opcional)">
                <Input value={form.finalCartao} onChange={(e) => set("finalCartao", e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="1234" />
              </Campo>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Dia do fechamento" dica="Compra nesse dia já vai para a próxima fatura">
                <Input type="number" min={1} max={31} value={form.diaFechamento} onChange={(e) => set("diaFechamento", e.target.value)} required />
              </Campo>
              <Campo label="Dia do vencimento">
                <Input type="number" min={1} max={31} value={form.diaVencimento} onChange={(e) => set("diaVencimento", e.target.value)} required />
              </Campo>
            </div>
            <Campo label="Limite (opcional)">
              <Input value={form.limite} onChange={(e) => set("limite", e.target.value)} inputMode="decimal" placeholder="0,00" />
            </Campo>
            <Campo label="Cor">
              <EscolhaCor valor={form.cor} onChange={(c) => set("cor", c)} />
            </Campo>
            {editando !== "novo" && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.ativo} onChange={(e) => set("ativo", e.target.checked)} className="h-4 w-4 accent-slate-900" />
                Cartão ativo (inativo some do lançamento, mas o histórico fica)
              </label>
            )}
            <Erro mensagem={erro} />
            <div className="flex items-center justify-between gap-2 pt-1">
              {editando !== "novo" ? (
                <Button type="button" variant="danger" onClick={excluir}>
                  Excluir
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={fechar}>
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
    </AppShell>
  );
}
