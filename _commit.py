import subprocess
cmds = [
    ['git', 'add', '-A'],
    ['git', 'commit', '-m', 'Polish client storefront: clean login card, branded hero, product cards with discounts, settings form, forward store token in proxy'],
    ['git', 'log', '--oneline', '-1'],
]
for c in cmds:
    r = subprocess.run(c, cwd=r'C:\Users\TAUSHEF\Downloads\int\agency-frontend', capture_output=True, text=True)
    print('$', ' '.join(c))
    print(r.stdout.strip())
    if r.stderr.strip():
        print('ERR:', r.stderr.strip()[-500:])
    if r.returncode != 0:
        print('exit', r.returncode)
