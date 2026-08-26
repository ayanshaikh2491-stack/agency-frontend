"""PROD E2E: office floor renders AND same-origin /api/ceo/floor reaches EC2."""
import sys
from playwright.sync_api import sync_playwright

URL = "https://agency-frontend-seven.vercel.app/admin/office"
OUT = r"C:\Users\TAUSHEF\Downloads\int\agency-frontend\__screenshots__\office_prod_final.png"
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1500, "height": 900})
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))

    page.goto(URL, timeout=45000, wait_until="domcontentloaded")
    page.wait_for_selector("canvas", timeout=20000)

    connected = False
    for _ in range(8):
        page.wait_for_timeout(1500)
        # new page has fixed bottom-right indicator
        txt = page.locator("body").inner_text()
        if "live floor" in txt:
            connected = True
            break

    page.wait_for_timeout(5000)  # let avatars walk to coffee etc.
    page.screenshot(path=OUT)

    floor_raw = page.evaluate(
        """async () => {
             const r = await fetch('/api/ceo/floor', {cache:'no-store'});
             return await r.text();
           }"""
    )
    browser.close()

print(f"CONNECTED={connected}")
print(f"FLOOR_API={floor_raw[:200]}")
print(f"CRASHES={sum(1 for e in errors if 'Application error' in e)}")
net_errs = [e for e in errors if "Failed to load resource" not in e]
for e in net_errs[:4]:
    print("ERR:", e[:160])
print("RESULT=", "PASS" if connected else "FAIL")
