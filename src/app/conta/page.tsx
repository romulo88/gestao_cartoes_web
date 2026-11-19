"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell, Titulo } from "@/components/app-shell";
import { Button, Campo, Cartao, Erro, Input } from "@/components/ui";
import {
  Compartilhamento,
  criarCompartilhamento,
  linkCompartilhamento,
  listarCompartilhamentos,
  revogarCompartilhamento,
  trocarSenha,
} from "@/lib/api";
import { dataBr } from "@/lib/format";
import { useSessaoObrigatoria } from "@/lib/use-sessao";

export default function ContaPage() {
  const sessao = useSessaoObrigatoria();
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  if (!sessao) return null;

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setOk(false);
    try {
      await trocarSenha(atual, nova);
      setAtual("");
      setNova("");
      setOk(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível trocar a senha.");
    }
  }

  return (
    <AppShell sessao={sessao}>
      <Titulo>Minha conta</Titulo>
      <Cartao className="max-w-md">
        <p className="text-sm text-slate-900">{sessao.nome}</p>
        <p className="text-sm text-slate-500">{sessao.email}</p>
        <form onSubmit={salvar} className="mt-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Trocar senha</h2>
          <Campo label="Senha atual">
            <Input type="password" autoComplete="current-password" value={atual} onChange={(e) => setAtual(e.target.value)} required />
          </Campo>
          <Campo label="Nova senha (mín. 8 caracteres)">
            <Input type="password" autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} required minLength={8} />
          </Campo>
          <Erro mensagem={erro} />
          {ok && <p className="text-sm text-green-700">Senha alterada.</p>}
          <Button type="submit">Salvar</Button>
        </form>
      </Cartao>
      <CompartilharPainel />
    </AppShell>
  );
}

/** Links somente leitura do painel (ex.: para a esposa ver sem precisar de login). */
function CompartilharPainel() {
  const [links, setLinks] = useState<Compartilhamento[] | null>(null);
  const [nome, setNome] = useState("");
  const [novo, setNovo] = useState<{ nome: string; url: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    listarCompartilhamentos().then(setLinks).catch((e) => setErro(e.message));
  }

  useEffect(carregar, []);

  async function criar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const r = await criarCompartilhamento(nome.trim());
      setNovo({ nome: r.compartilhamento.nome, url: linkCompartilhamento(r.token) });
      setCopiado(false);
      setNome("");
      carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível criar o link.");
    } finally {
      setSalvando(false);
    }
  }

  async function copiar() {
    if (!novo) return;
    try {
      await navigator.clipboard.writeText(novo.url);
      setCopiado(true);
    } catch {
      setErro("Não deu para copiar automaticamente: selecione o link e copie.");
    }
  }

  async function revogar(l: Compartilhamento) {
    if (!confirm(`Revogar o link "${l.nome}"? Quem tiver esse link perde o acesso na hora.`)) return;
    try {
      await revogarCompartilhamento(l.id);
      carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível revogar.");
    }
  }

  return (
    <Cartao className="mt-6 max-w-xl">
      <h2 className="text-sm font-semibold text-slate-900">Compartilhar painel</h2>
      <p className="mt-1 text-sm text-slate-500">
        Gere um link para alguém (ex.: sua esposa) ver o seu painel <strong>sem login e sem poder alterar nada</strong>.
        Lançamentos, cartões e configurações não aparecem.
      </p>

      <form onSubmit={criar} className="mt-4 flex gap-2">
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Para quem? Ex.: Esposa" maxLength={60} required />
        <Button type="submit" disabled={salvando} className="shrink-0">
          Criar link
        </Button>
      </form>

      {novo && (
        <div className="mt-4 rounded-xl bg-blue-50 p-4">
          <p className="text-sm font-medium text-slate-900">Link de &quot;{novo.nome}&quot; criado</p>
          <div className="mt-2 flex gap-2">
            <Input readOnly value={novo.url} onFocus={(e) => e.target.select()} className="!bg-white !text-xs" aria-label="Link do painel" />
            <Button type="button" variant="secondary" onClick={copiar} className="shrink-0 !bg-white">
              {copiado ? "Copiado ✓" : "Copiar"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-amber-800">
            Copie agora: por segurança o link não fica guardado e não dá para ver de novo. Se perder, revogue e crie outro.
          </p>
        </div>
      )}

      <Erro mensagem={erro} />

      {links && links.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
          {links.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{l.nome}</p>
                <p className="text-xs text-slate-500">
                  criado em {dataBr(l.criadoEm.slice(0, 10))} ·{" "}
                  {l.ultimoAcesso ? `último acesso ${dataBr(l.ultimoAcesso.slice(0, 10))} ${l.ultimoAcesso.slice(11, 16)}` : "nunca aberto"}
                </p>
              </div>
              <Button type="button" variant="danger" onClick={() => revogar(l)} className="shrink-0 !px-4 !py-1.5 !text-xs">
                Revogar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Cartao>
  );
}
