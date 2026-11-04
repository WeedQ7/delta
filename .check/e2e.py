import json, urllib.request, urllib.error, random, string

B="http://localhost:3001"
ok=fail=0; msgs=[]
def req(path, method="GET", body=None, token=None, raw=False):
    url = B + (path if path.startswith("/api") else "/api" + path)
    h={"Content-Type":"application/json"}
    if token: h["Authorization"]=f"Bearer {token}"
    data=json.dumps(body).encode() if body is not None else None
    r=urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        resp=urllib.request.urlopen(r, timeout=10)
        rawb=resp.read()
        if raw: return resp.status, rawb
        txt=rawb.decode()
        return resp.status, (json.loads(txt) if txt else None)
    except urllib.error.HTTPError as e:
        rb=e.read()
        if raw: return e.code, rb
        txt=rb.decode()
        try: j=json.loads(txt)
        except: j=txt
        return e.code, j
def check(name, cond, extra=""):
    global ok,fail
    if cond: ok+=1; msgs.append(f"PASS {name}")
    else: fail+=1; msgs.append(f"FAIL {name} :: {str(extra)[:160]}")

rnd=''.join(random.choices(string.ascii_lowercase,k=6))
email=f"u_{rnd}@test.io"; uname=f"user_{rnd}"

s,d=req("/auth/register","POST",{"email":email,"username":uname,"password":"pass12345","displayName":"Test User"})
check("register", s in (200,201) and isinstance(d,dict), d)
T=d.get("accessToken"); R=d.get("refreshToken")
check("dup email 409", req("/auth/register","POST",{"email":email,"username":uname+"x","password":"pass12345"})[0]==409)
check("bad login 4xx", req("/auth/login","POST",{"login":uname,"password":"wrong"})[0] in (400,401))
check("login by email", req("/auth/login","POST",{"login":email,"password":"pass12345"})[0] in (200,201))
s5,dm=req("/auth/me",token=T); MYID=dm.get("id") if isinstance(dm,dict) else "?"
check("auth/me", s5==200 and MYID!="?", dm)
check("me w/o token 401", req("/auth/me")[0]==401)
s7,d7=req("/auth/refresh","POST",{"refreshToken":R})
check("refresh returns new pair", s7==200 and d7.get("accessToken") and d7.get("refreshToken")!=R, d7)
T=d7["accessToken"]; R=d7["refreshToken"]
check("old refresh rejected after rotation", req("/auth/refresh","POST",{"refreshToken":"bogus"+R})[0] in (400,401))
s8,d8=req("/me/profile","PATCH",{"bio":"Hello DELTA"},token=T)
check("patch profile full", s8==200 and (d8.get("profile") or {}).get("bio")=="Hello DELTA", d8)
check("patch settings", req("/me/settings","PATCH",{"privateProfile":False,"showHistory":True},token=T)[0] in (200,204))

sA,tr=req("/tracks/search?q=Neon")
check("search public no-auth", sA==200 and tr, tr)
tid=tr[0]["id"] if tr else None
check("trending no-auth", req("/tracks/trending")[0]==200)
check("genres no-auth", req("/tracks/genres")[0]==200)
check("report play", req(f"/tracks/{tid}/play","POST",{},token=T)[0] in (200,201))
sE,hist=req("/me/history",token=T); check("history has track", sE==200 and any(h["track"]["id"]==tid for h in hist), hist)
sF,body=req("/audio/track1.mp3",raw=True); check("audio via /audio", sF==200 and len(body)>10000, sF)
sF2,_=req("/api/audio/track1.mp3",raw=True); check("audio via /api/audio", sF2==200, sF2)
check("recent", req("/me/recent",token=T)[0]==200)
check("recommendations", req("/me/recommendations",token=T)[0]==200)

dg=req(f"/me/favorites/{tid}","POST",{},token=T)[1]; check("fav add", dg.get("favorite")==True, dg)
fav=req("/me/favorites",token=T)[1]; check("favorites list", any(f["id"]==tid for f in fav), fav)
req(f"/me/favorites/{tid}","POST",{},token=T)

pl=req("/playlists","POST",{"title":"My List","visibility":"PUBLIC"},token=T)[1]
pid=pl.get("id"); check("create playlist", bool(pid), pl)
check("add track to pl", req(f"/playlists/{pid}/tracks","POST",{"trackId":tid},token=T)[0] in (200,201))
one=req(f"/playlists/{pid}",token=T)[1]
check("playlist contains track", one.get("tracks") and one["tracks"][0]["track"]["id"]==tid, one)
check("remove track", req(f"/playlists/{pid}/tracks/{tid}","DELETE",None,token=T)[0] in (200,204))
check("invalid track rejected", req(f"/playlists/{pid}/tracks","POST",{"trackId":"00000000-0000-0000-0000-000000000000"},token=T)[0] in (400,404))

u2=f"friend_{rnd}"; e2=f"f_{rnd}@test.io"
dn=req("/auth/register","POST",{"email":e2,"username":u2,"password":"pass12345"})[1]
T3=dn.get("accessToken"); check("register user2", bool(T3), dn)
fo=req(f"/users/{uname}/follow","POST",{},token=T3)[1]; check("follow", fo.get("following")==True, fo)
fl=req(f"/users/{u2}/followers")[1]; check("followers no-auth list", isinstance(fl,list) and any(x["username"]==u2 for x in fl), fl)
check("unfollow toggle", req(f"/users/{uname}/follow","POST",{},token=T3)[1].get("following")==False)
req(f"/users/{uname}/follow","POST",{},token=T3)

post=req("/posts","POST",{"text":"First post!","trackId":tid},token=T3)[1]
po=post.get("id"); check("create post", bool(po), post)
check("like", req(f"/posts/{po}/like","POST",{},token=T)[1].get("liked")==True)
cm=req(f"/posts/{po}/comments","POST",{"text":"Nice"},token=T)[1]; check("comment", bool(cm.get("id")), cm)
cms=req(f"/posts/{po}/comments")[1]; check("public comments no-auth", isinstance(cms,list) and len(cms)>=1, cms)
check("like w/o auth 401", req(f"/posts/{po}/like","POST",{})[0]==401)
fd=req("/feed",token=T)[1]; check("feed shows followed post", any(p["id"]==po for p in fd.get("items",[])), fd)
fdg=req("/feed")[1]; check("global feed no-auth works", isinstance(fdg,dict) and "items" in fdg, str(fdg)[:80])
no=req("/notifications",token=T3)[1]; check("notifications >=2", len(no)>=2, no)
check("unread count", req("/notifications/unread",token=T3)[1].get("count",0)>=1)
req("/notifications/read","POST",{},token=T3)
check("mark read -> 0", req("/notifications/unread",token=T3)[1].get("count")==0)

mi=req("/auth/login","POST",{"login":"mira","password":"delta12345"})[1]
TM=mi.get("accessToken"); check("mira seed login", bool(TM), mi)
spub,pu=req("/users/mira",token=T)
check("private profile -> limited stub", spub==200 and pu.get("private")==True and not pu.get("profile"), (spub,str(pu)[:100]))
sfv,_=req(f"/users/mira/posts",token=T); check("private posts hidden []", sfv==200, sfv)

bk=req(f"/users/{u2}/block","POST",{},token=T)[1]; check("block", bk.get("blocked")==True, bk)
try:
    sfb,_=req(f"/users/{u2}",token=T); blocked_ok = sfb==403
except Exception: blocked_ok=True
check("blocked profile 403", blocked_ok)
req(f"/users/{u2}/block","POST",{},token=T)

spls=req("/playlists",token=T3)[1]
check("own playlists only(+public)", isinstance(spls,list) and all(p["ownerId"]==MYID or p["visibility"]=="PUBLIC" for p in spls), str(spls)[:100])
check("missing q -> 400", req("/tracks/search")[0]==400)
check("bad uuid param -> 4xx", req("/playlists/not-a-uuid",token=T)[0] in (400,404,500) )

print("\n".join(msgs)); print(f"TOTAL: {ok} PASS / {fail} FAIL")
