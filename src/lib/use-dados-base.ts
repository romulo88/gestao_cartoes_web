"use client";

import { useCallback, useEffect, useState } from "react";
import { Cartao, Categoria, listarCartoes, listarCategorias } from "./api";

/** Cartões + categorias do usuário (usados pelo formulário de compra e pelos filtros). */
export function useDadosBase(ativo: boolean) {
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregado, setCarregado] = useState(false);

  const recarregar = useCallback(async () => {
    const [c, cat] = await Promise.all([listarCartoes(), listarCategorias()]);
    setCartoes(c);
    setCategorias(cat);
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!ativo) return;
    let cancelado = false;
    Promise.all([listarCartoes(), listarCategorias()])
      .then(([c, cat]) => {
        if (cancelado) return;
        setCartoes(c);
        setCategorias(cat);
        setCarregado(true);
      })
      .catch(() => !cancelado && setCarregado(true));
    return () => {
      cancelado = true;
    };
  }, [ativo]);

  return { cartoes, categorias, carregado, recarregar };
}
