"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout, BrandMark } from "@/components/auth-layout";
import { Button, Erro, Input } from "@/components/ui";
import { cadastrar } from "@/lib/api";
import { salvarSessao } from "@/lib/session";

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function criar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    if (senha !== confirma) return setErro("As senhas não conferem.");
    setEnviando(true);
    try {
      const r = await cadastrar(nome, email, senha);
      salvarSessao({ token: r.token, usuarioId: r.usuarioId, nome: r.nome, email: r.email });
      // Conta nova não tem cartão: começa por lá.
      router.replace("/cartoes");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível criar a conta.");
      setEnviando(false);
    }
  }

  return (
    <AuthLayout>
      <BrandMark />
      <h2 className="text-center text-xl font-semibold text-slate-900">Criar conta</h2>
      <form onSubmit={criar} className="mt-8 space-y-4">
        <Input placeholder="Seu nome" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={120} />
        <Input type="email" placeholder="E-mail" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Senha (mín. 8 caracteres)" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        <Input type="password" placeholder="Confirme a senha" autoComplete="new-password" value={confirma} onChange={(e) => setConfirma(e.target.value)} required />
        <Erro mensagem={erro} />
        <Button type="submit" disabled={enviando} className="w-full">
          {enviando ? "Criando..." : "Criar conta"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
