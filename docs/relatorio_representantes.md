# Guia e Documentação Técnica: Consultas de Representantes e Dashboard de Vendas no Sankhya (SQL Server)

Para construir os relatórios e painéis comerciais cruzando os dados de representantes com o volume de vendas em janelas temporais (anos e meses), trabalhamos essencialmente com as tabelas de cadastro e movimentação do ERP.

Abaixo está a documentação estruturada com todas as tabelas, consultas básicas e queries avançadas para você implementar no Construtor de Telas, Relatórios Formatados ou Dashboards (Sankhya BI).

---

## 1. Estrutura de Tabelas Principais

Para extrair as informações comerciais, os dados se relacionam da seguinte forma:

- **`TGFVEN` (Cadastro de Vendedores):** Armazena os dados do representante.
  - `CODVEND`: Código identificador único do vendedor/representante.
  - `APELIDO` / `NOMEVEND`: Nome ou apelido do representante.
  - `ATIVO`: Flag de status (`S` para ativo, `N` para inativo).
- **`TGFCAB` (Cabeçalho de Notas):** Armazena o registro de vendas, pedidos e notas fiscais.
  - `NUNOTA`: Número único da nota (Chave Primária).
  - `CODVEND`: Código do vendedor responsável pela venda (Chave Estrangeira ligando à `TGFVEN`).
  - `DTNEG`: Data de negociação do documento.
  - `DTMOV`: Data de movimentação do documento.
  - `VLRNOTA`: Valor total da nota fiscal.
  - `TIPMOV`: Tipo de movimento (Ex: `V` para Venda, `P` para Pedido, `D` para Devolução).
  - `STATUSNOTA`: Status da nota (Ex: `L` para Liberada/Confirmada).
- **`VIEW_TABX`:** View customizada auxiliar (utilizada para buscar o valor líquido consolidado de pedidos por `VLRPED`).
- **`TSIUFS` / `TSICID` / `TGFPAR`:** Tabelas geográficas e de cadastro de parceiros para cruzamento de vendas por Estado (UF).

---

## 2. Queries SQL Básicas (Foco em Representante Único)

As consultas abaixo estão adaptadas para a sintaxe do **SQL Server** e utilizam o parâmetro individual `:P_CODVEND` para filtrar um representante por vez.

### A. Listagem Simples de Representantes

Utilizada para popular componentes de filtro individuais (dropdown) no painel.

```sql
SELECT
    CODVEND,
    APELIDO AS NOME_REPRESENTANTE
FROM TGFVEN
WHERE ATIVO = 'S'
ORDER BY APELIDO;
```

### B. Relatório: Vendas por Ano (Gráfico Anual)

Consolida o valor faturado acumulado por representante agrupado ano a ano.

```sql
SELECT
    VEN.CODVEND,
    VEN.APELIDO AS NOME_REPRESENTANTE,
    YEAR(CAB.DTNEG) AS ANO_VENDA,
    SUM(CAB.VLRNOTA) AS TOTAL_VENDIDO
FROM TGFCAB CAB
INNER JOIN TGFVEN VEN ON CAB.CODVEND = VEN.CODVEND
WHERE CAB.TIPMOV = 'V'           -- Filtra apenas movimentos de Venda
  AND CAB.STATUSNOTA = 'L'       -- Apenas notas confirmadas/liberadas
  AND VEN.CODVEND = :P_CODVEND   -- Parâmetro para o Sankhya injetar o filtro do representante
GROUP BY
    VEN.CODVEND,
    VEN.APELIDO,
    YEAR(CAB.DTNEG)
ORDER BY
    ANO_VENDA DESC;
```

### C. Relatório: Anos versus Meses (Visão Detalhada)

Quebra o faturamento anual em meses para análise de sazonalidade do representante, limitada aos últimos 3 anos para otimização.

```sql
SELECT
    VEN.CODVEND,
    VEN.APELIDO AS NOME_REPRESENTANTE,
    YEAR(CAB.DTNEG) AS ANO_VENDA,
    MONTH(CAB.DTNEG) AS MES_VENDA,
    SUM(CAB.VLRNOTA) AS TOTAL_VENDIDO
FROM TGFCAB CAB
INNER JOIN TGFVEN VEN ON CAB.CODVEND = VEN.CODVEND
WHERE CAB.TIPMOV = 'V'
  AND CAB.STATUSNOTA = 'L'
  AND CAB.DTNEG >= DATEADD(month, -36, GETDATE())
  AND VEN.CODVEND = :P_CODVEND
GROUP BY
    VEN.CODVEND,
    VEN.APELIDO,
    YEAR(CAB.DTNEG),
    MONTH(CAB.DTNEG)
ORDER BY
    ANO_VENDA DESC,
    MES_VENDA DESC;
```

### Dicas de Implementação Básica

1. **Parâmetros (`:P_CODVEND`):** Ao criar o Dashboard ou Relatório no Sankhya, declare o parâmetro `:P_CODVEND` como tipo **Entidade** apontando para a tabela `Vendedor/Comprador` (`Vendedor`). Isso fará com que o sistema gere a caixa de seleção automaticamente.
2. **Tipo de Movimento (`TIPMOV`):** Confirme com a operação se as comissões/relatórios são baseadas no momento do **Pedido (`P`)** ou do faturamento/emissão da **Nota de Venda (`V`)**. Ajuste a cláusula `WHERE CAB.TIPMOV = 'V'` conforme a regra de negócio da empresa.

---

## 3. Configuração do Dashboard Gerencial Completo (Múltiplas Abas)

Para construir a tela gerencial de abas integradas, substituímos parâmetros individuais por uma estrutura global limpa inserida no nível superior do painel do Sankhya BI.

### 3.1. Parâmetros Globais do Dashboard

Crie estes parâmetros uma única vez para gerenciar todos os componentes simultaneamente:

- **`:P_ANO_ATUAL`** (Inteiro): Ano base principal sob análise (Ex: 2026).
- **`:P_ANO_ANTERIOR`** (Inteiro): Ano de comparação histórica (Ex: 2025).
- **`:P_CODEMP`** (Entidade: `Empresa@CODEMP`): Filtro opcional de empresa.
- **`:P_UFS`** (Múltipla Seleção / Texto): Lista dinâmica de UFs baseada na query:
  `SELECT CODUF AS VALUE, UF AS LABEL FROM TSIUFS ORDER BY UF`
- **`:P_MESES`** (Múltipla Seleção / Inteiro): Seleção de meses para cortes sazonais.

---

### 3.2. Aba 1: A.Atual / A.Anter. (Resumo de Ontem / Hoje)

**Visão Fechamento de ONTEM (KPIs em Grade ou Cards)**
Utiliza funções analíticas do SQL Server (`LAG` e `OVER`) para calcular o percentual de variação em relação ao ano anterior.

```sql
SELECT
    SUM(X.VLRPED) AS VLRPEDIDOS,
    ISNULL(ROUND(((SUM(X.VLRPED) / NULLIF(LAG(SUM(X.VLRPED)) OVER (ORDER BY YEAR(CAB.DTMOV)), 0)) * 100) - 100, 2), 0) AS PORCENTAGEM,
    YEAR(CAB.DTMOV) AS ANO,
    COUNT(CAB.NUNOTA) AS QTDPED,
    ISNULL(ROUND(((CAST(COUNT(CAB.NUNOTA) AS FLOAT) / NULLIF(LAG(COUNT(CAB.NUNOTA)) OVER (ORDER BY YEAR(CAB.DTMOV)), 0)) * 100) - 100, 2), 0) AS PERQTD
FROM TGFCAB CAB
LEFT JOIN VIEW_TABX X ON X.NUNOTA = CAB.NUNOTA
JOIN TGFPAR P ON CAB.CODPARC = P.CODPARC
JOIN TSICID CID ON P.CODCID = CID.CODCID
JOIN TSIUFS UF ON CID.UF = UF.CODUF
WHERE CAB.CODTIPOPER IN (3100, 888)
  AND DAY(CAB.DTMOV) = DAY(GETDATE() - 1)
  AND MONTH(CAB.DTMOV) = MONTH(GETDATE() - 1)
  AND YEAR(CAB.DTMOV) IN (:P_ANO_ATUAL, :P_ANO_ANTERIOR)
  AND ((CAB.CODEMP = :P_CODEMP) OR (:P_CODEMP IS NULL))
  AND UF.CODUF IN :P_UFS
GROUP BY YEAR(CAB.DTMOV)
ORDER BY YEAR(CAB.DTMOV) DESC;
```

_(Nota: Para montar a visão paralela de **HOJE**, basta remover o `- 1` das funções `DAY()` e `MONTH()` na cláusula WHERE)._

---

### 3.3. Aba 2: Vendas UF (Ranking de Estados)

Compara o faturamento de vendas por Estado (UF) entre o ano selecionado e o ano anterior.

```sql
WITH VendasAnoAnterior AS (
    SELECT UF.CODUF, SUM(X.VLRPED) AS VlrAnoAnt, COUNT(CB.NUNOTA) AS QtdAnoAnt
    FROM TGFCAB CB
    LEFT JOIN VIEW_TABX X ON X.NUNOTA = CB.NUNOTA
    JOIN TGFPAR PA ON PA.CODPARC = CB.CODPARC
    JOIN TSICID CD ON CD.CODCID = PA.CODCID
    JOIN TSIUFS UF ON UF.CODUF = CD.UF
    WHERE CB.CODTIPOPER IN (3100, 888)
      AND YEAR(CB.DTMOV) = :P_ANO_ANTERIOR
      AND ((CB.CODEMP = :P_CODEMP) OR (:P_CODEMP IS NULL))
      AND MONTH(CB.DTMOV) IN :P_MESES
      AND UF.CODUF IN :P_UFS
    GROUP BY UF.CODUF
),
VendasAnoAtual AS (
    SELECT UF.CODUF, SUM(X.VLRPED) AS VlrAnoAtu, COUNT(CB.NUNOTA) AS QtdAnoAtu
    FROM TGFCAB CB
    LEFT JOIN VIEW_TABX X ON X.NUNOTA = CB.NUNOTA
    JOIN TGFPAR PA ON PA.CODPARC = CB.CODPARC
    JOIN TSICID CD ON CD.CODCID = PA.CODCID
    JOIN TSIUFS UF ON UF.CODUF = CD.UF
    WHERE CB.CODTIPOPER IN (3100, 888)
      AND YEAR(CB.DTMOV) = :P_ANO_ATUAL
      AND ((CB.CODEMP = :P_CODEMP) OR (:P_CODEMP IS NULL))
      AND MONTH(CB.DTMOV) IN :P_MESES
      AND UF.CODUF IN :P_UFS
    GROUP BY UF.CODUF
)
SELECT
    UFS.UF,
    ISNULL(ANT.VlrAnoAnt, 0) AS VLRPEDIDO_ANO_ANT,
    ISNULL(ANT.QtdAnoAnt, 0) AS QTDPEDIDO_ANO_ANT,
    ISNULL(ATU.VlrAnoAtu, 0) AS VLRPEDIDO_ANO_ATU,
    ISNULL(ATU.QtdAnoAtu, 0) AS QTDPEDIDO_ANO_ATU,
    ISNULL(ROUND((((ISNULL(ATU.VlrAnoAtu, 0) / NULLIF(ISNULL(ANT.VlrAnoAnt, 0), 0)) * 100) - 100), 2), 0) AS PERC_EVOLUCAO
FROM TSIUFS UFS
LEFT JOIN VendasAnoAnterior ANT ON ANT.CODUF = UFS.CODUF
LEFT JOIN VendasAnoAtual ATU ON ATU.CODUF = UFS.CODUF
WHERE (ANT.CODUF IS NOT NULL OR ATU.CODUF IS NOT NULL)
ORDER BY VLRPEDIDO_ANO_ATU DESC;
```

---

### 3.4. Aba 3: Vendas Repres. (Evolução de Representantes)

Visão consolidada do ranking e evolução de faturamento de cada representante (`TGFVEN`) cadastrado no ERP.

```sql
WITH VendasAnoAnterior AS (
    SELECT CB.CODVEND, SUM(X.VLRPED) AS VlrAnoAnt, COUNT(CB.NUNOTA) AS QtdAnoAnt
    FROM TGFCAB CB
    LEFT JOIN VIEW_TABX X ON X.NUNOTA = CB.NUNOTA
    JOIN TGFPAR PA ON PA.CODPARC = CB.CODPARC
    JOIN TSICID CD ON CD.CODCID = PA.CODCID
    JOIN TSIUFS UF ON UF.CODUF = CD.UF
    WHERE CB.CODTIPOPER IN (3100, 888)
      AND YEAR(CB.DTMOV) = :P_ANO_ANTERIOR
      AND ((CB.CODEMP = :P_CODEMP) OR (:P_CODEMP IS NULL))
      AND MONTH(CB.DTMOV) IN :P_MESES
      AND UF.CODUF IN :P_UFS
    GROUP BY CB.CODVEND
),
VendasAnoAtual AS (
    SELECT CB.CODVEND, SUM(X.VLRPED) AS VlrAnoAtu, COUNT(CB.NUNOTA) AS QtdAnoAtu
    FROM TGFCAB CB
    LEFT JOIN VIEW_TABX X ON X.NUNOTA = CB.NUNOTA
    JOIN TGFPAR PA ON PA.CODPARC = CB.CODPARC
    JOIN TSICID CD ON CD.CODCID = PA.CODCID
    JOIN TSIUFS UF ON UF.CODUF = CD.UF
    WHERE CB.CODTIPOPER IN (3100, 888)
      AND YEAR(CB.DTMOV) = :P_ANO_ATUAL
      AND ((CB.CODEMP = :P_CODEMP) OR (:P_CODEMP IS NULL))
      AND MONTH(CB.DTMOV) IN :P_MESES
      AND UF.CODUF IN :P_UFS
    GROUP BY CB.CODVEND
)
SELECT
    VEN.CODVEND,
    RTRIM(VEN.APELIDO) AS APELIDO,
    ISNULL(ANT.VlrAnoAnt, 0) AS VLRPEDIDO_ANO_ANT,
    ISNULL(ANT.QtdAnoAnt, 0) AS QTDPEDIDO_ANO_ANT,
    ISNULL(ATU.VlrAnoAtu, 0) AS VLRPEDIDO_ANO_ATU,
    ISNULL(ATU.QtdAnoAtu, 0) AS QTDPEDIDO_ANO_ATU,
    ISNULL(ROUND((((ISNULL(ATU.VlrAnoAtu, 0) / NULLIF(ISNULL(ANT.VlrAnoAnt, 0), 0)) * 100) - 100), 2), 0) AS PERVEN,
    ISNULL(ROUND((((CAST(ISNULL(ATU.QtdAnoAtu, 0) AS FLOAT) / NULLIF(ISNULL(ANT.QtdAnoAnt, 0), 0)) * 100) - 100), 2), 0) AS PERQTD
FROM TGFVEN VEN
LEFT JOIN VendasAnoAnterior ANT ON VEN.CODVEND = ANT.CODVEND
LEFT JOIN VendasAnoAtual ATU ON VEN.CODVEND = ATU.CODVEND
WHERE ISNULL(ANT.VlrAnoAnt, 0) + ISNULL(ATU.VlrAnoAtu, 0) > 0
ORDER BY VLRPEDIDO_ANO_ATU DESC;
```

---

### 3.5. Aba 4: Vendas Mês (Comparativo Mensal Sazonal)

Gera dinamicamente a linha do tempo dos 12 meses do ano e preenche com os faturamentos correspondentes, ideal para alimentar gráficos de colunas agrupadas ou linhas paralelas.

```sql
WITH MeusMeses AS (
    SELECT 1 AS Mes UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
    SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL
    SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL
    SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
),
VendasAnoAnterior AS (
    SELECT MONTH(CB.DTMOV) AS Mes, SUM(X.VLRPED) AS Vlr, COUNT(CB.NUNOTA) AS Qtd
    FROM TGFCAB CB
    LEFT JOIN VIEW_TABX X ON X.NUNOTA = CB.NUNOTA
    JOIN TGFPAR PA ON PA.CODPARC = CB.CODPARC
    JOIN TSICID CD ON CD.CODCID = PA.CODCID
    JOIN TSIUFS UF ON UF.CODUF = CD.UF
    WHERE CB.CODTIPOPER IN (3100, 888)
      AND YEAR(CB.DTMOV) = :P_ANO_ANTERIOR
      AND ((CB.CODEMP = :P_CODEMP) OR (:P_CODEMP IS NULL))
      AND UF.CODUF IN :P_UFS
    GROUP BY MONTH(CB.DTMOV)
),
VendasAnoAtual AS (
    SELECT MONTH(CB.DTMOV) AS Mes, SUM(X.VLRPED) AS Vlr, COUNT(CB.NUNOTA) AS Qtd
    FROM TGFCAB CB
    LEFT JOIN VIEW_TABX X ON X.NUNOTA = CB.NUNOTA
    JOIN TGFPAR PA ON PA.CODPARC = CB.CODPARC
    JOIN TSICID CD ON CD.CODCID = PA.CODCID
    JOIN TSIUFS UF ON UF.CODUF = CD.UF
    WHERE CB.CODTIPOPER IN (3100, 888)
      AND YEAR(CB.DTMOV) = :P_ANO_ATUAL
      AND ((CB.CODEMP = :P_CODEMP) OR (:P_CODEMP IS NULL))
      AND UF.CODUF IN :P_UFS
    GROUP BY MONTH(CB.DTMOV)
)
SELECT
    CASE M.Mes
        WHEN 1 THEN 'JANEIRO' WHEN 2 THEN 'FEVEREIRO' WHEN 3 THEN 'MARÇO'
        WHEN 4 THEN 'ABRIL'   WHEN 5 THEN 'MAIO'      WHEN 6 THEN 'JUNHO'
        WHEN 7 THEN 'JULHO'   WHEN 8 THEN 'AGOSTO'    WHEN 9 THEN 'SETEMBRO'
        WHEN 10 THEN 'OUTUBRO' WHEN 11 THEN 'NOVEMBRO' WHEN 12 THEN 'DEZEMBRO'
    END AS NOME_MES,
    ISNULL(ANT.Vlr, 0) AS VLRPEDIDO_ANO_ANT,
    ISNULL(ANT.Qtd, 0) AS QTDPEDIDO_ANO_ANT,
    ISNULL(ATU.Vlr, 0) AS VLRPEDIDO_ANO_ATU,
    ISNULL(ATU.Qtd, 0) AS QTDPEDIDO_ANO_ATU
FROM MeusMeses M
LEFT JOIN VendasAnoAnterior ANT ON M.Mes = ANT.Mes
LEFT JOIN VendasAnoAtual ATU ON M.Mes = ATU.Mes
WHERE M.Mes IN :P_MESES
ORDER BY M.Mes;
```
