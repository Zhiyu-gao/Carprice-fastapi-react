import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright

DEFAULT_URL = "https://www.dongchedi.com/"
DEFAULT_OUTPUT = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "crawl"
    / "cookies"
    / "dongchedi_storage_state.json"
)


def create_cookie_json(url: str, output: Path) -> None:
    output = output.expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox",
            ],
        )
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        )

        page = context.new_page()
        page.goto(url, timeout=30000)
        page.wait_for_load_state("domcontentloaded")

        print(f"浏览器已打开，请在页面中手动登录：{url}")
        input("登录完成后，回到终端按回车保存 cookie JSON ... ")

        context.storage_state(path=str(output))
        browser.close()

    print(f"已保存 cookie JSON: {output}")


def main() -> int:
    parser = argparse.ArgumentParser(description="手动登录并保存 Playwright cookie JSON 文件")
    parser.add_argument("--url", default=DEFAULT_URL, help="登录页 URL")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="输出 JSON 文件路径")
    args = parser.parse_args()

    create_cookie_json(url=args.url, output=Path(args.output))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
