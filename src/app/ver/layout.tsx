import type { Metadata } from "next";
import { NOME_PRODUTO } from "@/lib/marca";

// Página de link compartilhado: nada de indexação nem de cache em buscador.
export const metadata: Metadata = {
  title: `Painel · ${NOME_PRODUTO}`,
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function VerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
