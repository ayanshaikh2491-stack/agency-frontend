with open('C:/Users/TAUSHEF/Downloads/int/agency-frontend/src/app/admin/agents/sba/page.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i in range(620, 625):
    print(f'Line {i+1}: {repr(lines[i][:100])}')
