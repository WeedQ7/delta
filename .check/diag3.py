import asyncio, json
from playwright.async_api import async_playwright

async def main():
    email="dg3%s@delta.test" % (int(asyncio.get_event_loop().time())%100000)
    uname=email.split('@')[0]; pw="TestPass123!"
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome", headless=True, args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":1280,"height":900})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:160]))
        await pg.goto("http://localhost:5173/#/register"); await pg.wait_for_timeout(800)
        await pg.locator('input[autocomplete="email"]').fill(email)
        await pg.locator('input[placeholder*="nova_wave"], input[autocomplete="username"]').first.fill(uname)
        dn = pg.locator('form input:not([type="email"]):not([type="password"])')
        if await dn.count()>=2: await dn.nth(1).fill("Dg Three")
        await pg.locator('input[autocomplete="new-password"]').first.fill(pw)
        await pg.locator('input[autocomplete="new-password"]').nth(1).fill(pw)
        await pg.click('button[type="submit"]'); await pg.wait_for_timeout(2000)
        await pg.goto("http://localhost:5173/#/search"); await pg.wait_for_timeout(900)
        await pg.locator('input[placeholder*="Треки"]').first.fill("neon")
        await pg.wait_for_timeout(1500)
        row = pg.locator('div.group:has-text("Neon Drive")').first
        await row.locator('button[aria-label^="Играть"]').first.click()
        await pg.wait_for_timeout(2500)
        st = await pg.evaluate("()=>window.__deltaPlayer.getState()")
        print("playing:", st["isPlaying"], "t:", round(st["currentTime"],2))
        # count buttons in the fixed bottom bar exactly like click_bar does
        cnt = await pg.locator('div.fixed.bottom-0 button[aria-label]').count()
        print("click_bar selector finds buttons:", cnt)
        allbtns = await pg.evaluate("""()=>{const out=[];for(const b of document.querySelectorAll('button')){const al=b.getAttribute('aria-label')||'';if(/Пауза|Воспроизвести|Следующий трек/.test(al)){const r=b.getBoundingClientRect();out.push([al,Math.round(r.y),Math.round(r.height),b.className.slice(0,40)]);}}return out;}""")
        print("matching buttons w/ rects:", json.dumps(allbtns, ensure_ascii=False))
        # try the actual click
        btns = pg.locator('div.fixed.bottom-0 button[aria-label]')
        done=False
        for i in range(await btns.count()):
            al = await btns.nth(i).get_attribute("aria-label") or ""
            if al=="Пауза":
                try:
                    await btns.nth(i).click(timeout=3000); done=True
                except Exception as e:
                    print("CLICK EXC:", str(e)[:200])
                    try:
                        await btns.nth(i).click(force=True, timeout=3000); done=True
                    except Exception as e2:
                        print("FORCE EXC:", str(e2)[:150])
                break
        await pg.wait_for_timeout(800)
        st2 = await pg.evaluate("()=>window.__deltaPlayer.getState()")
        print("clicked:", done, "-> isPlaying now:", st2["isPlaying"])
        print("JS ERRORS:", errs[:3])
        await pg.close(); await b.close()

asyncio.run(main())
