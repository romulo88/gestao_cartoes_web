"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell, Titulo } from "@/components/app-shell";
import { FormCompra } from "@/components/form-compra";
import { PainelVisao } from "@/components/painel-visao";
import { SeletorMes } from "@/components/seletor-mes";
import { Button, Cartao, Erro } from "@/components/ui";
import { dashboard, Dashboard, faturaAtual, faturasDoMes, FaturasDoMes } from "@/lib/api";
import { useDadosBase } from "@/lib/use-dados-base";
import { useSessaoObrigatoria } from "@/lib/use-sessao";

export default function PainelPage() {
  const sessao = useSessaoObrigatoria();
  const { cartoes, categorias, carregado, recarregar } = useDadosBase(!!sessao);
  // Abre na fatura em aberto hoje (vem do backend, que conhece o fechamento de cada cartão).
  const [atual, setAtual] = useState<string | null>(null);
  const [mes, setMes] = useState<string | null>(null);
  const [dados, setDados] = useState<Dashboard | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [faturas, setFaturas] = useState<FaturasDoMes | null>(null);

  useEffect(() => {
    if (!sessao) return;
    faturaAtual()
      .then((r) => {
        setAtual(r.mes);
        setMes((m) => m ?? r.mes);
      })
      .catch((e) => setErro(e.message));
  }, [sessao]);

  const carregar = useCallback(() => {
    if (!mes) return;
    dashboard(mes)
      .then((d) => {
        setDados(d);
        setErro(null);
      })
      .catch((e) => setErro(e.message));
    // Itens das faturas: hint das categorias e roscas por cartão. Se falhar, o painel segue sem eles.
    faturasDoMes(mes)
      .then(setFaturas)
      .catch(() => setFaturas(null));
  }, [mes]);

  useEffect(() => {
    if (sessao) carregar();
  }, [sessao, carregar]);

  if (!sessao || !mes) return null;

  return (
    <AppShell sessao={sessao}>
      <Titulo
        acoes={
          <>
            <SeletorMes mes={mes} atual={atual} onChange={setMes} />
            <Button onClick={() => setFormAberto(true)}>+ Nova compra</Button>
          </>
        }
      >
        Painel
      </Titulo>

      <Erro mensagem={erro} />

      {carregado && cartoes.length === 0 && (
        <Cartao className="mb-6 border-blue-200 bg-blue-50">
          <p className="text-sm text-slate-700">
            Comece cadastrando seus cartões com o dia de fechamento e de vencimento de cada um.{" "}
            <Link href="/cartoes" className="font-medium text-blue-700 hover:underline">
              Cadastrar cartões →
            </Link>
          </p>
        </Cartao>
      )}

      {dados && <PainelVisao dados={dados} atual={atual} onEscolherMes={setMes} faturas={faturas} />}

      <FormCompra
        key={formAberto ? "aberto" : "fechado"}
        aberto={formAberto}
        compra={null}
        cartoes={cartoes}
        categorias={categorias}
        onFechar={() => setFormAberto(false)}
        onSalvo={() => {
          setFormAberto(false);
          carregar();
        }}
        onCategoriaCriada={recarregar}
      />
    </AppShell>
  );
}
