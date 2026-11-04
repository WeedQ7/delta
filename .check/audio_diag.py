import asyncio, json
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(
            executable_path="/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
            headless=True, args=["--autoplay-policy=no-user-gesture-required","--no-sandbox"])
        pg = await b.new_page(viewport={"width":1280,"height":900})
        logs=[]
        pg.on("console", lambda m: logs.append(m.type+":"+m.text[:200]))
        await pg.goto("http://localhost:5173/#/login")
        await pg.wait_for_timeout(1000)
        # login form uses two .input fields; first is identifier (no type attr), second password
        await pg.locator('input[autocomplete="username"]').first.fill("alice")
        await pg.locator('input[type="password"]').fill("delta12345")
        await pg.click('button[type="submit"]')
        await pg.wait_for_timeout(1500)
        print("URL after login:", pg.url)
        await pg.evaluate("""() => {
          window.__diag = [];
          const origPlay = HTMLAudioElement.prototype.play;
          HTMLAudioElement.prototype.play = function(){
            window.__diag.push('play() src='+this.src);
            const pr = origPlay.call(this);
            pr.then(()=>window.__diag.push('play() RESOLVED')).catch(e=>window.__diag.push('play() REJECTED '+e.name+': '+e.message));
            return pr;
          };
        }""")
        await pg.goto("http://localhost:5173/#/search")
        await pg.wait_for_timeout(1000)
        inp = pg.locator('input').filter(has_not=pg.locator("x")).first
        # find search input by placeholder
        si = pg.locator('input[placeholder]').first
        print("search placeholder:", await si.get_attribute("placeholder"))
        await si.fill("neon")
        await pg.wait_for_timeout(1500)
        row = pg.locator('div.group:has-text("Neon Drive")').first
        if not await row.count():
            print("NO ROW. page text sample:", (await pg.locator("main").inner_text())[:300])
        else:
            print("row visible:", await row.is_visible())
            labels = await row.locator("button").evaluate_all("bs=>bs.map(b=>b.getAttribute('aria-label'))")
            print("buttons in row:", labels)
            btn = row.locator('button[aria-label*="Играть"], button[aria-label*="играть"]').first
            await btn.click()
            await pg.wait_for_timeout(2500)
            st = await pg.evaluate("() => window.__deltaPlayer.getState()")
            cur = st.get("current") or {}
            print("STATE playing=%s time=%.2f dur=%.2f title=%s url=%s" % (st["isPlaying"], st["currentTime"], st["duration"], cur.get("title"), cur.get("url")))
            print("DIAG:", json.dumps(await pg.evaluate("()=>window.__diag")))
            # navigation continuity
            await pg.goto("http://localhost:5173/#/")
            await pg.wait_for_timeout(1500)
            st2 = await pg.evaluate("() => window.__deltaPlayer.getState()")
            print("AFTER HOME NAV playing=%s time=%.2f" % (st2["isPlaying"], st2["currentTime"]))
        print("CONSOLE ERRS:", [l for l in logs if 'error' in l.lower()][:8])
        await b.close()

asyncio.run(main())
