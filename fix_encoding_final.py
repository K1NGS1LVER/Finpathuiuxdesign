import os

def fix_file(filepath):
    try:
        with open(filepath, 'rb') as f:
            raw = f.read()
        
        # Replace common UTF-8 misinterpreted as Latin-1 sequences
        # â‚¹ (0xC3 0xA2 0xE2 0x80 0x9A 0xC2 0xB9) -> ₹ (0xE2 0x82 0xB9)
        # However, let's just use string replacement on decoded content
        content = raw.decode('utf-8')
        
        replacements = {
            'â‚¹': '₹',
            'â”€': '─',
            'â€”': '—',
            'â€™': '’'
        }
        
        new_content = content
        changed = False
        for old, new in replacements.items():
            if old in new_content:
                new_content = new_content.replace(old, new)
                changed = True
        
        if changed:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed: {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

# Check all TSX files in src/app/screens
for root, dirs, files in os.walk('src/app/screens'):
    for file in files:
        if file.endswith('.tsx'):
            fix_file(os.path.join(root, file))
