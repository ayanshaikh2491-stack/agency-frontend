"""Smoke: /admin redirects to office, floor renders."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1500, "height": 900})
    page.goto("http://localhost:3000/admin", timeout=30000, wait_until="domcontentloaded")
    page.wait_for_timeout(4000)
    url = page.url
    page.wait_for_selector("canvas", timeout=15000)
    # sidebar should show the new Office Floor link
    nav = page.locator("text=Office Floor").first.is_visible()
    browser.close()

print(f"FINAL_URL={url}")
print(f"OFFICE_NAV_VISIBLE={nav}")
print("PASS" if url.endswith("/admin/office") and nav else "FAIL")
