<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef } from 'vue'

const canvasEl = useTemplateRef<HTMLCanvasElement>('canvas')

let teardown: (() => void) | undefined

// Raymarched signed-distance-field blob: an organically-deforming sphere with
// swirling liquid noise visible through its "glass" surface, and a glow that
// radiates outward from the silhouette rather than filling the whole canvas.
const VERTEX_SHADER = `#version 300 es
layout(location=0) in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform float u_time;
uniform vec2  u_res;
uniform float u_radius;
uniform float u_deform;
uniform float u_freq;
uniform float u_morphSpeed;
uniform float u_rotSpeed;
uniform float u_specular;
uniform float u_shininess;
uniform float u_glowStrength;
uniform vec3  u_colA;
uniform vec3  u_colB;
uniform vec3  u_glowA;
uniform vec3  u_glowB;
uniform float u_liquidSpeed;
uniform float u_liquidScale;
uniform float u_liquidBright;
uniform float u_filament;
uniform float u_core;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float blobField(vec3 p) {
  float t = u_time * u_morphSpeed;
  float f = u_freq;
  float d = 0.0;
  d += sin(p.x * 2.6 * f + t * 1.00);
  d += sin(p.y * 2.9 * f - t * 0.80 + 1.3);
  d += sin(p.z * 3.2 * f + t * 1.20 + 2.7);
  d += sin((p.x + p.z) * 2.2 * f - t * 0.90 + 4.1);
  d += sin((p.y - p.x) * 2.4 * f + t * 0.70 + 0.6);
  return d * 0.2;
}

float mapBlob(vec3 p) {
  float t = u_time * u_rotSpeed;
  p.xy *= rot(t * 0.7);
  p.yz *= rot(t * 0.5);
  float r = u_radius + u_deform * blobField(p);
  return length(p) - r;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(
    mapBlob(p + e.xyy) - mapBlob(p - e.xyy),
    mapBlob(p + e.yxy) - mapBlob(p - e.yxy),
    mapBlob(p + e.yyx) - mapBlob(p - e.yyx)));
}

float hash13(vec3 p3) { p3 = fract(p3 * 0.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
float vnoise3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i + vec3(0,0,0)), hash13(i + vec3(1,0,0)), f.x),
                 mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x),
                 mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { v += a * vnoise3(p); p *= 2.03; a *= 0.5; } return v; }

float liquid(vec3 p) {
  float t = u_time * u_liquidSpeed;
  p *= u_liquidScale;
  p.xy *= rot(t * 0.15);
  p.yz *= rot(t * 0.10);
  vec3 w = vec3(fbm3(p + t * 0.2), fbm3(p + vec3(4.3, 1.2, -t * 0.15)), fbm3(p.zxy + vec3(7.7, 2.3, t * 0.10)));
  return fbm3(p + 1.8 * w);
}

void main() {
  vec2 p = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
  p.x *= u_res.x / u_res.y;

  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(p, -1.8));

  float t = 0.0;
  bool hit = false;
  vec3 pos = ro;
  float minD = 1e3;
  for (int i = 0; i < 80; i++) {
    pos = ro + rd * t;
    float d = mapBlob(pos);
    minD = min(minD, d);
    if (d < 0.001) { hit = true; break; }
    t += d * 0.40;
    if (t > 6.0) break;
  }

  vec3 E = vec3(0.0);

  if (hit) {
    vec3 n = calcNormal(pos);
    vec3 v = -rd;
    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);

    vec3 rp = pos + rd * 0.04;
    float trans = 1.0;
    vec3 inner = vec3(0.0);
    for (int k = 0; k < 5; k++) {
      float raw = liquid(rp);
      float dens = smoothstep(0.30, 0.70, raw);
      float fil = pow(1.0 - abs(2.0 * raw - 1.0), 5.0);
      vec3 c = mix(u_colB, u_colA, 0.5 + 0.5 * sin(raw * 6.0 + u_time * 0.3 + rp.y * 2.5));
      vec3 emit = c * dens * 0.55 + c * fil * u_filament + vec3(1.0) * pow(fil, 3.0) * u_filament * 0.4;
      emit += u_colA * smoothstep(0.5, 0.0, length(rp)) * u_core;
      inner += trans * emit * 0.17;
      trans *= 0.84;
      rp += rd * 0.11;
      if (length(rp) > 1.0) break;
    }
    E += inner * (1.0 - fres * 0.6) * u_liquidBright;

    vec3 rim = mix(u_colB, u_colA, 0.5 + 0.5 * (n.x * 0.7 + n.y * 0.45));
    E += rim * fres * 1.3;
    vec3 l1 = normalize(vec3(0.6, 0.85, 0.6));
    vec3 l2 = normalize(vec3(-0.7, 0.25, 0.55));
    vec3 h1 = normalize(l1 + v);
    vec3 h2 = normalize(l2 + v);
    E += vec3(1.0) * pow(max(dot(n, h1), 0.0), u_shininess) * 1.3 * u_specular;
    E += vec3(0.8, 0.9, 1.0) * pow(max(dot(n, h2), 0.0), u_shininess * 0.45) * 0.6 * u_specular;
  } else {
    float g = exp(-minD * 5.5);
    float ang = atan(rd.y, rd.x);
    vec3 gc = mix(u_glowA, u_glowB, 0.5 + 0.5 * sin(ang * 3.0 + u_time * 0.5));
    E += (gc * g * 1.4 + vec3(0.6, 0.8, 1.0) * pow(g, 3.0) * 0.7) * u_glowStrength;
  }

  float alpha = clamp(max(E.r, max(E.g, E.b)), 0.0, 1.0);
  fragColor = vec4(clamp(E, 0.0, 1.0), alpha);
}
`

// One fixed, hand-tuned preset (colors matched to this project's existing
// --color-accent blue + deep indigo, in place of the reference demo's magenta).
const PRESET = {
  radius: 0.3,
  deform: 0.36,
  frequency: 2.0,
  morphSpeed: 1.1,
  rotSpeed: 0.12,
  specular: 1.0,
  shininess: 140,
  glowStrength: 0.7,
  colorA: [0.541, 0.706, 1.0], // #8ab4ff
  colorB: [0.263, 0.22, 0.792], // #4338ca
  liquidSpeed: 0.5,
  liquidScale: 2.2,
  liquidBright: 1.0,
  filament: 1.4,
  core: 0.3,
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Failed to create shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(log ?? 'shader compile failed')
  }
  return shader
}

onMounted(() => {
  const canvas = canvasEl.value
  if (!canvas) return

  const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: false })
  if (!gl) return

  let program: WebGLProgram
  try {
    const created = gl.createProgram()
    if (!created) throw new Error('Failed to create program')
    program = created
    gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER))
    gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? 'program link failed')
    }
  } catch {
    return
  }
  gl.useProgram(program)

  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  gl.clearColor(0, 0, 0, 0)

  const uniform = (name: string) => gl.getUniformLocation(program, name)
  const U = {
    time: uniform('u_time'),
    res: uniform('u_res'),
    radius: uniform('u_radius'),
    deform: uniform('u_deform'),
    freq: uniform('u_freq'),
    morphSpeed: uniform('u_morphSpeed'),
    rotSpeed: uniform('u_rotSpeed'),
    specular: uniform('u_specular'),
    shininess: uniform('u_shininess'),
    glowStrength: uniform('u_glowStrength'),
    colA: uniform('u_colA'),
    colB: uniform('u_colB'),
    glowA: uniform('u_glowA'),
    glowB: uniform('u_glowB'),
    liquidSpeed: uniform('u_liquidSpeed'),
    liquidScale: uniform('u_liquidScale'),
    liquidBright: uniform('u_liquidBright'),
    filament: uniform('u_filament'),
    core: uniform('u_core'),
  }

  let width = 0
  let height = 0
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25)
    width = Math.max(1, Math.floor(canvas!.clientWidth * dpr))
    height = Math.max(1, Math.floor(canvas!.clientHeight * dpr))
    if (canvas!.width !== width || canvas!.height !== height) {
      canvas!.width = width
      canvas!.height = height
    }
  }
  resize()

  let frameId: number
  const start = performance.now()
  const render = (now: number) => {
    resize()
    gl.viewport(0, 0, width, height)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.uniform1f(U.time, (now - start) * 0.001)
    gl.uniform2f(U.res, width, height)
    gl.uniform1f(U.radius, PRESET.radius)
    gl.uniform1f(U.deform, PRESET.deform)
    gl.uniform1f(U.freq, PRESET.frequency)
    gl.uniform1f(U.morphSpeed, PRESET.morphSpeed)
    gl.uniform1f(U.rotSpeed, PRESET.rotSpeed)
    gl.uniform1f(U.specular, PRESET.specular)
    gl.uniform1f(U.shininess, PRESET.shininess)
    gl.uniform1f(U.glowStrength, PRESET.glowStrength)
    gl.uniform3fv(U.colA, PRESET.colorA)
    gl.uniform3fv(U.colB, PRESET.colorB)
    gl.uniform3fv(U.glowA, PRESET.colorA)
    gl.uniform3fv(U.glowB, PRESET.colorB)
    gl.uniform1f(U.liquidSpeed, PRESET.liquidSpeed)
    gl.uniform1f(U.liquidScale, PRESET.liquidScale)
    gl.uniform1f(U.liquidBright, PRESET.liquidBright)
    gl.uniform1f(U.filament, PRESET.filament)
    gl.uniform1f(U.core, PRESET.core)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    frameId = requestAnimationFrame(render)
  }
  frameId = requestAnimationFrame(render)

  const handleResize = () => resize()
  window.addEventListener('resize', handleResize)

  teardown = () => {
    cancelAnimationFrame(frameId)
    window.removeEventListener('resize', handleResize)
    gl.deleteProgram(program)
    gl.deleteBuffer(buffer)
    gl.deleteVertexArray(vao)
  }
})

onUnmounted(() => teardown?.())
</script>

<template>
  <canvas ref="canvas" class="orb-canvas" aria-hidden="true" />
</template>

<style scoped>
.orb-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
