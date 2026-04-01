---
title: "Dark Mode Fintech Login"
projectId: 11148478485292758925
---

# Design System: Dark Mode Fintech Login
**Project ID:** 11148478485292758925

## 1. Visual Theme & Atmosphere
A estética predominante é a "Dark Mode Fintech". O ambiente sugere seriedade, tecnologia, precisão financeira e modernidade através do uso do modo escuro. O design é utilitário mas altamente polido, caracterizado por fundos sombrios que conferem contraste vibrante aos elementos destacados, passando uma sensação premium e altamente responsiva ("Tech-Vibe").

## 2. Color Palette & Roles

*   **Electric Tech Blue (#2B8CEE)**
    *   *Role:* Cor Primária oficial. Usada em textos chaves de destaque, botões principais de ação (CTAs), preenchimentos e elementos de foco interativos. Traz a vibração sobre os fundos escuros da Fintech.
*   **Deep Space Background (Variações de Slate/Gray-900)**
    *   *Role:* Fundo geral das interfaces. A ausência de branco e adoção de tons densos cria conforto visual e modernismo noturno, ancorando os painéis mais claros e a cor de destaque. O projeto possui "*Saturation: Nível 2*", isto é, o fundo não é cinza fumo puro `#111` e sim variações saturadas puxadas muito sutis ao azul-marinho denso (como `slate-900` ou `slate-800`).
*   **High-Contrast Text**
    *   *Role:* Textos principais de alto contraste (`white`, `gray-100`) para legibilidade, contrapondo contra as áreas preenchidas escuras.

## 3. Typography Rules
*   **Font Family:** `Inter`
*   A tipografia `Inter` promove uma leitura corporativa mas extremamente moderna e sem serifas. Títulos principais adotarão pesos fortes (`font-black`/`font-bold`) e acompanham bom respiro para hierarquia limpa. Elementos como sub-títulos usarão pesos médios (`font-medium`) e cores atenuadas (`text-slate-400`).

## 4. Component Stylings
*   **Geometria Primária:** `ROUND_EIGHT` (Aproximadamente 8px)
*   **Buttons:** Os botões não são extremamente redondos (pill-shape global foi abandonado). Assumem um perfil clássico arredondado nas pontas, como um `rounded-lg` ou `rounded-[8px]`, proporcionando estabilidade tangível. Cores vibrantes `#2B8CEE` para CTA.
*   **Cards/Containers:** Painéis de agrupamentos financeiros seguirão a regra do "subtly rounded corners", também atados à variável de `8px` (`rounded-lg`). Os painéis adotarão uma coloração de preenchimento que realce contra o fundo principal do "Deep Space Background" do site (ex.: `bg-slate-800` vs `bg-slate-900`), além de terem uso delicado de bordas (`border-slate-700`).

## 5. Layout Principles
O projeto obedece ao foco claro na usabilidade fluida (Dispositivo *Mobile-first* referenciado nos assets `cae2578999234a66823c012f492545e0`, transladados para grids de Desktop).
Os espaçamentos são equilibrados, adotando margens amplas para garantir o isolamento semântico de blocos de conteúdo financeiro, sem amontoados. O paradigma principal abandona redondos desnecessários `rounded-[32px]` e prefere rigidez de formas sérias `rounded-xl/lg`.
