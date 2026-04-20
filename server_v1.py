"""
Analisa Angka — Backend Server v1
FastAPI: semua kalkulasi engine AI, Mati, Jumlah Mati, Shio Mati, Master Invest
Data per codename disimpan di SQLite (data.db)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3, json, os, math

app = FastAPI(title="Analisa Angka API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "data.db"

# ─────────────────────────────────────────
# DATABASE SETUP
# ─────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS codenames (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            flag TEXT DEFAULT '📌'
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codename TEXT NOT NULL,
            value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

# ─────────────────────────────────────────
# LOOKUP TABLES (sama persis dengan JS)
# ─────────────────────────────────────────
TBL_I = {"0":5,"1":6,"2":7,"3":8,"4":9,"5":0,"6":1,"7":2,"8":3,"9":4}
TBL_L = {"0":1,"1":0,"2":5,"5":2,"3":8,"8":3,"4":7,"7":4,"6":9,"9":6}
TBL_B = {"0":8,"8":0,"1":7,"7":1,"2":6,"6":2,"3":9,"9":3,"4":5,"5":4}
TBL_T = {"0":7,"1":4,"2":9,"3":6,"4":1,"5":8,"6":3,"7":0,"8":5,"9":2}
AI_P  = {"0":2,"1":2,"2":3,"3":5,"4":5,"5":7,"6":7,"7":2,"8":2,"9":2}

def mod10(x): return ((int(x) % 10) + 10) % 10
def tbl(t, x): return t[str(mod10(x))]

def J2d(a, b):
    s = int(a) + int(b)
    return s - 9 if s >= 10 else s

# ─────────────────────────────────────────
# 25 AI FORMULAS
# ─────────────────────────────────────────
def ai_r1(c, p, p2):
    X = abs(int(c[1]) - int(c[3]))
    return list(set([X, tbl(TBL_B,X), tbl(TBL_T,X), tbl(TBL_I,X)]))

def ai_r2(c, p, p2):
    X = mod10(int(c[0]) + int(c[2]))
    return list(set([X, tbl(TBL_I,X), mod10(X+1), tbl(TBL_I,mod10(X+1)), mod10(X+2)]))

def ai_r3(c, p, p2):
    X = mod10(int(c[0])+int(c[1])+int(c[2])+int(c[3]))
    return list(set([X, tbl(TBL_L,X), tbl(TBL_T,X), mod10(X+1), mod10(X-1)]))

def ai_r4(c, p, p2):
    if not p: return None
    X = mod10(int(p[1]) + int(c[3]))
    return list(set([X, mod10(X+1), mod10(X+2), mod10(X+3), tbl(TBL_I,X)]))

def ai_r5(c, p, p2):
    X = int(c[3])
    return list(set([X, tbl(TBL_I,X), tbl(TBL_L,X), tbl(TBL_B,X), tbl(TBL_T,X), tbl(TBL_T,tbl(TBL_I,X))]))

def ai_r6(c, p, p2):
    X = abs(int(c[1]) - int(c[2]))
    return list(set([X, mod10(X+2), mod10(X-2), tbl(TBL_I,X)]))

def ai_r7(c, p, p2):
    X = mod10(int(c[0]) + int(c[3]))
    return list(set([X, tbl(AI_P,X), tbl(TBL_L,X), tbl(TBL_T,X)]))

def ai_r8(c, p, p2):
    X = mod10(int(c[1]) + int(c[3]))
    sh = mod10(10 - X)
    return list(set([X, sh, tbl(TBL_I,X), tbl(TBL_I,sh)]))

def ai_r9(c, p, p2):
    if not p: return None
    X = mod10(int(p[2]) + int(c[2]))
    return list(set([X, mod10(X+1), tbl(TBL_B,X), tbl(TBL_I,X)]))

def ai_r10(c, p, p2):
    if not p2: return None
    X = abs(int(c[3]) - int(p2[3]))
    return list(set([X, tbl(TBL_B,X), tbl(TBL_I,X), tbl(TBL_T,X), mod10(X+1)]))

def ai_r11(c, p, p2):
    X = mod10(int(c[0]) + int(c[1]))
    return list(set([X, tbl(TBL_L,X), tbl(TBL_B,X), tbl(TBL_I,X)]))

def ai_r12(c, p, p2):
    X = abs(int(c[0]) - int(c[2]))
    return list(set([X, tbl(TBL_T,X), tbl(TBL_B,X), tbl(TBL_I,X)]))

def ai_r13(c, p, p2):
    X = mod10(int(c[2]) + int(c[3]))
    return list(set([X, mod10(X+1), mod10(X+2), mod10(X+3), tbl(TBL_I,X)]))

def ai_r14(c, p, p2):
    X = abs(int(c[0]) - int(c[1]))
    return list(set([X, tbl(TBL_L,X), tbl(TBL_I,X), tbl(TBL_T,X)]))

def ai_r15(c, p, p2):
    if not p: return None
    X = mod10(int(p[1]) + int(c[1]))
    return list(set([X, tbl(TBL_I,X), tbl(TBL_B,X), mod10(X+1)]))

def ai_r16(c, p, p2):
    X = int(c[2])
    return list(set([X, mod10(X+1), tbl(TBL_B,X), tbl(TBL_I,X)]))

def ai_r17(c, p, p2):
    if not p: return None
    X = mod10(int(p[0]) + int(c[0]))
    return list(set([X, tbl(TBL_L,X), tbl(TBL_T,X), tbl(TBL_I,X)]))

def ai_r18(c, p, p2):
    if not p: return None
    X = abs(int(p[3]) - int(c[3]))
    return list(set([X, mod10(X+2), tbl(TBL_B,X), tbl(TBL_I,X)]))

def ai_r19(c, p, p2):
    X = mod10(int(c[1]) + int(c[2]))
    return list(set([X, tbl(TBL_T,X), tbl(TBL_L,X), tbl(TBL_I,X)]))

def ai_r20(c, p, p2):
    X = mod10(int(c[0])+int(c[1])+int(c[2]))
    return list(set([X, tbl(TBL_B,X), tbl(TBL_I,X), mod10(X+1)]))

def ai_r21(c, p, p2):
    if not p2: return None
    X = abs(int(p2[0]) - int(c[0]))
    return list(set([X, tbl(TBL_L,X), tbl(TBL_B,X), mod10(X+1)]))

def ai_r22(c, p, p2):
    if not p2: return None
    X = mod10(int(p2[3]) * int(c[3]))
    return list(set([X, tbl(TBL_L,X), tbl(TBL_B,X), tbl(TBL_I,X)]))

def ai_r23(c, p, p2):
    if not p: return None
    X = mod10(int(p[0]) * int(c[2]))
    return list(set([X, tbl(TBL_T,X), tbl(TBL_L,X), mod10(X+3)]))

def ai_r24(c, p, p2):
    X = mod10(int(c[0]) * int(c[1]) * int(c[2]))
    return list(set([X, tbl(TBL_T,X), tbl(TBL_I,X), mod10(X+1)]))

def ai_r25(c, p, p2):
    if not p2: return None
    X = mod10(int(p2[0])+int(p2[1])+int(p2[2])+int(p2[3]))
    return list(set([X, tbl(TBL_T,X), tbl(TBL_I,X), tbl(TBL_L,X)]))

AI_FORMULAS = [
    {"n":"R1 Delta Square",       "f":ai_r1,  "dg":4},
    {"n":"R2 Mirror Cross",       "f":ai_r2,  "dg":5},
    {"n":"R3 Biji Resonansi",     "f":ai_r3,  "dg":5},
    {"n":"R4 Diagonal Flow",      "f":ai_r4,  "dg":5},
    {"n":"R5 Triple Morph",       "f":ai_r5,  "dg":6},
    {"n":"R6 V-Shift",            "f":ai_r6,  "dg":4},
    {"n":"R7 Prime Pulse",        "f":ai_r7,  "dg":4},
    {"n":"R8 Shadow Digit",       "f":ai_r8,  "dg":4},
    {"n":"R9 Head Twin Flow",     "f":ai_r9,  "dg":4},
    {"n":"R10 Quantum Leap",      "f":ai_r10, "dg":5},
    {"n":"R11 Alpha Core",        "f":ai_r11, "dg":4},
    {"n":"R12 Delta Strike",      "f":ai_r12, "dg":4},
    {"n":"R13 Tail Run",          "f":ai_r13, "dg":5},
    {"n":"R14 As Kop Gap",        "f":ai_r14, "dg":4},
    {"n":"R15 Kop Twin Flow",     "f":ai_r15, "dg":4},
    {"n":"R16 Head Shift",        "f":ai_r16, "dg":4},
    {"n":"R17 Twin Alpha",        "f":ai_r17, "dg":4},
    {"n":"R18 Omega Gap",         "f":ai_r18, "dg":4},
    {"n":"R19 Mid Flow",          "f":ai_r19, "dg":4},
    {"n":"R20 Front Trinity",     "f":ai_r20, "dg":4},
    {"n":"R21 Alpha Lag Gap",     "f":ai_r21, "dg":4},
    {"n":"R22 Lag Tail Multiply", "f":ai_r22, "dg":4},
    {"n":"R23 Cross Multiply Flow","f":ai_r23,"dg":4},
    {"n":"R24 Front Multiply",    "f":ai_r24, "dg":4},
    {"n":"R25 Lag 2 Resonance",   "f":ai_r25, "dg":4},
]
AI_THRESH = {4:11, 5:12, 6:13}

# ─────────────────────────────────────────
# 50 OFF FORMULAS (_0x3ca571 equivalent)
# ─────────────────────────────────────────
OFF_NAMES = [
    "R01 Phantom Edge","R02 Shadow Index","R03 Night Blade","R04 Void Pulse",
    "R05 Ghost Bridge","R06 Dark Mirror","R07 Venom Drift","R08 Silent Spike",
    "R09 Dead Zone","R10 Hex Cutter","R11 Zero Cross","R12 Skull Shift",
    "R13 Toxic Morph","R14 Black Helix","R15 Iron Gate","R16 Reaper Flux",
    "R17 Ash Spiral","R18 Grave Lock","R19 Doom Cycle","R20 Final Axe",
    "R21 Twin AS Strike","R22 Kop Mirror Delta","R23 Cross Line Death",
    "R24 Mystic Cross Sum","R25 Beta Edge Clash","R26 Hybrid 4D Sum",
    "R27 Taysen Tail Echo","R28 Raw Head Strike","R29 Index Inner Cross",
    "R30 Mystic Total Kill","R31 Taysen Cross Multiplex","R32 Kop-Ekor Squared Drop",
    "R33 Front Cascade Mist","R34 Twin Index Clash","R35 Head-Tail Inversion",
    "R36 Double Mistis Core","R37 Outer Cross Index","R38 Biji 2D Backward",
    "R39 Absolute Delta 4D","R40 Phantom Tesson Strike","R41 Double Tail Strike",
    "R42 Kop-Kepala Cross Index","R43 Mystic 3D Rear","R44 As-Ekor Multiplier",
    "R45 Inner Resonance Mist","R46 Taysen Alpha-Omega","R47 Cross Wing Squared",
    "R48 Index Gap Shift","R49 Past Biji Multiplier","R50 Taysen Triple Front"
]

def off_rumus(a: str, b: str) -> dict:
    """50 OFF formulas — ported from _0x3ca571"""
    p  = {k: int(v) for k,v in zip(['as','kop','kpl','ekr'], a)}
    c2 = {k: int(v) for k,v in zip(['as','kop','kpl','ekr'], b)}
    m  = mod10
    ti, tl, tb, tt = lambda x: tbl(TBL_I,x), lambda x: tbl(TBL_L,x), lambda x: tbl(TBL_B,x), lambda x: tbl(TBL_T,x)
    return {
        "a":  m(c2['kpl']+c2['ekr']),
        "b":  ti((c2['as']+c2['ekr'])%10),
        "c":  tl((c2['kop']+c2['kpl'])%10),
        "d":  abs(c2['as']-c2['ekr']),
        "e":  tb((p['ekr']+c2['ekr'])%10),
        "f":  ti((p['as']+c2['as'])%10),
        "g":  m(c2['as']+c2['kop']+c2['kpl']+c2['ekr']),
        "h":  tl((c2['ekr']+1)%10),
        "i":  ti(abs(c2['kpl']-c2['ekr'])),
        "j":  m(c2['as']+c2['kop']),
        "k":  ti(abs(c2['kop']-c2['kpl'])),
        "l":  m(p['kpl']+c2['kpl']),
        "m":  tt((c2['kpl']+c2['ekr'])%10),
        "n":  tl((p['kop']+c2['kop'])%10),
        "o":  ti((c2['as']+c2['kpl'])%10),
        "p":  tl(abs(c2['as']-c2['kpl'])),
        "q":  tb(abs(c2['kop']-c2['ekr'])),
        "r":  m(c2['kop']+c2['kpl']+c2['ekr']),
        "s":  ti((c2['kpl']+1)%10),
        "t":  tt(c2['as']),
        "u":  m(p['as']+c2['as']),
        "v":  abs(p['kop']-c2['kop']),
        "w":  m(p['kpl']+c2['ekr']),
        "x":  tl((p['as']+c2['kop'])%10),
        "y":  tb(abs(p['ekr']-c2['as'])),
        "z":  m(p['as']+p['kop']+c2['kpl']+c2['ekr']),
        "aa": tt((p['ekr']+c2['ekr'])%10),
        "bb": abs(c2['as']-c2['kpl']),
        "cc": ti((c2['kop']+c2['ekr'])%10),
        "dd": tl(m(c2['as']+c2['kop']+c2['kpl']+c2['ekr'])),
        "ee": tb(tt((c2['as']+p['ekr'])%10)),
        "ff": m(c2['kop']*c2['ekr']),
        "gg": tl(m(c2['as']+c2['kop']+c2['kpl'])),
        "hh": m(ti((p['as']+c2['as'])%10)+tb((p['ekr']+c2['ekr'])%10)),
        "ii": abs(tt(c2['kpl'])-tt(c2['ekr'])),
        "jj": m(tl(c2['kop'])+tb(c2['kpl'])),
        "kk": ti((p['as']+c2['ekr'])%10),
        "ll": tt(m(p['kpl']+p['ekr']+c2['kpl']+c2['ekr'])),
        "mm": abs((c2['as']+c2['kop'])-(c2['kpl']+c2['ekr']))%10,
        "nn": tt((p['kop']+c2['kpl'])%10),
        "oo": ti((p['ekr']*c2['ekr'])%10),
        "pp": ti(abs(p['kop']-c2['kpl'])),
        "qq": tl(m(c2['kop']+c2['kpl']+c2['ekr'])),
        "rr": m(c2['as']*p['ekr']),
        "ss": tb(m(p['kop']+p['kpl']+c2['kop']+c2['kpl'])),
        "tt": abs(tt(c2['as'])-tt(c2['ekr'])),
        "uu": m((p['as']+c2['ekr'])*(p['ekr']+c2['as'])),
        "vv": ti(abs(c2['kop']-p['kpl'])),
        "ww": m(m(p['as']+p['kop']+p['kpl']+p['ekr'])*c2['ekr']),
        "xx": tt(m(c2['as']+c2['kop']+c2['kpl'])),
    }

OFF_KEYS = list(off_rumus("0000","0000").keys())  # 50 keys a..xx

# ─────────────────────────────────────────
# SHIO TABLE
# ─────────────────────────────────────────
SHIO_TBL = {}
shio_data = [
    (1,[1,13,25,37,49,61,73,85,97]),
    (2,[2,14,26,38,50,62,74,86,98]),
    (3,[3,15,27,39,51,63,75,87,99]),
    (4,[4,16,28,40,52,64,76,88,0]),
    (5,[5,17,29,41,53,65,77,89]),
    (6,[6,18,30,42,54,66,78,90]),
    (7,[7,19,31,43,55,67,79,91]),
    (8,[8,20,32,44,56,68,80,92]),
    (9,[9,21,33,45,57,69,81,93]),
    (10,[10,22,34,46,58,70,82,94]),
    (11,[11,23,35,47,59,71,83,95]),
    (12,[12,24,36,48,60,72,84,96]),
]
for shio, nums in shio_data:
    for n in nums:
        SHIO_TBL[n] = shio

def get_shio(r: str) -> int:
    n = int(r[2]) * 10 + int(r[3])
    return SHIO_TBL.get(n, SHIO_TBL.get(n % 100, 1))

SHIO_NAMES  = ['','Kuda','Ular','Naga','Kelinci','Harimau','Kerbau','Tikus','Babi','Anjing','Ayam','Monyet','Kambing']
SHIO_EMOJI  = ['','🐴','🐍','🐉','🐰','🐯','🐂','🐭','🐷','🐕','🐔','🐒','🐐']

SHIO_RUMUS_NAMES = [
    "RS01 Lunar Blade","RS02 Zodiac Drift","RS03 Beast Helix","RS04 Modulus Pulse","RS05 Astral Gate",
    "RS06 Night Zodiac","RS07 Phantom Beast","RS08 Void Modulus","RS09 Lunar Zone","RS10 Hex Zodiac",
    "RS11 Zero Orbit","RS12 Skull Shift","RS13 Toxic Beast","RS14 Dark Lunar","RS15 Iron Modulus",
    "RS16 Reaper Zodiac","RS17 Ash Orbit","RS18 Grave Cycle","RS19 Doom Beast","RS20 Final Modulus",
    "RS21 Twin Zodiac Strike","RS22 Lunar Mirror Delta","RS23 Cross Beast Death","RS24 Modulus Cross Sum","RS25 Beta Lunar Clash",
    "RS26 Hybrid Zodiac Sum","RS27 Beast Tail Echo","RS28 Raw Lunar Strike","RS29 Orbit Inner Cross","RS30 Zodiac Total Kill",
    "RS31 Modulus Cross Multiplex","RS32 Lunar Squared Drop","RS33 Front Cascade Beast","RS34 Twin Orbit Clash","RS35 Zodiac Inversion",
    "RS36 Double Modulus Core","RS37 Outer Cross Lunar","RS38 Beast 2D Backward","RS39 Absolute Zodiac 4D","RS40 Phantom Orbit Strike",
    "RS41 Double Lunar Strike","RS42 Beast Cross Matrix","RS43 Modulus 3D Rear","RS44 Lunar Multiplier","RS45 Inner Resonance Beast",
    "RS46 Zodiac Alpha-Omega","RS47 Cross Wing Orbit","RS48 Modulus Gap Shift","RS49 Past Lunar Multiplier","RS50 Zodiac Triple Front"
]

def shio_rumus(a: str, b: str) -> dict:
    p  = [int(x) for x in a]
    c  = [int(x) for x in b]
    m  = lambda x: (abs(int(x)) % 12) or 12
    return {
        "k1":  m(c[0]+c[1]+c[2]+c[3]),  "k2":  m(p[3]+c[3]),
        "k3":  m(c[2]*c[3]),             "k4":  m(c[0]*c[3]),
        "k5":  m(c[1]+c[2]),             "k6":  m(p[0]+c[0]),
        "k7":  m(p[1]+c[1]),             "k8":  m(p[2]+c[2]),
        "k9":  m(c[0]-c[3]),             "k10": m(c[1]-c[2]),
        "k11": m(p[3]*c[0]),             "k12": m(p[2]*c[1]),
        "k13": m(p[1]*c[2]),             "k14": m(p[0]*c[3]),
        "k15": m(c[0]+c[1]),             "k16": m(c[2]+c[3]),
        "k17": m(p[0]+p[1]+c[2]+c[3]),  "k18": m(p[2]+p[3]+c[0]+c[1]),
        "k19": m(c[0]*c[1]),             "k20": m(p[0]*p[1]),
        "k21": m(c[0]+c[2]),             "k22": m(c[1]+c[3]),
        "k23": m(p[0]+c[2]),             "k24": m(p[1]+c[3]),
        "k25": m(p[0]-c[0]),             "k26": m(p[1]-c[1]),
        "k27": m(p[2]-c[2]),             "k28": m(p[3]-c[3]),
        "k29": m(c[0]+p[3]),             "k30": m(c[3]+p[0]),
        "k31": m(c[0]*p[0]),             "k32": m(c[1]*p[1]),
        "k33": m(c[2]*p[2]),             "k34": m(c[3]*p[3]),
        "k35": m((c[0]+c[1])*(c[2]+c[3])), "k36": m((p[0]+p[1])*(p[2]+p[3])),
        "k37": m(c[0]+c[1]-c[2]),        "k38": m(c[1]+c[2]-c[3]),
        "k39": m(p[0]+p[1]-c[3]),        "k40": m(p[2]+p[3]-c[0]),
        "k41": m(c[0]+c[3]+p[0]+p[3]),  "k42": m(c[1]+c[2]+p[1]+p[2]),
        "k43": m((c[0]*c[2])+c[3]),      "k44": m((c[1]*c[3])+c[0]),
        "k45": m((p[0]*p[2])+p[3]),      "k46": m((p[1]*p[3])+p[0]),
        "k47": m(c[0]+p[1]+c[2]+p[3]),  "k48": m(c[1]+p[2]+c[3]+p[0]),
        "k49": m(c[0]*c[1]*c[2]),        "k50": m(c[1]*c[2]*c[3]),
    }

SHIO_KEYS = list(shio_rumus("0000","0000").keys())  # k1..k50

# ─────────────────────────────────────────
# CORE ENGINE FUNCTIONS
# ─────────────────────────────────────────
def engine_ai(D: list, N: int) -> dict:
    U = D[-17:]
    vote = {d: 0 for d in range(10)}
    formula_results = []
    thresh_map = {4:11, 5:12, 6:13}

    for rm in AI_FORMULAS:
        hits, valid = 0, 0
        for i in range(14):
            prev2, prev, curr, tgt = U[i], U[i+1], U[i+2], U[i+3]
            ai = rm["f"](curr, prev, prev2)
            if ai is None: continue
            valid += 1
            if int(tgt[2]) in ai or int(tgt[3]) in ai:
                hits += 1
        thresh = thresh_map.get(rm["dg"], 10)
        lolos = hits >= thresh
        formula_results.append({"name": rm["n"], "hits": hits, "valid": valid, "thresh": thresh, "lolos": lolos})

    elite_count = sum(1 for r in formula_results if r["lolos"])
    fallback = elite_count == 0

    for i, rm in enumerate(AI_FORMULAS):
        if fallback or formula_results[i]["lolos"]:
            fp = rm["f"](D[-1], D[-2], D[-3])
            if fp:
                for d in fp:
                    vote[d] += 1

    # gap calculation
    gap = {d: len(U) for d in range(10)}
    for j in range(len(U)-1, -1, -1):
        gk, ge = int(U[j][2]), int(U[j][3])
        if gap[gk] == len(U): gap[gk] = len(U)-1-j
        if gap[ge] == len(U): gap[ge] = len(U)-1-j

    sorted_digits = sorted(vote.keys(), key=lambda d: (-vote[d], -gap[d]))
    result = sorted(sorted_digits[:N])
    return {
        "digits": result,
        "elite_count": elite_count,
        "fallback": fallback,
        "formula_details": formula_results,
        "total_data": len(D)
    }

def engine_mati_pos(D: list, pos_idx: int, N: int) -> dict:
    U = D[-17:]
    SA = {k: 0 for k in OFF_KEYS}
    for i in range(14):
        pr = off_rumus(U[i], U[i+1])
        val = int(U[i+2][pos_idx])
        for k in OFF_KEYS:
            if pr[k] != val:
                SA[k] += 1

    fq = {str(d): 0 for d in range(10)}
    for r in U: fq[r[pos_idx]] = fq.get(r[pos_idx], 0) + 1
    rc = {str(d): 99 for d in range(10)}
    for j in range(len(U)-1, -1, -1):
        dg = U[j][pos_idx]
        if rc[dg] == 99: rc[dg] = len(U)-1-j

    elite = [k for k in OFF_KEYS if SA[k] >= 14]
    fallback = False
    if not elite:
        fallback = True
        mx = max(SA.values())
        elite = [k for k in OFF_KEYS if SA[k] == mx]

    FP = off_rumus(D[-2], D[-1])
    ct = {}
    for k in elite:
        v = str(FP[k])
        ct[v] = ct.get(v, 0) + 1

    def sort_key(a):
        ga = 1 if rc.get(a, 99) == 99 else 0
        return (-ct.get(a, 0), ga, -fq.get(a, 0), rc.get(a, 99))

    sorted_digits = sorted(ct.keys(), key=sort_key)
    off_digits = sorted_digits[:N]

    elite_details = []
    for i, k in enumerate(OFF_KEYS):
        if SA[k] >= 14 and str(FP[k]) in off_digits:
            elite_details.append({"name": OFF_NAMES[i], "score": SA[k]})

    return {"off": off_digits, "elite_count": len(elite), "fallback": fallback, "details": elite_details}

def engine_jumlah_mati(D: list) -> dict:
    U = D[-17:]
    SA = {k: 0 for k in OFF_KEYS}
    for i in range(14):
        pr = off_rumus(U[i], U[i+1])
        j2d = J2d(U[i+2][2], U[i+2][3])
        for k in OFF_KEYS:
            if pr[k] != j2d:
                SA[k] += 1

    elite = [k for k in OFF_KEYS if SA[k] >= 14]
    fallback = False
    if not elite:
        fallback = True
        mx = max(SA.values())
        elite = [k for k in OFF_KEYS if SA[k] == mx]

    fq = {str(d): 0 for d in range(10)}
    for r in U:
        j = str(J2d(r[2], r[3]))
        fq[j] = fq.get(j, 0) + 1
    rc = {str(d): 99 for d in range(10)}
    for j in range(len(U)-1, -1, -1):
        jd = str(J2d(U[j][2], U[j][3]))
        if rc[jd] == 99: rc[jd] = len(U)-1-j

    FP = off_rumus(D[-2], D[-1])
    ct = {}
    for k in elite:
        v = str(FP[k])
        ct[v] = ct.get(v, 0) + 1

    def sort_key(a):
        ga = 1 if rc.get(a, 99) == 99 else 0
        return (-ct.get(a, 0), ga, -fq.get(a, 0), rc.get(a, 99))

    sorted_vals = sorted(ct.keys(), key=sort_key)
    hasil = sorted_vals[0] if sorted_vals else "0"
    if hasil == "0":
        for v in sorted_vals[1:]:
            if v != "0": hasil = v; fallback = True; break
        if hasil == "0":
            fb = sorted(fq.keys(), key=lambda x: -fq[x])
            hasil = next((x for x in fb if x != "0"), "1")
            fallback = True

    elite_count = len(elite)
    support = sum(1 for k in elite if str(FP[k]) == hasil)
    elite_details = []
    for i, k in enumerate(OFF_KEYS):
        if SA[k] >= 14 and str(FP[k]) == hasil:
            elite_details.append({"name": OFF_NAMES[i], "score": SA[k]})

    return {"hasil": hasil, "elite_count": elite_count, "support": support, "fallback": fallback, "details": elite_details}

def engine_shio_mati(D: list, N: int) -> dict:
    U = D[-17:]
    SA = {k: 0 for k in SHIO_KEYS}
    for i in range(14):
        pr = shio_rumus(U[i], U[i+1])
        sh_aktual = get_shio(U[i+2])
        for k in SHIO_KEYS:
            if pr[k] != sh_aktual:
                SA[k] += 1

    elite = [k for k in SHIO_KEYS if SA[k] >= 14]
    fallback = False
    if not elite:
        fallback = True
        mx = max(SA.values())
        elite = [k for k in SHIO_KEYS if SA[k] == mx]

    fq = {s: 0 for s in range(1, 13)}
    for r in U: fq[get_shio(r)] = fq.get(get_shio(r), 0) + 1
    rc = {s: 99 for s in range(1, 13)}
    for j in range(len(U)-1, -1, -1):
        sj = get_shio(U[j])
        if rc[sj] == 99: rc[sj] = len(U)-1-j

    FP = shio_rumus(D[-2], D[-1])
    ct = {}
    for k in elite:
        v = FP[k]
        ct[v] = ct.get(v, 0) + 1

    def sort_key(s):
        ga = 1 if rc.get(s, 99) == 99 else 0
        return (-ct.get(s, 0), ga, -fq.get(s, 0), rc.get(s, 99))

    sorted_shio = sorted(ct.keys(), key=sort_key)
    hasil = sorted_shio[:N]
    support = sum(ct.get(s, 0) for s in hasil)

    elite_details = []
    for i, k in enumerate(SHIO_KEYS):
        if SA[k] >= 14 and FP[k] in hasil:
            elite_details.append({"name": SHIO_RUMUS_NAMES[i], "score": SA[k], "shio": FP[k]})

    shio_out = [{"id": s, "name": SHIO_NAMES[s], "emoji": SHIO_EMOJI[s]} for s in hasil]
    return {"hasil": shio_out, "elite_count": len(elite), "support": support, "fallback": fallback, "details": elite_details}

def engine_master_invest(D: list) -> dict:
    CT  = engine_ai(D, 6)["digits"]
    LK  = int(engine_mati_pos(D, 2, 1)["off"][0])
    LE  = int(engine_mati_pos(D, 3, 1)["off"][0])
    LJ  = int(engine_jumlah_mati(D)["hasil"])
    LS  = engine_shio_mati(D, 1)["hasil"][0]["id"] if engine_shio_mati(D, 1)["hasil"] else 1

    lines = []
    for k in range(10):
        for e in range(10):
            if k == LK or e == LE: continue
            if J2d(k, e) == LJ: continue
            if get_shio("00" + str(k) + str(e)) == LS: continue
            if k not in CT and e not in CT: continue
            lines.append(f"{k}{e}")

    return {
        "CT": CT, "LK": LK, "LE": LE, "LJ": LJ,
        "LS": {"id": LS, "name": SHIO_NAMES[LS], "emoji": SHIO_EMOJI[LS]},
        "lines": lines, "total_lines": len(lines)
    }

# ─────────────────────────────────────────
# PYDANTIC MODELS
# ─────────────────────────────────────────
class AddResultsRequest(BaseModel):
    codename: str
    data: List[str]

class DeleteCodenameRequest(BaseModel):
    codename: str

# ─────────────────────────────────────────
# API ENDPOINTS
# ─────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "app": "Analisa Angka API v1"}

@app.get("/codenames")
def list_codenames():
    conn = get_db()
    rows = conn.execute("""
        SELECT c.name, c.flag, COUNT(r.id) as total,
               MAX(r.value) as last_result
        FROM codenames c
        LEFT JOIN results r ON c.name = r.codename
        GROUP BY c.name ORDER BY c.name
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/codename/add-results")
def add_results(req: AddResultsRequest):
    codename = req.codename.upper().strip()
    valid = [x.strip() for x in req.data if len(x.strip()) == 4 and x.strip().isdigit()]
    if not valid:
        raise HTTPException(400, "Tidak ada data valid (format: 4 digit angka)")
    conn = get_db()
    conn.execute("INSERT OR IGNORE INTO codenames (name) VALUES (?)", (codename,))
    conn.executemany("INSERT INTO results (codename, value) VALUES (?, ?)",
                     [(codename, v) for v in valid])
    conn.commit()
    total = conn.execute("SELECT COUNT(*) FROM results WHERE codename=?", (codename,)).fetchone()[0]
    conn.close()
    return {"message": f"Tersimpan {len(valid)} result", "total": total, "codename": codename}

@app.delete("/codename/{codename}")
def delete_codename(codename: str):
    codename = codename.upper()
    conn = get_db()
    conn.execute("DELETE FROM results WHERE codename=?", (codename,))
    conn.execute("DELETE FROM codenames WHERE name=?", (codename,))
    conn.commit()
    conn.close()
    return {"message": f"{codename} dihapus"}

def get_data(codename: str) -> list:
    conn = get_db()
    rows = conn.execute(
        "SELECT value FROM results WHERE codename=? ORDER BY id ASC", (codename.upper(),)
    ).fetchall()
    conn.close()
    return [r["value"] for r in rows]

def validate_data(codename: str) -> list:
    D = get_data(codename)
    if len(D) < 17:
        raise HTTPException(400, f"Data kurang! ({len(D)}/17 minimum)")
    return D

@app.get("/analisa/{codename}/ai")
def analisa_ai(codename: str, N: int = 6):
    D = validate_data(codename)
    if N not in [4, 6, 8]:
        raise HTTPException(400, "N harus 4, 6, atau 8")
    result = engine_ai(D, N)
    result["codename"] = codename.upper()
    result["mode"] = "BBFS" if N >= 8 else f"{N} Digit AI"
    return result

@app.get("/analisa/{codename}/mati")
def analisa_mati(codename: str, N: int = 2):
    D = validate_data(codename)
    if N not in [1, 2, 3, 4]:
        raise HTTPException(400, "N harus 1-4")
    POS = [("AS", 0), ("KOP", 1), ("KEPALA", 2), ("EKOR", 3)]
    hasil = {}
    for pos_name, pos_idx in POS:
        hasil[pos_name] = engine_mati_pos(D, pos_idx, N)
    return {"codename": codename.upper(), "N": N, "positions": hasil, "total_data": len(D)}

@app.get("/analisa/{codename}/jumlah-mati")
def analisa_jumlah_mati(codename: str):
    D = validate_data(codename)
    result = engine_jumlah_mati(D)
    result["codename"] = codename.upper()
    result["total_data"] = len(D)
    return result

@app.get("/analisa/{codename}/shio-mati")
def analisa_shio_mati(codename: str, N: int = 1):
    D = validate_data(codename)
    if N not in [1, 2]:
        raise HTTPException(400, "N harus 1 atau 2")
    result = engine_shio_mati(D, N)
    result["codename"] = codename.upper()
    result["total_data"] = len(D)
    return result

@app.get("/analisa/{codename}/master-invest")
def analisa_master_invest(codename: str):
    D = validate_data(codename)
    result = engine_master_invest(D)
    result["codename"] = codename.upper()
    result["total_data"] = len(D)
    return result
