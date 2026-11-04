import asyncio, json
from playwright.async_api import async_playwright

async def main():
    tag = "z%s" % (int(asyncio.get_event_loop().time()) % 100000)
    email=f"{tag}@delta.test"; uname=f"t{tag}"; pw="TestPass123!"
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome", headless=True, args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":1280,"height":900})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        cons=[]; pg.on("console", lambda m: cons.append(m.type+":"+m.text[:120]) if m.type in ("error","warning") else None)
        await pg.goto("http://localhost:5173/#/register"); await pg.wait_for_timeout(800)
        await pg.locator('input[autocomplete="email"]').fill(email)
        await pg.locator('input[placeholder*="nova_wave"], input[autocomplete="username"]').first.fill(uname)
        dname = pg.locator('form input:not([type="email"]):not([type="password"])')
        if await dname.count() >= 2: await dname.nth(1).fill("Diag User")
        await pg.locator('input[autocomplete="new-password"]').first.fill(pw)
        await pg.locator('input[autocomplete="new-password"]').nth(1).fill(pw)
        await pg.click('button[type="submit"]'); await pg.wait_for_timeout(2000)
        await pg.goto("http://localhost:5173/#/search"); await pg.wait_for_timeout(800)
        await pg.locator('input[placeholder*="Треки"]').first.fill("neon")
        await pg.wait_for_timeout(1800)
        rows = pg.locator('div.group:has-text("Neon Drive")')
        print("rows count:", await rows.count())
        btn = rows.first.locator('button[aria-label^="Играть"]')
        print("btn count:", await btn.count())
        await btn.first.click(force=True)
        for t in (300, 1000, 2500, 4000):
            await pg.wait_for_timeout(t)
            st = await pg.evaluate("()=>{const s=window.__deltaPlayer.getState();return {cur:s.current&&s.current.title, playing:s.isPlaying, ct:s.currentTime, q:s.queue.length};}")
            dom = await pg.evaluate("""()=>{const a=document.querySelector('audio');if(!a)return 'NO AUDIO ELEMENT';return {src:a.src.slice(-40), paused:a.paused, ct:a.currentTime, rs:a.readyState, err:a.error&&a.error.code+'/'+a.error.message};}""")
            print(f"after +{t}: store={st} dom={dom}")
        print("pageerrors:", errs[:5])
        print("console:", cons[:10])
        await pg.close(); await b.close()
asyncio.run(main())
