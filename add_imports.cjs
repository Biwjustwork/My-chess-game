const fs = require('fs');

function insertImport(filePath, importLine) {
    if (!fs.existsSync(filePath)) {
        console.log('File not found: ' + filePath);
        return;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.includes(importLine)) {
        const lines = content.split(/\r?\n/);
        
        let lastImportIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
                lastImportIndex = i;
            }
        }
        
        if (lastImportIndex !== -1) {
            lines.splice(lastImportIndex + 1, 0, importLine);
        } else {
            lines.unshift(importLine);
        }
        
        fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
        console.log('Added to ' + filePath);
    } else {
        console.log('Already in ' + filePath);
    }
}

insertImport('src/components/board/Board.jsx', "import './Board.css';");
insertImport('src/components/hud/TurnCounter.jsx', "import './HUD.css';");
insertImport('src/components/hud/RuleCard.jsx', "import './HUD.css';");
insertImport('src/components/hud/GameStatus.jsx', "import './HUD.css';");
insertImport('src/components/overlays/RuleDraftModal.jsx', "import './Overlays.css';");
