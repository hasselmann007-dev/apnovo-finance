---
description: Guideline e Framework para construção de Skills via "Get Shit Done" (GSD)
---

# 🚀 Workflow "Get Shit Done" (GSD) para Criar Skills

Este workflow define a conduta estrita que você (Agente) deve adotar ao construir novas `skills` no diretório `.agents/skills`. O objetivo do GSD é maximizar a velocidade, focar apenas em código em funcionamento real e remover qualquer overhead arquitetural desnecessário.

## Regras Fundamentais (GSD)

1. **Cortar Complexidade**: Se uma task pode ser feita em 1 arquivo com 100 linhas ao invés de 5 arquivos de 20 linhas, faça em 1 arquivo. Menos abstração = entregas mais rápidas.
2. **Execute e Valide (Não suponha)**: Você tem acesso ao terminal. Escreveu o script ou configurou a lib? Execute-a imediatamente com um payload de teste. Se falhar, corrija. Só conclua a skill quando ela estiver provada que funciona.
3. **Não peça permissões para testar**: Use fluxos automatizados (ex: `node script.js`) ao invés de pausar o workflow para perguntar ao usuário.
4. **Resuma Falhas e Sucessos**: Em vez de relatar a estrutura do código à exaustão, traga ao usuário: "Rodei X, quebrou em Y, apliquei Z para corrigir. Aqui está o resultado final ✅".

## Passos para Construção de uma Skill (Execução Automática)

Quando o usuário pedir "Crie uma skill GSD para [Funcionalidade]", siga *exatamente* este roteiro:

### Passo 1: Criação da Pasta e Metadados
Identifique a utilidade principal da skill e crie:
- `.agents/skills/[nome-da-skill]/SKILL.md` (Contendo apenas a lógica crua de prompt da skill, ou seja, regras exatas a seguir).
- O arquivo deve possuir Frontmatter YAML (`name`, `description`).

### Passo 2: Instalação Ninja
// turbo-all
Verifique dependências ausentes e force a instalação imediatamente sem perguntar:
`npm install [nome-pacote] --no-fund --no-audit` ou equivalente caso seja python. Se falhar por conflito de versão, repare com `--force` ou `--legacy-peer-deps`. Não perca tempo.

### Passo 3: O Caminho Feliz (Happy Path Code)
Crie implementações padrão (scripts ou hooks React) que cubram o caso de uso mais comum da skill.
*Não inclua tratamento de erros obscuros logo de cara*; crie a versão que resolve o problema central. Refine depois se houver problemas.

### Passo 4: Validação Imediata (Crucial no GSD)
Rode um comando verificador (seja um teste curto, um build rápido, ou a chamada `npm run lint /path/to/script`) para provar que a skill e as dependências acopladas no projeto não quebraram.

### Passo 5: Atualização do Task Artifact
Assinale a task como concluída apenas *após* você mesmo ver o input verde (sucesso no terminal) ou a criação correta dos arquivos. Nunca presuma que "deve funcionar".

## Anti-Patterns Absolutos

Mantenha distância de:
- **"Boilerplates excessivos"**: Criar interfaces Typescript ou JSDocs enormes e super-documentadas. Use `any` ou código estrito se resolver o problema em 1/3 do tempo, caso o projeto permita JS padrão.
- **"Paralisia por análise"**: Avaliar 5 bibliotecas diferentes. Escolha a mais popular ou a que o usuário mencionou, aplique e valide.
- **"Verbose Output"**: No relatório final, não gere textões em Markdown para o usuário. Mostre apenas o Link/Rota alterada, o artefato mudado e pergunte: "Próxima tarefa?".
