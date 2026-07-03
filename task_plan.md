# Plano de Trabalho: Otimização Mobile & Responsividade

## 🏁 Objetivos
1. Resolver as limitações de usabilidade e interações em dispositivos móveis no dashboard e abas secundárias.
2. Criar e delegar tarefas a um subagente especializado em Mobile/Frontend.
3. Testar a responsividade e o fluxo móvel de ponta a ponta.

---

## 📋 Checklist de Fases

### Fase 1: Visão & Descoberta
- [ ] Obter respostas para as Perguntas de Descoberta (/grill-me).
- [ ] Definir o escopo exato das limitações mobile (menus, tabelas, modais, etc.).
- [ ] Registrar os schemas de entrada/saída no `gemini.md`.

### Fase 2: Link
- [ ] Validar a conexão local e o dev server.

### Fase 3: Arquitetura
- [ ] Criar o subagente especializado em Mobile/UX.
- [ ] Escrever o POP técnico em `architecture/` detalhando as regras CSS e contêineres mobile seguros.

### Fase 4: Estilo & UI
- [ ] Aplicar correções de layout mobile (tabelas com scroll horizontal, padding em modais e z-index do botão flutuante).
- [ ] Executar builds de teste (`npm.cmd run build`).

### Fase 5: Gatilho & Deploy
- [ ] Commitar e fazer push na `main` do GitHub.
- [ ] Atualizar o status do Supabase se necessário.
