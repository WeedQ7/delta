import sys, random, string, subprocess
from playwright.sync_api import sync_playwright

EXE = "/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome"
BASE = "http://localhost:5173"
suf = ''.join(random.choices(string.ascii_lowercase+string.digits, k=6))
EMAIL, USERNAME, PASSWORD = f"pw_{suf}@delta.test", f"pw{suf}", "Str0ngPass!23"

fails = []
def step(name, cond, extra=""):
    print(("PASS  " if cond else "FAIL  ") + name + ("" if cond else f"  | {str(extra)[:250]}"))
    if not cond: fails.append(name)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=EXE,
        args=["--no-sandbox","--autoplay-policy=no-user-gesture-required"])
    page = browser.new_context(viewport={"width":1280,"height":800}).new_page()
    page.set_default_timeout(15000)
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    # 1. Open app -> anon redirected to /login
    page.goto(BASE + "/", wait_until="domcontentloaded")
    try: page.wait_for_url("**/#/login**", timeout=10000)
    except Exception: pass
    step("app opens, anon redirected to /login", "/#/login" in page.url, page.url)

    # 2. Register link -> register page
    lk = page.get_by_role("link", name="Зарегистрироваться")
    if lk.count(): lk.first.click()
    else: page.goto(BASE+"/#/register")
    page.wait_for_selector("input[type=email]")
    step("register page rendered", True)

    # 3. Fill form and submit
    page.fill("input[type=email]", EMAIL)
    page.locator("input[placeholder*='nova_wave']").fill(USERNAME)
    ins = page.locator(".card input")
    ins.nth(2).fill("PW Test User")
    ins.nth(3).fill(PASSWORD)
    ins.nth(4).fill(PASSWORD)
    page.locator("button.btn-primary").click()
    try: page.wait_for_function("() => !location.hash.startsWith('#/login')", timeout=10000)
    except Exception: pass
    page.wait_for_timeout(1500)
    step("registered via UI -> landed in app", "/#/login" not in page.url, page.url)

    # 4. Verify user in PostgreSQL
    q = subprocess.run(["su","postgres","-c",
        'psql -d delta -t -A -c "SELECT username FROM \\"User\\" WHERE email=\'%s\'"' % EMAIL],
        capture_output=True, text=True)
    step("user persisted in PostgreSQL", q.stdout.strip()==USERNAME, q.stdout[:80]+q.stderr[:120])

    # 5. Logout via Profile
    page.goto(BASE+"/#/profile", wait_until="domcontentloaded")
    btn = page.get_by_role("button", name="Выйти из аккаунта")
    btn.wait_for(); btn.click()
    try: page.wait_for_url("**/#/login**", timeout=8000)
    except Exception: pass
    step("logout redirects to /login", "/#/login" in page.url, page.url)

    # 6. Login again
    page.locator(".card input").first.fill(EMAIL)
    page.fill("input[type=password]", PASSWORD)
    page.locator("button.btn-primary").click()
    try: page.wait_for_function("() => !location.hash.startsWith('#/login')", timeout=10000)
    except Exception: pass
    step("login by email works", "/#/login" not in page.url, page.url)

    # 7. Reload -> session restored
    page.reload(wait_until="domcontentloaded"); page.wait_for_timeout(2500)
    step("session restored after reload", "/#/login" not in page.url, page.url)

    # 8. Search neon
    page.goto(BASE+"/#/search", wait_until="domcontentloaded"); page.wait_for_timeout(1000)
    page.fill("input[aria-label='Поиск музыки']", "neon")
    page.wait_for_timeout(2000)
    body = page.inner_text("main")
    step("search shows real track Neon Drive", "Neon Drive" in body, body[:200])

    # 9. Play it
    played = False
    for sel in ["button[aria-label*='Neon']","[title*='Neon'] button","button[aria-label*='Воспроизвести']"]:
        loc = page.locator(sel)
        if loc.count():
            loc.first.click(); played=True; break
    if not played:
        row = page.locator("text=Neon Drive").first
        row.click(timeout=5000); played=True
    page.wait_for_timeout(3000)
    t = page.evaluate("""() => { const a=document.querySelector('audio');
        return a? {cur:a.currentTime,paused:a.paused,src:a.currentSrc}:null }""")
    ok_play = bool(t) and (t["cur"] > 0 or not t["paused"]) and "track" in (t["src"] or "")
    step("audio playing real MP3 (currentTime>0)", ok_play, t)

    # 10. Navigate Home — playback continues
    page.goto(BASE+"/#/", wait_until="domcontentloaded"); page.wait_for_timeout(2000)
    t2 = page.evaluate("() => { const a=document.querySelector('audio'); return a? {cur:a.currentTime,paused:a.paused}:null }")
    cont = bool(t2) and not t2["paused"] and t2["cur"] >= ((t or {}).get("cur",0))
    step("playback continues across navigation", cont, f"{t} -> {t2}")

    # 11. Mobile 390x844 overflow checks
    page.set_viewport_size({"width":390,"height":844})
    for route in ["/#/login","/#/register","/#/","/#/search"]:
        page.goto(BASE+route, wait_until="domcontentloaded"); page.wait_for_timeout(1500)
        ov = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
        step(f"no horizontal overflow at 390px on {route}", ov <= 1, f"overflow={ov}px")

    step("no uncaught page errors", len(errors)==0, "; ".join(errors)[:300])
    browser.close()

print("\nTOTAL:", "ALL PASS" if not fails else "FAILED: "+", ".join(fails))
sys.exit(0 if not fails else 1)
