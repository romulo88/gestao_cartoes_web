import type { NextConfig } from "next";

// Mesmo esquema do Commander: o navegador só fala com o Next (mesma origem) e o servidor
// Next repassa /api/* ao backend. ⚠️ `rewrites()` é resolvido em BUILD TIME - BACKEND_URL
// tem que entrar como build-arg (ver Dockerfile/workflow); no `environment:` do compose não
// tem efeito.
// Default = backend rodando na máquina via `mvn spring-boot:run` (porta 8081, para não
// brigar com o backend do Commander na 8080).
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8081";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
