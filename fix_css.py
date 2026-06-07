import os

filepath = 'd:/SD/ServerDeckFrontend/src/index.css'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

missing_css = """  * {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  /* Premium UI Utilities */
  .glass-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 24px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .glass-card:hover {
    background: var(--bg-card-hover);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }

  .glass-input {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    color: var(--text-primary);
    transition: border-color 0.2s ease, background-color 0.2s ease;
  }
  .glass-input:focus {
    outline: none;
    border-color: var(--accent-violet);
    background: var(--bg-card-hover);
  }

  .glass-button {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    color: var(--text-primary);
    padding: 0.5rem 1rem;
    transition: all 0.2s ease;
    font-weight: 500;
  }
  .glass-button:hover {
    background: var(--bg-card-hover);
    border-color: rgba(255, 255, 255, 0.15);
  }
  .glass-button:active {
    transform: scale(0.98);
  }
  
  select.glass-input {
    appearance: auto;
  }
  
  .accent-text-green {
    color: var(--accent-mint);
  }
  
  .accent-bg-green {
    background-color: var(--accent-mint);
    color: #0a0a0a;
  }
"""

content = content.replace("  * {\n\n  /* Global text", missing_css + "\n  /* Global text")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("CSS restored successfully!")
