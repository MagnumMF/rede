#!/usr/bin/env python3
# Gera os ícones do app: um escudo (proteção) com uma figura guardiã
# abraçando uma criança, sobre fundo teal. Paleta da capa da cartilha.
from PIL import Image, ImageDraw

TEAL   = (22, 64, 61)     # #16403d  fundo
TEAL_HI= (47, 122, 114)   # #2f7a72  brilho do fundo
GOLD   = (240, 201, 134)  # #f0c986  escudo / guardião
MINT   = (169, 216, 207)  # #a9d8cf  criança
CREAM  = (251, 246, 236)  # #fbf6ec  detalhes

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i]-a[i])*t) for i in range(3))

def base(size, pad_ratio, rounded=True):
    """Cria a arte num canvas grande (supersampling) e devolve."""
    S = size * 4
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # fundo (quadrado arredondado p/ 'any'; quadrado cheio p/ maskable)
    radius = int(S * 0.22) if rounded else 0
    # gradiente radial simples (do topo-centro)
    for y in range(S):
        t = min(1.0, (y / S) * 1.15)
        d.line([(0, y), (S, y)], fill=lerp(TEAL_HI, TEAL, t))
    if rounded:
        mask = Image.new("L", (S, S), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, S-1, S-1], radius=radius, fill=255)
        bg = img.copy()
        img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        img.paste(bg, (0, 0), mask)
        d = ImageDraw.Draw(img)

    # área útil (respeita zona segura do maskable)
    pad = int(S * pad_ratio)
    x0, y0, x1, y1 = pad, pad, S - pad, S - pad
    w = x1 - x0
    h = y1 - y0
    cx = (x0 + x1) // 2

    # ---- ESCUDO ----
    top = y0 + int(h * 0.06)
    bot = y1 - int(h * 0.02)
    shw = int(w * 0.86)
    sx0 = cx - shw // 2
    sx1 = cx + shw // 2
    shoulder = top + int((bot - top) * 0.30)
    tip_y = bot
    shield = [
        (cx, top),
        (sx1, shoulder),
        (sx1, top + int((bot - top) * 0.52)),
        (cx, tip_y),
        (sx0, top + int((bot - top) * 0.52)),
        (sx0, shoulder),
    ]
    # borda creme + preenchimento dourado
    d.polygon(shield, fill=GOLD)

    # ---- FIGURAS desenhadas numa camada e recortadas no formato do escudo ----
    fig = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fig)

    midx = cx
    midy = top + int((bot - top) * 0.46)

    # guardião: cabeça + ombros largos descendo até a ponta do escudo
    gh_r = int(w * 0.12)
    gh_cx = midx + int(w * 0.07)
    gh_cy = midy - int(h * 0.12)
    fd.ellipse([gh_cx-gh_r, gh_cy-gh_r, gh_cx+gh_r, gh_cy+gh_r], fill=TEAL)
    bw = int(w * 0.34)
    by = gh_cy + int(gh_r * 0.55)
    # corpo: elipse alta que ultrapassa a ponta (será recortada no escudo)
    fd.ellipse([gh_cx-bw, by, gh_cx+bw, tip_y + int(h*0.18)], fill=TEAL)

    # criança: cabeça + corpo (mint), à frente/abraçada
    ch_r = int(w * 0.085)
    ch_cx = midx - int(w * 0.13)
    ch_cy = midy - int(h * 0.01)
    fd.ellipse([ch_cx-ch_r, ch_cy-ch_r, ch_cx+ch_r, ch_cy+ch_r], fill=MINT)
    cbw = int(w * 0.19)
    cby = ch_cy + int(ch_r * 0.55)
    fd.ellipse([ch_cx-cbw, cby, ch_cx+cbw, tip_y + int(h*0.14)], fill=MINT)

    # máscara = escudo levemente reduzido (mantém a borda dourada visível)
    smask = Image.new("L", (S, S), 0)
    inset = int(S * 0.012)
    shield_in = [(cx, top+inset),
                 (sx1-inset, shoulder),
                 (sx1-inset, top + int((bot - top) * 0.52)),
                 (cx, tip_y-inset),
                 (sx0+inset, top + int((bot - top) * 0.52)),
                 (sx0+inset, shoulder)]
    ImageDraw.Draw(smask).polygon(shield_in, fill=255)
    img.paste(fig, (0, 0), Image.composite(fig.split()[3], Image.new("L",(S,S),0), smask))

    # borda creme do escudo por cima de tudo
    d = ImageDraw.Draw(img)
    d.line(shield + [shield[0]], fill=CREAM, width=max(2, int(S*0.012)), joint="curve")

    return img.resize((size, size), Image.LANCZOS)

def gen(path, size, maskable=False):
    pad = 0.20 if maskable else 0.12     # maskable precisa de mais respiro
    img = base(size, pad, rounded=not maskable)
    if maskable:
        # fundo cheio para a zona segura (sem cantos transparentes)
        S = img.size[0]
        bg = Image.new("RGBA", (S, S), TEAL + (255,))
        bg.alpha_composite(img)
        img = bg
    img.save(path)
    print("ok:", path)

import os
os.makedirs("icons", exist_ok=True)
gen("icons/icon-192.png", 192)
gen("icons/icon-512.png", 512)
gen("icons/icon-maskable-192.png", 192, maskable=True)
gen("icons/icon-maskable-512.png", 512, maskable=True)
print("Ícones gerados.")
