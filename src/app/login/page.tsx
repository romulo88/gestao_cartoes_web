"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout, BrandMark } from "@/components/auth-layout";
import { Button, Erro, Input } from "@/components/ui";
import { login } from "@/lib/api";
import { salvarSessao } from "@/lib/session";
import { useSessaoOpcional } from "@/lib/use-sessao";

export default function LoginPage() {
  const router = useRouter();
  const { sessao } = useSessaoOpcional();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (sessao) router.replace("/painel");
  }, [sessao, router]);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const r = await login(email, senha);
      salvarSessao({ token: r.token, usuarioId: r.usuarioId, nome: r.nome, email: r.email });
      router.replace("/painel");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
      setEnviando(false);
    }
  }

  return (
    <AuthLayout>
      <BrandMark />
      <h2 className="text-center text-xl font-semibold text-slate-900">Entrar</h2>
      <form onSubmit={entrar} className="mt-8 space-y-4">
        <Input type="email" placeholder="E-mail" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Senha" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        <Erro mensagem={erro} />
        <Button type="submit" disabled={enviando} className="w-full">
          {enviando ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-blue-600 hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  );
}
