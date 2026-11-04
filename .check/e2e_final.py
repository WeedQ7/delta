import asyncio, json, sys
from playwright.async_api import async_playwright

PASS=[]; FAIL=[]
def ok(name): PASS.append(name); print("PASS:", name)
def bad(name, err=""): FAIL.append((name,err)); print("FAIL:", name, "|", str(err)[:150])

async def state(pg): return await pg.evaluate("() => window.__deltaPlayer.getState()")

async def main():
    tag = "u%s" % (int(asyncio.get_event_loop().time()) % 100000)
    email = f"{tag}@delta.test"; uname = f"t{tag}"; pw = "TestPass123!"
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome", headless=True, args=["--no-sandbox"])
        # ---------- desktop scenario ----------
        pg = await b.new_page(viewport={"width":1280,"height":900})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        reqs=[]; pg.on("response", lambda r: reqs.append((r.status, r.url)) if r.status>=400 else None)
        try:
            await pg.goto("http://localhost:5173/#/")
            await pg.wait_for_timeout(1200)
            body = await pg.locator("body").inner_text()
            ok("anon redirect to /login") if "#/login" in pg.url and ("С возвращением" in body or "Войти" in body) else bad("anon redirect", (pg.url, body[:80]))
            await pg.click('a[href="#/register"], a:has-text("Зарегистрироваться")')
            await pg.wait_for_timeout(600)
            await pg.locator('input[autocomplete="email"]').fill(email)
            await pg.locator('input[placeholder*="nova_wave"], input[autocomplete="username"]').first.fill(uname)
            dname = pg.locator('form input:not([type="email"]):not([type="password"])')
            if await dname.count() >= 2:
                await dname.nth(1).fill("Test User")
            await pg.locator('input[autocomplete="new-password"]').first.fill(pw)
            await pg.locator('input[autocomplete="new-password"]').nth(1).fill(pw)
            await pg.click('button[type="submit"]')
            await pg.wait_for_timeout(2000)
            ok("register via UI -> app opens") if "#/login" not in pg.url else bad("register via UI", pg.url)
            await pg.goto("http://localhost:5173/#/profile"); await pg.wait_for_timeout(1200)
            txt = await pg.locator("main").inner_text()
            ok("profile shows new user") if uname in txt or "Test User" in txt else bad("profile", txt[:100])
            # logout via profile button
            lo = pg.locator('button:has-text("Выйти")').first
            if await lo.count(): await lo.click(); await pg.wait_for_timeout(1200)
            ok("logout -> login page") if "#/login" in pg.url else bad("logout", pg.url)
            # login again
            await pg.locator('input[autocomplete="username"]').fill(email)
            await pg.locator('input[type="password"]').fill(pw)
            await pg.click('button[type="submit"]'); await pg.wait_for_timeout(1500)
            ok("login by email") if "#/login" not in pg.url else bad("login", pg.url)
            await pg.reload(); await pg.wait_for_timeout(1500)
            ok("session restored after reload") if "#/login" not in pg.url else bad("reload session", pg.url)
            # search + play
            await pg.goto("http://localhost:5173/#/search"); await pg.wait_for_timeout(800)
            await pg.locator('input[placeholder*="Треки"]').first.fill("neon")
            await pg.wait_for_timeout(1500)
            row = pg.locator('div.group:has-text("Neon Drive")').first
            ok("search neon finds Neon Drive") if await row.count() else bad("search neon")
            # play the whole search result list as context queue (2+ tracks)
            await row.locator('button[aria-label^="Играть"]').first.click()
            await pg.wait_for_timeout(2500)
            st = await state(pg)
            # build a 2-track queue: play Neon Drive with the whole search context,
            # then add another track from the Home trending shelf to the queue
            allrows = pg.locator('div.group button[aria-label^="Играть"]')
            n_all = await allrows.count()
            print("INFO playable rows:", n_all)
            ok("play starts (playing=true)") if st["isPlaying"] else bad("play start", st)
            t1 = st["currentTime"]; ok("currentTime advances >1s") if t1 >= 1.0 else bad("time advance", t1)
            # navigate without stopping
            await pg.goto("http://localhost:5173/#/"); await pg.wait_for_timeout(1500)
            st2 = await state(pg)
            qbtns = pg.locator('button[aria-label="Добавить в очередь"]')
            qb_cnt = await qbtns.count()
            clicked_q = False
            for i in range(qb_cnt):
                txt = await qbtns.nth(i).evaluate("el => (el.closest('div.group')?.textContent||'')")
                if "Neon Drive" not in txt:
                    await qbtns.nth(i).click(); clicked_q = True; break
            await pg.wait_for_timeout(600)
            stq = await state(pg)
            print("INFO queue buttons on home:", qb_cnt, "| queue len:", len(stq["queue"]))
            ok("add-to-queue grows queue") if clicked_q and len(stq["queue"]) >= 2 else bad("queue build", (clicked_q, len(stq["queue"])))
            await pg.goto("http://localhost:5173/#/library"); await pg.wait_for_timeout(1200)
            st3 = await state(pg)
            ok("music survives navigation") if st3["isPlaying"] and st3["currentTime"] > t1 else bad("continuity", (t1, st2["currentTime"], st3["currentTime"]))
            # --- PlayerBar controls: real clicks on the fixed bottom bar (z-40) ---
            async def click_bar(label):
                for _ in range(30):
                    btns = pg.locator('div.fixed.bottom-0 button[aria-label]')
                    cnt = await btns.count()
                    for i in range(cnt):
                        al = await btns.nth(i).get_attribute("aria-label") or ""
                        if al == label:
                            try:
                                await btns.nth(i).click(timeout=2000); return True
                            except Exception:
                                await btns.nth(i).click(force=True, timeout=2000); return True
                    await pg.wait_for_timeout(250)
                return False
            clicked = await click_bar("Пауза")
            await pg.wait_for_timeout(800)
            stp = await state(pg)
            ok("pause stops playback (PlayerBar)") if clicked and not stp["isPlaying"] else bad("pause", (clicked, stp["isPlaying"]))
            paused_t = stp["currentTime"]
            await pg.wait_for_timeout(1000)
            stp2 = await state(pg)
            ok("time frozen while paused") if abs(stp2["currentTime"]-paused_t)<0.6 else bad("frozen", (paused_t, stp2["currentTime"]))
            ok("resume button found & clicked") if await click_bar("Воспроизвести") else bad("resume click")
            await pg.wait_for_timeout(1500)
            st_r = await state(pg)
            ok("resume works") if st_r["isPlaying"] and st_r["currentTime"]>paused_t else bad("resume", st_r["isPlaying"])
            prev_id = (st_r.get("current") or {}).get("id")
            ok("next button found & clicked") if await click_bar("Следующий трек") else bad("next click")
            await pg.wait_for_timeout(1500)
            st_n = await state(pg)
            ok("next track switches queue item") if (st_n.get("current") or {}).get("id") != prev_id else bad("next", (prev_id, len(st_n["queue"]), (st_n.get("current") or {}).get("title")))
            ok("no uncaught JS errors") if not errs else bad("js errors", errs[:2])
            api4xx = [r for r in reqs if "/api/" in r[1]]
            print("INFO 4xx API responses:", len(api4xx), api4xx[:4])
            await pg.close()
        except Exception as e:
            bad("desktop scenario exception", e)
        # ---------- mobile 390x844 ----------
        try:
            m = await b.new_page(viewport={"width":390,"height":844})
            for route,name in [("/#/login","Login"),("/#/register","Register")]:
                await m.goto("http://localhost:5173"+route); await m.wait_for_timeout(900)
                ov = await m.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                ok(f"mobile {name}: no h-scroll") if ov<=0 else bad(f"mobile {name} overflow", ov)
            await m.goto("http://localhost:5173/#/login"); await m.wait_for_timeout(900)
            await m.locator('input[autocomplete="username"]').fill(email)
            await m.locator('input[type="password"]').fill(pw)
            await m.click('button[type="submit"]'); await m.wait_for_timeout(1500)
            for route,name in [("/#/","Home"),("/#/search","Search"),("/#/feed","Feed")]:
                await m.goto("http://localhost:5173"+route); await m.wait_for_timeout(1100)
                ov = await m.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                ok(f"mobile {name}: no h-scroll") if ov<=0 else bad(f"mobile {name} overflow", ov)
            if "#/login" in m.url:
                await m.locator('input[autocomplete="username"]').fill(email)
                await m.locator('input[type="password"]').fill(pw)
                await m.click('button[type="submit"]'); await m.wait_for_timeout(1500)
            await m.goto("http://localhost:5173/#/search"); await m.wait_for_timeout(1200)
            si = m.locator('input[aria-label="Поиск музыки"]')
            if not await si.count():
                await m.goto("http://localhost:5173/#/"); await m.wait_for_timeout(1000)
                si = m.locator('input[aria-label="Поиск музыки"], input[type="search"]')
            await si.first.fill("neon"); await m.wait_for_timeout(1300)
            r0 = m.locator('div.group:has-text("Neon Drive")').first
            await r0.locator('button[aria-label^="Играть"]').first.click(); await m.wait_for_timeout(2000)
            s = await state(m)
            ok("mobile playback works") if s["isPlaying"] and s["currentTime"]>0.5 else bad("mobile playback", s)
            bar = await m.evaluate("""()=>{const els=[...document.querySelectorAll('*')].filter(e=>e.textContent.includes('Neon Drive')||true);return true;}""")
            await m.close()
        except Exception as e:
            bad("mobile scenario exception", e)
        await b.close()
    print("\n==== RESULT: %d PASS / %d FAIL ====" % (len(PASS), len(FAIL)))
    for f in FAIL: print("FAILED:", f)
    sys.exit(0 if not FAIL else 1)

asyncio.run(main())
