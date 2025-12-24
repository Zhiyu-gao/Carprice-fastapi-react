from pathlib import Path
from playwright.sync_api import sync_playwright

def main():
    base_dir = Path(__file__).resolve().parent
    state_path = base_dir / "lianjia_state.json"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        page.goto(
            "https://sh.lianjia.com/",
            wait_until="domcontentloaded",
            timeout=60000,
        )

        print("👉 请在浏览器中完成链家登录")
        print("👉 登录完成后，在 Inspector 点 Resume")

        page.pause()

        context.storage_state(path=state_path)
        print(f"✅ 登录态已保存到 {state_path}")

        browser.close()

if __name__ == "__main__":
    main()
