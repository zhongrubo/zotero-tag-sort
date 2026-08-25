#!/usr/bin/env python3
"""Generate the Zotero Tag Sort plugin icons (PNG), using only the stdlib."""
import zlib
import struct
import math
import os


def rounded_rect_sdf(x, y, cx, cy, half, radius):
    qx = abs(x - cx) - (half - radius)
    qy = abs(y - cy) - (half - radius)
    return min(max(qx, qy), 0.0) + math.hypot(max(qx, 0.0), max(qy, 0.0)) - radius


def seg_dist(px, py, ax, ay, bx, by):
    vx, vy = bx - ax, by - ay
    wx, wy = px - ax, py - ay
    c1 = vx * wx + vy * wy
    if c1 <= 0:
        return math.hypot(px - ax, py - ay)
    c2 = vx * vx + vy * vy
    if c2 <= c1:
        return math.hypot(px - bx, py - by)
    t = c1 / c2
    return math.hypot(px - (ax + t * vx), py - (ay + t * vy))


def polyline_dist(px, py, points):
    d = 1e9
    for i in range(len(points) - 1):
        ax, ay = points[i]
        bx, by = points[i + 1]
        dd = seg_dist(px, py, ax, ay, bx, by)
        if dd < d:
            d = dd
    return d


def png_chunk(typ, data):
    chunk = struct.pack('>I', len(data)) + typ + data
    crc = zlib.crc32(typ + data) & 0xffffffff
    return chunk + struct.pack('>I', crc)


def render(size, path):
    scale = 4
    n = scale * scale
    half = size / 2.0
    corner = size * 0.22
    stroke = size * 0.078
    top_color = (0x4c, 0x86, 0xf2)
    bottom_color = (0x33, 0x63, 0xd3)
    white = (0xff, 0xff, 0xff)
    up = [(size * 0.333, size * 0.4375), (size * 0.5, size * 0.292), (size * 0.667, size * 0.4375)]
    down = [(size * 0.333, size * 0.5625), (size * 0.5, size * 0.708), (size * 0.667, size * 0.5625)]

    def sample(px, py):
        if rounded_rect_sdf(px, py, half, half, half, corner) > 0:
            return None
        if polyline_dist(px, py, up) <= stroke / 2.0 or polyline_dist(px, py, down) <= stroke / 2.0:
            return white
        t = py / size
        return (
            int(round(top_color[0] + (bottom_color[0] - top_color[0]) * t)),
            int(round(top_color[1] + (bottom_color[1] - top_color[1]) * t)),
            int(round(top_color[2] + (bottom_color[2] - top_color[2]) * t)),
        )

    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            rs = gs = bs = 0
            opaque = 0
            for sy in range(scale):
                py = y + (sy + 0.5) / scale
                for sx in range(scale):
                    px = x + (sx + 0.5) / scale
                    c = sample(px, py)
                    if c is None:
                        continue
                    rs += c[0]
                    gs += c[1]
                    bs += c[2]
                    opaque += 1
            if opaque == 0:
                raw += bytes([0, 0, 0, 0])
            else:
                alpha = int(round(opaque * 255.0 / n))
                raw += bytes([rs // opaque, gs // opaque, bs // opaque, alpha])

    signature = bytes([137, 80, 78, 71, 13, 10, 26, 10])
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    with open(path, 'wb') as f:
        f.write(signature)
        f.write(png_chunk(b'IHDR', ihdr))
        f.write(png_chunk(b'IDAT', idat))
        f.write(png_chunk(b'IEND', b''))


def main():
    out_dir = os.path.join('addon', 'content', 'icons')
    os.makedirs(out_dir, exist_ok=True)
    render(48, os.path.join(out_dir, 'icon-48.png'))
    render(96, os.path.join(out_dir, 'icon-96.png'))
    print('icons written to', out_dir)


if __name__ == '__main__':
    main()
