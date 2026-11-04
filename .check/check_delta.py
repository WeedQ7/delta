import sys, json, time
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:4173"
routes = ["/", "#/search", "#/library", "#/favorites", "#/playlists", "#/profile",
          "#/settings", "#/subscriptions", "#/coins", "#/marketplace"]

results = {}

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--no-sandbox", "--autoplay-policy=no-user-gesture-required"])
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()
    console_errors = []
    page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: console_errors.append("PAGEERROR: " + str(e)))

    for r in routes:
        url = BASE + ("/" if r == "/" else "/" + r)
        page.goto(url, wait_until="networkidle")
        time.sleep(0.3)
        root_html = page.locator("#root").inner_html()
        h = page.locator("h1, h2").first.inner_text() if page.locator("h1,h2").count() else ""
        results[r] = {"rendered_len": len(root_html), "heading": h[:60]}
    print("== ROUTES (desktop) ==")
    print(json.dumps(results, ensure_ascii=False, indent=1))

    # ---------- Player test on Home ----------
    page.goto(BASE + "/#/", wait_until="networkidle")
    time.sleep(0.5)
    main_buttons = page.locator("main button").count()
    print("main buttons on home:", main_buttons)
    clicked = False
    if main_buttons:
        page.locator("main button").first.click()
        clicked = True
    time.sleep(1.5)
    tc = "() => {const m=document.body.innerText.match(/(\\d+:\\d\\d)\\s*[\\/]\\s*(\\d+:\\d\\d)/); return m?m[1]:null;}"
    t1 = page.evaluate(tc)
    time.sleep(2.5)
    t2 = page.evaluate(tc)
    print("== PLAYER == clicked:", clicked, "progress:", t1, "->", t2, "advancing:", bool(t1 and t2 and t1 != t2))

    # ---------- Coins purchase ----------
    page.goto(BASE + "/#/coins", wait_until="networkidle")
    bal_before = page.evaluate("""() => {try{const s=JSON.parse(localStorage.getItem('delta-coins')||'{}');return (s.state&&s.state.balance)??null;}catch(e){return 'err'}}""")
    buy_ok = False
    try:
        page.get_by_role("button", name="купить").first.click(timeout=3000)
        buy_ok = True
    except Exception:
        try:
            page.locator("button", has_text="Купить").first.click(timeout=3000); buy_ok = True
        except Exception as e:
            print("coin buy click err:", str(e)[:150])
    time.sleep(0.8)
    bal_after = page.evaluate("""() => {try{const s=JSON.parse(localStorage.getItem('delta-coins')||'{}');return (s.state&&s.state.balance)??null;}catch(e){return 'err'}}""")
    tx_count = page.evaluate("""() => {try{const s=JSON.parse(localStorage.getItem('delta-coins')||'{}');return ((s.state&&s.state.transactions)||[]).length;}catch(e){return -1}}""")
    print("== COINS == before:", bal_before, "after:", bal_after, "txCount:", tx_count, "clicked:", buy_ok)

    # ---------- Theme toggle + persistence ----------
    theme_before = page.evaluate("() => document.documentElement.dataset.theme")
    page.goto(BASE + "/#/settings", wait_until="networkidle")
    changed = False
    for label in ["Светлая", "Light"]:
        try:
            page.locator(f"button:has-text('{label}')").first.click(timeout=2500)
            changed = True
            break
        except Exception:
            pass
    time.sleep(0.5)
    theme_after = page.evaluate("() => document.documentElement.dataset.theme")
    page.reload(wait_until="networkidle")
    theme_persist = page.evaluate("() => document.documentElement.dataset.theme")
    print("== THEME == before:", theme_before, "clicked:", changed, "after:", theme_after, "persist:", theme_persist)

    print("== CONSOLE ERRORS (desktop) ==")
    print("\n".join(console_errors[:15]) if console_errors else "NONE")
    ctx.close()

    # ---------- Mobile pass ----------
    ctx2 = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    page2 = ctx2.new_page()
    merr = []
    page2.on("pageerror", lambda e: merr.append(str(e)))
    overflow_issues = []
    for r in routes:
        url = BASE + ("/" if r == "/" else "/" + r)
        page2.goto(url, wait_until="networkidle")
        time.sleep(0.2)
        ow = page2.evaluate("() => document.documentElement.scrollWidth - window.innerWidth")
        if ow > 2:
            overflow_issues.append((r, ow))
    print("== MOBILE horizontal overflow ==", overflow_issues if overflow_issues else "NONE")
    print("== MOBILE pageerrors ==", merr if merr else "NONE")
    page2.goto(BASE + "/#/", wait_until="networkidle")
    page2.screenshot(path="/workspace/.check/delta_mobile.png")
    ctx2.close()

    ctx3 = browser.new_context(viewport={"width": 1280, "height": 800})
    pg = ctx3.new_page()
    pg.goto(BASE + "/#/", wait_until="networkidle")
    pg.screenshot(path="/workspace/.check/delta_desktop.png")
    ctx3.close()
    browser.close()

print("DONE")
