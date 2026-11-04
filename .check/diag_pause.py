import asyncio, json
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome")
        pg = await b.new_page(viewport={"width":1280,"height":800})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        # login as existing test user (registered in prior runs) - use fresh register instead
        import time
        ts=str(int(time.time()))
        await pg.goto("http://localhost:5173/#/register"); await pg.wait_for_timeout(800)
        for sel,val in [("input[name='email']",f"diag{ts}@delta.test"),("input[name='username']",f"diag{ts}"),("input[name='password']","Delta12345!"),("input[name='name']","Diag User")]:
            try: await pg.fill(sel,val)
            except Exception as e: print("fill fail",sel,e)
        btn=pg.locator("button[type=submit]")
        if await btn.count(): await btn.first.click()
        await pg.wait_for_timeout(2500)
        await pg.goto("http://localhost:5173/#/search"); await pg.wait_for_timeout(1200)
        await pg.fill("input[type=search], input[placeholder*='оиск'], input[placeholder*='ука']", "neon")
        await pg.wait_for_timeout(1200)
        row=pg.locator("text=Neon Drive").first
        await row.locator('xpath=ancestor::div[contains(@class,"group")]').locator('button[aria-label^="Играть"]').first.click()
        await pg.wait_for_timeout(2000)
        st=lambda: pg.evaluate("()=>JSON.parse(JSON.stringify(window.__deltaPlayer.getState(), (k,v)=>typeof v==='function'?undefined:v))")
        print("before pause:", {k:v for k,v in (await st()).items() if k in ("isPlaying","currentTime")})
        # find ALL buttons with aria-label anywhere
        labels = await pg.evaluate("""()=>Array.from(document.querySelectorAll('button[aria-label]')).map(b=>({al:b.getAttribute('aria-label'),vis:!!(b.offsetWidth||b.offsetHeight),rect:b.getBoundingClientRect().toJSON()})).filter(x=>['Пауза','Воспроизвести','Следующий трек'].includes(x.al))""")
        print("found bar buttons:", json.dumps(labels, ensure_ascii=False))
        # click via DOM directly
        await pg.evaluate("""()=>{const b=Array.from(document.querySelectorAll('button[aria-label]')).find(x=>x.getAttribute('aria-label')==='Пауза'); b&&b.click();}""")
        await pg.wait_for_timeout(900)
        s1=await st()
        print("after DOM-click pause:", {k:v for k,v in s1.items() if k in ("isPlaying","currentTime")})
        await pg.wait_for_timeout(1000)
        s2=await st()
        print("1s later:", {k:v for k,v in s2.items() if k in ("isPlaying","currentTime")})
        # element truth
        el = await pg.evaluate("""()=>{const a=document.querySelector('audio');return null; }""")
        print("ERRS:", errs[:3])
        await b.close()
asyncio.run(main())
