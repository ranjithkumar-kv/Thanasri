import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html_ids = set(re.findall(r'id=["\']([^"\']+)["\']', html))
print(f'Total IDs in HTML: {len(html_ids)}')

js_files = [
    'js/sync.js',
    'js/calculator.js',
    'js/notepad.js',
    'js/whiteboard.js',
    'js/games.js',
    'js/japanese.js',
    'js/savedModules.js',
    'js/birthday.js',
    'js/app.js'
]

missing_count = 0
for jf in js_files:
    with open(jf, 'r', encoding='utf-8') as f:
        content = f.read()
    js_ids = re.findall(r'getElementById\(["\']([^"\']+)["\']\)', content)
    for jid in js_ids:
        if jid not in html_ids:
            print(f'MISSING ID in {jf}: "{jid}"')
            missing_count += 1

print(f'Total missing IDs: {missing_count}')
