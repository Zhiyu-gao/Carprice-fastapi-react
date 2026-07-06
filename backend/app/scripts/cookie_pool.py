import argparse
import re
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

BASE_DIR = Path(__file__).resolve().parents[2]
sys.path.append(str(BASE_DIR))

load_dotenv()

from app.services.cookie_pool_service import DEFAULT_COOKIE_POOL_DIR, EXPIRED_DIR_NAME, get_cookie_pool_stats

DEFAULT_LOGIN_URL = "https://www.dongchedi.com/"


def _safe_name(name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_.-]+", "_", name.strip())
    return cleaned.strip("._") or datetime.now().strftime("cookie_%Y%m%d_%H%M%S")


def _pool_dir(raw_dir: str | None) -> Path:
    path = Path(raw_dir).expanduser() if raw_dir else DEFAULT_COOKIE_POOL_DIR
    path.mkdir(parents=True, exist_ok=True)
    return path


def add_cookie(args: argparse.Namespace) -> None:
    pool_dir = _pool_dir(args.pool_dir)
    filename = f"{_safe_name(args.name)}.json"
    output_path = pool_dir / filename

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        )
        page = context.new_page()
        page.goto(args.url, wait_until="domcontentloaded")

        print("\n浏览器已打开。请在浏览器里手动完成登录/验证。")
        print("完成后回到这个终端，按 Enter 保存 cookie。")
        input("按 Enter 保存: ")

        context.storage_state(path=str(output_path))
        browser.close()

    print(f"已保存 cookie: {output_path}")


def list_cookies(args: argparse.Namespace) -> None:
    pool_dir = _pool_dir(args.pool_dir)
    stats = get_cookie_pool_stats(str(pool_dir))
    files = sorted(pool_dir.glob("*.json"))
    expired_files = sorted((pool_dir / EXPIRED_DIR_NAME).glob("*.json"))
    if not files and not expired_files:
        print(f"cookie 池为空: {pool_dir}")
        return

    print(f"cookie 池目录: {pool_dir}")
    print(
        "统计: "
        f"总数 {stats['total_count']} | 可用 {stats['active_count']} | "
        f"已过期 {stats['expired_count']} | 无效 {stats['invalid_count']}"
    )
    for path in files:
        stat = path.stat()
        updated = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        print(f"- 可用 {path.name} | {stat.st_size} bytes | updated {updated}")
    for path in expired_files:
        if path.name.endswith(".expired.json"):
            continue
        stat = path.stat()
        updated = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        print(f"- 过期 {path.name} | {stat.st_size} bytes | updated {updated}")


def delete_cookie(args: argparse.Namespace) -> None:
    pool_dir = _pool_dir(args.pool_dir)
    target = pool_dir / f"{_safe_name(args.name)}.json"
    expired_target = pool_dir / EXPIRED_DIR_NAME / f"{_safe_name(args.name)}.json"
    if target.exists():
        target.unlink()
        print(f"已删除 cookie: {target}")
        return
    if expired_target.exists():
        expired_target.unlink()
        meta_path = expired_target.with_suffix(expired_target.suffix + ".expired.json")
        if meta_path.exists():
            meta_path.unlink()
        print(f"已删除过期 cookie: {expired_target}")
        return
    print(f"未找到 cookie: {target} 或 {expired_target}")


def main() -> None:
    parser = argparse.ArgumentParser(description="维护懂车帝爬虫 cookie 池")
    parser.add_argument("--pool-dir", default=None, help="cookie 池目录，默认 data/crawl/cookie_pool")
    sub = parser.add_subparsers(dest="command", required=True)

    add = sub.add_parser("add", help="打开浏览器，手动登录后保存一份 cookie")
    add.add_argument("--name", required=True, help="cookie 名称，例如 account1")
    add.add_argument("--url", default=DEFAULT_LOGIN_URL, help="登录入口 URL")
    add.set_defaults(func=add_cookie)

    list_cmd = sub.add_parser("list", help="列出 cookie 池")
    list_cmd.set_defaults(func=list_cookies)

    delete = sub.add_parser("delete", help="删除一份过期 cookie")
    delete.add_argument("--name", required=True, help="cookie 名称，不用带 .json")
    delete.set_defaults(func=delete_cookie)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
