import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NOME_PRODUTO } from "@/lib/marca";

export const metadata: Metadata = {
  title: NOME_PRODUTO,
  description: "Controle de gastos e parcelas dos cartões de crédito",
  appleWebApp: { title: NOME_PRODUTO, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
