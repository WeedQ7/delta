import json, random, urllib.request

BASE = "http://localhost:3001/api"

def req(path, method="GET", body=None, tok=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, method=method)
    r.add_header("content-type", "application/json")
    if tok:
        r.add_header("authorization", "Bearer " + tok)
    try:
        with urllib.request.urlopen(r, timeout=8) as resp:
            t = resp.read().decode()
            return resp.status, (json.loads(t) if t else None)
    except urllib.error.HTTPError as e:
        t = e.read().decode()
        try:
            return e.code, json.loads(t)
        except Exception:
            return e.code, t[:200]

tag = random.randint(10000, 99999)
st, reg = req("/auth/register", "POST", {
    "email": f"probe{tag}@delta.test",
    "username": f"pb{tag}",
    "password": "TestPass123!",
    "displayName": "Probe",
})
print("register:", st)
tok = reg["accessToken"]

st, pls = req("/playlists", tok=tok)
print("playlists list:", st, json.dumps(pls)[:400])

st, pl = req("/playlists", "POST", {"title": "ProbePL", "visibility": "PRIVATE"}, tok)
print("create playlist:", st, json.dumps(pl)[:300])
pid = pl["id"]

st, found = req("/tracks/search?q=neon")
tid = found[0]["id"]
print("search neon:", st, found[0]["title"])

st, add = req(f"/playlists/{pid}/tracks", "POST", {"trackId": tid}, tok)
print("add track:", st, json.dumps(add)[:200])

st, det = req(f"/playlists/{pid}", tok=tok)
print("detail keys:", st, list(det.keys()) if isinstance(det, dict) else type(det))
print("detail tracks field:", json.dumps(det.get("tracks"))[:300] if isinstance(det, dict) else "")
print("_count:", det.get("_count") if isinstance(det, dict) else "")

# also check favorites & history & recent shapes
for p in ["/me/favorites", "/me/recent", "/me/recommendations", "/me/history"]:
    st, d = req(p, tok=tok)
    print(p, "->", st, type(d).__name__, (len(d) if isinstance(d, list) else str(d)[:120]))
