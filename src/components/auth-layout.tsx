import { IconeCartao } from "@/components/icones";
import { NOME_PRODUTO } from "@/lib/marca";

/** Mesmo layout das telas públicas do Commander: painel de marca à esquerda (gradiente
 * slate-950 → blue-900) e formulário em branco à direita. */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen">
      <div className="relative hidden shrink-0 flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 p-12 text-white lg:flex lg:w-[440px] xl:w-[520px]">
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grade" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grade)" />
        </svg>
        <div className="relative flex flex-1 flex-col justify-center">
          <h1 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight">Suas faturas sem surpresa.</h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
            Lance a compra uma vez e veja em qual fatura cada parcela cai, quanto do limite está comprometido e
            para onde o dinheiro está indo.
          </p>
        </div>
        <p className="relative text-xs text-slate-400">
          © {new Date().getFullYear()} {NOME_PRODUTO} · Romtech Soluções
        </p>
      </div>
      <div className="flex w-full flex-1 flex-col justify-center px-6 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}

export function BrandMark() {
  return (
    <div className="mb-8 flex items-center justify-center gap-2.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900">
        <IconeCartao className="h-5 w-5 text-white" />
      </div>
      <span className="text-lg font-semibold tracking-wide text-slate-900">{NOME_PRODUTO}</span>
    </div>
  );
}
