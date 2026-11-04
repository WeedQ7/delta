import sys, time, subprocess
from playwright.sync_api import sync_playwright

EXE = "/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome"
BASE = "http://localhost:5173"
U = f"e2e{int(time.time())}"
EMAIL = f"{U}@delta.test"
PW = "TestPass123!"
fails = []

def check(name, cond):
    print(("PASS  " if cond else "FAIL  ") + name)
    if not cond: fails.append(name)

def pstate(pg):
    return pg.evaluate("() => { const s = window.__deltaPlayer.getState(); return {playing: s.isPlaying, t: s.currentTime, title: s.current ? s.current.title : null}; }")

def do_login(page, ident, pw):
    page.wait_for_selector("input", timeout=8000)
    inputs = page.query_selector_all("input")
    for i in inputs:
        t = (i.get_attribute("type") or "").lower()
        if t == "password": i.fill(pw)
        elif t == "email": i.fill(ident)
        elif t in ("", "text"): i.fill(ident)
    page.get_by_role("button", name="Войти").click()
    page.wait_for_url(lambda u: "/login" not in u, timeout=10000)

def play_neon(page):
    row = page.locator("div,li").filter(has_text="Neon Drive")
    # smallest matching container that has a button
    btn = None
    for i in range(row.count()):
        el = row.nth(i)
        try:
            b = el.locator("button").first
            if b.count() > 0 and b.is_visible(timeout=500):
                # ensure it's the direct row (has an img/svg cover or is small)
                btn = b; break
        except Exception:
            continue
    if btn is None:
        # fallback: first play-ish button after heading "Результаты"
        btn = page.locator("button").filter(has=page.locator("svg")).first
    btn.click()
    page.wait_for_timeout(3000)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE, args=["--no-sandbox","--autoplay-policy=no-user-gesture-required"])
    ctx = b.new_context()
    pg = ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))

    # 1-2. Open / unauthenticated -> redirect to /login
    pg.goto(BASE + "/#/"); pg.wait_for_timeout(2500)
    check("redirect / -> /login", "/login" in pg.url)

    # 3-4. Register new user through UI
    pg.get_by_role("link", name="Зарегистрироваться").click()
    pg.wait_for_url("**/#/register**", timeout=8000)
    ins = pg.query_selector_all("input")
    # order: email, username, displayName, password, confirm
    ins[0].fill(EMAIL); ins[1].fill(U); ins[2].fill("E2E Tester"); ins[3].fill(PW); ins[4].fill(PW)
    pg.get_by_role("button", name="Зарегистрироваться").click()
    try:
        pg.wait_for_url(lambda u: "/register" not in u and "/login" not in u, timeout=10000)
        ok = True
    except Exception:
        ok = False
    check("registration via UI -> app opens", ok)

    # 5. user exists in PostgreSQL
    r = subprocess.run(["su","postgres","-c",f"psql -d delta -tAc \"SELECT count(*) FROM User WHERE email=\'{EMAIL}\'\""], capture_output=True, text=True)
    if "ERROR" in r.stderr:
        r = subprocess.run(["su","postgres","-c",f"psql -d delta -tAc \"SELECT count(*) FROM \\\"User\\\" WHERE email='{EMAIL}'\""], capture_output=True, text=True)
    check("user saved in PostgreSQL", r.stdout.strip() == "1")

    # 6. logout from profile (resilient: any control containing "Выйти")
    pg.goto(BASE + "/#/profile"); pg.wait_for_timeout(2500)
    logged_out = False
    for loc in [pg.get_by_role("button", name="Выйти из аккаунта"),
                pg.locator("button:has-text('Выйти')"),
                pg.locator("a:has-text('Выйти')"),
                pg.get_by_text("Выйти").first]:
        try:
            loc.first.click(timeout=4000); pg.wait_for_timeout(2000)
            if "/login" in pg.url: logged_out = True; break
        except Exception:
            continue
    check("logout -> /login", logged_out)

    # 7. login again
    do_login(pg, EMAIL, PW)
    check("login works", "/login" not in pg.url)

    # 8. reload keeps session
    pg.reload(); pg.wait_for_timeout(3000)
    check("session restored after reload", "/login" not in pg.url)

    # 9-10. search neon
    pg.goto(BASE + "/#/search"); pg.wait_for_timeout(1500)
    sb = pg.query_selector("main input, form input, input")
    sb.fill("neon"); pg.wait_for_timeout(2000)
    body = pg.inner_text("body")
    check("search shows real 'Neon Drive'", "Neon Drive" in body)

    # 11-12. play -> currentTime advances (click the row's play button)
    play_neon(pg)
    st = pstate(pg)
    check("player state playing=true", st["playing"])
    check("track title is Neon Drive", st["title"] == "Neon Drive")
    t1 = st["t"]; pg.wait_for_timeout(3000); t2 = pstate(pg)["t"]
    check(f"currentTime advances ({t1:.2f} -> {t2:.2f})", t2 > t1 + 1)

    # 13. navigate Home/Library without stopping
    pg.goto(BASE + "/#/"); pg.wait_for_timeout(2000)
    sth = pstate(pg)
    check("Home: still playing", sth["playing"] and sth["title"] == "Neon Drive")
    pg.goto(BASE + "/#/library"); pg.wait_for_timeout(2000)
    stl = pstate(pg)
    check("Library: still playing & advancing", stl["playing"] and stl["t"] > t2)

    check("no page JS errors", len(errors) == 0)
    if errors: print("ERRORS:", errors[:3])

    # 14. final logout
    pg.goto(BASE + "/#/profile"); pg.wait_for_timeout(1200)
    try: pg.get_by_role("button", name="Выйти из аккаунта").click(); pg.wait_for_timeout(1500)
    except Exception: pass
    check("final logout", "/login" in pg.url)

    # --- mobile 390x844 ---
    mctx = b.new_context(viewport={"width":390,"height":844})
    mp = mctx.new_page()
    def overflow(page): return page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1")
    mp.goto(BASE + "/#/login"); mp.wait_for_timeout(1500)
    check("mobile Login no h-scroll", not overflow(mp))
    mp.goto(BASE + "/#/register"); mp.wait_for_timeout(1200)
    check("mobile Register no h-scroll", not overflow(mp))
    mp.goto(BASE + "/#/login"); mp.wait_for_timeout(1200)
    do_login(mp, EMAIL, PW); mp.wait_for_timeout(1500)
    mp.goto(BASE + "/#/"); mp.wait_for_timeout(2500)
    check("mobile Home no h-scroll", not overflow(mp))
    mp.goto(BASE + "/#/search"); mp.wait_for_timeout(1500)
    check("mobile Search no h-scroll", not overflow(mp))
    mp.goto(BASE + "/#/feed"); mp.wait_for_timeout(1500)
    check("mobile Feed no h-scroll", not overflow(mp))
    mp.goto(BASE + "/#/search"); mp.wait_for_timeout(1200)
    msb = mp.query_selector("main input, input"); msb.fill("neon"); mp.wait_for_timeout(2000)
    try:
        play_neon(mp)
        check("mobile player plays audio", pstate(mp)["playing"])
    except Exception as e:
        print("mobile play err", e); check("mobile player plays audio", False)
    mctx.close()
    b.close()

print("\nRESULT:", "ALL PASS" if not fails else f"{len(fails)} FAILED: {fails}")
sys.exit(0 if not fails else 1)
