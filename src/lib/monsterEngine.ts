/**
 * Ascendancy Procedural Monster Engine
 * 
 * Builds monster sprites programmatically on HTML5 Canvas using:
 *  - Seed-deterministic RNG (same monster ID → same result every time)
 *  - Per-archetype HSL color palettes (60% Primary, 30% Secondary, 10% Accent)
 *  - Z-index stacking: Back Limbs → Body → Torso → Front Limbs → Head → VFX
 *  - IK-approximated spider legs (Coxa → Femur → Tarsus)
 */

// ─── SEED DETERMINISM ─────────────────────────────────────────────────────────

/** A simple, reproducible hash based on the monster ID string. */
function hashString(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/** Creates a seeded pseudo-random number generator.
 *  Always returns the same sequence for the same seed string.
 */
export function seededRng(seed: string) {
    let state = hashString(seed);
    return function rand(min = 0, max = 1): number {
        state ^= state << 13;
        state ^= state >> 17;
        state ^= state << 5;
        state = state >>> 0;
        return min + ((state / 4294967296) * (max - min));
    };
}

// ─── COLOR PALETTES ───────────────────────────────────────────────────────────

export interface MonsterPalette {
    primary: [number, number, number];   // HSL
    secondary: [number, number, number];
    accent: [number, number, number];
    material: 'organic' | 'mineral' | 'spectral';
}

const PALETTES: Record<string, MonsterPalette> = {
    slime: { primary: [80, 100, 50], secondary: [173, 100, 37], accent: [0, 0, 100], material: 'organic' },
    goblin: { primary: [90, 47, 28], secondary: [20, 35, 19], accent: [65, 72, 58], material: 'organic' },
    wolf: { primary: [220, 12, 42], secondary: [220, 10, 28], accent: [0, 80, 45], material: 'organic' },
    spider: { primary: [0, 0, 14], secondary: [0, 77, 44], accent: [0, 0, 95], material: 'organic' },
    golem: { primary: [200, 18, 44], secondary: [130, 45, 33], accent: [210, 87, 52], material: 'mineral' },
    wraith: { primary: [237, 72, 37], secondary: [210, 10, 71], accent: [186, 100, 50], material: 'spectral' },
    hydra: { primary: [145, 60, 28], secondary: [150, 50, 18], accent: [0, 85, 50], material: 'organic' },
    demon: { primary: [0, 80, 20], secondary: [0, 60, 12], accent: [39, 100, 50], material: 'spectral' },
    dragon: { primary: [0, 0, 8], secondary: [0, 90, 37], accent: [48, 100, 50], material: 'mineral' },
    titan: { primary: [210, 15, 25], secondary: [200, 20, 18], accent: [48, 100, 50], material: 'mineral' },
};

function getArchetype(name: string): string {
    const n = name.toLowerCase();
    const archetypes = ['slime', 'goblin', 'wolf', 'spider', 'golem', 'wraith', 'hydra', 'demon', 'dragon', 'titan'];
    return archetypes.find(a => n.includes(a)) ?? 'slime';
}

/** Apply a small random HSL deviation based on the seed for natural variation. */
function shiftHSL(
    [h, s, l]: [number, number, number],
    rand: (min: number, max: number) => number,
    amount = 10
): string {
    const nh = (h + rand(-amount, amount) + 360) % 360;
    const ns = Math.max(0, Math.min(100, s + rand(-amount / 2, amount / 2)));
    const nl = Math.max(10, Math.min(90, l + rand(-amount / 2, amount / 2)));
    return `hsl(${nh.toFixed(0)}, ${ns.toFixed(0)}%, ${nl.toFixed(0)}%)`;
}

function hsl(h: number, s: number, l: number, a = 1): string {
    return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

// ─── DRAWING UTILITIES ────────────────────────────────────────────────────────

function fillEllipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function fillCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, intensity = 0.7) {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, color.replace(')', `, ${intensity})`).replace('hsl', 'hsla'));
    grad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
}

/** Draw a 3-segment spider leg using IK approximation.
 *  origin: shoulder point on torso
 *  tip: foot target position
 *  kneeOffset: how far the "knee" bends outward
 */
function drawIKLeg(
    ctx: CanvasRenderingContext2D,
    ox: number, oy: number,
    tx: number, ty: number,
    kneeX: number, kneeY: number,
    color: string,
    thickness: number
) {
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(tx, ty);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
}

// ─── MONSTER RENDERERS ────────────────────────────────────────────────────────

function drawSlime(ctx: CanvasRenderingContext2D, cx: number, cy: number, palette: MonsterPalette, rand: (min: number, max: number) => number, p: string, s: string, a: string) {
    const rx = 38 + rand(-4, 4), ry = 30 + rand(-4, 4);

    // Back ooze drips
    for (let i = 0; i < 3; i++) {
        const dx = cx + rand(-rx, rx) * 0.7;
        fillEllipse(ctx, dx, cy + ry + rand(3, 10), rand(4, 9), rand(4, 12), p);
    }

    // Body
    fillEllipse(ctx, cx, cy, rx, ry, p);

    // Highlight (organic material)
    const grad = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, 2, cx, cy, rx * 1.1);
    grad.addColorStop(0, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Internal nucleus
    fillEllipse(ctx, cx, cy, rx * 0.3, ry * 0.25, `rgba(0,0,0,0.35)`);

    // Eyes  
    const eyeSep = 10 + rand(-3, 3);
    fillCircle(ctx, cx - eyeSep, cy - 8, 5, '#fff');
    fillCircle(ctx, cx + eyeSep, cy - 8, 5, '#fff');
    fillCircle(ctx, cx - eyeSep + 1, cy - 7, 2.5, '#111');
    fillCircle(ctx, cx + eyeSep + 1, cy - 7, 2.5, '#111');
}

function drawGoblin(ctx: CanvasRenderingContext2D, cx: number, cy: number, palette: MonsterPalette, rand: (min: number, max: number) => number, p: string, s: string, a: string) {
    // LAYER 0: Back arms
    ctx.beginPath(); ctx.moveTo(cx - 20, cy - 5); ctx.lineTo(cx - 38, cy + 15); ctx.lineTo(cx - 30, cy + 30);
    ctx.strokeStyle = s; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 20, cy - 5); ctx.lineTo(cx + 38, cy + 15); ctx.lineTo(cx + 30, cy + 30);
    ctx.stroke();

    // LAYER 1: Body
    fillEllipse(ctx, cx, cy + 5, 22, 28, p);
    // Head
    fillEllipse(ctx, cx, cy - 22, 20, 19, p);

    // Ears (asymmetric)
    fillEllipse(ctx, cx - 25, cy - 22, 9, 6, s);
    fillEllipse(ctx, cx + 22, cy - 25, 7, 5, s);

    // Nose
    fillEllipse(ctx, cx + rand(-2, 2), cy - 18, 5, 4, s);

    // LAYER 2: Face - Glowing yellow eyes
    fillCircle(ctx, cx - 7, cy - 24, 4, a);
    fillCircle(ctx, cx + 7, cy - 24, 4, a);
    fillCircle(ctx, cx - 7, cy - 24, 2, '#111');
    fillCircle(ctx, cx + 7, cy - 24, 2, '#111');

    // VFX: Outline
    ctx.beginPath();
    ctx.ellipse(cx, cy - 22, 20, 19, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `${s}`;
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawWolf(ctx: CanvasRenderingContext2D, cx: number, cy: number, palette: MonsterPalette, rand: (min: number, max: number) => number, p: string, s: string, a: string) {
    // Tail
    ctx.beginPath();
    ctx.moveTo(cx + 32, cy);
    ctx.bezierCurveTo(cx + 60, cy - 20, cx + 65, cy - 40, cx + 45, cy - 50);
    ctx.strokeStyle = p; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();

    // Back legs
    ctx.beginPath(); ctx.moveTo(cx + 15, cy + 10); ctx.lineTo(cx + 18, cy + 38); ctx.lineTo(cx + 10, cy + 50);
    ctx.strokeStyle = s; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 15, cy + 12); ctx.lineTo(cx - 12, cy + 38); ctx.lineTo(cx - 5, cy + 50);
    ctx.stroke();

    // Body (mirrored + noise)
    fillEllipse(ctx, cx, cy, 35, 20, p);

    // Neck + Head
    fillEllipse(ctx, cx - 32, cy - 8, 15, 12, p);
    fillEllipse(ctx, cx - 48, cy - 14, 14, 11, p);

    // Snout
    fillEllipse(ctx, cx - 61, cy - 10, 10, 7, s);

    // Ears
    ctx.beginPath();
    ctx.moveTo(cx - 50, cy - 24); ctx.lineTo(cx - 44, cy - 40); ctx.lineTo(cx - 37, cy - 24);
    ctx.fillStyle = p; ctx.fill();

    // Front legs
    ctx.beginPath(); ctx.moveTo(cx - 20, cy + 10); ctx.lineTo(cx - 25, cy + 38); ctx.lineTo(cx - 17, cy + 50);
    ctx.strokeStyle = p; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();

    // Glowing red eye
    fillCircle(ctx, cx - 51, cy - 16, 4, a);
    fillCircle(ctx, cx - 51, cy - 16, 2, '#111');
    drawGlow(ctx, cx - 51, cy - 16, 10, a, 0.6);
}

function drawSpider(ctx: CanvasRenderingContext2D, cx: number, cy: number, palette: MonsterPalette, rand: (min: number, max: number) => number, p: string, s: string, a: string) {
    // Per spec: Body Ratio: Abdomen is 1.5x larger than Cephalothorax
    // "Hanging Rule": Abdomen sits lower
    const cephY = cy - 10;  // Head section
    const abdY = cy + 18;  // Main abdomen, hangs lower

    // LAYER 0: Back legs (4 legs behind body)
    const legColor = s;
    const legThick = 2.5 + rand(0, 1);
    // Each leg: 3 segments - Coxa (short near body), Femur (up/out), Tarsus (down to floor)
    // Left back legs (4)
    const leftOriginX = cx - 12, pts = [cephY, cephY + 2, cephY + 4, cephY + 6];
    [[cx - 12, cephY, cx - 38, cephY - 18, cx - 52, cy + 30],
    [cx - 12, cephY + 2, cx - 42, cephY - 8, cx - 58, cy + 32],
    [cx - 10, cephY + 4, cx - 40, cephY + 5, cx - 54, cy + 35],
    [cx - 10, cephY + 6, cx - 36, cephY + 15, cx - 48, cy + 38],
    ].forEach(([ox, oy, kx, ky, tx, ty]) =>
        drawIKLeg(ctx, ox, oy, tx, ty, kx, ky, legColor, legThick)
    );
    // Right back legs (4)
    [[cx + 12, cephY, cx + 38, cephY - 18, cx + 52, cy + 30],
    [cx + 12, cephY + 2, cx + 42, cephY - 8, cx + 58, cy + 32],
    [cx + 10, cephY + 4, cx + 40, cephY + 5, cx + 54, cy + 35],
    [cx + 10, cephY + 6, cx + 36, cephY + 15, cx + 48, cy + 38],
    ].forEach(([ox, oy, kx, ky, tx, ty]) =>
        drawIKLeg(ctx, ox, oy, tx, ty, kx, ky, legColor, legThick)
    );

    // LAYER 1: Abdomen (large)
    fillEllipse(ctx, cx, abdY, 22, 28, p);
    // Abdomen marking
    ctx.beginPath();
    ctx.moveTo(cx, abdY - 10); ctx.lineTo(cx - 6, abdY + 12); ctx.lineTo(cx + 6, abdY + 12);
    ctx.fillStyle = s; ctx.fill();

    // LAYER 2: Cephalothorax
    fillEllipse(ctx, cx, cephY, 15, 13, p);

    // LAYER 3: Eye Cluster (grouped in center-front)
    const eyePts = [[-5, -5], [0, -7], [5, -5], [-8, -2], [8, -2], [-4, 1], [4, 1]];
    eyePts.forEach(([ex, ey]) => {
        fillCircle(ctx, cx + ex, cephY + ey, 2.2, a);
    });

    // Mandibles (pincer)
    ctx.beginPath(); ctx.moveTo(cx - 8, cephY + 10); ctx.lineTo(cx - 13, cephY + 22); ctx.strokeStyle = p; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 8, cephY + 10); ctx.lineTo(cx + 13, cephY + 22); ctx.stroke();

    // VFX: Eye glow
    drawGlow(ctx, cx, cephY - 3, 14, a, 0.25);
}

function drawGolem(ctx: CanvasRenderingContext2D, cx: number, cy: number, palette: MonsterPalette, rand: (min: number, max: number) => number, p: string, s: string, a: string) {
    // LAYER 0: Back arms (large block arms)
    const armColor = s;
    [[-1, 1], [1, 1]].forEach(([dir, _]) => {
        ctx.beginPath();
        ctx.roundRect(cx + dir * 30, cy - 15, dir * 18, 40, 4);
        ctx.fillStyle = armColor; ctx.fill();
        ctx.strokeStyle = `rgba(0,0,0,0.5)`; ctx.lineWidth = 2; ctx.stroke();
    });

    // LAYER 1: Main Torso (octagonal clip)
    ctx.beginPath();
    const tw = 28, th = 45;
    ctx.moveTo(cx - tw * 0.6, cy - th * 0.5);
    ctx.lineTo(cx + tw * 0.6, cy - th * 0.5);
    ctx.lineTo(cx + tw, cy - th * 0.2);
    ctx.lineTo(cx + tw, cy + th * 0.2);
    ctx.lineTo(cx + tw * 0.6, cy + th * 0.5);
    ctx.lineTo(cx - tw * 0.6, cy + th * 0.5);
    ctx.lineTo(cx - tw, cy + th * 0.2);
    ctx.lineTo(cx - tw, cy - th * 0.2);
    ctx.closePath();
    ctx.fillStyle = p; ctx.fill();

    // Mineral material: high contrast edges
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1; ctx.stroke();

    // LAYER 2: Head block
    ctx.beginPath();
    ctx.roundRect(cx - 20, cy - th * 0.5 - 28, 40, 30, 3);
    ctx.fillStyle = p; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.stroke();

    // LAYER 3: Legs
    ctx.fillStyle = s;
    ctx.fillRect(cx - 20, cy + th * 0.5, 15, 18);
    ctx.fillRect(cx + 5, cy + th * 0.5, 15, 18);

    // VFX: Glowing runic core + visor eye slit
    drawGlow(ctx, cx, cy - 8, 20, a, 0.5);
    ctx.beginPath(); ctx.roundRect(cx - 12, cy - 10, 24, 5, 3); ctx.fillStyle = a; ctx.fill();
    drawGlow(ctx, cx, cy - 8, 8, a, 0.9);

    const eyeY = cy - th * 0.5 - 13;
    ctx.beginPath(); ctx.roundRect(cx - 10, eyeY, 20, 4, 2); ctx.fillStyle = a; ctx.fill();
    drawGlow(ctx, cx, eyeY + 2, 12, a, 0.7);
}

function drawWraith(ctx: CanvasRenderingContext2D, cx: number, cy: number, palette: MonsterPalette, rand: (min: number, max: number) => number, p: string, s: string, a: string) {
    // Spectral material: low opacity layers
    ctx.globalAlpha = 0.85;

    // LAYER 0: Tattered flowing tail (fade out at bottom)
    const tailGrad = ctx.createLinearGradient(cx, cy + 10, cx, cy + 70);
    tailGrad.addColorStop(0, p.replace('hsl', 'hsla').replace(')', ', 0.8)'));
    tailGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy + 15);
    ctx.bezierCurveTo(cx - 30, cy + 40, cx - 10, cy + 60, cx, cy + 70);
    ctx.bezierCurveTo(cx + 10, cy + 60, cx + 30, cy + 40, cx + 20, cy + 15);
    ctx.fillStyle = tailGrad;
    ctx.fill();

    // Wispy side tendrils
    [[cx - 40, cy + 30, cx - 20, cy + 55],
    [cx + 40, cy + 30, cx + 20, cy + 55]].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath(); ctx.moveTo(cx, cy + 20);
        ctx.quadraticCurveTo(x1, y1, x2, y2);
        ctx.strokeStyle = p.replace('hsl', 'hsla').replace(')', ', 0.5)');
        ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.stroke();
    });

    // LAYER 1: Main spectral robe body
    ctx.beginPath();
    ctx.ellipse(cx, cy, 26, 32, 0, 0, Math.PI * 2);
    const bodyGrad = ctx.createRadialGradient(cx - 5, cy - 5, 4, cx, cy, 32);
    bodyGrad.addColorStop(0, p.replace('hsl', 'hsla').replace(')', ', 0.9)'));
    bodyGrad.addColorStop(1, p.replace('hsl', 'hsla').replace(')', ', 0.3)'));
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // LAYER 2: Deep cowl / hood
    ctx.beginPath();
    ctx.ellipse(cx, cy - 30, 22, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(5,5,20,0.92)`;
    ctx.fill();

    // Floating sleeve outstretched
    ctx.beginPath(); ctx.moveTo(cx - 26, cy - 5);
    ctx.bezierCurveTo(cx - 50, cy - 20, cx - 60, cy + 5, cx - 55, cy + 20);
    ctx.strokeStyle = p.replace('hsl', 'hsla').replace(')', ', 0.7)');
    ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.stroke();

    ctx.beginPath(); ctx.moveTo(cx + 26, cy - 5);
    ctx.bezierCurveTo(cx + 50, cy - 20, cx + 60, cy + 5, cx + 55, cy + 20);
    ctx.stroke();

    // Restore opacity before VFX layer
    ctx.globalAlpha = 1;

    // VFX: Glowing ethereal eyes inside the dark cowl
    drawGlow(ctx, cx - 8, cy - 30, 12, a, 0.8);
    drawGlow(ctx, cx + 8, cy - 30, 12, a, 0.8);
    fillCircle(ctx, cx - 8, cy - 30, 4, a);
    fillCircle(ctx, cx + 8, cy - 30, 4, a);
    fillCircle(ctx, cx - 8, cy - 30, 2, '#fff');
    fillCircle(ctx, cx + 8, cy - 30, 2, '#fff');

    // VFX: Spectral core orb
    drawGlow(ctx, cx, cy, 25, a, 0.2);
}

function drawHydra(ctx: CanvasRenderingContext2D, cx: number, cy: number, palette: MonsterPalette, rand: (min: number, max: number) => number, p: string, s: string, a: string) {
    const nHeads = 3;
    const headOffsets = [[-28, -60], [0, -70], [28, -60]];

    // LAYER 1: Body
    fillEllipse(ctx, cx, cy, 32, 22, p);

    // Array-based neck + head rendering
    headOffsets.forEach(([hx, hy]) => {
        const hcx = cx + hx, hcy = cy + hy;

        // Neck (bezier)
        ctx.beginPath();
        ctx.moveTo(cx + hx * 0.4, cy - 18);
        ctx.bezierCurveTo(cx + hx * 0.6, cy - 38, hcx + rand(-5, 5), hcy + 22, hcx, hcy);
        ctx.strokeStyle = s; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();

        // Head
        fillEllipse(ctx, hcx, hcy, 15, 12, p);

        // Lower jaw
        fillEllipse(ctx, hcx, hcy + 10, 10, 6, s);

        // Glowing eyes
        fillCircle(ctx, hcx - 5, hcy - 4, 4, a);
        fillCircle(ctx, hcx + 5, hcy - 4, 4, a);
        fillCircle(ctx, hcx - 5, hcy - 4, 2, '#111');
        fillCircle(ctx, hcx + 5, hcy - 4, 2, '#111');
        drawGlow(ctx, hcx, hcy - 4, 12, a, 0.5);
    });

    // Legs
    [[-20, 18], [20, 18]].forEach(([lx, ly]) => {
        ctx.beginPath();
        ctx.moveTo(cx + lx * 0.5, cy + ly * 0.5);
        ctx.lineTo(cx + lx, cy + ly + 20);
        ctx.strokeStyle = s; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.stroke();
    });
}

function drawDemon(ctx: CanvasRenderingContext2D, cx: number, cy: number, palette: MonsterPalette, rand: (min: number, max: number) => number, p: string, s: string, a: string) {
    // LAYER 0: Bat wings (behind body, largest)
    const wingPath = (dir: number) => {
        ctx.beginPath();
        ctx.moveTo(cx + dir * 20, cy - 10);
        ctx.lineTo(cx + dir * 70, cy - 45);
        ctx.lineTo(cx + dir * 80, cy);
        ctx.lineTo(cx + dir * 65, cy + 20);
        ctx.lineTo(cx + dir * 40, cy + 30);
        ctx.bezierCurveTo(cx + dir * 55, cy + 10, cx + dir * 30, cy + 5, cx + dir * 20, cy + 5);
        ctx.fillStyle = p.replace('hsl', 'hsla').replace(')', ', 0.8)');
        ctx.fill();
        // Wing struts
        [[cx + dir * 70, cy - 45], [cx + dir * 80, cy], [cx + dir * 65, cy + 20]].forEach(([wx, wy]) => {
            ctx.beginPath(); ctx.moveTo(cx + dir * 20, cy - 5); ctx.lineTo(wx, wy);
            ctx.strokeStyle = s; ctx.lineWidth = 2; ctx.stroke();
        });
    };
    wingPath(-1); wingPath(1);

    // Tail (behind body)
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy + 36);
    ctx.bezierCurveTo(cx - 20, cy + 55, cx - 5, cy + 70, cx + 10, cy + 65);
    ctx.strokeStyle = p; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.stroke();
    // Tail spike
    ctx.beginPath(); ctx.moveTo(cx + 8, cy + 63); ctx.lineTo(cx + 18, cy + 75); ctx.lineTo(cx + 5, cy + 72);
    ctx.fillStyle = s; ctx.fill();

    // LAYER 1: Body
    fillEllipse(ctx, cx, cy + 5, 22, 30, p);

    // LAYER 2: Head
    fillEllipse(ctx, cx, cy - 20, 18, 17, p);

    // Arms
    [[-1, 1], [1, 1]].forEach(([dir]) => {
        ctx.beginPath();
        ctx.moveTo(cx + dir * 20, cy - 5);
        ctx.lineTo(cx + dir * 38, cy + 12);
        ctx.lineTo(cx + dir * 35, cy + 30);
        ctx.strokeStyle = s; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    });

    // Horns
    [[-8, -37], [8, -37]].forEach(([hx, hy]) => {
        ctx.beginPath();
        ctx.moveTo(cx + hx, cy + hy + 15);
        ctx.bezierCurveTo(cx + hx - 4, cy + hy, cx + hx, cy + hy - 10, cx + hx + 2, cy + hy - 20);
        ctx.strokeStyle = s; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();
    });

    // VFX: Glowing eyes
    fillCircle(ctx, cx - 6, cy - 20, 4, a); fillCircle(ctx, cx + 6, cy - 20, 4, a);
    fillCircle(ctx, cx - 6, cy - 20, 2, '#fff'); fillCircle(ctx, cx + 6, cy - 20, 2, '#fff');
    drawGlow(ctx, cx, cy - 20, 18, a, 0.4);
}

function drawDragon(ctx: CanvasRenderingContext2D, cx: number, cy: number, palette: MonsterPalette, rand: (min: number, max: number) => number, p: string, s: string, a: string) {
    // LAYER 0: Wing (massive, behind everything)
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 15);
    ctx.bezierCurveTo(cx + 20, cy - 80, cx + 90, cy - 70, cx + 100, cy - 30);
    ctx.bezierCurveTo(cx + 85, cy - 10, cx + 50, cy + 5, cx + 20, cy + 5);
    // Wing membrane polygons
    ctx.fillStyle = p.replace('hsl', 'hsla').replace(')', ', 0.75)');
    ctx.fill();
    // Wing struts
    [[cx + 100, cy - 30], [cx + 85, cy - 10]].forEach(([wx, wy]) => {
        ctx.beginPath(); ctx.moveTo(cx - 5, cy - 15); ctx.lineTo(wx, wy);
        ctx.strokeStyle = s; ctx.lineWidth = 3; ctx.stroke();
    });

    // Tail
    ctx.beginPath();
    ctx.moveTo(cx + 28, cy + 8);
    ctx.bezierCurveTo(cx + 60, cy + 25, cx + 80, cy + 10, cx + 90, cy - 10);
    ctx.strokeStyle = p; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.stroke();
    // Tail spikes
    for (let i = 0; i < 4; i++) {
        const t = 0.4 + i * 0.18;
        const spx = cx + 28 + (90 - 28) * t;
        const spy = cy + 8 + (cy - 18 - cy - 8) * t;
        ctx.beginPath();
        ctx.moveTo(spx, spy);
        ctx.lineTo(spx - 4, spy - 10 - i * 2);
        ctx.strokeStyle = s; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
    }

    // LAYER 1: Body
    fillEllipse(ctx, cx - 5, cy + 8, 30, 20, p);

    // Neck
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy - 5);
    ctx.bezierCurveTo(cx - 35, cy - 20, cx - 45, cy - 30, cx - 48, cy - 40);
    ctx.strokeStyle = p; ctx.lineWidth = 20; ctx.lineCap = 'round'; ctx.stroke();

    // LAYER 2: Large Head
    fillEllipse(ctx, cx - 48, cy - 48, 20, 15, p);
    // Elongated snout
    fillEllipse(ctx, cx - 68, cy - 44, 18, 8, s);
    // Jaw (open)
    ctx.beginPath();
    ctx.moveTo(cx - 55, cy - 37);
    ctx.bezierCurveTo(cx - 68, cy - 34, cx - 80, cy - 36, cx - 82, cy - 40);
    ctx.strokeStyle = s; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();

    // Legs
    [[-1, 1], [1, -0.5]].forEach(([dir, side]) => {
        ctx.beginPath();
        ctx.moveTo(cx + dir * 15, cy + 22);
        ctx.lineTo(cx + dir * 22, cy + 42);
        ctx.lineTo(cx + dir * 14 + 5, cy + 52);
        ctx.strokeStyle = s; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    });

    // Horns
    [[-40, -62], [-55, -60]].forEach(([hx, hy]) => {
        ctx.beginPath();
        ctx.moveTo(cx + hx + 10, cy + hy + 12);
        ctx.lineTo(cx + hx, cy + hy);
        ctx.strokeStyle = s; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();
    });

    // VFX: Golden Molten Eye
    fillCircle(ctx, cx - 46, cy - 50, 5, a);
    fillCircle(ctx, cx - 46, cy - 50, 2.5, '#111');
    drawGlow(ctx, cx - 46, cy - 50, 14, a, 0.8);

    // VFX: Breath fire trace
    drawGlow(ctx, cx - 88, cy - 38, 18, a, 0.5);
}

function drawTitan(ctx: CanvasRenderingContext2D, cx: number, cy: number, palette: MonsterPalette, rand: (min: number, max: number) => number, p: string, s: string, a: string) {
    // Parallax Layering: Far body layer (ground-level, behind Titan)
    drawGlow(ctx, cx, cy + 52, 45, p, 0.2); // Atmospheric mist

    // LAYER 0: Stone feet / base pillars
    ctx.fillStyle = s;
    ctx.fillRect(cx - 30, cy + 44, 22, 20);
    ctx.fillRect(cx + 8, cy + 44, 22, 20);
    // Crack overlays (mineral material)
    ctx.beginPath(); ctx.moveTo(cx - 25, cy + 50); ctx.lineTo(cx - 15, cy + 64);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();

    // LAYER 1: Main torso (tall, imposing)
    const tw = 38, th = 55;
    ctx.fillStyle = p;
    ctx.fillRect(cx - tw, cy - th, tw * 2, th + 44);
    // Mineral edges
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 3;
    ctx.strokeRect(cx - tw, cy - th, tw * 2, th + 44);
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 1;
    ctx.strokeRect(cx - tw, cy - th, tw * 2, th + 44);

    // LAYER 2: Monolithic shoulders (extends beyond frame)
    ctx.fillStyle = s;
    ctx.fillRect(cx - tw - 20, cy - th + 5, 20, 30); // Left
    ctx.fillRect(cx + tw, cy - th + 5, 20, 30); // Right

    // LAYER 3: Head slab (extends above frame for "overwhelming verticality")
    ctx.fillStyle = p;
    ctx.fillRect(cx - 28, cy - th - 38, 56, 40);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2;
    ctx.strokeRect(cx - 28, cy - th - 38, 56, 40);

    // VFX: Enormous single cyclops eye (glowing)
    drawGlow(ctx, cx, cy - th - 18, 30, a, 0.5);
    ctx.beginPath(); ctx.roundRect(cx - 18, cy - th - 24, 36, 11, 5);
    ctx.fillStyle = a; ctx.fill();
    drawGlow(ctx, cx, cy - th - 18, 12, a, 1.0);

    // VFX: Dust particles at base
    [[cx - 55, cy + 55], [cx + 48, cy + 58], [cx - 35, cy + 65], [cx + 60, cy + 50]].forEach(([px, py]) => {
        fillCircle(ctx, px, py, rand(2, 5), `rgba(255,255,255,${rand(0.05, 0.2).toFixed(2)})`);
    });
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export interface MonsterBlueprint {
    id: string;
    name: string;
    rarity: string;
}

export function drawMonster(
    ctx: CanvasRenderingContext2D,
    monster: MonsterBlueprint,
    width: number,
    height: number
) {
    ctx.clearRect(0, 0, width, height);
    ctx.save();

    const rand = seededRng(monster.id);
    const archetype = getArchetype(monster.name);
    const basePalette = PALETTES[archetype] ?? PALETTES.slime;

    const p = shiftHSL(basePalette.primary, rand, 8);
    const s = shiftHSL(basePalette.secondary, rand, 6);
    const acc = PALETTES[archetype]?.accent ?? [48, 100, 50];
    const a = hsl(acc[0], acc[1], acc[2]);

    const cx = width / 2;
    const cy = height / 2 + 10; // slightly below center

    const renderers: Record<string, typeof drawSlime> = {
        slime: drawSlime,
        goblin: drawGoblin,
        wolf: drawWolf,
        spider: drawSpider,
        golem: drawGolem,
        wraith: drawWraith,
        hydra: drawHydra,
        demon: drawDemon,
        dragon: drawDragon,
        titan: drawTitan,
    };

    const renderer = renderers[archetype] ?? drawSlime;
    renderer(ctx, cx, cy, basePalette, rand, p, s, a);

    ctx.restore();
}
