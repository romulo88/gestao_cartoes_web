"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { IconeCartao } from "@/components/icones";
import { agruparPorCategoria, ItensPorCategoria } from "@/components/graficos";
import { PainelVisao } from "@/components/painel-visao";
import { SeletorMes } from "@/components/seletor-mes";
import { Cartao } from "@/components/ui";
import { ApiError, Dashboard, painelPublicoDashboard, painelPublicoFaturas, painelPublicoInfo } from "@/lib/api";
import { NOME_PRODUTO } from "@/lib/marca";

// O token vem depois do # (/ver#abc...): o navegador não manda o fragmento para servidor
// nenhum, então ele não aparece em log. Daqui ele vai para a API num header.
function assinarHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
const tokenDaUrl = () => window.location.hash.slice(1);

/** Painel somente leitura aberto por link de compartilhamento (sem login). */
export default function VerPainelPage() {
  const token = useSyncExternalStore(assinarHash, tokenDaUrl, () => null);
  const [dono, setDono] = useState<string | null>(null);
  const [atual, setAtual] = useState<string | null>(null);
  const [mes, setMes] = useState<string | null>(null);
  const [dados, setDados] = useState<Dashboard | null>(null);
  const [itens, setItens] = useState<ItensPorCategoria | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelado = false;
    painelPublicoInfo(token)
      .then((i) => {
        if (cancelado) return;
        setDono(i.dono);
        setAtual(i.mesAtual);
        setMes(i.mesAtual);
        setErro(null);
      })
      .catch((e) => !cancelado && setErro(mensagem(e)));
    return () => {
      cancelado = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token || !mes) return;
    let cancelado = false;
    painelPublicoDashboard(token, mes)
      .then((d) => !cancelado && setDados(d))
      .catch((e) => !cancelado && setErro(mensagem(e)));
    painelPublicoFaturas(token, mes)
      .then((f) => !cancelado && setItens(agruparPorCategoria(f)))
      .catch(() => !cancelado && setItens(null));
    return () => {
      cancelado = true;
    };
  }, [token, mes]);

  // Ainda no servidor / antes de montar: nada (evita piscar a mensagem de link inválido).
  if (token === null) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 px-4 py-3 text-white sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/20 ring-1 ring-blue-400/40">
              <IconeCartao className="h-4 w-4 text-blue-300" />
            </span>
            <span className="text-sm font-medium tracking-wide">{NOME_PRODUTO}</span>
          </span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-300">👁 Somente leitura</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {!token || (erro && !dados) ? (
          <Cartao className="mx-auto max-w-md text-center">
            <p className="text-sm font-medium text-slate-900">Não foi possível abrir este painel</p>
            <p className="mt-1 text-sm text-slate-500">
              {!token ? "O link está incompleto. Confira se copiou o endereço inteiro." : erro}
            </p>
          </Cartao>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-xl font-semibold text-slate-900">{dono ? `Painel de ${dono}` : "Painel"}</h1>
              {mes && <SeletorMes mes={mes} atual={atual} onChange={setMes} />}
            </div>
            {dados && <PainelVisao dados={dados} atual={atual} onEscolherMes={setMes} itensPorCategoria={itens} somenteLeitura />}
          </>
        )}
      </main>
    </div>
  );
}

function mensagem(e: unknown): string {
  if (e instanceof ApiError && e.status === 404) return "Link inválido ou revogado. Peça um novo a quem compartilhou.";
  return e instanceof Error ? e.message : "Erro ao carregar o painel.";
}
