import os

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replacements to move Penny from lime (tertiary-accent) to blue (accent)
        replacements = [
            # Backgrounds/Shadows
            ('bg-tertiary-accent', 'bg-accent'),
            ('var(--tertiary-accent-glow)', 'var(--accent-glow)'),
            ('var(--tertiary-accent-subtle)', 'var(--accent-subtle)'),
            ('var(--tertiary-accent)', 'var(--accent)'),
            # Text
            ('text-tertiary-accent-text', 'text-accent-text'),
            ('text-tertiary-accent', 'text-accent-text'),
            ('var(--tertiary-accent-text)', 'var(--accent-text)'),
            ('var(--on-tertiary-accent)', 'var(--on-accent)'),
            # Specific to Penny Insights numbering
            ('text-tertiary-accent', 'text-accent-text'),
            ('text-[var(--tertiary-accent)]', 'text-[var(--accent-text)]')
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
            print(f"Fixed: {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

# Process screens and components
directories = ['src/app/screens', 'src/app/components']
for directory in directories:
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx'):
                fix_file(os.path.join(root, file))
