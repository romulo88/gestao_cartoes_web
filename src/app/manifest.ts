import type { MetadataRoute } from "next";
import { NOME_PRODUTO } from "@/lib/marca";

/** PWA: "Adicionar à tela de início" no Android/iPhone abre em tela cheia direto no painel. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: NOME_PRODUTO,
    short_name: "Cartões",
    start_url: "/painel",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    lang: "pt-BR",
  };
}
