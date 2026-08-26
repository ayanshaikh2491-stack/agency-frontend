"""Diagnose: what does prod /admin/office actually show?"""
from playwright.sync_api import sync_playwright

URL = "https://agency-frontend-seven.vercel.app/admin/office"
OUT = r"C:\Users\TAUSHEF\Downloads\int\agency-frontend\__screenshots__\office_prod_diag.png"
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1500, "height": 900})
    page.on("console", lambda m: errors.append(f"[{m.type}] {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errors.append(f"[pageerror] {e}"))

    page.goto(URL, timeout=45000, wait_until="domcontentloaded")
    page.wait_for_timeout(10000)

    print(f"FINAL_URL={page.url}")
    print(f"TITLE={page.title()}")
    body = page.locator("body").inner_text()
    print(f"BODY_FIRST_400={body[:400]!r}")
    print(f"CANVAS_COUNT={page.locator('canvas').count()}")
    page.screenshot(path=OUT)
    browser.close()

print(f"CONSOLE_ISSUES={len(errors)}")
for e in errors[:8]:
    print("MSG:", e[:200])
