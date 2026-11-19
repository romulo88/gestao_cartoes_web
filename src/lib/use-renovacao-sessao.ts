"use client";

import { useEffect } from "react";
import { renovarSessao } from "./api";
import { getSessaoSnapshot, salvarSessao } from "./session";

/** Renova o token quando ele passa de 1 dia de idade e o app está em uso (montado/visível).
 * Assim quem abre o app pelo menos uma vez por semana nunca precisa logar de novo. */
const RENOVAR_APOS_MS = 24 * 60 * 60_000;

export function useRenovacaoSessao() {
  useEffect(() => {
    function talvezRenovar() {
      const s = getSessaoSnapshot();
      if (!s || document.visibilityState !== "visible") return;
      if (Date.now() - s.obtidoEm < RENOVAR_APOS_MS) return;
      renovarSessao(s.token)
        .then((r) => salvarSessao({ token: r.token, usuarioId: r.usuarioId, nome: r.nome, email: r.email }))
        .catch(() => {
          /* token já vencido: a próxima chamada recebe 401 e o api.ts manda para o login */
        });
    }
    talvezRenovar();
    document.addEventListener("visibilitychange", talvezRenovar);
    return () => document.removeEventListener("visibilitychange", talvezRenovar);
  }, []);
}
