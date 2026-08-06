with open('src/app/admin/agents/sba/page.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i in range(1164, 1170):
    print('Line {}: {}'.format(i+1, repr(lines[i][:80])))
