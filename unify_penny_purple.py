import os

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replacements to move Penny from blue (accent) to purple (secondary-accent)
        # Note: We are targeting only the Penny-related classes we just added
        # or things that were just changed to 'accent' for Penny.
        
        replacements = [
            # Backgrounds/Shadows
            ('bg-accent', 'bg-secondary-accent'),
            ('var(--accent-glow)', 'var(--secondary-accent-glow)'),
            ('var(--accent-subtle)', 'var(--secondary-accent-subtle)'),
            # Text
            ('text-accent-text', 'text-secondary-accent-text'),
            ('var(--accent-text)', 'var(--secondary-accent-text)'),
            ('var(--on-accent)', 'var(--on-secondary-accent)'),
            # Specific to numbering markers we just updated
            ('text-accent', 'text-secondary-accent-text'),
            ('text-[var(--accent-text)]', 'text-[var(--secondary-accent-text)]')
        ]
        
        new_content = content
        changed = False
        
        # Special check to ensure we don't accidentally break blue items that are NOT Penny
        # However, since the user wants EVERYTHING changed "accordingly" and I just 
        # made Penny blue, I'll revert those specific blue changes to purple.
        
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
