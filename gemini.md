# Constituição do Projeto: Google Antigravity Python SDK & ApNovo Finance

## 📋 Esquemas de Dados & Layout Responsivo (Data & UX Schemas)

### z-index & Posições de Componentes Fixos
*   **Bottom Navigation Mobile:** `fixed bottom-0 left-0 w-full h-16 z-40 bg-[#0A0C10]/80 backdrop-blur-md`
*   **Floating Action Button (Console):**
    *   *Mobile:* `fixed bottom-20 right-6 z-50` (para evitar sobreposição física da barra de navegação no rodapé)
    *   *Desktop:* `fixed bottom-12 right-12 z-50`
*   **Modais Globais:** `fixed inset-0 z-50 flex items-center justify-center p-4`

### Modais e Responsividade de Altura
*   Todos os modais do sistema devem possuir scroll interno caso a altura da tela seja insuficiente (iPhone SE, modo paisagem, etc.).
*   *Container padrão do modal:* `max-h-[90vh] overflow-y-auto`
*   Remover classes rígidas de corte (`overflow-hidden`) nos blocos internos que abrigam formulários longos.

### Tabelas Responsivas (Histórico e Faturas)
*   *Mobile (telas < md):* Linhas da tabela devem se comportar como cards flexíveis verticais (`flex flex-col p-4 mb-3 bg-white/2 border border-white/5 rounded-2xl`). Ocultar cabeçalhos de tabela rígidos (`hidden md:table-header-group`).
*   *Desktop (telas >= md):* Renderização em formato tabular tradicional (`md:table-row`, `md:table-cell`).

### Acessibilidade Touch (Touch Targets)
*   Elementos interativos clicáveis devem possuir dimensões físicas mínimas de **44x44 pixels** (Tailwind `p-3`, `h-11`, `w-11` ou `gap-3`).
*   Ações rápidas não devem depender de hover (`:hover`) em dispositivos touch. Utilizar opacidade explícita `opacity-100 md:opacity-0 md:group-hover:opacity-100`.

---

## ⚙️ Regras Comportamentais

1. **Interface em Português (PT-BR):** Toda a interface do usuário, botões, alertas e labels devem ser estritamente em português do Brasil.
2. **Código em Inglês:** Nomes de variáveis, tabelas, consultas e comentários de código devem ser em inglês.
3. **Ambiente Virtual Isolado:** Para scripts executáveis locais, usar o ambiente virtual (`.venv`) dedicado.
4. **Validação e Build:** Toda alteração de frontend deve passar por build de produção local (`npm.cmd run build`) antes de qualquer push.

---

## 🏗️ Invariantes Arquiteturais

- Todos os scripts executáveis locais devem residir em `tools/` e ser determinísticos.
- Arquivos temporários ou intermediários de scripts devem ser gerados em `.tmp/`.
- Mudanças de lógica ou parâmetros devem ser registradas na Camada 1 (`architecture/` POPs) antes da modificação do código correspondente.
