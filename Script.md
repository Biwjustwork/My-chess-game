**System Role:** You are an expert in React, Tailwind CSS, and Boardgame.io. This project is a game called "Chaos Chess," which features a randomized special rules engine. The current code structure already manages the game state via Boardgame.io.

**Objective:** Upgrade the rule drawing system. Instead of the game randomly drawing 1 rule and applying it immediately, change it to a "Drafting" system. The game should randomly draw 3 rules and display them in a "Card Container" for the player to choose 1. Once selected, that rule card should be applied and displayed in an "Active Rules" zone.

**Tasks:**

**1. Update Game Logic (`src/game/Game.js` and `src/game/RulesEngine.js`)**

- When the designated turn is reached (e.g., every 5 turns), instead of calling `drawNewRule` to get 1 rule, create a new function in `RulesEngine.js` called `draftRules` to randomly select 3 unique rules from the `rulePool`.
    
- Add new states to `G`, such as `G.draftedRules = []` (to store the 3 drafted rules) and `G.isDraftingRule = true` (to pause the normal gameplay loop and wait for the player's choice).
    
- Create a new Move in Boardgame.io called `selectDraftedRule: ({ G, events }, ruleId)`. When a player selects a rule, push that `ruleId` into `G.rulesEngine.activeRuleIds`, clear `G.draftedRules`, and set `G.isDraftingRule = false`.
    

**2. Create the Rule Selection UI (Rule Selection Card Container)**

- Update `src/components/NewRulePopup.jsx` (or create a new component `RuleDraftModal.jsx`) to trigger and render when `G.isDraftingRule` is `true`.
    
- Design the UI as a centered Modal Overlay. Inside, create a Card Container that displays the 3 rule cards side-by-side using Flexbox or CSS Grid.
    
- Each card must display: Rule Name, Icon (if any), and Description.
    
- Add hover effects (e.g., scale-up, box-shadow) using Tailwind CSS to make the cards feel interactive. When a card is clicked, execute `moves.selectDraftedRule(ruleId)`.
    

**3. Create the Active Rules Panel**

- Refactor `src/components/RuleCard.jsx` or create a new `ActiveRulesPanel.jsx` component to display the list of currently active rules (fetching data from `G.rulesEngine.activeRuleIds`).
    
- Position this UI section on the side of the chessboard as a Sidebar.
    
- Design it as a stack of cards or a styled list that fits the game's theme. When hovered, the active rule should display a tooltip or expand to show its full description.
    

**4. Coding Constraints**

- Write the code using React Functional Components and Hooks.
    
- Use Tailwind CSS for all layouts, styling, and animations.
    
- Ensure the drafting logic filters out rules so that the 3 drawn cards do not include any rules already present in `activeRuleIds`.
    
- Provide the code step-by-step, file by file (start by updating `Game.js` and `RulesEngine.js` first, then wait for my confirmation before providing the UI components).