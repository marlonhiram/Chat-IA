# ALINHAMENTO — Segmento Agro no Prompt da Suh
> Criado em: 19/05/2026  
> Contexto: Revisão do agente Comercial (`lib/agents/comercial.ts`) após identificação de erro técnico nas gramaturas durante teste com usuária Daiane/MT.

---

## 1. Problema Identificado

Durante teste da Suh, a assistente respondeu que gramaturas entre **71g e 150g/m²** são indicadas para proteção de plantações. Isso está **errado** e pode afastar produtores rurais.

**Tabela correta (referência de mercado):**

| Aplicação | Gramatura indicada |
|---|---|
| Cobertura de canteiros, hortaliças, mudas | 15g – 20g/m² |
| Ensacamento de frutas, proteção de geada | 25g – 40g/m² |
| Sacarias de sementes, telas laterais, mulching | 70g – 150g/m² |

> ⚠️ **Atenção**: confirmar se as gramaturas acima correspondem ao que a DKN **realmente fabrica**. A Suh não pode citar gramaturas que não estão no portfólio.

---

## 2. Questões para Alinhar com o Comercial/Produção

### 2.1 Portfólio real
- [ ] Quais gramaturas a DKN produz para aplicações agrícolas?
- [ ] A DKN tem uma linha com nome oficial para o segmento agro (ex: "TNT Agro")? Ou é o TNT padrão com aditivação Anti-UV?
- [ ] Quais larguras de bobina são disponíveis para agro?

### 2.2 Aplicações mais vendidas
- [ ] Quais são as aplicações agrícolas que mais vendem hoje?
- [ ] Existe alguma aplicação que a DKN **não atende** mas é frequentemente solicitada?

### 2.3 Regiões e representantes
- [ ] Quais estados têm maior demanda no segmento agro? (ex: MT, GO, PR, SP?)
- [ ] Os representantes regionais têm experiência para atender produtores rurais ou esse público vai direto para Andreia?

### 2.4 Aditivação Anti-UV
- [ ] O Anti-UV é um adicional em qualquer gramatura ou só em linhas específicas?
- [ ] Tem custo adicional? A Suh pode mencionar isso ou deve deixar para o representante?

### 2.5 Pedido mínimo
- [ ] O pedido mínimo de R$10.000 se aplica também para clientes agro (pequenos produtores)?
- [ ] Existe alguma política diferente para chácara/pequena propriedade vs. grande produtor?

---

## 3. Melhoria de Condução Identificada

Além do erro técnico, a Suh não conduziu bem a conversa com a Daiane:

- **Problema**: perguntou "tem alguma aplicação específica em mente?" sendo que a Daiane já havia dito que tem uma chácara com plantações.
- **Correto**: perguntar diretamente **"o que você está plantando?"** para qualificar e encaminhar ao representante.

**Fluxo ideal para leads agro:**
1. Identificar nome + estado ✅ (já funcionou com Daiane)
2. Perguntar o que planta / qual cultura
3. Indicar gramatura correta + Anti-UV se estado quente
4. Encaminhar para representante da região com dados coletados

---

## 4. Próximos Passos

- [ ] Levantar respostas das questões da seção 2 com comercial ou produção
- [ ] Atualizar bloco de conhecimento agro no prompt da Suh (`comercial.ts`)
- [ ] Incluir lógica de condução consultiva para leads agro no prompt
- [ ] Re-testar com perguntas do segmento agro nos scripts automatizados
