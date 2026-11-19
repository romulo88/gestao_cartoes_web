import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

/** Mesmo padrão visual do Commander: campo preenchido slate-100, sem borda. */
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={[
        "block w-full rounded-lg border-0 bg-slate-100 px-4 py-3 text-sm text-slate-900",
        "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return (
    <select
      {...rest}
      className={[
        "block w-full rounded-lg border-0 bg-slate-100 px-4 py-3 text-sm text-slate-900",
        "focus:outline-none focus:ring-2 focus:ring-blue-500",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" };

export function Button({ variant = "primary", className, ...rest }: ButtonProps) {
  const base = "rounded-full px-6 py-2.5 text-sm font-medium transition disabled:opacity-50";
  const cores = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "border border-slate-300 text-slate-900 hover:border-slate-400 hover:bg-slate-50",
    danger: "border border-red-200 text-red-600 hover:bg-red-50",
  }[variant];
  return <button {...rest} className={[base, cores, className].filter(Boolean).join(" ")} />;
}

export function Campo({ label, children, dica }: { label: string; children: ReactNode; dica?: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-slate-400">{dica}</span>}
    </label>
  );
}

export function Modal({
  titulo,
  aberto,
  onFechar,
  children,
  largo,
}: {
  titulo: string;
  aberto: boolean;
  onFechar: () => void;
  children: ReactNode;
  largo?: boolean;
}) {
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center sm:px-4" onClick={onFechar}>
      <div
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-lg sm:rounded-2xl ${largo ? "sm:max-w-2xl" : "sm:max-w-md"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
          <button type="button" onClick={onFechar} className="text-slate-400 hover:text-slate-600" aria-label="Fechar">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Cartao({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={["rounded-2xl border border-slate-200 bg-white p-5", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function Erro({ mensagem }: { mensagem: string | null }) {
  if (!mensagem) return null;
  return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{mensagem}</p>;
}

export function Bolinha({ cor, className }: { cor: string; className?: string }) {
  return <span className={["inline-block h-2.5 w-2.5 shrink-0 rounded-full", className].filter(Boolean).join(" ")} style={{ backgroundColor: cor }} />;
}

/** Cores de cartão/categoria. Ordem fixa e validada para daltonismo (as 8 primeiras, nessa
 * ordem, passam no validador de paleta categórica); cada cartão novo pega a próxima livre,
 * então o gráfico empilhado do painel continua legível. Cinza = "outros"/neutro. */
export const CORES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948", "#64748b"];

/** Primeira cor da paleta ainda não usada (cai no cinza se todas estiverem em uso). */
export function proximaCor(usadas: string[]): string {
  return CORES.find((c) => !usadas.includes(c)) ?? CORES[CORES.length - 1];
}

export function EscolhaCor({ valor, onChange }: { valor: string; onChange: (cor: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CORES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={`Cor ${c}`}
          className={`h-7 w-7 rounded-full ring-offset-2 transition ${valor === c ? "ring-2 ring-slate-900" : ""}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}
