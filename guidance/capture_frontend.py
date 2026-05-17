import asyncio
import json
import os
import sys
from pathlib import Path
from urllib.parse import urljoin


def safe_print(message: str):
    sys.stdout.buffer.write((message + "\n").encode("utf-8", errors="replace"))


try:
    from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
except ModuleNotFoundError:
    safe_print("Playwright chưa được cài đặt. Hãy chạy:")
    safe_print("pip install python-docx reportlab playwright")
    safe_print("playwright install")
    sys.exit(1)


GUIDANCE_DIR = Path(__file__).resolve().parent
ROUTES_FILE = Path(os.getenv("GUIDE_ROUTES_FILE", str(GUIDANCE_DIR / "routes.json")))
SCREENSHOT_DIR = Path(os.getenv("GUIDE_SCREENSHOT_DIR", str(GUIDANCE_DIR / "screenshots")))

GUIDE_BASE_URL = os.getenv("GUIDE_BASE_URL", "http://127.0.0.1:5175")
GUIDE_USERNAME = os.getenv("GUIDE_USERNAME", "")
GUIDE_PASSWORD = os.getenv("GUIDE_PASSWORD", "")

LOGIN_URL = os.getenv("GUIDE_LOGIN_URL", "/login")
USERNAME_SELECTOR = os.getenv(
    "GUIDE_USERNAME_SELECTOR",
    'input[name="username"], input[type="email"], input[type="text"]',
)
PASSWORD_SELECTOR = os.getenv(
    "GUIDE_PASSWORD_SELECTOR",
    'input[name="password"], input[type="password"]',
)
SUBMIT_SELECTOR = os.getenv(
    "GUIDE_SUBMIT_SELECTOR",
    'button[type="submit"], input[type="submit"]',
)
SELECT_TAB_SELECTOR = os.getenv(
    "GUIDE_SELECT_TAB_SELECTOR",
    'select, [aria-label="Danh mục"]',
)

POST_LOGIN_WAIT_URL_PART = os.getenv("GUIDE_POST_LOGIN_WAIT_URL_PART", "/")
PAGE_WAIT_MS = int(os.getenv("GUIDE_PAGE_WAIT_MS", "2500"))
VIEWPORT_WIDTH = int(os.getenv("GUIDE_VIEWPORT_WIDTH", "1920"))
VIEWPORT_HEIGHT = int(os.getenv("GUIDE_VIEWPORT_HEIGHT", "1080"))


def load_routes():
    return json.loads(ROUTES_FILE.read_text(encoding="utf-8"))


async def maybe_login(page):
    if not GUIDE_USERNAME or not GUIDE_PASSWORD:
        safe_print("Bỏ qua login tự động vì chưa có GUIDE_USERNAME / GUIDE_PASSWORD.")
        return

    login_url = urljoin(GUIDE_BASE_URL.rstrip("/") + "/", LOGIN_URL.lstrip("/"))
    safe_print(f"Đăng nhập tại: {login_url}")
    await page.goto(login_url, wait_until="domcontentloaded")
    await page.wait_for_timeout(1200)

    await page.locator(USERNAME_SELECTOR).first.fill(GUIDE_USERNAME)
    await page.locator(PASSWORD_SELECTOR).first.fill(GUIDE_PASSWORD)
    await page.locator(SUBMIT_SELECTOR).first.click()

    try:
        await page.wait_for_url(f"**{POST_LOGIN_WAIT_URL_PART}**", timeout=20000)
    except PlaywrightTimeoutError:
        await page.wait_for_load_state("networkidle", timeout=20000)
    await page.wait_for_timeout(PAGE_WAIT_MS)


async def apply_route_interaction(page, route_info):
    tab_value = route_info.get("tab_value")
    button_text = route_info.get("button_text")
    click_selector = route_info.get("click_selector")
    wait_selector = route_info.get("wait_selector")

    if tab_value:
        selector = page.locator(SELECT_TAB_SELECTOR).first
        await selector.wait_for(timeout=10000)
        await selector.select_option(tab_value)
        await page.wait_for_timeout(PAGE_WAIT_MS)

    if button_text:
        await page.get_by_role("button", name=button_text, exact=True).click()
        await page.wait_for_timeout(PAGE_WAIT_MS)

    if click_selector:
        await page.locator(click_selector).first.click()
        await page.wait_for_timeout(PAGE_WAIT_MS)

    if wait_selector:
        await page.locator(wait_selector).first.wait_for(timeout=15000)
        await page.wait_for_timeout(1000)


async def capture_route(page, route_info):
    route = route_info["route"]
    name = route_info["name"]
    title = route_info["title"]
    target_url = urljoin(GUIDE_BASE_URL.rstrip("/") + "/", route.lstrip("/"))
    screenshot_path = SCREENSHOT_DIR / f"{name}.png"

    safe_print(f"Chụp {title}: {target_url}")
    await page.goto(target_url, wait_until="domcontentloaded")
    try:
        await page.wait_for_load_state("networkidle", timeout=10000)
    except PlaywrightTimeoutError:
        pass

    await apply_route_interaction(page, route_info)
    await page.screenshot(path=str(screenshot_path), full_page=True)


async def main():
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    routes = load_routes()

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": VIEWPORT_WIDTH, "height": VIEWPORT_HEIGHT},
            device_scale_factor=1,
        )
        page = await context.new_page()

        await maybe_login(page)

        for route_info in routes:
            try:
                await capture_route(page, route_info)
            except Exception as exc:  # noqa: BLE001
                safe_print(f"Không chụp được {route_info['name']}: {exc}")

        await browser.close()

    safe_print(f"Đã lưu ảnh vào: {SCREENSHOT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
