title: 'Making of: Atrasos em repasses federais em 2015 seguram execução orçamentária de secretarias de SP'
published: True
categories: Gastos Abertos
tags: repasses federais, gastos públicos, orçamento, execução orçamentária, participação, são paulo, secretarias
author: gastos_abertos
cover: img/blog/photo.jpg

## Making of: Atrasos em repasses federais em 2015 seguram execução orçamentária de secretarias de SP
Confira, em detalhes, como a <a href="http://gastosabertos.org/blog/2016/3/9/atrasos_em_repasses_seguram_execucao_orcamentaria_de_secretarias_paulistas/" target="_blank">matéria</a> foi criada e que ferramentas e dados foram utilizados em sua produção

São Paulo - Dezembro/2015

A tabela-base para este tutorial está <a href="https://docs.google.com/spreadsheets/d/1-Dl6bu70ixom2ifSdm4YvK-ghl4GVB50HS6akwRZgs8/edit?usp=sharing" target="_blank">neste link</a>
Para saber mais como funciona a execução do orçamento, acesse <a href="http://www.fazenda.sp.gov.br/download/cge/manual_siafem_integra.pdf" target="_blank">este link</a>

Na primeira história do orçamento, quisemos saber qual era o ritmo de de execução orçamentária das secretarias do município de São Paulo, a fim de reconhecer quais delas estavam aquém em seus investimentos previstos para o ano.

Para isso, foi preciso recorrer aos <a href="http://orcamento.prefeitura.sp.gov.br/orcamento/" target="_blank">dados disponibilizados</a> pela Prefeitura mensalmente detalhando orçamento inicial, orçamento atualizado, montante empenhado e montante liquidado. (Aba 1 da tabela-base)

No entanto, a Prefeitura não calcula o ritmo da execução orçamentária - ou seja, quanto do orçamento foi efetivamente liquidado.

Para se chegar a esse ritmo foram levados em consideração dois parâmetros: o orçamento atualizado para o ano e a liquidação de recursos.

O orçamento para determinado ano é definido com antecipação de vários meses e votado pela Câmara dos Vereadores. Assim, quando esse orçamento passa de fato a valer, alguns ajustes no montante definido são realizados para refletir as necessidades e características de secretarias com o andamento do ano corrente.

Assim, considerou-se o orçamento atualizado como referência para o ritmo de execução. (Aba 2 da tabela-base)

Já o montante liquidado é importante porque trata-se da etapa da execução que reconhece efetivamente a despesa (a segunda parte da execução), diferentemente do montante empenhado, que respeito ao fechamento do contrato e dos valores (a primeira parte da execução). O pagamento, embora seja a parte final da execução, apenas diz respeito à transferência dos recursos já liquidados para a parte contratada. (Abas 1 e 8 da tabela-base)

Logo, o montante liquidado foi utilizado como medição para o ritmo de execução do orçamento. (Aba 2 da tabela-base)

Identificados os parâmetros para se calcular o ritmo de gastos das secretarias, quisemos saber quais foram as secretarias com o menor ritmo e por quê.

Assim, identificamos uma correlação entre baixa execução orçamentária e alta dependência de recursos federais na cidade de São Paulo - sem fazer um julgamento de causa e efeito para isso. Mas, no fim, foi exatamente o que os dados nos mostraram: as duas secretarias com maior dependência de recursos federais foram as que menos executaram seu orçamento em 2015.

Para se chegar ao grau de dependência, fizemos uma conta simples: qual porcentagem do orçamento atualizado de cada secretaria deveria vir da União. (Aba 3 da tabela-base)

Para montar as tabelas utilizamos o <a href="https://www.google.com/sheets/about/" target="_blank">Google Sheets</a>, aplicando recursos de &quot;<a href="https://support.google.com/docs/answer/1272900?hl=pt-BR" target="_blank">Tabela Dinâmica</a>&quot; e fórmulas customizadas.

Para fazer os gráficos, foi utilizado o HighCharts, no qual é possível fazer gráficos interativos com certa variedade de recursos e com facilidade, além de ser gratuito e permitir o download de diversos tipos de arquivos.
