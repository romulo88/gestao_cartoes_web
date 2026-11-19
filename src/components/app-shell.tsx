"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconeCartao, IconeSair } from "@/components/icones";
import { NOME_PRODUTO } from "@/lib/marca";
import { limparSessao, Sessao } from "@/lib/session";
import { useRenovacaoSessao } from "@/lib/use-renovacao-sessao";

const ITENS = [
  { href: "/painel", label: "Painel" },
  { href: "/lancamentos", label: "Lançamentos" },
  { href: "/faturas", label: "Faturas" },
  { href: "/recorrentes", label: "Recorrentes" },
  { href: "/cartoes", label: "Cartões" },
  { href: "/categorias", label: "Categorias" },
];

/** Topo escuro com a navegação (mesmo visual do Commander) + área de conteúdo. */
export function AppShell({ sessao, children }: { sessao: Sessao; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  useRenovacaoSessao();

  function sair() {
    limparSessao();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="relative bg-slate-900 px-4 py-3 text-white sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-2 sm:w-auto">
            <Link href="/painel" className="flex items-center gap-2 hover:opacity-80">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/20 ring-1 ring-blue-400/40">
                <IconeCartao className="h-4 w-4 text-blue-300" />
              </div>
              <span className="text-sm font-medium tracking-wide">{NOME_PRODUTO}</span>
            </Link>
            <nav className="-mx-1 flex w-full items-center overflow-x-auto px-1 sm:mx-0 sm:w-auto sm:border-l sm:border-blue-300/50 sm:pl-3">
              {ITENS.map((item, i) => {
                const ativo = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <span key={item.href} className="flex items-center whitespace-nowrap">
                    {i > 0 && <span className="mx-2 text-blue-300/50">|</span>}
                    <Link
                      href={item.href}
                      className={`text-xs font-medium ${ativo ? "text-white underline decoration-blue-400 underline-offset-4" : "text-slate-300 hover:text-white"}`}
                    >
                      {item.label}
                    </Link>
                  </span>
                );
              })}
            </nav>
          </div>
          <div className="absolute right-4 top-3 flex items-center gap-3 text-sm sm:static">
            <Link href="/conta" className="max-w-[160px] truncate text-slate-300 hover:text-white" title={sessao.email}>
              {sessao.nome}
            </Link>
            <button onClick={sair} className="flex items-center gap-1 text-slate-300 hover:text-white">
              <IconeSair className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

export function Titulo({ children, acoes }: { children: React.ReactNode; acoes?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-semibold text-slate-900">{children}</h1>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  );
}
