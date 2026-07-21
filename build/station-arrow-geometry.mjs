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
//     a path. It's drawn behind the arrow as the gusts hub.
//   • The rotation/anchor point — what the marker rotates the arrow about — is the
//     midpoint of the element marked id="center" (an Inkscape ellipse/arc, which
//     Inkscape saves as a <path sodipodi:type="arc" sodipodi:cx sodipodi:cy …>, or
//     a plain <circle id="center" cx cy r/>). Any transform on that element (e.g.
//     Inkscape's stray `scale(-1,1)` on mirrored shapes) is applied to get its
//     position in the SVG's root coordinate space.
//
// None of these markers are optional, and there is no fallback if one is missing
// or malformed — the build fails with a descriptive error instead, so a botched
// edit to the SVG is caught immediately rather than silently shipping a wrong
// rotation centre or hub.

// --- minimal path parsing -------------------------------------------------------

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
// units) and its centre. Supports a plain <circle id="gusts" cx cy r/>, a bare
// <path id="gusts" d="…">, or — what Inkscape produces when you label a blob —
// a <g id="gusts" transform="translate(…)"> wrapping a path, whose translate is
// baked into the returned `d`.
function gustsShape(svg) {
  const circle = svg.match(/<(?:circle|ellipse)\b[^>]*\bid="gusts"[^>]*>/);
  if (circle) {
    const cx = attr(circle[0], 'cx');
    const cy = attr(circle[0], 'cy');
    const r = attr(circle[0], 'r');
    if ([cx, cy, r].some((v) => v === undefined)) {
      throw new Error(`<circle id="gusts"> is missing cx/cy/r: ${circle[0]}`);
    }
    return { d: circlePath(cx, cy, r), cx, cy };
  }

  const path = svg.match(/<path\b[^>]*\bid="gusts"[^>]*>/);
  if (path) {
    const d = path[0].match(/\bd="([^"]+)"/)?.[1];
    if (!d) {
      throw new Error(`<path id="gusts"> has no d attribute: ${path[0]}`);
    }
    const subpaths = parsePath(d);
    const box = boxOf(subpaths);
    return {
      d: d.trim().replace(/\s+/g, ' '),
      cx: (box.minX + box.maxX) / 2,
      cy: (box.minY + box.maxY) / 2,
    };
  }

  const group = svg.match(/<g\b([^>]*\bid="gusts"[^>]*)>([\s\S]*?)<\/g>/);
  if (!group) {
    throw new Error(
      'SVG has no id="gusts" marker (expected a <circle id="gusts">, a <path id="gusts">, or a <g id="gusts"> wrapping a <path>)',
    );
  }
  const [tx, ty] = translateOf(group[1]);
  const inner = group[2].match(/<path\b[^>]*\bd="([^"]+)"/);
  if (!inner) {
    throw new Error('<g id="gusts"> does not wrap a <path> with a d attribute');
  }
  const subpaths = parsePath(inner[1]);
  const box = boxOf(subpaths);
  return {
    d: serializeAbs(subpaths, (x, y) => [x + tx, y + ty]),
    cx: (box.minX + box.maxX) / 2 + tx,
    cy: (box.minY + box.maxY) / 2 + ty,
  };
}

const attrColon = (tag, ns, name) => {
  const m = tag.match(new RegExp(`\\b${ns}:${name}="([^"]+)"`));
  return m ? parseFloat(m[1]) : undefined;
};

// `transform="translate(…) scale(…) …"` → the listed [kind, a, b] functions, in
// document order. Only translate/scale appear on hand-authored arrow shapes.
function parseTransformList(tag) {
  const t = tag.match(/\btransform="([^"]+)"/)?.[1];
  if (!t) return [];
  const fns = [];
  const re = /(translate|scale)\(\s*(-?[\d.eE]+)(?:[\s,]+(-?[\d.eE]+))?\s*\)/g;
  let m;
  while ((m = re.exec(t))) {
    fns.push({
      kind: m[1],
      a: parseFloat(m[2]),
      b: m[3] !== undefined ? parseFloat(m[3]) : undefined,
    });
  }
  return fns;
}

// Map a point through a parsed transform list. `transform="T1 T2"` composes as
// M = T1·T2, so a local point is transformed by the rightmost function first.
function applyTransforms(fns, [x, y]) {
  for (let i = fns.length - 1; i >= 0; i--) {
    const f = fns[i];
    if (f.kind === 'translate') {
      x += f.a;
      y += f.b ?? 0;
    } else {
      x *= f.a;
      y *= f.b ?? f.a;
    }
  }
  return [x, y];
}

// The rotation centre, marked id="center": Inkscape saves an ellipse/arc drawn
// with its centre-point tool as a <path sodipodi:type="arc" sodipodi:cx
// sodipodi:cy …>, so that's tried first; a plain <circle id="center" cx cy r/>
// is read from its cx/cy. The element's own `transform` (Inkscape adds a stray
// `scale(-1,1)` on mirrored shapes) is applied to land in the SVG's root
// coordinate space.
function centerPoint(svg) {
  const tag = (svg.match(
    /<(?:path|circle|ellipse)\b[^>]*\bid="center"[^>]*\/>/,
  ) ?? svg.match(/<(?:path|circle|ellipse)\b[^>]*\bid="center"[^>]*>/))?.[0];
  if (!tag) {
    throw new Error(
      'SVG has no id="center" marker (expected an Inkscape arc/ellipse or a <circle id="center"> marking the rotation centre)',
    );
  }

  const scx = attrColon(tag, 'sodipodi', 'cx');
  const scy = attrColon(tag, 'sodipodi', 'cy');
  const local =
    scx !== undefined && scy !== undefined
      ? [scx, scy]
      : [attr(tag, 'cx'), attr(tag, 'cy')];
  if (local.some((v) => v === undefined)) {
    throw new Error(
      `id="center" element has no sodipodi:cx/cy or cx/cy: ${tag}`,
    );
  }

  return applyTransforms(parseTransformList(tag), local);
}

// The arrow body path, marked id="wind".
function bodyPath(svg) {
  const tag = svg.match(/<path\b[^>]*\bid="wind"[^>]*>/)?.[0];
  if (!tag) {
    throw new Error('SVG has no <path id="wind"> body');
  }
  const d = tag.match(/\bd="([^"]+)"/)?.[1];
  if (!d) {
    throw new Error(`<path id="wind"> has no d attribute: ${tag}`);
  }
  return d.trim().replace(/\s+/g, ' ');
}

export function geometryFromSvg(svg) {
  const rawPath = bodyPath(svg);

  // The arrow's own bounding box is the "base arrow size" — the SVG page/viewBox
  // is ignored, so however the author framed the drawing the marker renders at a
  // consistent size that fills the frame.
  const bodySubs = parsePath(rawPath);
  const body = boxOf(bodySubs);
  const bh = body.maxY - body.minY;

  // Gusts shape, drawn behind the arrow as the gusts hub.
  const gusts = gustsShape(svg);

  // The rotation centre: the dedicated id="center" marker.
  const [centreX, centreY] = centerPoint(svg);

  // Normalise so the arrow's bounding box is the canonical height — every arrow
  // then shares one coordinate scale (and one on-screen size and outline width).
  const k = CANONICAL_VIEW_HEIGHT / bh;
  const hubX = round2(centreX * k);
  const hubY = round2(centreY * k);

  // The viewBox is a square centred on the hub (the rotation centre), sized to
  // the shape's own natural reach from the hub along each axis, plus a little
  // for the outline stroke — not padded for full-rotation safety. That means a
  // rotated arrow can clip its corners against the box at some angles, but
  // every consumer (the on-map marker, the favicon, the settings preview, the
  // compact card) renders the same unpadded size instead of each one sitting
  // inside its own oversized, mostly-empty safety margin.
  const reach = Math.max(
    Math.abs(body.minX - centreX),
    Math.abs(body.maxX - centreX),
    Math.abs(body.minY - centreY),
    Math.abs(body.maxY - centreY),
  );
  const half = Math.ceil((reach + bh * 0.06) * k);

  return {
    path: scalePath(rawPath, k),
    viewBox: `${round2(hubX - half)} ${round2(hubY - half)} ${half * 2} ${half * 2}`,
    rotationCentre: `${hubX} ${hubY}`,
    gustsPath: scalePath(gusts.d, k),
  };
}
