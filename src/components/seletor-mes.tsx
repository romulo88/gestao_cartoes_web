"use client";

import { mesLongo, somarMeses } from "@/lib/format";

/** ‹ Dezembro de 2026 › - navega entre faturas (mês = competência, mês em que a fatura fecha).
 * `atual` = fatura em aberto hoje; o botão "Atual" volta para ela. */
export function SeletorMes({ mes, atual, onChange }: { mes: string; atual: string | null; onChange: (mes: string) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1 py-1">
      <button onClick={() => onChange(somarMeses(mes, -1))} className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100" aria-label="Mês anterior">
        ‹
      </button>
      <span className="min-w-[150px] text-center text-sm font-medium text-slate-900">{mesLongo(mes, true)}</span>
      <button onClick={() => onChange(somarMeses(mes, 1))} className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100" aria-label="Próximo mês">
        ›
      </button>
      {atual && mes !== atual && (
        <button onClick={() => onChange(atual)} className="ml-1 rounded-full px-3 py-1 text-xs text-blue-600 hover:bg-blue-50">
          Atual
        </button>
      )}
    </div>
  );
}
