<div align="center">

  <img src="./src/assets/logo.svg" alt="Dashboard Comercial Sankhya" height="120" />

  <h1>Dashboard Comercial — Sankhya ERP (React + Vite)</h1>

  <p>
    Dashboard de inteligência comercial e análise de vendas integrado ao <strong>Sankhya ERP</strong> como componente HTML5, construído com <strong>React 19</strong>, <strong>TypeScript</strong>, <strong>Tailwind CSS v4</strong> e <strong>Recharts</strong>.
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 7" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
    <img src="https://img.shields.io/badge/Sankhya_ERP-HTML5_Component-0052CC?style=flat-square" alt="Sankhya ERP" />
    <img src="https://img.shields.io/badge/License-MIT-black?style=flat-square" alt="License: MIT" />
  </p>

  <p>
    <a href="#-recursos-principais"><img src="https://img.shields.io/badge/Funcionalidades-completo-blue" alt="Funcionalidades" /></a>
    <a href="#-como-executar-localmente"><img src="https://img.shields.io/badge/Guia-como%20rodar-brightgreen" alt="Como Rodar" /></a>
    <a href="#-build-e-implantação-no-sankhya"><img src="https://img.shields.io/badge/Deploy-Sankhya-orange" alt="Deploy Sankhya" /></a>
  </p>
</div>

---

## 📊 Visão Geral

O **Dashboard Comercial** foi desenvolvido para oferecer à diretoria e equipe comercial uma visão estratégica e operacional de vendas, com acompanhamento de metas, comparações anuais e mensais, rankings de vendedores/produtos/clientes e detalhamento direto até o nível de nota fiscal (*drill-down*).

Ele funciona nativamente embutido como um **Componente HTML5 no Sankhya ERP** (utilizando a biblioteca nativa `window.executeQuery` / `removeFrame` ou serviços `service.sbr`), além de possuir um **Modo Demo/Mock** automático que permite desenvolvimento e testes completos em ambiente local sem depender de conexão ativa com o ERP.

---

## ✨ Recursos Principais

### 1. 📈 Visão Gerencial
- **Snapshot de Desempenho:** Cards com métricas consolidadas de *Hoje*, *Ontem*, *Mês Atual* e *Ano Atual*, comparando valores faturados/pedidos, quantidades e percentuais de variação contra o ano anterior.
- **Comparativo por UF:** Ranking de faturamento por estado com comparação direta entre o ano atual e ano anterior, além de variação percentual.
- **Ranking de Representantes:** Tabela e gráfico com o desempenho de cada vendedor no período, variação ano contra ano e totalizadores.
- **Evolução Mensal:** Gráfico comparativo mês a mês (Janeiro a Dezembro) entre os anos selecionados.

### 2. 👤 Visão do Representante (Individual)
- **Seleção Dinâmica de Vendedor:** Combobox com busca rápida por código ou nome do vendedor.
- **KPIs Comerciais:** Total faturado/pedido, quantidade de pedidos, ticket médio e percentual de participação nas vendas totais da empresa.
- **Histórico Anual:** Acompanhamento do faturamento do representante ao longo dos anos.
- **Distribuição Geográfica (UF):** Vendas por estado de atuação do vendedor.
- **Top 10 Clientes & Top 10 Produtos:** Identificação das principais contas e produtos mais representativos.
- **Análise Temporal Detalhada:**
  - **Ano × Mês:** Comparativo sazonal mês a mês em múltiplos anos.
  - **Dia a Dia:** Evolução diária das vendas no mês comparando ano a ano.

### 3. ⚖️ Comparador de Representantes
- Comparação lado a lado de múltiplos representantes selecionados simultaneamente.
- Visualização combinada em tabela e gráfico multissérie de barras.
- Destaques automáticos de líder de faturamento, maior crescimento percentual e totais acumulados.

### 4. 🔍 Drill-Down Interativo (Detalhamento)
- Ao clicar em qualquer linha de tabela ou barra de gráfico (UF, Representante, Mês, Cliente ou Produto), abre-se um modal com as notas/pedidos individuais que compõem aquele valor.
- Visualização com filtros em tempo real, ordenação, paginação e gráfico de dispersão/distribuição temporal das notas.

### 5. 🛠️ Controles e Customização de Interface
- **Densidade Visual:** Alternância rápida entre layout *Confortável* e *Compacto*.
- **Controle de Zoom:** Ajuste de escala (0.7x até 1.5x) para otimizar visualização em telas de diferentes tamanhos/TVs de sala de reunião.
- **Personalização de Colunas:** Reordene, oculte ou exiba colunas nas tabelas conforme a necessidade, com preferências persistidas localmente (`localStorage`).
- **Alternância Tabela / Gráfico:** Alterne a visualização de cada card entre gráfico de barras e tabela com um único clique.
- **Exportação de Imagens (PNG):** Botão de download direto do card/gráfico como imagem PNG de alta resolução.

---

## 🎛️ Filtros Globais (Barra Lateral)

- **Tipo de Movimento (Base de Cálculo):**
  - **Faturamento (`V`):** Notas fiscais de venda confirmadas (`TOP.TIPMOV = 'V'`).
  - **Pedidos (`P`):** Pedidos de venda (`TOP.TIPMOV = 'P'`).
- **Anos de Comparação:** Seleção flexível do Ano Atual e Ano Anterior.
- **Filtro de Meses:** Seleção rápida de períodos (Todos os Meses, 1º Semestre, 2º Semestre, 1º ao 4º Trimestre) ou seleção granular de meses específicos.
- **Modo Demo Indicator:** Indicador visual quando o painel está rodando com dados simulados/mockados no ambiente de desenvolvimento.

---

## 🚀 Tecnologias Utilizadas

| Tecnologia | Finalidade |
| :--- | :--- |
| **React 19** | Biblioteca base da interface com componentização e hooks modernos |
| **Vite 7** | Build tool ultrarrápido com empacotamento otimizado |
| **TypeScript** | Tipagem estática robusta para entidades, queries e respostas do Sankhya |
| **Tailwind CSS v4** | Estilização utilitária moderna e design responsivo |
| **Radix UI** | Primitivas acessíveis para Diálogos, Selects, Popovers, Tabs e Checkboxes |
| **Recharts** | Biblioteca de gráficos responsivos e interativos |
| **Lucide Icons** | Conjunto completo de ícones |
| **html-to-image** | Geração e download de cards em PNG |
| **vite-plugin-zip-pack** | Geração automática do pacote `.zip` pronto para importação no Sankhya |

---

## 💻 Como Executar Localmente

### Pré-requisitos
- **Node.js** (versão 20+ recomendada)
- Gerenciador de pacotes **pnpm** (ou `npm` / `yarn`)

### Passos

1. Clone o repositório e acesse a pasta do projeto:
```bash
git clone https://github.com/mateussantoos/dashboard-comercial.git
cd dashboard-comercial
```

2. Instale as dependências:
```bash
pnpm install
```

3. Inicie o servidor de desenvolvimento:
```bash
pnpm dev
```

4. Abra no navegador: [http://localhost:5173](http://localhost:5173)

> **Nota:** Em ambiente local (`pnpm dev`), o dashboard detecta a ausência do runtime do Sankhya e ativa automaticamente o **Modo Mock**, simulando o banco de dados e permitindo testar todas as telas e interações com dados fictícios realistas.

---

## 📦 Build e Implantação no Sankhya

Para compilar e gerar o pacote de distribuição:

```bash
pnpm build
```

O comando executará a checagem de tipos (`tsc -b`), a compilação via Vite e o empacotamento automático gerando a pasta `dist/`:

- `dist/index.jsp` — Página de entrada com tags `<snk:load/>` do Sankhya
- `dist/assets/app.js` — Bundle JavaScript otimizado
- `dist/assets/index.css` — Estilos CSS compilados
- `dist/sankhya-component.zip` — **Arquivo compactado pronto para envio ao Sankhya**

### Como importar no Sankhya:
1. No Sankhya ERP, acesse o menu **Componentes HTML5** (ou Construtor de Telas).
2. Crie ou edite um componente do tipo HTML5.
3. Faça o upload do arquivo `dist/sankhya-component.zip` (ou copie os arquivos da pasta `dist/` para a pasta do componente no servidor).
4. Defina a página inicial como `index.jsp`.

---

## 📁 Estrutura do Projeto

```
dashboard-comercial/
├── public/
│   └── index.jsp                  # Wrapper JSP do componente Sankhya
├── src/
│   ├── app/
│   │   └── app.tsx                # Componente raiz, layout e roteamento de telas
│   ├── assets/                    # Imagens, ícones e SVGs
│   ├── components/
│   │   ├── dashboard/             # Componentes específicos do dashboard
│   │   │   ├── charts.tsx         # Gráficos Recharts (Ano x Mês, Dia a Dia, etc.)
│   │   │   ├── column-settings.tsx# Modal de configuração e ordenação de colunas
│   │   │   ├── detail-dialog.tsx  # Modal de drill-down de notas fiscais
│   │   │   ├── generic-bar-chart.tsx # Gráficos de barras genéricos
│   │   │   ├── generic-table.tsx  # Tabela dinâmica com ordenação e formatação
│   │   │   ├── gerencial-toolbar.tsx # Barra de controles (zoom, densidade, reset)
│   │   │   ├── kpi-card.tsx       # Cards de métricas e KPIs
│   │   │   ├── panel-cards.tsx    # Cards com alternância Gráfico / Tabela / Exportação
│   │   │   ├── sidebar.tsx        # Menu lateral e filtros globais
│   │   │   ├── tela-comparar.tsx  # Tela: Comparador de Representantes
│   │   │   ├── tela-gerencial.tsx # Tela: Visão Gerencial
│   │   │   └── tela-representante.tsx # Tela: Visão Individual do Representante
│   │   └── ui/                    # Componentes base de UI (Radix / Tailwind)
│   ├── contexts/
│   │   └── sankhya-context.tsx    # Provedor de contexto do Sankhya
│   ├── hooks/
│   │   ├── use-dashboard-data.ts  # Hooks para consumo de dados e cache
│   │   └── use-local-storage.ts   # Hook para persistência de preferências
│   ├── lib/
│   │   └── format.ts              # Utilitários de formatação (Moeda, Números, Datas)
│   ├── services/
│   │   ├── representantes/        # Camada de domínio comercial
│   │   │   ├── analytics.ts       # Cálculos agregados e resumos
│   │   │   ├── mock.ts            # Gerador e dados mockados para modo offline
│   │   │   ├── queries.ts         # Consultas SQL e builders para o Sankhya
│   │   │   ├── repository.ts      # Repositório de dados (chaveia Sankhya / Mock)
│   │   │   └── types.ts           # Interfaces e tipos do domínio comercial
│   │   └── sankhya/               # Camada de comunicação com a API do Sankhya
│   └── main.tsx                   # Ponto de entrada da aplicação
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para mais informações.

<div align="center">
  Desenvolvido por <strong>Mateus Santos</strong>
</div>
