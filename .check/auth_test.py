import json, urllib.request, sys

BASE = "http://localhost:3001/api"
def req(path, method="GET", body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE+path, data=data, method=method,
        headers={"Content-Type":"application/json", **({"Authorization":f"Bearer {token}"} if token else {})})
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read() or b'{}')
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read() or b'{}')
        except: return e.code, {}

results=[]
def check(name, cond, extra=""):
    results.append((name, bool(cond), extra)); print(("PASS " if cond else "FAIL ")+name+((" | "+str(extra)[:120]) if extra and not cond else ""))

import random, string
suffix=''.join(random.choices(string.ascii_lowercase+string.digits,k=6))
email=f"e2e_{suffix}@delta.test"; username=f"e2e{suffix}"; password="Str0ngPass!23"

# 1 Register
s,d = req("/auth/register","POST",{"email":email,"username":username,"password":password,"displayName":"E2E User"})
check("register 201/200 + tokens", s in (200,201) and d.get("accessToken") and d.get("refreshToken"), f"{s} {d}")
at, rt = d.get("accessToken"), d.get("refreshToken")

# 2 Login
s,d2 = req("/auth/login","POST",{"login":email,"password":password})
check("login by email", s in (200,201) and d2.get("accessToken"), s)
at2, rt2 = d2["accessToken"], d2["refreshToken"]
s,d3 = req("/auth/login","POST",{"login":username,"password":password})
check("login by username", s in (200,201), s)

# 3 Wrong password
s,_ = req("/auth/login","POST",{"login":email,"password":"wrongpass"})
check("wrong password -> 401", s==401, s)

# 4 Duplicate email
s,_ = req("/auth/register","POST",{"email":email,"username":"other"+suffix,"password":password})
check("duplicate email -> 409", s==409, s)

# 5 GET /me
s,me = req("/auth/me",token=at2)
check("GET /me authenticated", s==200 and me.get("username")==username, f"{s} {me}")

# 6 Unauthenticated /me
s,_ = req("/auth/me")
check("GET /me no token -> 401", s==401, s)

# 7 Refresh rotation
s,rd = req("/auth/refresh","POST",{"refreshToken":rt2})
check("refresh returns NEW refreshToken", s in (200,201) and rd.get("accessToken") and rd.get("refreshToken") and rd["refreshToken"]!=rt2, f"{s} keys={list(rd)}")
at3 = rd.get("accessToken"); rt3 = rd.get("refreshToken")

# 8 Old refresh reuse must fail
s,_ = req("/auth/refresh","POST",{"refreshToken":rt2})
check("old refresh token rejected -> 401", s==401, s)

# 9 New refresh works
s,_ = req("/auth/refresh","POST",{"refreshToken":rt3})
check("rotated refresh works", s in (200,201), s)

# 10 Logout revokes
s,_ = req("/auth/logout","POST",{"refreshToken":rt3},token=at3)
check("logout ok", s in (200,201,204), s)
s,_ = req("/auth/refresh","POST",{"refreshToken":rt3})
check("refresh after logout -> 401", s==401, s)

# 11 Invalid params
s,_ = req("/auth/register","POST",{"email":"not-an-email","username":"x","password":"123"})
check("invalid register payload -> 4xx", 400<=s<500, s)

passed=sum(1 for _,ok,_ in results if ok)
print(f"\nTOTAL: {passed}/{len(results)} passed")
sys.exit(0 if passed==len(results) else 1)
