import os

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Explicit replacements for the Dashboard and Sidebar/Panel buttons
        # to ensure we don't accidentally leave 'accent' background where we want purple
        replacements = [
            (\"background: 'var(--accent)'\", \"background: 'var(--secondary-accent)'\"),
            (\"color: 'var(--on-accent)'\", \"color: 'var(--on-secondary-accent)'\"),
            (\"text-accent\", \"text-secondary-accent-text\"),
            (\"bg-accent\", \"bg-secondary-accent\"),
            (\"shadow-[0_8px_24px_var(--accent-glow)]\", \"shadow-[0_8px_24px_var(--secondary-accent-glow)]\"),
            (\"shadow-[0_4px_16px_var(--accent-glow)]\", \"shadow-[0_4px_16px_var(--secondary-accent-glow)]\")
        ]
        
        new_content = content
        changed = False
        
        for old, new in replacements:
            if old in new_content:
                new_content = new_content.replace(old, new)
                changed = True
        
        if changed:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f\"Corrected: {filepath}\")
    except Exception as e:
        print(f\"Error processing {filepath}: {e}\")

# Target only the relevant files that definitely need Penny-purple
target_files = [
    'src/app/screens/Dashboard.tsx',
    'src/app/screens/Cashflow.tsx',
    'src/app/screens/Debt.tsx',
    'src/app/screens/Progress.tsx',
    'src/app/screens/Scenarios.tsx',
    'src/app/screens/Month.tsx',
    'src/app/components/Sidebar.tsx',
    'src/app/components/PennyPanel.tsx'
]

for file in target_files:
    fix_file(file)
