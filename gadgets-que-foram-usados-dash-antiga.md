<gadget refresh-time="600000">

  <prompt-parameters>

    <parameter id="Ano" description="Ano" metadata="integer" required="false" keep-last="true" keep-date="false" order="0" label="Ano : Número Inteiro"/>

    <parameter id="codemp" description="Empresa" metadata="entity:Empresa@CODEMP" required="false" keep-last="true" keep-date="false" order="1" label="codemp : Entidade/Tabela"/>

    <parameter id="UFS" description="Filtrar UFs" metadata="multiList:Text" listType="sql" required="true" keep-last="true" keep-date="false" order="2" label="UFS : multiList:Text">

      <expression type="SQL">

        <![CDATA[

        SELECT CODUF AS VALUE, UF AS LABEL FROM TSIUFS ORDER BY UF

      ]]>

      </expression>

    </parameter>

  </prompt-parameters>

  <level id="lvl_ontem_v2_final" description="Principal">

    <container orientacao="H" tamanhoRelativo="100">

      <container orientacao="V" tamanhoRelativo="25">

        <container orientacao="V" tamanhoRelativo="50">

          <grid id="grd_ontem_final" useNewGrid="S">

            <expression type="sql" data-source="MGEDS">

              <![CDATA[

SELECT

    SUM(X.VLRPED) AS VLRPEDIDOS,

    -- Cálculo de % Valor (Dinâmico: Ano Anterior da lista)

    ISNULL(ROUND(((SUM(X.VLRPED) / NULLIF(LAG(SUM(X.VLRPED)) OVER (ORDER BY YEAR(CAB.DTMOV)), 0)) * 100) - 100, 2), 0) AS PORCENTAGEM,



    YEAR(CAB.DTMOV) AS ANO,



    COUNT(CAB.NUNOTA) AS QTDPED,

    -- Cálculo de % Quantidade (Dinâmico: Ano Anterior da lista)

    ISNULL(ROUND(((CAST(COUNT(CAB.NUNOTA) AS FLOAT) / NULLIF(LAG(COUNT(CAB.NUNOTA)) OVER (ORDER BY YEAR(CAB.DTMOV)), 0)) * 100) - 100, 2), 0) AS PERQTD

FROM TGFCAB CAB

LEFT JOIN VIEW_TABX X ON X.NUNOTA = CAB.NUNOTA

JOIN TGFPAR P ON CAB.CODPARC = P.CODPARC

JOIN TSICID CID ON P.CODCID = CID.CODCID

JOIN TSIUFS UF ON CID.UF = UF.CODUF

WHERE CAB.CODTIPOPER IN (3100, 888)

-- Filtra o dia de ONTEM (Note o -1 no dia e no mês para garantir consistência)

AND DAY(CAB.DTMOV) = DAY(GETDATE() - 1)

AND MONTH(CAB.DTMOV) = MONTH(GETDATE() - 1)

AND ((YEAR(CAB.DTMOV) >= :Ano) OR (:Ano IS NULL))

AND ((CAB.CODEMP = :codemp) OR (:codemp IS NULL))

AND UF.CODUF IN :UFS

GROUP BY YEAR(CAB.DTMOV)

ORDER BY YEAR(CAB.DTMOV) DESC

              ]]>

            </expression>

            <metadata>

              <field name="VLRPEDIDOS" label="Vendas" type="I" visible="true" useFooter="false" mask="R$ #.##0,00">

              </field>

              <field name="PORCENTAGEM" label="% Vlr" type="F" visible="true" useFooter="false" mask="#.##0,00 %">

              </field>

              <field name="ANO" label="Ano" type="I" visible="true" useFooter="false">

              </field>

              <field name="QTDPED" label="Pedidos" type="I" visible="true" useFooter="false" mask="###0">

              </field>

              <field name="PERQTD" label="% Qtd" type="F" visible="true" useFooter="false" mask="#.##0,00%">

              </field>

            </metadata>

          </grid>

        </container>

      </container>

    </container>

  </level>

</gadget>

<gadget refresh-time="600000">

  <prompt-parameters>

    <parameter id="Ano" description="Ano" metadata="integer" required="false" keep-last="true" keep-date="false" order="0" label="Ano : Número Inteiro"/>

    <parameter id="codemp" description="Empresa" metadata="entity:Empresa@CODEMP" required="false" keep-last="true" keep-date="false" order="1" label="codemp : Entidade/Tabela"/>

    <parameter id="UFS" description="Filtrar UFs" metadata="multiList:Text" listType="sql" required="true" keep-last="true" keep-date="false" order="2" label="UFS : multiList:Text">

      <expression type="SQL">

        <![CDATA[

        SELECT CODUF AS VALUE, UF AS LABEL FROM TSIUFS ORDER BY UF

      ]]>

      </expression>

    </parameter>

  </prompt-parameters>

  <level id="lvl_hoje_v2_final_v2" description="Principal">

    <container orientacao="H" tamanhoRelativo="100">

      <container orientacao="V" tamanhoRelativo="25">

        <container orientacao="V" tamanhoRelativo="50">

          <grid id="grd_hoje_final_v2" useNewGrid="S">

            <expression type="sql" data-source="MGEDS">

              <![CDATA[

SELECT

    SUM(X.VLRPED) AS VLRPEDIDOS,

    -- Cálculo de % Valor (Dinâmico: Ano Atual vs Ano Anterior)

    ISNULL(ROUND(((SUM(X.VLRPED) / NULLIF(LAG(SUM(X.VLRPED)) OVER (ORDER BY YEAR(CAB.DTMOV)), 0)) * 100) - 100, 2), 0) AS PORCENTAGEM,



    YEAR(CAB.DTMOV) AS ANO,



    COUNT(CAB.NUNOTA) AS QTDPED,

    -- Cálculo de % Quantidade (Dinâmico: Ano Atual vs Ano Anterior)

    ISNULL(ROUND(((CAST(COUNT(CAB.NUNOTA) AS FLOAT) / NULLIF(LAG(COUNT(CAB.NUNOTA)) OVER (ORDER BY YEAR(CAB.DTMOV)), 0)) * 100) - 100, 2), 0) AS PERQTD

FROM TGFCAB CAB

LEFT JOIN VIEW_TABX X ON X.NUNOTA = CAB.NUNOTA

JOIN TGFPAR P ON CAB.CODPARC = P.CODPARC

JOIN TSICID CID ON P.CODCID = CID.CODCID

JOIN TSIUFS UF ON CID.UF = UF.CODUF

WHERE CAB.CODTIPOPER IN (3100, 888)

-- Filtra dia e mês atuais (HOJE)

AND DAY(CAB.DTMOV) = DAY(GETDATE())

AND MONTH(CAB.DTMOV) = MONTH(GETDATE())

AND ((YEAR(CAB.DTMOV) >= :Ano) OR (:Ano IS NULL))

AND ((CAB.CODEMP = :codemp) OR (:codemp IS NULL))

AND UF.CODUF IN :UFS

GROUP BY YEAR(CAB.DTMOV)

ORDER BY YEAR(CAB.DTMOV) DESC

              ]]>

            </expression>

            <metadata>

              <field name="VLRPEDIDOS" label="Vendas" type="F" visible="true" useFooter="false" mask="R$ #.##0,00">

              </field>

              <field name="PORCENTAGEM" label="% Pedido" type="F" visible="true" useFooter="false" mask="#.##0,00 %">

              </field>

              <field name="ANO" label="Ano" type="I" visible="true" useFooter="false">

              </field>

              <field name="QTDPED" label="Pedidos" type="I" visible="true" useFooter="false" mask="###0">

              </field>

              <field name="PERQTD" label="% Qtd" type="F" visible="true" useFooter="false" mask="#.##0,00 %">

              </field>

            </metadata>

          </grid>

        </container>

      </container>

    </container>

  </level>

</gadget>

<gadget refresh-time="600000">

  <prompt-parameters>

    <parameter id="Ano" description="Ano" metadata="integer" required="false" keep-last="true" keep-date="false" range-end="2040" range-ini="2000" order="0" label="Ano : Número Inteiro"/>

    <parameter id="codemp" description="Empresa" metadata="entity:Empresa@CODEMP" required="false" keep-last="true" keep-date="false" order="1" label="codemp : Entidade/Tabela"/>

    <parameter id="UFS" description="Filtrar UFs" metadata="multiList:Text" listType="sql" required="true" keep-last="true" keep-date="false" order="2" label="UFS : multiList:Text">

      <expression type="SQL">

        <![CDATA[

        SELECT CODUF AS VALUE, UF AS LABEL FROM TSIUFS ORDER BY UF

      ]]>

      </expression>

    </parameter>

  </prompt-parameters>

  <level id="lvl_mes_v2_fix2" description="Principal">

    <container orientacao="H" tamanhoRelativo="100">

      <container orientacao="V" tamanhoRelativo="25">

        <container orientacao="V" tamanhoRelativo="50">

          <grid id="grd_mes_fix2" useNewGrid="S">

            <expression type="sql" data-source="MGEDS">

              <![CDATA[

SELECT

    SUM(X.VLRPED) AS VLRPEDIDOS,

    -- Cálculo % Valor (Dinâmico: Mesma época do ano anterior)

    ISNULL(ROUND(((SUM(X.VLRPED) / NULLIF(LAG(SUM(X.VLRPED)) OVER (ORDER BY YEAR(CAB.DTMOV)), 0)) * 100) - 100, 2), 0) AS PORCENTAGEM,



    YEAR(CAB.DTMOV) AS ANO,



    COUNT(CAB.NUNOTA) AS QTDPED,

    -- Cálculo % Quantidade (Dinâmico e direto no SQL, sem calculated field)

    ISNULL(ROUND(((CAST(COUNT(CAB.NUNOTA) AS FLOAT) / NULLIF(LAG(COUNT(CAB.NUNOTA)) OVER (ORDER BY YEAR(CAB.DTMOV)), 0)) * 100) - 100, 2), 0) AS PERQTD

FROM TGFCAB CAB

LEFT JOIN VIEW_TABX X ON X.NUNOTA = CAB.NUNOTA

JOIN TGFPAR P ON CAB.CODPARC = P.CODPARC

JOIN TSICID CID ON P.CODCID = CID.CODCID

JOIN TSIUFS UF ON CID.UF = UF.CODUF

WHERE CAB.CODTIPOPER IN (3100, 888)

-- Filtra o MÊS ATUAL de todos os anos

AND MONTH(CAB.DTMOV) = MONTH(GETDATE())

AND ((YEAR(CAB.DTMOV) >= :Ano) OR (:Ano IS NULL))

AND ((CAB.CODEMP = :codemp) OR (:codemp IS NULL))

AND UF.CODUF IN :UFS

GROUP BY YEAR(CAB.DTMOV)

ORDER BY YEAR(CAB.DTMOV) DESC

              ]]>

            </expression>

            <metadata>

              <field name="VLRPEDIDOS" label="Vendas" type="F" visible="true" useFooter="false" mask="R$ #.##0,00">

              </field>

              <field name="PORCENTAGEM" label="% Vend" type="F" visible="true" useFooter="false" mask="#.##0,00 %">

              </field>

              <field name="ANO" label="Ano" type="I" visible="true" useFooter="false">

              </field>

              <field name="QTDPED" label="Pedidos" type="I" visible="true" useFooter="false">

              </field>

              <field name="PERQTD" label="% Qtd" type="F" visible="true" useFooter="false" mask="#.##0,00 %">

              </field>

            </metadata>

          </grid>

        </container>

      </container>

    </container>

  </level>

  <level id="lvl_mes_chart_fix2" description="MES CHART">

    <args >

      <arg id="ANO" type="integer"/>

    </args>

    <container orientacao="V" tamanhoRelativo="100">

      <chart id="cht_mes_fix2" type="column" nroColuna="6">

        <title>

          <![CDATA[MÊS]]>

        </title>

        <expression type="sql" data-source="MGEDS">

          <![CDATA[SELECT

    SUM(CAB.VLRNOTA) AS VLRPEDIDOS,

    MONTH(CAB.DTNEG) AS MES

FROM TGFCAB CAB

JOIN TGFPAR P ON CAB.CODPARC = P.CODPARC

JOIN TSICID CID ON P.CODCID = CID.CODCID

JOIN TSIUFS UF ON CID.UF = UF.CODUF

WHERE CAB.CODTIPOPER = 3103

AND YEAR(CAB.DTNEG) = :ANO

AND UF.CODUF IN :UFS

GROUP BY MONTH(CAB.DTNEG)

ORDER BY MES]]>

        </expression>

        <metadata>

          <field name="VLRPEDIDOS" label="VLRPEDIDOS" type="I" visible="true" useFooter="false" mask="R$ #.##0,00">

          </field>

          <field name="MES" label="MÊS" type="I" visible="true" useFooter="false">

          </field>

        </metadata>

        <horizontal-axis>

          <category field="MES" rotation="0" dropLabel="false">

            <initView value="first">

            </initView>

            <title>MÊS</title>

          </category>

        </horizontal-axis>

        <series>

          <serie type="column">

            <xField>$MES</xField>

            <yField>$VLRPEDIDOS</yField>

            <display>

              <![CDATA[EVOLUCAO]]>

            </display>

          </serie>

        </series>

      </chart>

    </container>

  </level>

</gadget>

<gadget refresh-time="600000">

  <prompt-parameters>

    <parameter id="Ano" description="Ano" metadata="integer" required="false" keep-last="true" keep-date="false" order="0" label="Ano : Número Inteiro"/>

    <parameter id="codemp" description="Empresa" metadata="entity:Empresa@CODEMP" required="false" keep-last="true" keep-date="false" order="1" label="codemp : Entidade/Tabela"/>

    <parameter id="UFS" description="Filtrar UFs" metadata="multiList:Text" listType="sql" required="true" keep-last="true" keep-date="false" order="2" label="UFS : multiList:Text">

      <expression type="SQL">

        <![CDATA[

        SELECT CODUF AS VALUE, UF AS LABEL FROM TSIUFS ORDER BY UF

      ]]>

      </expression>

    </parameter>

  </prompt-parameters>

  <level id="lvl_ano_v2_fix2" description="Principal">

    <container orientacao="H" tamanhoRelativo="100">

      <container orientacao="V" tamanhoRelativo="25">

        <container orientacao="V" tamanhoRelativo="50">

          <grid id="grd_ano_fix2" useNewGrid="S">

            <expression type="sql" data-source="MGEDS">

              <![CDATA[

SELECT

    SUM(X.VLRPED) AS VLRPEDIDOS,

    -- Cálculo % Valor (Dinâmico: Ano vs Ano Anterior)

    ISNULL(ROUND(((SUM(X.VLRPED) / NULLIF(LAG(SUM(X.VLRPED)) OVER (ORDER BY YEAR(CAB.DTMOV)), 0)) * 100) - 100, 2), 0) AS PORCENTAGEM,



    YEAR(CAB.DTMOV) AS ANO,



    COUNT(CAB.NUNOTA) AS QTDPED,

    -- Cálculo % Quantidade (Dinâmico e direto no SQL)

    ISNULL(ROUND(((CAST(COUNT(CAB.NUNOTA) AS FLOAT) / NULLIF(LAG(COUNT(CAB.NUNOTA)) OVER (ORDER BY YEAR(CAB.DTMOV)), 0)) * 100) - 100, 2), 0) AS PERQTD

FROM TGFCAB CAB

LEFT JOIN VIEW_TABX X ON X.NUNOTA = CAB.NUNOTA

JOIN TGFPAR P ON CAB.CODPARC = P.CODPARC

JOIN TSICID CID ON P.CODCID = CID.CODCID

JOIN TSIUFS UF ON CID.UF = UF.CODUF

WHERE CAB.CODTIPOPER IN (3100, 888)

-- Sem filtro de mês/dia, pois queremos o ANO todo

AND ((YEAR(CAB.DTMOV) >= :Ano) OR (:Ano IS NULL))

AND ((CAB.CODEMP = :codemp) OR (:codemp IS NULL))

AND UF.CODUF IN :UFS

GROUP BY YEAR(CAB.DTMOV)

ORDER BY YEAR(CAB.DTMOV) DESC

              ]]>

            </expression>

            <metadata>

              <field name="VLRPEDIDOS" label="Vendas" type="F" visible="true" useFooter="false" mask="R$ #.##0,00">

              </field>

              <field name="PORCENTAGEM" label="% Vend" type="F" visible="true" useFooter="false" mask="#.##0,00 %">

              </field>

              <field name="ANO" label="Ano" type="I" visible="true" useFooter="false">

              </field>

              <field name="QTDPED" label="Pedidos" type="I" visible="true" useFooter="false">

              </field>

              <field name="PERQTD" label="% Qtd" type="F" visible="true" useFooter="false" mask="#.##0,00 %">

              </field>

            </metadata>

          </grid>

        </container>

      </container>

    </container>

  </level>

  <level id="lvl_ano_chart_fix2" description="MES CHART">

    <args >

      <arg id="ANO" type="integer"/>

    </args>

    <container orientacao="V" tamanhoRelativo="100">

      <chart id="cht_ano_fix2" type="column" nroColuna="6">

        <title>

          <![CDATA[MÊS]]>

        </title>

        <expression type="sql" data-source="MGEDS">

          <![CDATA[SELECT

    SUM(CAB.VLRNOTA) AS VLRPEDIDOS,

    MONTH(CAB.DTNEG) AS MES

FROM TGFCAB CAB

JOIN TGFPAR P ON CAB.CODPARC = P.CODPARC

JOIN TSICID CID ON P.CODCID = CID.CODCID

JOIN TSIUFS UF ON CID.UF = UF.CODUF

WHERE CAB.CODTIPOPER = 3103

AND YEAR(CAB.DTNEG) = :ANO

AND UF.CODUF IN :UFS

GROUP BY MONTH(CAB.DTNEG)

ORDER BY MES]]>

        </expression>

        <metadata>

          <field name="VLRPEDIDOS" label="VLRPEDIDOS" type="I" visible="true" useFooter="false" mask="R$ #.##0,00">

          </field>

          <field name="MES" label="MÊS" type="I" visible="true" useFooter="false">

          </field>

        </metadata>

        <horizontal-axis>

          <category field="MES" rotation="0" dropLabel="false">

            <initView value="first">

            </initView>

            <title>MÊS</title>

          </category>

        </horizontal-axis>

        <series>

          <serie type="column">

            <xField>$MES</xField>

            <yField>$VLRPEDIDOS</yField>

            <display>

              <![CDATA[EVOLUCAO]]>

            </display>

          </serie>

        </series>

      </chart>

    </container>

  </level>

</gadget>

<gadget  refresh-time="600000">

  <prompt-parameters>

    <parameter  id="Mes" description="Filtro Mês" metadata="multiList:Text" listType="sql" required="true" keep-last="true" keep-date="false" order="0" label="Mes : multiList:Text">

      <expression type="SQL">

        <![CDATA[



SELECT 1 AS VALUE, 'JANEIRO' AS LABEL UNION ALL

SELECT 2 AS VALUE, 'FEVEREIRO' AS LABEL UNION ALL

SELECT 3 AS VALUE, 'MARÇO' AS LABEL UNION ALL

SELECT 4 AS VALUE, 'ABRIL' AS LABEL UNION ALL

SELECT 5 AS VALUE, 'MAIO' AS LABEL UNION ALL

SELECT 6 AS VALUE, 'JUNHO' AS LABEL UNION ALL

SELECT 7 AS VALUE, 'JULHO' AS LABEL UNION ALL

SELECT 8 AS VALUE, 'AGOSTO' AS LABEL UNION ALL

SELECT 9 AS VALUE, 'SETEMBRO' AS LABEL UNION ALL

SELECT 10 AS VALUE, 'OUTUBRO' AS LABEL UNION ALL

SELECT 11 AS VALUE, 'NOVEMBRO' AS LABEL UNION ALL

SELECT 12 AS VALUE, 'DEZEMBRO' AS LABEL

      ]]>

      </expression>

      <default-values type="SQL">

SELECT 1 AS VALUE UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL

SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL

SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL

SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12

    </default-values>

    </parameter>

    <parameter  id="Dtini19" description="Dtini19" metadata="date" required="false" keep-last="true" keep-date="false" order="2" label="Dtini19 : Data"/>

    <parameter  id="Dtfin19" description="Dtfin19" metadata="date" required="false" keep-last="true" keep-date="false" order="3" label="Dtfin19 : Data"/>

    <parameter  id="Dtini20" description="Dtini20" metadata="date" required="false" keep-last="true" keep-date="false" order="4" label="Dtini20 : Data"/>

    <parameter  id="Dtfin20" description="Dtfin20" metadata="date" required="false" keep-last="true" keep-date="false" order="5" label="Dtfin20 : Data"/>

    <parameter  id="ordenacao" description="ordenacao" metadata="text" required="true" order="6" keep-last="true" label="ordenacao : Texto"/>

    <parameter  id="codemp" description="Empresa" metadata="entity:Empresa@CODEMP" required="false" keep-last="true" keep-date="false" order="7" label="codemp : Entidade/Tabela"/>

    <parameter  id="Ano1" description="Ano1" metadata="integer" required="true" keep-last="true" keep-date="false" range-end="2099" range-ini="1990" order="8" label="Ano1 : Número Inteiro"/>

    <parameter  id="Ano2" description="Ano2" metadata="integer" required="true" keep-last="true" keep-date="false" range-end="2090" range-ini="1990" order="9" label="Ano2 : Número Inteiro"/>

    <parameter  id="UFS" description="Filtrar UFs" metadata="multiList:Text" listType="sql" required="true" keep-last="true" keep-date="false" order="10" label="UFS : multiList:Text">

      <expression type="SQL">

        <![CDATA[



        SELECT CODUF AS VALUE, UF AS LABEL FROM TSIUFS ORDER BY UF



      ]]>

      </expression>

    </parameter>

  </prompt-parameters>

  <level id="lvl_uf_v2_fix2" description="Principal">

    <container orientacao="V" tamanhoRelativo="100">

      <grid id="grd_uf_fix2" multiplaSelecao="S" useNewGrid="S">

        <expression type="sql" data-source="MGEDS">

          <![CDATA[WITH Vendas2019 AS (

    SELECT

        UF.CODUF,

        SUM(X.VLRPED) AS TotalVendas2019,

        COUNT(CB.NUNOTA) AS TotalPedidos2019

    FROM TGFCAB CB

    LEFT JOIN VIEW_TABX X ON X.NUNOTA = CB.NUNOTA

    JOIN TGFPAR PA ON PA.CODPARC = CB.CODPARC

    JOIN TSICID CD ON CD.CODCID = PA.CODCID

    JOIN TSIUFS UF ON UF.CODUF = CD.UF

    WHERE CB.CODTIPOPER IN (3100, 888)

    AND YEAR(CB.DTMOV) = :Ano1

    AND ((CB.DTMOV >= :Dtini19) OR (:Dtini19 IS NULL))

    AND ((CB.DTMOV <= :Dtfin19) OR (:Dtfin19 IS NULL))

    AND ((CB.CODEMP = :codemp) OR (:codemp IS NULL))

    AND MONTH(CB.DTMOV) in :Mes

    AND UF.CODUF IN :UFS

    GROUP BY UF.CODUF

),

Vendas2020 AS (

    SELECT

        UF.CODUF,

        SUM(X.VLRPED) AS TotalVendas2020,

        COUNT(CB.NUNOTA) AS TotalPedidos2020

    FROM TGFCAB CB

    LEFT JOIN VIEW_TABX X ON X.NUNOTA = CB.NUNOTA

    JOIN TGFPAR PA ON PA.CODPARC = CB.CODPARC

    JOIN TSICID CD ON CD.CODCID = PA.CODCID

    JOIN TSIUFS UF ON UF.CODUF = CD.UF

    WHERE CB.CODTIPOPER IN (3100, 888)

    AND YEAR(CB.DTMOV) = :Ano2

    AND ((CB.DTMOV >= :Dtini20) OR (:Dtini20 IS NULL))

    AND ((CB.DTMOV <= :Dtfin20) OR (:Dtfin20 IS NULL))

    AND ((CB.CODEMP = :codemp) OR (:codemp IS NULL))

    AND MONTH(CB.DTMOV) in :Mes

    AND UF.CODUF IN :UFS

    GROUP BY UF.CODUF

),

Ordenacao AS (

    SELECT

        UF.CODUF,

        SUM(X.VLRPED) AS TotalOrdenacao

    FROM TGFCAB CB

    LEFT JOIN VIEW_TABX X ON X.NUNOTA = CB.NUNOTA

    JOIN TGFPAR PA ON PA.CODPARC = CB.CODPARC

    JOIN TSICID CD ON CD.CODCID = PA.CODCID

    JOIN TSIUFS UF ON UF.CODUF = CD.UF

    WHERE CB.CODTIPOPER IN (3100, 888)

    AND ((YEAR(CB.DTMOV) = :ordenacao) OR (:ordenacao IS NULL))

    AND ((CB.DTMOV >= :Dtini20) OR (:Dtini20 IS NULL))

    AND ((CB.DTMOV <= :Dtfin20) OR (:Dtfin20 IS NULL))

    AND ((CB.CODEMP = :codemp) OR (:codemp IS NULL))

    AND MONTH(CB.DTMOV) in :Mes

    AND UF.CODUF IN :UFS

    GROUP BY UF.CODUF

)

SELECT

    UFS.UF,

    ROW_NUMBER() OVER (ORDER BY

        CASE

            WHEN :ordenacao = '2024' THEN ISNULL(Ordenacao.TotalOrdenacao, 0)

            ELSE ISNULL(Vendas2020.TotalVendas2020, 0)

        END DESC

    ) AS RANKING,

    ISNULL(Vendas2019.TotalVendas2019, 0) AS VLRPEDIDO_2019,

    ISNULL(Vendas2019.TotalPedidos2019, 0) AS QTDPEDIDO_2019,

    ISNULL(Vendas2020.TotalVendas2020, 0) AS VLRPEDIDO_2020,

    ISNULL(Vendas2020.TotalPedidos2020, 0) AS QTDPEDIDO_2020,

    CASE

        WHEN :ordenacao = '2024' THEN ISNULL(Ordenacao.TotalOrdenacao, 0)

        ELSE ISNULL(Vendas2019.TotalVendas2019, 0)

    END AS ORDENACAO

FROM TSIUFS UFS

LEFT JOIN Vendas2019 ON Vendas2019.CODUF = UFS.CODUF

LEFT JOIN Vendas2020 ON Vendas2020.CODUF = UFS.CODUF

LEFT JOIN Ordenacao ON Ordenacao.CODUF = UFS.CODUF

WHERE (Vendas2019.CODUF IS NOT NULL OR Vendas2020.CODUF IS NOT NULL)

ORDER BY RANKING]]>

        </expression>

        <metadata>

          <field name="UF" label="UF" type="S" visible="true" useFooter="false">

          </field>

          <field name="RANKING" label="RK" type="I" visible="true" useFooter="false">

          </field>

          <field name="VLRPEDIDO_2019" label="Vend. 2025" type="I" visible="true" useFooter="SUM" mask="R$ #.##0,00">

          </field>

          <field name="QTDPEDIDO_2019" label="Ped. 2025" type="I" visible="true" useFooter="SUM" mask="###0">

          </field>

          <field name="VLRPEDIDO_2020" label="Vend. 2026" type="I" visible="true" useFooter="SUM" mask="R$ #.##0,00">

          </field>

          <field name="QTDPEDIDO_2020" label="Ped. 2026" type="I" visible="true" useFooter="SUM" mask="###0">

          </field>

          <field name="ORDENACAO" label="ORDENACAO" type="I" visible="false" useFooter="false">

          </field>

          <field name="PERVEN" label="% Vend" type="F" visible="true" useFooter="PER" mask="#.##0,00 %">

            <aggregates per="PER">

              <text>

                <![CDATA[:]]>

              </text>

              <personalized>

                <![CDATA[((SUM($VLRPEDIDO_2020) / SUM($VLRPEDIDO_2019) *100) -100)]]>

              </personalized>

            </aggregates>

            <calculated>

              <formula>

                <![CDATA[



                (($VLRPEDIDO_2020/ $VLRPEDIDO_2019  *100) -100)



              ]]>

              </formula>

            </calculated>

          </field>

          <field name="PERQTD" label="% Ped." type="F" visible="true" useFooter="PER" mask="#.##0,00 %">

            <aggregates per="PER">

              <text>

                <![CDATA[:]]>

              </text>

              <personalized>

                <![CDATA[((SUM($QTDPEDIDO_2020) / SUM($QTDPEDIDO_2019) * 100) -100)]]>

              </personalized>

            </aggregates>

            <calculated>

              <formula>

                <![CDATA[



                (($QTDPEDIDO_2020 / $QTDPEDIDO_2019  *100) -100)



              ]]>

              </formula>

            </calculated>

          </field>

        </metadata>

      </grid>

    </container>

  </level>

</gadget>

<gadget  refresh-time="600000">

  <prompt-parameters>

    <parameter  id="Mes" description="Filtro Mês" metadata="multiList:Text" listType="sql" required="true" keep-last="true" keep-date="false" order="0" label="Mes : multiList:Text">

      <expression type="SQL">

        <![CDATA[



SELECT 1 AS VALUE, 'JANEIRO' AS LABEL UNION ALL

SELECT 2 AS VALUE, 'FEVEREIRO' AS LABEL UNION ALL

SELECT 3 AS VALUE, 'MARÇO' AS LABEL UNION ALL

SELECT 4 AS VALUE, 'ABRIL' AS LABEL UNION ALL

SELECT 5 AS VALUE, 'MAIO' AS LABEL UNION ALL

SELECT 6 AS VALUE, 'JUNHO' AS LABEL UNION ALL

SELECT 7 AS VALUE, 'JULHO' AS LABEL UNION ALL

SELECT 8 AS VALUE, 'AGOSTO' AS LABEL UNION ALL

SELECT 9 AS VALUE, 'SETEMBRO' AS LABEL UNION ALL

SELECT 10 AS VALUE, 'OUTUBRO' AS LABEL UNION ALL

SELECT 11 AS VALUE, 'NOVEMBRO' AS LABEL UNION ALL

SELECT 12 AS VALUE, 'DEZEMBRO' AS LABEL

      ]]>

      </expression>

      <default-values type="SQL">

SELECT 1 AS VALUE UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL

SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL

SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL

SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12

    </default-values>

    </parameter>

    <parameter  id="Dtini19" description="Dtini19" metadata="date" required="false" keep-last="true" keep-date="false" order="1" label="Dtini19 : Data"/>

    <parameter  id="Dtfin19" description="Dtfin19" metadata="date" required="false" keep-last="true" keep-date="false" order="2" label="Dtfin19 : Data"/>

    <parameter  id="Dtini20" description="Dtini20" metadata="date" required="false" keep-last="true" keep-date="false" order="3" label="Dtini20 : Data"/>

    <parameter  id="Dtfin20" description="Dtfin20" metadata="date" required="false" keep-last="true" keep-date="false" order="4" label="Dtfin20 : Data"/>

    <parameter  id="codemp" description="Empresa" metadata="entity:Empresa@CODEMP" required="false" keep-last="true" keep-date="false" order="5" label="codemp : Entidade/Tabela"/>

    <parameter  id="Ano1" description="Ano1" metadata="integer" required="true" order="6" keep-last="true" label="Ano1 : Número Inteiro"/>

    <parameter  id="Ano2" description="Ano2" metadata="integer" required="true" order="7" keep-last="true" label="Ano2 : Número Inteiro"/>

    <parameter  id="ordenacao" description="ordenacao" metadata="text" required="true" order="8" keep-last="true" label="ordenacao : Texto"/>

    <parameter  id="UFS" description="Filtrar UFs" metadata="multiList:Text" listType="sql" required="true" keep-last="true" keep-date="false" order="9" label="UFS : multiList:Text">

      <expression type="SQL">

        <![CDATA[



        SELECT CODUF AS VALUE, UF AS LABEL FROM TSIUFS ORDER BY UF



      ]]>

      </expression>

    </parameter>

  </prompt-parameters>

  <level id="lvl_rep_v2_final_v2" description="Principal">

    <container orientacao="H" tamanhoRelativo="100">

      <container orientacao="V" tamanhoRelativo="25">

        <container orientacao="V" tamanhoRelativo="50">

          <grid id="grd_rep_final_v2" multiplaSelecao="S" useNewGrid="S">

            <expression type="sql" data-source="MGEDS">

              <![CDATA[WITH VendasAno1 AS (

    SELECT

        CB.CODVEND,

        SUM(X.VLRPED) AS TotalVendasAno1,

        COUNT(CB.NUNOTA) AS TotalPedidosAno1

    FROM TGFCAB CB

    LEFT JOIN VIEW_TABX X ON X.NUNOTA = CB.NUNOTA

    JOIN TGFPAR PA ON PA.CODPARC = CB.CODPARC

    JOIN TSICID CD ON CD.CODCID = PA.CODCID

    JOIN TSIUFS UF ON UF.CODUF = CD.UF

    WHERE CB.CODTIPOPER IN (3100, 888)

    AND YEAR(CB.DTMOV) = :Ano1

    AND ((CB.DTMOV >= :Dtini19) OR (:Dtini19 IS NULL))

    AND ((CB.DTMOV <= :Dtfin19) OR (:Dtfin19 IS NULL))

    AND ((CB.CODEMP = :codemp) OR (:codemp IS NULL))

    AND MONTH(CB.DTMOV) in :Mes

    AND UF.CODUF IN :UFS

    GROUP BY CB.CODVEND

),

VendasAno2 AS (

    SELECT

        CB.CODVEND,

        SUM(X.VLRPED) AS TotalVendasAno2,

        COUNT(CB.NUNOTA) AS TotalPedidosAno2

    FROM TGFCAB CB

    LEFT JOIN VIEW_TABX X ON X.NUNOTA = CB.NUNOTA

    JOIN TGFPAR PA ON PA.CODPARC = CB.CODPARC

    JOIN TSICID CD ON CD.CODCID = PA.CODCID

    JOIN TSIUFS UF ON UF.CODUF = CD.UF

    WHERE CB.CODTIPOPER IN (3100, 888)

    AND YEAR(CB.DTMOV) = :Ano2

    AND ((CB.DTMOV >= :Dtini20) OR (:Dtini20 IS NULL))

    AND ((CB.DTMOV <= :Dtfin20) OR (:Dtfin20 IS NULL))

    AND ((CB.CODEMP = :codemp) OR (:codemp IS NULL))

    AND MONTH(CB.DTMOV) in :Mes

    AND UF.CODUF IN :UFS

    GROUP BY CB.CODVEND

),

Ordenacao AS (

    SELECT

        CB.CODVEND,

        SUM(X.VLRPED) AS TotalOrdenacao

    FROM TGFCAB CB

    LEFT JOIN VIEW_TABX X ON X.NUNOTA = CB.NUNOTA

    JOIN TGFPAR PA ON PA.CODPARC = CB.CODPARC

    JOIN TSICID CD ON CD.CODCID = PA.CODCID

    JOIN TSIUFS UF ON UF.CODUF = CD.UF

    WHERE CB.CODTIPOPER IN (3100, 888)

    AND ((YEAR(CB.DTMOV) = CAST(:ordenacao AS INT)) OR (:ordenacao IS NULL))

    AND ((CB.DTMOV >= :Dtini19) OR (:Dtini19 IS NULL))

    AND ((CB.DTMOV <= :Dtfin19) OR (:Dtfin19 IS NULL))

    AND ((CB.CODEMP = :codemp) OR (:codemp IS NULL))

    AND MONTH(CB.DTMOV) in :Mes

    AND UF.CODUF IN :UFS

    GROUP BY CB.CODVEND

)

SELECT

    VEN.CODVEND,

    ROW_NUMBER() OVER (ORDER BY

        CASE WHEN CAST(:ordenacao AS VARCHAR) = CAST(:Ano1 AS VARCHAR) THEN ISNULL(Ordenacao.TotalOrdenacao, 0)

        ELSE ISNULL(VendasAno2.TotalVendasAno2, 0)

        END DESC

    ) AS RANKING,

    RTRIM(VEN.APELIDO) AS APELIDO,

    ISNULL(VendasAno1.TotalVendasAno1, 0) AS VLRPEDIDO_2019,

    ISNULL(VendasAno1.TotalPedidosAno1, 0) AS QTDPEDIDO_2019,

    ISNULL(VendasAno2.TotalVendasAno2, 0) AS VLRPEDIDO_2020,

    ISNULL(VendasAno2.TotalPedidosAno2, 0) AS QTDPEDIDO_2020,

    CASE

        WHEN CAST(:ordenacao AS VARCHAR) = CAST(:Ano1 AS VARCHAR) THEN ISNULL(Ordenacao.TotalOrdenacao, 0)

        ELSE ISNULL(VendasAno2.TotalVendasAno2, 0)

    END AS ORDENACAO,

    ISNULL(ROUND((((ISNULL(VendasAno2.TotalVendasAno2, 0) / NULLIF(ISNULL(VendasAno1.TotalVendasAno1, 0), 0)) * 100) - 100), 2), 0) AS PERVEN,

    ISNULL(ROUND((((CAST(ISNULL(VendasAno2.TotalPedidosAno2, 0) AS FLOAT) / NULLIF(ISNULL(VendasAno1.TotalPedidosAno1, 0), 0)) * 100) - 100), 2), 0) AS PERQTD

FROM TGFVEN VEN

LEFT JOIN VendasAno1 ON VEN.CODVEND = VendasAno1.CODVEND

LEFT JOIN VendasAno2 ON VEN.CODVEND = VendasAno2.CODVEND

LEFT JOIN Ordenacao ON VEN.CODVEND = Ordenacao.CODVEND

WHERE ISNULL(VendasAno1.TotalVendasAno1, 0) + ISNULL(VendasAno2.TotalVendasAno2, 0) > 0

ORDER BY ORDENACAO DESC]]>

            </expression>

            <metadata>

              <field name="CODVEND" label="Cód" type="I" visible="false" useFooter="false">

              </field>

              <field name="RANKING" label="RK" type="I" visible="true" useFooter="false">

              </field>

              <field name="APELIDO" label="Representante" type="S" visible="true" useFooter="false">

              </field>

              <field name="VLRPEDIDO_2019" label="Vend. 2025" type="I" visible="true" useFooter="SUM" mask="R$ #.##0,00">

              </field>

              <field name="QTDPEDIDO_2019" label="Ped. 2025" type="I" visible="true" useFooter="SUM">

              </field>

              <field name="VLRPEDIDO_2020" label="Vend. 2026" type="I" visible="true" useFooter="SUM" mask="R$ #.##0,00">

              </field>

              <field name="QTDPEDIDO_2020" label="Ped. 2026" type="I" visible="true" useFooter="SUM">

              </field>

              <field name="ORDENACAO" label="ORDENACAO" type="I" visible="false" useFooter="false">

              </field>

              <field name="PERVEN" label="% Vend." type="F" visible="true" useFooter="PER" mask="#.##0,00 %">

                <aggregates per="PER">

                  <text>

                    <![CDATA[:]]>

                  </text>

                  <personalized>

                    <![CDATA[((SUM($VLRPEDIDO_2020) / SUM($VLRPEDIDO_2019) *100) -100)]]>

                  </personalized>

                </aggregates>

              </field>

              <field name="PERQTD" label="% Ped." type="F" visible="true" useFooter="PER" mask="#.##0,00 %">

                <aggregates per="PER">

                  <text>

                    <![CDATA[:]]>

                  </text>

                  <personalized>

                    <![CDATA[((SUM($QTDPEDIDO_2020) / SUM($QTDPEDIDO_2019) * 100) -100)]]>

                  </personalized>

                </aggregates>

              </field>

            </metadata>

          </grid>

        </container>

      </container>

    </container>

  </level>

</gadget>

<gadget  refresh-time="600000">

  <prompt-parameters>

    <parameter  id="Mes" description="Mês" metadata="multiList:Text" listType="sql" required="true" keep-last="true" keep-date="false" order="0" label="Mes : multiList:Text">

      <expression type="SQL">

        <![CDATA[





SELECT 1 AS VALUE, 'JANEIRO' AS LABEL UNION ALL

SELECT 2 AS VALUE, 'FEVEREIRO' AS LABEL UNION ALL

SELECT 3 AS VALUE, 'MARÇO' AS LABEL UNION ALL

SELECT 4 AS VALUE, 'ABRIL' AS LABEL UNION ALL

SELECT 5 AS VALUE, 'MAIO' AS LABEL UNION ALL

SELECT 6 AS VALUE, 'JUNHO' AS LABEL UNION ALL

SELECT 7 AS VALUE, 'JULHO' AS LABEL UNION ALL

SELECT 8 AS VALUE, 'AGOSTO' AS LABEL UNION ALL

SELECT 9 AS VALUE, 'SETEMBRO' AS LABEL UNION ALL

SELECT 10 AS VALUE, 'OUTUBRO' AS LABEL UNION ALL

SELECT 11 AS VALUE, 'NOVEMBRO' AS LABEL UNION ALL

SELECT 12 AS VALUE, 'DEZEMBRO' AS LABEL

      ]]>

      </expression>

      <default-values type="SQL">SELECT 1 AS VALUE UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL

SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL

SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL

SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12</default-values>

    </parameter>

    <parameter  id="Dtini19" description="Dtini19" metadata="date" required="false" keep-last="true" keep-date="false" order="1" label="Dtini19 : Data"/>

    <parameter  id="Dtfin19" description="Dtfin19" metadata="date" required="false" keep-last="true" keep-date="false" order="2" label="Dtfin19 : Data"/>

    <parameter  id="Dtini20" description="Dtini20" metadata="date" required="false" keep-last="true" keep-date="false" order="3" label="Dtini20 : Data"/>

    <parameter  id="Dtfin20" description="Dtfin20" metadata="date" required="false" keep-last="true" keep-date="false" order="4" label="Dtfin20 : Data"/>

    <parameter  id="codemp" description="Empresa" metadata="entity:Empresa@CODEMP" required="false" keep-last="true" keep-date="false" order="5" label="codemp : Entidade/Tabela"/>

    <parameter  id="Ano1" description="Ano1" metadata="integer" required="true" order="6" keep-last="true" label="Ano1 : Número Inteiro"/>

    <parameter  id="Ano2" description="Ano2" metadata="integer" required="true" order="7" keep-last="true" label="Ano2 : Número Inteiro"/>

    <parameter  id="UFS" description="Filtrar UFs" metadata="multiList:Text" listType="sql" required="true" keep-last="true" keep-date="false" order="8" label="UFS : multiList:Text">

      <expression type="SQL">

        <![CDATA[





        SELECT CODUF AS VALUE, UF AS LABEL FROM TSIUFS ORDER BY UF





      ]]>

      </expression>

    </parameter>

  </prompt-parameters>

  <level id="lvl_mensal_v3_final" description="Principal">

    <container orientacao="H" tamanhoRelativo="100">

      <container orientacao="V" tamanhoRelativo="25">

        <container orientacao="V" tamanhoRelativo="50">

          <grid id="grd_mensal_v3_final" useNewGrid="S">

            <expression type="sql" data-source="MGEDS">

              <![CDATA[WITH

MeusMeses AS (

    SELECT 1 AS Mes UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL

    SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL

    SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL

    SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12

),

Vendas2019 AS (

    SELECT

        MONTH(CB.DTMOV) AS Mes,

        SUM(X.VLRPED) AS TotalVendas2019,

        COUNT(CB.NUNOTA) AS TotalPedidos2019

    FROM TGFCAB CB

    LEFT JOIN VIEW_TABX X ON X.NUNOTA = CB.NUNOTA

    JOIN TGFPAR PA ON PA.CODPARC = CB.CODPARC

    JOIN TSICID CD ON CD.CODCID = PA.CODCID

    JOIN TSIUFS UF ON UF.CODUF = CD.UF

    WHERE CB.CODTIPOPER IN (3100, 888)

    AND ((CB.DTMOV >= :Dtini19) OR (:Dtini19 IS NULL))

    AND ((CB.DTMOV <= :Dtfin19) OR (:Dtfin19 IS NULL))

    AND ((CB.CODEMP = :codemp) OR (:codemp IS NULL))

    AND YEAR(CB.DTMOV) = :Ano1

    AND MONTH(CB.DTMOV) IN :Mes

    AND UF.CODUF IN :UFS

    GROUP BY MONTH(CB.DTMOV)

),

Vendas2020 AS (

    SELECT

        MONTH(CB.DTMOV) AS Mes,

        SUM(X.VLRPED) AS TotalVendas2020,

        COUNT(CB.NUNOTA) AS TotalPedidos2020

    FROM TGFCAB CB

    LEFT JOIN VIEW_TABX X ON X.NUNOTA = CB.NUNOTA

    JOIN TGFPAR PA ON PA.CODPARC = CB.CODPARC

    JOIN TSICID CD ON CD.CODCID = PA.CODCID

    JOIN TSIUFS UF ON UF.CODUF = CD.UF

    WHERE CB.CODTIPOPER IN (3100, 888)

    AND ((CB.DTMOV >= :Dtini20) OR (:Dtini20 IS NULL))

    AND ((CB.DTMOV <= :Dtfin20) OR (:Dtfin20 IS NULL))

    AND ((CB.CODEMP = :codemp) OR (:codemp IS NULL))

    AND YEAR(CB.DTMOV) = :Ano2

    AND MONTH(CB.DTMOV) IN :Mes

    AND UF.CODUF IN :UFS

    GROUP BY MONTH(CB.DTMOV)

)

SELECT

    CASE

        WHEN M.Mes = 1 THEN 'JANEIRO'

        WHEN M.Mes = 2 THEN 'FEVEREIRO'

        WHEN M.Mes = 3 THEN 'MARÇO'

        WHEN M.Mes = 4 THEN 'ABRIL'

        WHEN M.Mes = 5 THEN 'MAIO'

        WHEN M.Mes = 6 THEN 'JUNHO'

        WHEN M.Mes = 7 THEN 'JULHO'

        WHEN M.Mes = 8 THEN 'AGOSTO'

        WHEN M.Mes = 9 THEN 'SETEMBRO'

        WHEN M.Mes = 10 THEN 'OUTUBRO'

        WHEN M.Mes = 11 THEN 'NOVEMBRO'

        WHEN M.Mes = 12 THEN 'DEZEMBRO'

        ELSE '' END AS MES,

    ISNULL(V19.TotalVendas2019, 0) AS VLRPEDIDO_2019,

    ISNULL(V19.TotalPedidos2019, 0) AS QTDPEDIDO_2019,

    ISNULL(V20.TotalVendas2020, 0) AS VLRPEDIDO_2020,

    ISNULL(V20.TotalPedidos2020, 0) AS QTDPEDIDO_2020

FROM MeusMeses M

LEFT JOIN Vendas2019 V19 ON M.Mes = V19.Mes

LEFT JOIN Vendas2020 V20 ON M.Mes = V20.Mes

WHERE M.Mes IN :Mes

ORDER BY M.Mes]]>

            </expression>

            <metadata>

              <field name="MES" label="Mês" type="S" visible="true" useFooter="false">

              </field>

              <field name="VLRPEDIDO_2019" label="Vend. 2025" type="I" visible="true" useFooter="SUM" mask="R$ #.##0,00">

              </field>

              <field name="QTDPEDIDO_2019" label="Ped. 2025" type="I" visible="true" useFooter="SUM">

              </field>

              <field name="VLRPEDIDO_2020" label="Vend. 2026" type="I" visible="true" useFooter="SUM" mask="R$ #.##0,00">

              </field>

              <field name="QTDPEDIDO_2020" label="Ped. 2026" type="I" visible="true" useFooter="SUM">

              </field>

              <field name="PERVLR" label="% Vend." type="F" visible="true" useFooter="PER" mask="#.##0,00 %">

                <aggregates per="PER">

                  <text>

                    <![CDATA[:]]>

                  </text>

                  <personalized>

                    <![CDATA[((SUM($VLRPEDIDO_2020) / SUM($VLRPEDIDO_2019) *100) -100)]]>

                  </personalized>

                </aggregates>

                <calculated>

                  <formula>

                    <![CDATA[





                        (($VLRPEDIDO_2020 / $VLRPEDIDO_2019  *100) -100)





                  ]]>

                  </formula>

                </calculated>

              </field>

              <field name="PERQTD" label="% Ped." type="F" visible="true" useFooter="PER" mask="#.##0,00 %">

                <aggregates per="PER">

                  <text>

                    <![CDATA[:]]>

                  </text>

                  <personalized>

                    <![CDATA[((SUM($QTDPEDIDO_2020) / SUM($QTDPEDIDO_2019) * 100) -100)]]>

                  </personalized>

                </aggregates>

                <calculated>

                  <formula>

                    <![CDATA[





                        (($QTDPEDIDO_2020 / $QTDPEDIDO_2019  *100) -100)





                  ]]>

                  </formula>

                </calculated>

              </field>

            </metadata>

          </grid>

        </container>

      </container>

    </container>

  </level>

  <level id="lvl_chart_final_v3" description="MES CHART">

    <args >

      <arg id="ANO" type="integer"/>

    </args>

    <container orientacao="V" tamanhoRelativo="100">

      <chart id="cht_chart_final_v3" type="column" nroColuna="6">

        <title>

          <![CDATA[MÊS]]>

        </title>

        <expression type="sql" data-source="MGEDS">

          <![CDATA[SELECT

    SUM(CAB.VLRNOTA) AS VLRPEDIDOS,

    MONTH(CAB.DTNEG) AS MES

FROM TGFCAB CAB

JOIN TGFPAR P ON CAB.CODPARC = P.CODPARC

JOIN TSICID CID ON P.CODCID = CID.CODCID

JOIN TSIUFS UF ON CID.UF = UF.CODUF

WHERE CAB.CODTIPOPER = 3103

AND YEAR(CAB.DTNEG) = :ANO

AND UF.CODUF IN :UFS

GROUP BY MONTH(CAB.DTNEG)

ORDER BY MES]]>

        </expression>

        <metadata>

          <field name="VLRPEDIDOS" label="VLRPEDIDOS" type="I" visible="true" useFooter="false" mask="R$ #.##0,00">

          </field>

          <field name="MES" label="MÊS" type="I" visible="true" useFooter="false">

          </field>

        </metadata>

        <horizontal-axis>

          <category field="MES" rotation="0" dropLabel="false">

            <initView value="first">

            </initView>

            <title>MÊS</title>

          </category>

        </horizontal-axis>

        <series>

          <serie type="column">

            <xField>$MES</xField>

            <yField>$VLRPEDIDOS</yField>

            <display>

              <![CDATA[EVOLUCAO]]>

            </display>

          </serie>

        </series>

      </chart>

    </container>

  </level>

</gadget>
