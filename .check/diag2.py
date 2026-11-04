import asyncio, json, time
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome", headless=True, args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":1280,"height":800})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        ts=str(int(time.time()))
        await pg.goto("http://localhost:5173/#/register"); await pg.wait_for_timeout(900)
        for sel,val in [("input[name='email']",f"dg{ts}@delta.test"),("input[name='username']",f"dg{ts}"),("input[name='password']","Delta12345!"),("input[name='name']","Diag")]:
            try: await pg.fill(sel,val)
            except Exception as e: print("fillfail",sel)
        await pg.locator("button[type=submit]").first.click(force=True)
        await pg.wait_for_timeout(2500)
        st=lambda: pg.evaluate("()=>JSON.parse(JSON.stringify(window.__deltaPlayer.getState(),(k,v)=>typeof v==='function'?undefined:v))")
        await pg.goto("http://localhost:5173/#/search"); await pg.wait_for_timeout(1200)
        inp=pg.locator("input").filter(has_not=pg.locator("x")) # fallback below
        try:
            await pg.fill("main input, header input", "neon")
        except Exception:
            await pg.evaluate("""()=>{const i=document.querySelector('input'); const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; s.call(i,'neon'); i.dispatchEvent(new Event('input',{bubbles:true}));}""")
        await pg.wait_for_timeout(1500)
        r=await pg.evaluate("""()=>{
          const rows=Array.from(document.querySelectorAll('div.group'));
          const row=rows.find(r=>r.textContent.includes('Neon Drive'));
          if(!row) return 'NO ROW';
          const btns=Array.from(row.querySelectorAll('button')).map(b=>({al:b.getAttribute('aria-label'),disabled:b.disabled}));
          const play=Array.from(row.querySelectorAll('button')).find(b=>(b.getAttribute('aria-label')||'').startsWith('Играть'));
          if(!play) return JSON.stringify(btns);
          play.click();
          return 'CLICKED '+ (play.disabled?'DIS':'OK');
        }""")
        print("play click:", r)
        await pg.wait_for_timeout(2000)
        s=await st()
        print("after play:", s.get("isPlaying"), round(s.get("currentTime") or 0,2), (s.get("current") or {}).get("title"), "qLen", len(s.get("queue",[])), "qIdx", s.get("queueIndex"))
        # pause via store call directly through the real button DOM click
        pr=await pg.evaluate("""()=>{const b=Array.from(document.querySelectorAll('button[aria-label]')).find(x=>x.getAttribute('aria-label')==='Пауза'); if(!b) return 'NO BTN'; b.click(); return 'CLICKED';}""")
        print("pause:", pr)
        await pg.wait_for_timeout(900)
        s=await st(); print("after pause:", s.get("isPlaying"), round(s.get("currentTime") or 0,2))
        await pg.wait_for_timeout(1000)
        s=await st(); print("frozen check:", s.get("isPlaying"), round(s.get("currentTime") or 0,2))
        nr=await pg.evaluate("""()=>{const b=Array.from(document.querySelectorAll('button[aria-label]')).find(x=>x.getAttribute('aria-label')==='Следующий трек'); if(!b) return 'NO BTN'; b.click(); return 'CLICKED';}""")
        print("next:", nr)
        await pg.wait_for_timeout(1500)
        s=await st(); print("after next:", s.get("isPlaying"), (s.get("current") or {}).get("title"), "qIdx", s.get("queueIndex"))
        # library nav errors
        await pg.goto("http://localhost:5173/#/library"); await pg.wait_for_timeout(1500)
        print("ERRS:", json.dumps(errs[:3], ensure_ascii=False))
        await b.close()
asyncio.run(main())
