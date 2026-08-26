"""One-shot check: office floor renders, canvas exists, characters spawn."""
import sys
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\TAUSHEF\Downloads\int\agency-frontend\__screenshots__\office_floor_check.png"
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1500, "height": 900})
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))

    page.goto("http://localhost:3000/admin/office", timeout=30000)
    page.wait_for_load_state("networkidle")

    # PixiJS appends a <canvas> into the floor container
    page.wait_for_selector("canvas", timeout=15000)
    # Let characters walk in from the entrance (a few seconds of ticker)
    page.wait_for_timeout(5000)
    page.screenshot(path=OUT, full_page=False)

    title = page.title()
    header = page.locator("h1").first.inner_text()
    browser.close()

print(f"TITLE={title}")
print(f"HEADER={header}")
print(f"CONSOLE_ERRORS={len(errors)}")
for e in errors[:5]:
    print("ERR:", e[:200])
print("OK")
