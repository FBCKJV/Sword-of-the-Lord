#!/usr/bin/env python3
"""Regenerates assets/icons/*.png from scratch (no source art needed).
Run with: python3 tools/generate-icons.py
"""
import math
import os
from PIL import Image, ImageDraw

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'icons')
os.makedirs(OUT_DIR, exist_ok=True)

INK = (12, 9, 8, 255)
INK_LIGHT = (28, 20, 14, 255)
GOLD = (212, 175, 55, 255)
GOLD_BRIGHT = (244, 217, 118, 255)
STEEL_LIGHT = (244, 247, 248, 255)
STEEL_DARK = (159, 176, 184, 255)
HELL = (255, 107, 53, 255)


def blend(bg, fg, t):
    return tuple(int(bg[c] * (1 - t) + fg[c] * t) for c in range(3)) + (255,)


def draw_glow(draw, cx, cy, r, color, bg, steps=24, max_strength=0.55):
    # Pre-blend each ring against the opaque background color so we paint
    # solid pixels (no alpha-compositing artifacts from drawing translucent
    # shapes directly onto an already-opaque canvas).
    for i in range(steps, 0, -1):
        frac = i / steps  # 1.0 at the outer edge, ~0 at the core (drawn last, on top)
        t = max_strength * (1 - frac) ** 1.6
        rad = r * frac
        draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=blend(bg, color, t))


def sword_polygon(cx, cy, scale):
    # Blade tip up, crossguard, short grip — proportioned for a square icon.
    blade_top = (cx, cy - 190 * scale)
    blade = [
        (cx - 8 * scale, cy - 40 * scale),
        (cx - 16 * scale, cy - 150 * scale),
        blade_top,
        (cx + 16 * scale, cy - 150 * scale),
        (cx + 8 * scale, cy - 40 * scale),
    ]
    return blade


def render(size, maskable=False):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if maskable:
        # Maskable icons must be opaque edge-to-edge; the OS applies its own
        # mask shape, so keep visual content inside the ~80% safe zone instead.
        d.rectangle([0, 0, size, size], fill=INK)
    else:
        d.rounded_rectangle([0, 0, size, size], radius=size * 0.22, fill=INK)

    cx, cy = size / 2, size / 2 + size * 0.06
    scale = size / 512
    if maskable:
        scale *= 0.72  # keep content inside the safe zone the OS won't crop

    draw_glow(d, cx, cy - 10 * scale, 170 * scale, HELL, INK)

    # crossguard
    guard_w, guard_h = 128 * scale, 22 * scale
    d.rounded_rectangle([cx - guard_w / 2, cy - 44 * scale - guard_h / 2,
                          cx + guard_w / 2, cy - 44 * scale + guard_h / 2],
                         radius=guard_h / 2, fill=GOLD)

    # grip
    grip_w, grip_h = 26 * scale, 70 * scale
    d.rounded_rectangle([cx - grip_w / 2, cy - 44 * scale,
                          cx + grip_w / 2, cy - 44 * scale + grip_h],
                         radius=8 * scale, fill=(74, 58, 42, 255))
    # pommel
    d.ellipse([cx - 14 * scale, cy + 22 * scale, cx + 14 * scale, cy + 46 * scale], fill=GOLD)

    # blade
    blade_pts = sword_polygon(cx, cy, scale)
    d.polygon(blade_pts, fill=STEEL_LIGHT)
    d.line([(cx, cy - 40 * scale), (cx, cy - 150 * scale)], fill=STEEL_DARK, width=max(1, int(3 * scale)))

    if not maskable:
        d.rounded_rectangle([0, 0, size, size], radius=size * 0.22,
                             outline=(212, 175, 55, 90), width=max(1, int(size * 0.01)))

    return img


for name, size, maskable in [
    ('icon-192.png', 192, False),
    ('icon-512.png', 512, False),
    ('icon-maskable-512.png', 512, True),
    ('apple-touch-icon.png', 180, False),
]:
    render(size, maskable).save(os.path.join(OUT_DIR, name))
    print('wrote', name)

# Favicon (multi-size .ico)
favicon_sizes = [16, 32, 48]
favicon_imgs = [render(s, False) for s in favicon_sizes]
favicon_imgs[0].save(os.path.join(OUT_DIR, 'favicon.ico'),
                      sizes=[(s, s) for s in favicon_sizes])
print('wrote favicon.ico')
