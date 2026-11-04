import asyncio, json, time
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome", headless=True, args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":1280,"height":900})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        ts=str(int(time.time()))
        await pg.goto("http://localhost:5173/#/register"); await pg.wait_for_timeout(900)
        await pg.locator('input[autocomplete="email"]').fill(f"dg{ts}@delta.test")
        await pg.locator('input[autocomplete="username"]').first.fill(f"dg{ts}")
        dname = pg.locator('form input:not([type="email"]):not([type="password"])')
        if await dname.count() >= 2: await dname.nth(1).fill("Diag User")
        await pg.locator('input[autocomplete="new-password"]').first.fill("TestPass123!")
        await pg.locator('input[autocomplete="new-password"]').nth(1).fill("TestPass123!")
        await pg.click('button[type="submit"]'); await pg.wait_for_timeout(2200)
        # search + play Neon Drive exactly like e2e_final
        await pg.goto("http://localhost:5173/#/search"); await pg.wait_for_timeout(800)
        await pg.locator('input[placeholder*="Треки"]').first.fill("neon")
        await pg.wait_for_timeout(1500)
        row = pg.locator('div.group:has-text("Neon Drive")').first
        await row.locator('button[aria-label^="Играть"]').first.click()
        await pg.wait_for_timeout(2500)
        # go home, add to queue like e2e
        await pg.goto("http://localhost:5173/#/"); await pg.wait_for_timeout(1500)
        qbtns = pg.locator('button[aria-label="Добавить в очередь"]')
        cnt = await qbtns.count()
        for i in range(cnt):
            txt = await qbtns.nth(i).evaluate("el => (el.closest('div.group')?.textContent||'')")
            if "Neon Drive" not in txt:
                await qbtns.nth(i).click(); break
        await pg.wait_for_timeout(600)
        # go library like e2e
        await pg.goto("http://localhost:5173/#/library"); await pg.wait_for_timeout(1200)
        st=lambda: pg.evaluate("()=>JSON.parse(JSON.stringify(window.__deltaPlayer.getState(),(k,v)=>typeof v==='function'?undefined:v))")
        s=await st(); print("state:", s.get("isPlaying"), round(s.get("currentTime") or 0,2), "qLen", len(s.get("queue",[])), "qIdx", s.get("queueIndex"))
        info = await pg.evaluate("""()=>{
          const bars=document.querySelectorAll('div.fixed.bottom-0');
          return {barCount: bars.length, labels: Array.from(document.querySelectorAll('div.fixed.bottom-0 button')).map(b=>b.getAttribute('aria-label')), playerPresent: !!document.querySelector('div.fixed.bottom-0 button[aria-label=\\"Пауза\\"]')};
        }""")
        print("bar info:", json.dumps(info, ensure_ascii=False))
        print("ERRS:", json.dumps(errs[:4], ensure_ascii=False))
        await b.close()
asyncio.run(main())
