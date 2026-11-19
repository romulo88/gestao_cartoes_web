"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { assinarSessao, getSessaoServerSnapshot, getSessaoSnapshot, Sessao } from "./session";

function assinarNunca() {
  return () => {};
}

/** Garante que a página só é usada com sessão ativa - senão manda para o login. Mesmo truque
 * do Commander: espera montar no navegador antes de decidir (senão um reload com sessão
 * válida jogava para o login, porque no servidor a sessão é sempre null). */
export function useSessaoObrigatoria(): Sessao | null {
  const router = useRouter();
  const sessao = useSyncExternalStore(assinarSessao, getSessaoSnapshot, getSessaoServerSnapshot);
  const montado = useSyncExternalStore(assinarNunca, () => true, () => false);

  useEffect(() => {
    if (montado && sessao === null) router.replace("/login");
  }, [montado, sessao, router]);

  return montado ? sessao : null;
}

/** Sessão sem redirecionar (login/cadastro usam para pular direto ao painel). */
export function useSessaoOpcional(): { sessao: Sessao | null; montado: boolean } {
  const sessao = useSyncExternalStore(assinarSessao, getSessaoSnapshot, getSessaoServerSnapshot);
  const montado = useSyncExternalStore(assinarNunca, () => true, () => false);
  return { sessao: montado ? sessao : null, montado };
}
