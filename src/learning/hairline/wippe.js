/**
 * Wippe: a forklift as a seesaw on its front axle. The pointer, projected onto
 * the ground, slides the loaded pallet along the forks. Past the tipping
 * moment the whole truck rotates about the front wheel's contact point: the
 * forks dip and the rear wheel lifts off. Two floor dots mark the pivot and the
 * load centre, so the lever arm is the gap between them. At rest the crate is
 * bright; once the truck tips, the bright goes to the counterweight that lifts.
 * The slider is the load's mass in kg.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, proj, rad, rings, run, unproj,
  spring, stepS, flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

const XA = 52, PX0 = 66, PX1 = 98, PL = 40, MM = 25, REST = 66, M0 = 1500 * 700, TMAX = 7.5;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.62);
  fit(C, [[-10, -14, -5], [134, 50, -5], [134, -14, -5], [-10, 50, -5], [60, 18, 82], [0, 18, 45]], 200, 172);
  const P = proj(C), front = facing(C);
  let m = value, over = null, th = 0;
  const px = spring(REST, { eps: 0.02 });

  // the truck pivots about the front wheel's contact point (XA, 0)
  const R = (x, y, z) => {
    const c = Math.cos(rad(th)), s = Math.sin(rad(th)), d = x - XA;
    return P(XA + d * c + z * s, y, -d * s + z * c);
  };
  const g = mk("g", {}, svg), parts = [];
  const [fr, fi] = rings(-10, -14, 134, 50, 10, 2.2);
  put(solid(g), { sil: poly(hull(fr.map((q) => P(q.u, q.v, -5)).concat(fr.map((q) => P(q.u, q.v, 0))))), crease: open(run(fi, front).map((q) => P(q.u, q.v, 0))) });
  const pivot = flatDot(g, C, 1.3, "dot m"), centre = flatDot(g, C, 1.3, "dot off");
  place(pivot, P(XA, 44, 0));

  const box = (x0, y0, x1, y1, z0, z1, r, b, slide) => {
    const [ring, inner] = rings(x0, y0, x1, y1, r, b);
    const p = { ring, inner, z0, z1, slide, el: solid(g) };
    parts.push(p);
    return p;
  };
  const wheel = (cx, r, y0, y1) => {
    const ring = [], inner = [];
    for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2; ring.push([cx + r * Math.cos(a), r + r * Math.sin(a)]); inner.push([cx + (r - 2.4) * Math.cos(a), r + (r - 2.4) * Math.sin(a)]); }
    const p = { wheel: true, ring, inner, y0, y1, el: solid(g) };
    parts.push(p);
    return p;
  };
  // back to front: far wheels, body, counterweight, guard, mast, near wheels, forks, pallet, crate
  wheel(12, 8, -2, 5); wheel(XA, 9, -2, 5);
  box(0, 0, 58, 36, 6, 28, 7, 1.6);
  const cw = box(0, 1, 20, 35, 28, 40, 6, 1.6);
  for (const [x, y] of [[24, 3], [50, 3], [24, 30.5], [50, 30.5]]) box(x, y, x + 2.5, y + 2.5, 28, 62, 1, 0.5);
  box(20, 1, 55, 35, 62, 64.5, 4, 1.4);
  box(58, 5, 63, 9.5, 3, 80, 1.2, 0.6); box(58, 9.5, 63, 26.5, 72, 76, 1, 0.6); box(58, 26.5, 63, 31, 3, 80, 1.2, 0.6);
  wheel(12, 8, 31, 38); wheel(XA, 9, 31, 38);
  box(63, 9, 120, 13, 12, 14, 1, 0.5); box(63, 23, 120, 27, 12, 14, 1, 0.5);
  box(0, 2, PL, 34, 14, 20, 2, 0.9, true);
  const crate = box(2, 4, PL - 2, 32, 20, 50, 4, 1.6, true);

  let drawn = "";
  function draw() {
    const key = px.x.toFixed(2) + "|" + th.toFixed(3);
    if (key === drawn) return;
    drawn = key;
    for (const p of parts) {
      if (p.wheel) {
        const side = (y) => p.ring.map(([x, z]) => R(x, y, z));
        put(p.el, { sil: poly(hull(side(p.y0).concat(side(p.y1)))), crease: poly(p.inner.map(([x, z]) => R(x, p.y1, z))) });
        continue;
      }
      const o = p.slide ? px.x : 0;
      const at = (q, z) => R(q.u + o, q.v, z);
      put(p.el, { sil: poly(hull(p.ring.map((q) => at(q, p.z0)).concat(p.ring.map((q) => at(q, p.z1))))), crease: open(run(p.inner, front).map((q) => at(q, p.z1))) });
    }
    place(centre, P(px.x + PL / 2, 44, 0));
    crate.el.sil.classList.toggle("hi", th < 0.05);
    cw.el.sil.classList.toggle("hi", th >= 0.05);
  }
  // tipping starts when mass × load-centre distance passes the truck's stable moment
  const tilt = () => clamp((m * (px.x + PL / 2 - PX0) * MM - M0) / (M0 * 0.5), 0, 1) * TMAX;

  const B = register(stage, (dt) => {
    const moving = stepS(px, dt);
    th = tilt();
    draw();
    return moving;
  });
  bag.add(B.unregister);

  function retarget() {
    px.t = over ? clamp(over[0] - PL / 2, PX0, PX1) : REST;
    const mm = Math.round(((px.t + PL / 2 - PX0) * MM) / 10) * 10;
    read.textContent = over ? `${mm} mm${m * mm > M0 ? " · lift" : ""}` : "rest";
    B.wake();
  }
  bag.add(pointer(stage, {
    move: (p) => { over = unproj(C, p[0], p[1], 0); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { m = v; drawn = ""; B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "wippe",
  means: "A forklift is a seesaw on its front axle: slide the load out along the forks and the rear wheels lift.",
  rules: [1, 4, 5, 9],
  range: [1000, 1500, 2000],
  tour: [[214, 214], [262, 238], [300, 258], null],
  mount,
});
