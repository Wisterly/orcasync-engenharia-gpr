# 📌 Registro Oficial de Pontos de Restauração (PR) — OrçaSync | Engenharia GPR

Este documento registra cronologicamente todos os pontos de restauração do projeto para recuperação imediata sob demanda e sincronização entre ambientes de desenvolvimento.

---

## 🔒 REGRA DE OURO DAS RESTAURAÇÕES (ISOLAMENTO DE DADOS vs ESTRUTURA DO SITE)

Toda e qualquer restauração solicitada (ex: `PR.001`, `PR.002`, `PR.003`, etc.) segue rigorosamente estes dois pilares:

### 1. O que ENTRA no Ponto de Restauração (É Restaurado):
- **Toda a parte estrutural da aplicação**: Next.js, React, TypeScript, Tailwind CSS e componentes;
- **Layout, tema e identidade visual**: Dark Industrial Luxury (`#0A0A0C`), gradientes dourados/laranja, cards, tabelas e cabeçalhos;
- **Lógica e comportamento das abas**: Nova Compatibilização, Banco de Contratos Base, Mesa De-Para e Dicionário de Sinônimos;
- **Motores de processamento**: Motor ExcelJS (`workbook.calcProperties.fullCalcOnLoad = true`), algoritmos semânticos e gerador de fórmulas vivas;
- **Quaisquer modificações estruturais futuras** que possam surgir no desenvolvimento do sistema.

### 2. O que NÃO ENTRA no Ponto de Restauração (É Mantido e Preservado Intacto):
- **Planilhas orçamentárias carregadas em memória ativa** e histórico local do navegador;
- **Contratos personalizados criados pelo usuário** persistidos em `localStorage`;
- **Regras aprendidas de De-Para** e adições manuais ao dicionário de sinônimos salvas localmente;
- **Arquivos temporários e uploads**.

---

### [PR.002]
- **Data/Hora:** 19/10/2026 01:08 (Horário Local)
- **Tag Git:** `PR.002`
- **Commit SHA:** `5f75df4`
- **Status:** Ativo / Em Produção
- **Links Oficiais:**
  - Produção Oficial (Vercel): https://orcasync-engenharia-gpr.vercel.app
  - Repositório GitHub: https://github.com/Wisterly/orcasync-engenharia-gpr
  - Tag no GitHub: https://github.com/Wisterly/orcasync-engenharia-gpr/releases/tag/PR.002
  - Localhost de Desenvolvimento: http://localhost:3000

#### 🖥️ Implementações Estruturais do PR.002:
1. **Foto de Capa com Miniatura da Planilha Excel (`ExcelThumbnailCover.tsx`):**
   - Miniatura de janela do Microsoft Excel com badge `XLSX` e indicador de `BASE ATIVA`.
   - Grid de colunas `#`, `A (ITEM)`, `B (COMPOSIÇÃO)`, `C (UN)`, `D (VALOR)`.
   - Renderização visual realista das primeiras linhas reais da planilha do contrato (etapas em dourado, subitens e preços).
   - Efeito visual com acabamento profissional e botão de inspeção em tela cheia ao passar o mouse.
2. **Caixa de Anexo e Área Drag-and-Drop em Cada Card:**
   - Cada card do Banco de Contratos possui uma área específica para arrastar o arquivo `.xlsx` diretamente para dentro dele.
   - Botão dedicado **"Anexar Arquivo"** que abre o seletor nativo do sistema operacional (computador ou smartphone).
   - Suporte para substituição rápida da planilha base existente sem perder os metadados do contrato.
3. **Criação de Novos Cards de Contrato sem Planilha Imediata:**
   - Modal atualizado para permitir cadastrar o contrato previamente e anexar a planilha depois diretamente no card.
4. **Contratos Pré-Configurados no Banco:**
   - *Contrato Master GPR 2026* (com planilha oficial e capa ativa).
   - *Contrato Obras Hospitalares & Clínicas* (com planilha oficial e capa ativa).
   - *Contrato Infraestrutura Urbana & Saneamento* (card aguardando anexo).
   - *Contrato Retrofit e Reforma Corporativa* (card aguardando anexo).

---

### [PR.001]
- **Data/Hora:** 19/10/2026 00:33 (Horário Local)
- **Tag Git:** `PR.001`
- **Commit SHA:** `0d3a215` / `cb85e90`
- **Status:** Marco Zero / Baseline
- **Links Oficiais:**
  - Produção Oficial (Vercel): https://orcasync-engenharia-gpr.vercel.app
  - Repositório GitHub: https://github.com/Wisterly/orcasync-engenharia-gpr

#### 🖥️ Implementações Estruturais do PR.001:
1. **Arquitetura Base Next.js (App Router) + TypeScript + Tailwind CSS:**
   - Configuração estrita de tipos para orçamentos, etapas e BDI.
   - Identidade visual Dark Industrial Luxury (`#0A0A0C`, `#121316`, `#18191E`, gradientes `#FF6B00` para `#D4AF37`).
2. **Branding Oficial:**
   - Cabeçalho superior: ícone geométrico dourado, `OrçaSync` em dourado metálico, `|` em cinza grafite e `Engenharia GPR` em laranja vibrante.
   - Metadados: `<title>OrçaSync | Engenharia GPR</title>`.
3. **Regra Inviolável de Engenharia:**
   - Preservação integral das descrições, códigos, unidades e preços da planilha base do novo contrato.
   - Migração automática apenas dos quantitativos.
4. **Motor de Fórmulas Vivas (`exceljs`):**
   - Recalculo automático ao abrir no Excel: `fullCalcOnLoad = true`.
   - Fórmulas dinâmicas de multiplicação por linha (`=ROUND(F...*H..., 2)`).
   - Fórmulas dinâmicas de soma por etapa (`=SUM(...)`).
   - Fórmulas de rodapé somando subtotais, BDI e Total Geral.
5. **Mesa De-Para & Dicionário de Sinônimos:**
   - 4 KPIs financeiros e técnicos no topo.
   - Tabela comparativa Split-View com conector inteligente.
   - Dicionário com mais de 10 grupos técnicos da construção civil e memória aprendida persistida.
