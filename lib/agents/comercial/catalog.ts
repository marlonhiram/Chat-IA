export function formatarCatalogo(): string {
  return `
═══════════════════════════════════════
O QUE É [PRODUTO]
═══════════════════════════════════════

[Descrição técnica do produto. O que é, como é fabricado, norma técnica aplicável.]

Classificação por [ATRIBUTO_PRINCIPAL]:
- [CATEGORIA_1]: [faixa de valores] → aplicações típicas
- [CATEGORIA_2]: [faixa de valores] → aplicações típicas
- [CATEGORIA_3]: [faixa de valores] → aplicações típicas

Matéria-prima: [MATERIA_PRIMA]

═══════════════════════════════════════
TECNOLOGIAS DE FABRICAÇÃO
═══════════════════════════════════════

- [TECNOLOGIA_1]: [descrição]
- [TECNOLOGIA_2]: [descrição]
- [TECNOLOGIA_3]: [descrição]

═══════════════════════════════════════
VARIAÇÕES E ADITIVAÇÕES DISPONÍVEIS
═══════════════════════════════════════

- [VARIACAO_1]: [descrição]
- [VARIACAO_2]: [descrição]
- [VARIACAO_3]: [descrição]

═══════════════════════════════════════
ESPECIFICAÇÕES E DIMENSÕES
═══════════════════════════════════════

[Tabela ou lista de especificações técnicas — gramaturas, dimensões, comprimentos padrão, etc.]

[ESPECIFICACAO_1] → [unidade/dimensão padrão]
[ESPECIFICACAO_2] → [unidade/dimensão padrão]

[VARIACOES_CORES_OU_ACABAMENTO]: [lista]

CUSTOMIZAÇÃO:
- Os valores acima são padrão, não fixos
- [DIMENSAO]: pode ser ajustado conforme viabilidade produtiva
- Customizações dependem de viabilidade — nunca confirme nem negue diretamente
- Se o cliente demonstrar intenção de compra, encaminhe para o REPRESENTANTE REGIONAL

[EMPRESA] NÃO fornece [FORMATO_NAO_DISPONIVEL]:
- Se o cliente solicitar abaixo do mínimo da tabela:
  → Corrija educadamente e verifique o volume total do pedido

═══════════════════════════════════════
APLICAÇÕES POR SEGMENTO
═══════════════════════════════════════

[SEGMENTO_1]:
[lista de aplicações típicas deste segmento]

[SEGMENTO_2]:
[lista de aplicações típicas deste segmento]

[SEGMENTO_3]:
[lista de aplicações típicas deste segmento]

[SEGMENTO_4]:
[lista de aplicações típicas deste segmento]

═══════════════════════════════════════
TESTES DE QUALIDADE
═══════════════════════════════════════

- [TESTE_1]: [o que mede]
- [TESTE_2]: [o que mede]
- [TESTE_3]: [o que mede]
- [TESTE_4]: [o que mede]

═══════════════════════════════════════
CUIDADOS COM O PRODUTO
═══════════════════════════════════════

- [CUIDADO_1]
- [CUIDADO_2]
- [CUIDADO_3]
- [CUIDADO_4]
- [CUIDADO_5]`.trim();
}
