"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessaoOpcional } from "@/lib/use-sessao";

/** Raiz: logado vai para o painel, senão para o login. */
export default function Inicio() {
  const router = useRouter();
  const { sessao, montado } = useSessaoOpcional();
  useEffect(() => {
    if (montado) router.replace(sessao ? "/painel" : "/login");
  }, [montado, sessao, router]);
  return null;
}
