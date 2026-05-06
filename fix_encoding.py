import os
import re

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
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

def walk(dir_path):
    for root, dirs, files in os.walk(dir_path):
        for file in files:
            if file.endswith('.tsx'):
                fix_file(os.path.join(root, file))

walk('src/app/screens')
