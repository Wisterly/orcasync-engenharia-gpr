import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OrçaSync | Engenharia GPR",
  description: "Sistema Inteligente de Compatibilização e Migração de Orçamentos entre Contratos com Fórmulas Vivas",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-[#0A0A0C] text-slate-100 font-sans antialiased selection:bg-[#FF6B00]/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
