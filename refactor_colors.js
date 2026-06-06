const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./src', function(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.css')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. var(--accent-violet) -> var(--accent-mint)
    content = content.replace(/var\(--accent-violet\)/g, 'var(--accent-mint)');
    
    // 2. Buttons: bg-[var(--accent-mint)] text-white -> accent-bg-green
    // We do this because step 1 will convert bg-[var(--accent-violet)] text-white to bg-[var(--accent-mint)] text-white
    content = content.replace(/bg-\[var\(--accent-mint\)\]\s+text-white/g, 'accent-bg-green');
    content = content.replace(/bg-violet-500\s+text-white/g, 'accent-bg-green');
    
    // 3. Other tailwind violet utilities
    content = content.replace(/bg-violet-500/g, 'bg-[var(--accent-mint)]');
    content = content.replace(/text-violet-500/g, 'text-[var(--accent-mint)]');
    content = content.replace(/text-violet-400/g, 'text-[var(--accent-mint)]');
    content = content.replace(/border-violet-500/g, 'border-[var(--accent-mint)]');
    content = content.replace(/shadow-violet-500/g, 'shadow-emerald-500');
    content = content.replace(/shadow-\[var\(--accent-mint\)\]\/20/g, 'shadow-emerald-500/20'); // Fix previously created invalid shadows
    
    // 4. Specific components that had violet-500/10
    content = content.replace(/bg-violet-500\/10/g, 'bg-[var(--accent-mint)]/10');
    content = content.replace(/bg-violet-500\/5/g, 'bg-[var(--accent-mint)]/10');
    content = content.replace(/hover:bg-violet-600/g, 'hover:brightness-110');
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
});
