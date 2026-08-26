"""Diag E2E: never hard-fail; dump page state + errors."""
import sys
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\TAUSHEF\Downloads\int\agency-frontend\__screenshots__\office_e2e.png"
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1500, "height": 900})
    page.on("console", lambda m: errors.append(f"[{m.type}] {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(f"[pageerror] {e}"))
    bad = []
    page.on("response", lambda r: bad.append(f"{r.status} {r.url[-90:]}") if r.status >= 400 else None)
    page.add_init_script(
        "window.addEventListener('unhandledrejection',e=>console.error('[rejection]',String(e.reason&&e.reason.stack||e.reason)));"
        "window.addEventListener('error',e=>console.error('[windowerr]',String(e.message)));"
    )

    try:
        page.goto("http://localhost:3000/admin/office", timeout=30000, wait_until="domcontentloaded")
    except Exception as e:
        print("GOTO_FAIL:", str(e)[:200])
    page.wait_for_timeout(9000)

    print("FINAL_URL=", page.url)
    try:
        body = page.locator("body").inner_text()
        print("BODY_300=", body[:300].replace("\n", " | "))
    except Exception as e:
        print("BODY_FAIL:", str(e)[:120])
    print("CANVAS_COUNT=", page.locator("canvas").count())
    floor_n = -1
    try:
        floor_n = page.evaluate(
            """async () => {
                 const r = await fetch('/api/ceo/floor', {cache:'no-store'});
                 const j = await r.json();
                 return JSON.stringify(j).slice(0, 400);
               }"""
        )
    except Exception as e:
        floor_n = f"EVAL_FAIL {str(e)[:120]}"
    print("FLOOR_RAW=", floor_n)
    page.screenshot(path=OUT)
    browser.close()

print("CONSOLE_ERRORS=", len(errors))
for e in errors[:8]:
    print("MSG:", e[:220])
for b in bad[:6]:
    print("BAD:", b)
