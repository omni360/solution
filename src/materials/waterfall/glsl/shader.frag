#define WATERFALL

#include <common>
#include <logdepthbuf_pars_fragment>
#include <fog_pars_fragment>

uniform float time;
uniform float timeScale;

uniform float smoothness;
uniform float fallAccel;
uniform float spread;
uniform float drops;
uniform float shape;
uniform float power;
uniform float alpha;
uniform float height;
uniform float overflow;
uniform vec2 scale;
uniform vec2 strength;
uniform vec3 tint;

varying vec2 vUv;

const float K1 = 0.366025404; // (sqrt(3) - 1) / 2
const float K2 = 0.211324865; // (3 - sqrt(3)) / 6

vec2 hash(vec2 p) {

	p = vec2(
		dot(p, vec2(127.1, 311.7)),
		dot(p, vec2(269.5, 183.3))
	);

	return -1.0 + 2.0 * fract(sin(p * smoothness) * 43758.5453123);

}

float noise(vec2 p) {

	vec2 i = floor(p + (p.x + p.y) * K1);

	vec2 a = p - i + (i.x + i.y) * K2;
	float z = clamp(ceil(a.x - a.y), 0.0, 1.0); // x > y = 1, else 0
	vec2 o = vec2(z, 1.0 - z);
	vec2 b = a - o + K2;
	vec2 c = a - 1.0 + 2.0 * K2;

	vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);

	vec3 n = h * h * h * h * vec3(
		dot(a, hash(i)),
		dot(b, hash(i + o)),
		dot(c, hash(i + 1.0))
	);

	return dot(n, vec3(70.0));

}

float fbm(vec2 uv) {

	mat2 m = mat2(1.6, 1.2, -1.2, 1.6);

	float f = 0.5000 * noise(uv);
	uv = m * uv; f += 0.2500 * noise(uv);
	uv = m * uv; f += 0.1250 * noise(uv);
	uv = m * uv; f += 0.0625 * noise(uv);

	return spread + 0.5 * f;

}

void main() {

	#include <logdepthbuf_fragment>

	vec2 q = -vec2(vUv);

	float t = time * timeScale;

	q.x *= scale.x;
	q.y *= scale.y;

	float T3 = max(3.0, 1.25 * strength.x) * t * 0.6 + pow(abs(q.y), fallAccel) * 2.0;

	float n = fbm(vec2(strength.x * q.x, strength.x * q.y) - vec2(0.0, T3));

	float T3B = max(3.0, 1.25 * strength.y) * t * 0.6 + pow(abs(q.y), fallAccel) * 2.0;

	n = n * 0.5 + (n * 0.5) / (0.001 + 1.5 * fbm(vec2(strength.y * q.x, strength.y * q.y) - vec2(0.0, T3B)));

	float intensity = abs(sin(t * overflow));
	n *= 1.0 + pow(intensity, 8.0) * 0.5;

	float c = 1.0 - (drops / abs(pow(q.y, 1.0) * 4.0 + 1.0)) * pow(max(0.0, length(q * vec2(1.8 + q.y * 1.5, 0.75)) - n * max(0.0, q.y + 0.25)), shape);
	float c1 = n * c * ((power + pow(intensity, height) * 0.9 - pow(intensity, 4.0) * 0.4) - pow(vUv.y, 2.0));

	c1 = c1 * 1.05 + sin(c1 * 3.4) * 0.4;
	c1 *= 0.95 - pow(q.y, 2.0);
	c1 = clamp(c1, 0.4, 1.0);

	float c4 = c1 * c1 * c1 * c1;

	vec3 color = vec3(
		(1.0 + tint.r) * c4,
		(1.0 + tint.g) * c4,
		(1.0 + tint.b) * c4 / c1
	);

	float a = c * (1.0 - pow(abs(vUv.y), alpha));

	gl_FragColor = vec4(color, a);

	#include <premultiplied_alpha_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>

}
