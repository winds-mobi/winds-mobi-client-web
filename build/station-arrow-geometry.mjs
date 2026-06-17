// Build-time extraction of arrow geometry from a hand-authored SVG (the kind
// Inkscape saves). Given the SVG source it returns everything the app needs to
// render the marker, favicon, and gusts hub for that shape — so the SVG file is
// the single source of truth for the arrow and editing it is all that's needed.
//
// Conventions (keep authoring simple):
//   • The arrow body is the path marked id="wind", pointing up. Its bounding box
//     is the "base arrow size": the SVG page/viewBox is ignored and the shape is
//     normalised to a canonical height, so every arrow renders at one size and
//     outline width however the drawing happened to be framed.
//   • The gusts disc is marked id="gusts": a <circle id="gusts" cx cy r/> or (what
//     Inkscape produces when you label a blob) a translated <g id="gusts"> wrapping
//     a path. Its centre is the rotation/anchor point — the marker rotates the
//     arrow about the hub. If absent, the path's last subpath (the hole) is used.

// --- minimal path parsing, only used for the hub fallback ----------------------

function tokenize(d) {
  return d.match(/[MmCcLlZzHhVv]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
}

// Parse a path `d` into absolute subpaths: [{ start:[x,y], segs:[{cmd,pts}] }].
function parsePath(d) {
  const tokens = tokenize(d);
  const subpaths = [];
  let i = 0;
  let cmd = '';
  let cur = [0, 0];
  let start = [0, 0];
  let sub = null;
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    switch (cmd.toUpperCase()) {
      case 'M': {
        let x = num();
        let y = num();
        if (rel) {
          x += cur[0];
          y += cur[1];
        }
        cur = [x, y];
        start = [x, y];
        sub = { start: [x, y], segs: [] };
        subpaths.push(sub);
        cmd = rel ? 'l' : 'L';
        break;
      }
      case 'L': {
        let x = num();
        let y = num();
        if (rel) {
          x += cur[0];
          y += cur[1];
        }
        sub.segs.push({ pts: [[x, y]] });
        cur = [x, y];
        break;
      }
      case 'H': {
        let x = num();
        if (rel) x += cur[0];
        sub.segs.push({ pts: [[x, cur[1]]] });
        cur = [x, cur[1]];
        break;
      }
      case 'V': {
        let y = num();
        if (rel) y += cur[1];
        sub.segs.push({ pts: [[cur[0], y]] });
        cur = [cur[0], y];
        break;
      }
      case 'C': {
        const p = [];
        for (let k = 0; k < 3; k++) {
          let x = num();
          let y = num();
          if (rel) {
            x += cur[0];
            y += cur[1];
          }
          p.push([x, y]);
        }
        sub.segs.push({ cubic: true, pts: p });
        cur = p[2];
        break;
      }
      case 'Z':
        sub.closed = true;
        cur = [...start];
        break;
      default:
        throw new Error(`Unsupported path command: ${cmd}`);
    }
  }
  return subpaths;
}

function subpathBox(sub) {
  let p = [...sub.start];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const add = (x, y) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  add(p[0], p[1]);
  for (const s of sub.segs) {
    if (s.cubic) {
      const [c1, c2, e] = s.pts;
      for (let t = 0; t <= 1; t += 0.05) {
        const mt = 1 - t;
        add(
          mt ** 3 * p[0] +
            3 * mt * mt * t * c1[0] +
            3 * mt * t * t * c2[0] +
            t ** 3 * e[0],
          mt ** 3 * p[1] +
            3 * mt * mt * t * c1[1] +
            3 * mt * t * t * c2[1] +
            t ** 3 * e[1],
        );
      }
      p = e;
    } else {
      add(...s.pts[0]);
      p = s.pts[0];
    }
  }
  return { minX, minY, maxX, maxY };
}

// Union bounding box of a list of subpaths.
function boxOf(subpaths) {
  return subpaths.map(subpathBox).reduce((a, b) => ({
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }));
}

// --- SVG reading ---------------------------------------------------------------

// Every arrow's bounding box is normalised to this height so the shapes share one
// coordinate scale: the hairline outline (a single shared stroke width) and the
// on-screen marker size then read the same whichever shape is drawn, regardless
// of the units or page size the SVG happened to be authored at.
const CANONICAL_VIEW_HEIGHT = 340;

const round2 = (n) => Math.round(n * 100) / 100;

// Scale every coordinate in a path `d` by `k` about the origin. Uniform scaling
// multiplies absolute coordinates and relative deltas alike, and these arrows
// use only M/L/C/Z (no arc flags), so multiplying each number is exact.
const scalePath = (d, k) =>
  d.replace(/-?\d*\.?\d+(?:e-?\d+)?/g, (n) =>
    String(round2(parseFloat(n) * k)),
  );

const r2s = (n) => String(round2(n));

// Serialise absolute subpaths back to a path `d`, applying a point transform.
// Used to bake an Inkscape group's translate into the gusts shape.
function serializeAbs(subpaths, fn) {
  let out = '';
  for (const sp of subpaths) {
    const [sx, sy] = fn(...sp.start);
    out += `M ${r2s(sx)},${r2s(sy)}`;
    for (const seg of sp.segs) {
      if (seg.cubic) {
        const [a, b, c] = seg.pts.map((pt) => fn(...pt));
        out += ` C ${r2s(a[0])},${r2s(a[1])} ${r2s(b[0])},${r2s(b[1])} ${r2s(c[0])},${r2s(c[1])}`;
      } else {
        const [x, y] = fn(...seg.pts[0]);
        out += ` L ${r2s(x)},${r2s(y)}`;
      }
    }
    if (sp.closed) out += ' Z';
  }
  return out;
}

// An absolute-coordinate circle as four cubic béziers — used when the gusts pin
// is a <circle id="gusts">.
const KAPPA = 0.5522847498307936;
function circlePath(cx, cy, r) {
  const k = KAPPA * r;
  return (
    `M ${r2s(cx)},${r2s(cy - r)}` +
    ` C ${r2s(cx + k)},${r2s(cy - r)} ${r2s(cx + r)},${r2s(cy - k)} ${r2s(cx + r)},${r2s(cy)}` +
    ` C ${r2s(cx + r)},${r2s(cy + k)} ${r2s(cx + k)},${r2s(cy + r)} ${r2s(cx)},${r2s(cy + r)}` +
    ` C ${r2s(cx - k)},${r2s(cy + r)} ${r2s(cx - r)},${r2s(cy + k)} ${r2s(cx - r)},${r2s(cy)}` +
    ` C ${r2s(cx - r)},${r2s(cy - k)} ${r2s(cx - k)},${r2s(cy - r)} ${r2s(cx)},${r2s(cy - r)} Z`
  );
}

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}="([^"]+)"`));
  return m ? parseFloat(m[1]) : undefined;
};

// `transform="… translate(x[, y]) …"` → [x, y] (Inkscape wraps labelled blobs
// in a translated group).
function translateOf(tag) {
  const m = tag.match(/translate\(\s*(-?[\d.eE]+)(?:[\s,]+(-?[\d.eE]+))?/);
  return m ? [parseFloat(m[1]) || 0, parseFloat(m[2]) || 0] : [0, 0];
}

// The gusts shape, marked id="gusts": its absolute path `d` (in the SVG's root
// units) and its centre. Supports a plain <circle id="gusts" cx cy r/> or — what
// Inkscape produces when you label a blob — a <g id="gusts" transform="translate(…)">
// wrapping a path, whose translate is baked into the returned `d`. Returns null
// when there is no gusts marker (caller then falls back to the path's hole).
function gustsShape(svg) {
  const circle = svg.match(/<(?:circle|ellipse)\b[^>]*\bid="gusts"[^>]*>/);
  if (circle) {
    const cx = attr(circle[0], 'cx');
    const cy = attr(circle[0], 'cy');
    const r = attr(circle[0], 'r');
    if (![cx, cy, r].some((v) => v === undefined)) {
      return { d: circlePath(cx, cy, r), cx, cy };
    }
  }

  const group = svg.match(/<g\b([^>]*\bid="gusts"[^>]*)>([\s\S]*?)<\/g>/);
  if (group) {
    const [tx, ty] = translateOf(group[1]);
    const inner = group[2].match(/<path\b[^>]*\bd="([^"]+)"/);
    if (inner) {
      const subpaths = parsePath(inner[1]);
      const box = boxOf(subpaths);
      return {
        d: serializeAbs(subpaths, (x, y) => [x + tx, y + ty]),
        cx: (box.minX + box.maxX) / 2 + tx,
        cy: (box.minY + box.maxY) / 2 + ty,
      };
    }
  }
  return null;
}

// The arrow body path, marked id="wind". Falls back to the only non-gusts <path>
// so a single-path SVG (no explicit ids) still works.
function bodyPath(svg) {
  const tags = svg.match(/<path\b[^>]*>/g) ?? [];
  const tag =
    tags.find((t) => /\bid="wind"/.test(t)) ??
    tags.find((t) => !/\bid="gusts"|label="gusts"/.test(t));
  const d = tag?.match(/\bd="([^"]+)"/)?.[1];
  return d ? d.trim().replace(/\s+/g, ' ') : '';
}

export function geometryFromSvg(svg) {
  const rawPath = bodyPath(svg);
  if (!rawPath) throw new Error('SVG has no <path> body');

  // The arrow's own bounding box is the "base arrow size" — the SVG page/viewBox
  // is ignored, so however the author framed the drawing the marker renders at a
  // consistent size that fills the frame.
  const bodySubs = parsePath(rawPath);
  const body = boxOf(bodySubs);
  const bw = body.maxX - body.minX;
  const bh = body.maxY - body.minY;

  // Gusts shape + its centre (the centre is the rotation/anchor point — the
  // marker rotates the arrow about the station's hub). Falls back to the body's
  // last subpath (the punched-out hole) when there is no id="gusts" marker.
  let gusts = gustsShape(svg);
  if (!gusts) {
    const last = bodySubs[bodySubs.length - 1];
    const box = subpathBox(last);
    gusts = {
      d: serializeAbs([last], (x, y) => [x, y]),
      cx: (box.minX + box.maxX) / 2,
      cy: (box.minY + box.maxY) / 2,
    };
  }

  // Normalise so the arrow's bounding box is the canonical height — every arrow
  // then shares one coordinate scale (and one on-screen size and outline width).
  const k = CANONICAL_VIEW_HEIGHT / bh;
  const hubX = round2(gusts.cx * k);
  const hubY = round2(gusts.cy * k);

  // Favicon viewBox: a square centred on the hub (the rotation centre), sized to
  // the farthest the arrow reaches from the hub so it can't clip at any rotation,
  // plus a little for the outline stroke.
  const reach = Math.max(
    Math.hypot(body.minX - gusts.cx, body.minY - gusts.cy),
    Math.hypot(body.minX - gusts.cx, body.maxY - gusts.cy),
    Math.hypot(body.maxX - gusts.cx, body.minY - gusts.cy),
    Math.hypot(body.maxX - gusts.cx, body.maxY - gusts.cy),
  );
  const half = Math.ceil((reach + bh * 0.06) * k);

  return {
    path: scalePath(rawPath, k),
    viewBox: [body.minX, body.minY, bw, bh].map((n) => round2(n * k)).join(' '),
    rotationCentre: `${hubX} ${hubY}`,
    gustsPath: scalePath(gusts.d, k),
    faviconViewBox: `${round2(hubX - half)} ${round2(hubY - half)} ${half * 2} ${half * 2}`,
  };
}
