# Descobertas e Restrições (Findings)

## 📌 Contexto Inicial
O usuário reportou limitações ao utilizar a aplicação pelo celular (resolução móvel). Precisamos levantar os pontos problemáticos da interface móvel e documentar restrições técnicas.

## ⚙️ Limitações Identificadas

Durante a auditoria de design responsivo e UX/UI móvel nos arquivos de interface do ApNovo Finance, foram identificadas as seguintes limitações críticas para dispositivos móveis:

### 1. `Dashboard.jsx` (Página Principal)
*   **Problema 1: Conflito de Botões Flutuantes vs. Navegação Inferior (Bottom Nav)**
    *   **Linhas prováveis:** L560-677
    *   **Detalhes:** O botão flutuante de "Comandos Rápidos" e o menu de ações rápidas (`isQuickMenuOpen`) usam `fixed bottom-8 right-8 z-50`. No mobile, há uma barra de navegação inferior fixa em `fixed bottom-0 left-0 w-full z-45` (L469). Isso cria uma sobreposição física direta dos botões, onde o botão flutuante cobre itens de navegação (como a aba de "Ativos" ou "Cartões") ou causa cliques acidentais em celulares de menor resolução ou com teclados virtuais abertos.
    *   **Solução:** Ajustar a posição do botão flutuante em telas móveis utilizando Tailwind responsivo (ex: `bottom-20 md:bottom-12 right-6 md:right-12`) ou integrar a ação à Bottom Navigation.
*   **Problema 2: Modal de Novo Lançamento Cortado verticalmente**
    *   **Linhas prováveis:** L813-920
    *   **Detalhes:** O modal de lançamento de transações é muito alto (contém alternador de tipo, descrição, valor, categoria, seletor de data, switch de pago e botão de submit) e possui classes rígidas que impedem a rolagem (`overflow-hidden`). Em telas baixinhas ou celulares em modo paisagem (landscape), as opções inferiores e o botão de submit ficam inacessíveis por falta de scroll.
    *   **Solução:** Substituir `overflow-hidden` por `max-h-[90vh] overflow-y-auto` no container do modal.

### 2. `CreditCardsTab.jsx` (Componente de Cartões)
*   **Problema 1: Modais Rígidos sem Scroll Vertical**
    *   **Linhas prováveis:** L1018-1114 (Novo Cartão), L1117-1260 (Nova Compra), L1263-1321 (Pagador de Fatura)
    *   **Detalhes:** Os modais de "Adicionar Cartão de Crédito", "Lançar Compra" e "Efetuar Pagamento" utilizam `overflow-hidden` no container principal. O modal de "Nova Compra", em especial, é extremamente longo devido aos campos de parcelamento e compras recorrentes. Ele quebra o layout em telas de aparelhos menores (como iPhone SE ou modo paisagem) e esconde o botão de salvar.
    *   **Solução:** Aplicar `max-h-[90vh] overflow-y-auto` nos containers principais desses modais.
*   **Problema 2: Rolagem Horizontal Áspera na Tabela de Transações**
    *   **Linhas prováveis:** L861-954
    *   **Detalhes:** A tabela de transações da fatura é muito larga (7 colunas). Embora esteja encapsulada em um container com `overflow-x-auto`, no celular o scroll de tabelas nativas sem indicadores visuais de rolagem (shadow guards) ou sem colunas congeladas prejudica a experiência e pode fazer o usuário não perceber que há mais colunas (ex: Saldo Restante e Ações).
    *   **Solução:** Transformar a visualização em cards empilhados verticalmente no mobile (`flex flex-col md:table-row`), semelhante ao histórico do `OverviewTab`, ou adicionar um indicador visual claro de rolagem.

### 3. `InvestmentsTab.jsx` (Componente de Investimentos)
*   **Problema 1: Botão Flutuante de Aporte Sobreposto**
    *   **Linhas prováveis:** L327-333
    *   **Detalhes:** O botão "Novo Aporte" usa `fixed bottom-8 right-8 z-40`, o que entra em conflito e sobrepõe a barra de navegação inferior do mobile (`fixed bottom-0`).
    *   **Solução:** Elevar o botão no mobile (`bottom-24 right-6 md:bottom-12 md:right-12`) ou colocá-lo inline no header do componente.
*   **Problema 2: Áreas de Toque (Touch Targets) Reduzidas nas Ações**
    *   **Linhas prováveis:** L311-318
    *   **Detalhes:** Os botões de editar e apagar ativos na lista possuem padding reduzido (`p-2`) e ícones pequenos (`size={16}`), gerando um tamanho físico de ~32px. Isso descumpre a recomendação de acessibilidade móvel (mínimo de 44x44px), tornando difícil o toque preciso no celular.
    *   **Solução:** Aumentar o padding para `p-3` e os ícones para `size={18}` em telas sensíveis ao toque.
*   **Problema 3: Modal de Aporte sem Scroll Vertical**
    *   **Linhas prováveis:** L336-463
    *   **Detalhes:** O modal de Novo Aporte/Resgate utiliza `overflow-hidden`. Por ser longo e possuir campos de valores e taxas, ele corta em telas menores ou modo paisagem.
    *   **Solução:** Adicionar `max-h-[90vh] overflow-y-auto` ao container interno do modal.

### 4. `OverviewTab.jsx` (Componente de Visão Geral)
*   **Problema 1: Ações de Transação Dependentes de Hover (Invisíveis no Celular)**
    *   **Linhas prováveis:** L298-315
    *   **Detalhes:** As ações rápidas de transações (editar, deletar, checkbox de pago) utilizam `md:opacity-0 group-hover:opacity-100` para efeito de fade. Em telas touch, o hover não funciona, fazendo com que as ações fiquem invisíveis para o usuário móvel, a menos que ele execute toques longos ou interações acidentais.
    *   **Solução:** Forçar a opacidade total em dispositivos touch usando classes responsivas (`opacity-100 md:opacity-0 md:group-hover:opacity-100`).

