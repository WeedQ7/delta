import asyncio, json
from playwright.async_api import async_playwright

async def main():
    email="diag%s@delta.test" % (int(asyncio.get_event_loop().time())%100000)
    uname=(email.split('@')[0]); pw="TestPass123!"
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome", headless=True, args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":1280,"height":900})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
        await pg.goto("http://localhost:5173/#/register"); await pg.wait_for_timeout(800)
        await pg.locator('input[autocomplete="email"]').fill(email)
        await pg.locator('input[placeholder*="nova_wave"], input[autocomplete="username"]').first.fill(uname)
        dn = pg.locator('form input:not([type="email"]):not([type="password"])')
        if await dn.count()>=2: await dn.nth(1).fill("Diag User")
        await pg.locator('input[autocomplete="new-password"]').first.fill(pw)
        await pg.locator('input[autocomplete="new-password"]').nth(1).fill(pw)
        await pg.click('button[type="submit"]'); await pg.wait_for_timeout(2000)
        print("URL after register:", pg.url)
        await pg.goto("http://localhost:5173/#/search"); await pg.wait_for_timeout(1000)
        await pg.locator('input[placeholder*="Треки"]').first.fill("neon")
        await pg.wait_for_timeout(1500)
        row = pg.locator('div.group:has-text("Neon Drive")').first
        print("row count:", await row.count())
        qbtns = pg.locator('div.group button[aria-label="Добавить в очередь"]')
        print("queue buttons:", await qbtns.count())
        for i in range(await qbtns.count()):
            txt = await qbtns.nth(i).evaluate("el => (el.closest('div.group')?.textContent||'').slice(0,60)")
            print(f"  btn{i} rowtext: {txt!r}")
        # click the first queue button directly
        if await qbtns.count():
            await qbtns.first.click(); await pg.wait_for_timeout(500)
            st = await pg.evaluate("()=>window.__deltaPlayer.getState()")
            print("after direct queue click: queue len =", len(st["queue"]), [t["title"] for t in st["queue"]])
        # play neon
        await row.locator('button[aria-label^="Играть"]').first.click()
        await pg.wait_for_timeout(2000)
        st = await pg.evaluate("()=>window.__deltaPlayer.getState()")
        print("playing:", st["isPlaying"], "t:", st["currentTime"], "queue:", len(st["queue"]))
        # dump ALL buttons with aria-label and their container class chain
        info = await pg.evaluate("""()=>{const out=[];for(const b of document.querySelectorAll('button[aria-label]')){
          const al=b.getAttribute('aria-label'); if(/Пауза|Воспроизвести|Следующий/.test(al)){
            let el=b, chain=[]; while(el&&chain.length<4){chain.push((el.className||'').toString().slice(0,60)); el=el.parentElement;}
            const r=b.getBoundingClientRect(); out.push({al, rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)], chain});}}
          return out;}""")
        print(json.dumps(info, ensure_ascii=False, indent=1))
        print("JS ERRORS:", errs[:4])
        await pg.close(); await b.close()

asyncio.run(main())
