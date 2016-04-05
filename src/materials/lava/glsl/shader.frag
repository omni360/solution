#define LAVA

#include <common>
#include <logdepthbuf_pars_fragment>
#include <fog_pars_fragment>

uniform sampler2D noiseMap;

uniform float time;
uniform float timeScale;

uniform float primarySpeed;
uniform float secondarySpeed;
uniform float displacement;
uniform float advection;
uniform float intensity;

uniform vec2 octaveScale;
uniform vec3 lavaColor;

uniform float direction;

//varying float vViewTheta;
varying vec2 vUv;

float noise3(vec2 n) {

	float x = n.x * n.y * 1000.0;
	x = mod(x, 13.0) * mod(x, 123.0);
	x = mod(x, 0.01);

	return clamp(0.1 + x * 100.0, 0.0, 1.0);

	//return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);

}

mat2 makem2(float theta) {

	float c = cos(theta);
	float s = sin(theta);

	float a = mix(c, s, direction);
	float b = mix(s, c, direction);

	//return mat2(c, -s, s, c);
	return mat2(a, -b, b, a);

}

float noise(vec2 x) {

	return texture2D(noiseMap, x * 0.01).x;

}

vec2 gradn(vec2 p) {

	float ep = 0.09;
	float gradx = noise(vec2(p.x + ep, p.y)) - noise(vec2(p.x - ep, p.y));
	float grady = noise(vec2(p.x, p.y + ep)) - noise(vec2(p.x, p.y - ep));

	return vec2(gradx, grady);

}

float flow(vec2 p) {

	float t = time * timeScale;
	float t1 = t * primarySpeed;
	float t2 = t * secondarySpeed;

	float z = 2.0;
	float rz = 0.0;
	vec2 bp = p;

	for(float i = 1.0; i < 7.0; ++i) {

		p += t1;
		bp += t2;

		// Displacement field.
		vec2 gr = gradn(i * p * 0.34 + t * displacement);

		// Rotation of the displacement field.
		gr *= makem2(t * 6.0 - (0.05 * p.x + 0.03 * p.y) * 40.0);

		// Displace the system.
		p += gr * 0.5;

		// Add noise octave.
		rz += (sin(noise(p) * 7.0) * 0.5 + 0.5) / z;

		// Blend.
		p = mix(bp, p, advection);

		// Intensity scaling.
		z *= intensity;

		// Octave scaling.
		p *= octaveScale.x;
		bp *= octaveScale.y;

	}

	return rz;

}

void main() {

	#include <logdepthbuf_fragment>

	float rz = flow(vUv);

	vec3 color = lavaColor / rz;
	color = pow(abs(color), vec3(1.4));

	gl_FragColor = vec4(color, 1.0);

	#include <premultiplied_alpha_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>

}
