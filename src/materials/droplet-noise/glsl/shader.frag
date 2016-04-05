#define DROPLET_NOISE

uniform float tWidth;
uniform float tHeight;

uniform float texelSize;
uniform float halfTexelSize;

uniform float time;
uniform float randomTime;

varying vec2 vUv;

/*vec2 coordRot(vec2 tc, float angle) {

	float rotX = ((tc.x * 2.0 - 1.0) * (tWidth / tHeight) * cos(angle)) - ((tc.y * 2.0 - 1.0) * sin(angle));
	float rotY = ((tc.y * 2.0 - 1.0) * cos(angle)) + ((tc.x * 2.0 - 1.0) * (tWidth / tHeight) * sin(angle));
	rotX = ((rotX / (tWidth / tHeight)) * 0.5 + 0.5);
	rotY = rotY * 0.5 + 0.5;

	return vec2(rotX, rotY);

}*/

vec3 randRGB(vec2 tc) {

	float noise = sin(dot(tc, vec2(12.9898, 78.233))) * 43758.5453;

	return vec3(
		fract(noise) * 2.0 - 1.0,
		fract(noise * 1.2154) * 2.0 - 1.0,
		fract(noise * 1.3453) * 2.0 - 1.0
	);

}

float randA(vec2 tc) {

	return fract(sin(dot(tc, vec2(12.9898, 78.233))) * 43758.5453 * 1.3647) * 2.0 - 1.0;

}

float fade(float t) {

	return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);

}

float perlinNoise(vec3 p) {

	// Integer part, scaled so +1 moves texelSize texel.
	// Add 1/2 texel to sample texel centers.
	vec3 pi = texelSize * floor(p) + halfTexelSize;

	// Fractional part for interpolation.
	vec3 pf = fract(p);

	// Noise contributions from (x=0, y=0), z=0 and z=1.
	float perm00 = randA(pi.xy);
	vec3  grad000 = randRGB(vec2(perm00, pi.z)) * 4.0 - 1.0;
	float n000 = dot(grad000, pf);
	vec3  grad001 = randRGB(vec2(perm00, pi.z + texelSize)) * 4.0 - 1.0;
	float n001 = dot(grad001, pf - vec3(0.0, 0.0, 1.0));

	// Noise contributions from (x=0, y=1), z=0 and z=1.
	float perm01 = randA(pi.xy + vec2(0.0, texelSize));
	vec3  grad010 = randRGB(vec2(perm01, pi.z)) * 4.0 - 1.0;
	float n010 = dot(grad010, pf - vec3(0.0, 1.0, 0.0));
	vec3  grad011 = randRGB(vec2(perm01, pi.z + texelSize)) * 4.0 - 1.0;
	float n011 = dot(grad011, pf - vec3(0.0, 1.0, 1.0));

	// Noise contributions from (x=1, y=0), z=0 and z=1.
	float perm10 = randA(pi.xy + vec2(texelSize, 0.0));
	vec3  grad100 = randRGB(vec2(perm10, pi.z)) * 4.0 - 1.0;
	float n100 = dot(grad100, pf - vec3(1.0, 0.0, 0.0));
	vec3  grad101 = randRGB(vec2(perm10, pi.z + texelSize)) * 4.0 - 1.0;
	float n101 = dot(grad101, pf - vec3(1.0, 0.0, 1.0));

	// Noise contributions from (x=1, y=1), z=0 and z=1.
	float perm11 = randA(pi.xy + vec2(texelSize));
	vec3  grad110 = randRGB(vec2(perm11, pi.z)) * 4.0 - 1.0;
	float n110 = dot(grad110, pf - vec3(1.0, 1.0, 0.0));
	vec3  grad111 = randRGB(vec2(perm11, pi.z + texelSize)) * 4.0 - 1.0;
	float n111 = dot(grad111, pf - vec3(1.0, 1.0, 1.0));

	// Blend contributions along x.
	vec4 nX = mix(vec4(n000, n001, n010, n011), vec4(n100, n101, n110, n111), fade(pf.x));

	// Blend contributions along y.
	vec2 nXY = mix(nX.xy, nX.zw, fade(pf.y));

	// Blend contributions along z and return the final noise value.
	return mix(nXY.x, nXY.y, fade(pf.z));

}

void main() {

	float r = 0.0;
	float g = 0.0;

	r += perlinNoise(vec3(vUv * vec2(tWidth / 90.0, tHeight / 200.0) + vec2(0.0, time * 0.6), 1.0 + time * 0.2)) * 0.25;
	r += perlinNoise(vec3(vUv * vec2(tWidth / 1200.0, tHeight / 1800.0) + vec2(0.0, time * 0.5), 3.0 + time * 0.3)) * 0.75;

	g += perlinNoise(vec3(vUv * vec2(tWidth / 40.0, tHeight / 60.0), randomTime / 8.0 + time * 0.02)) * 0.2;
	g += perlinNoise(vec3(vUv * vec2(tWidth / 80.0, tHeight / 200.0), randomTime * 2.1 + time * 0.03)) * 0.25;

	#ifdef HIGH_QUALITY

		r += perlinNoise(vec3(vUv * vec2(tWidth / 50.0, tHeight / 80.0) + vec2(0.0, time * 0.8), time * 0.2)) * 0.1;
		r += perlinNoise(vec3(vUv * vec2(tWidth / 200.0, tHeight / 400.0) + vec2(0.0, time * 0.4), 2.0 + time * 0.4)) * 0.25;

		g += perlinNoise(vec3(vUv * vec2(tWidth / 200.0, tHeight / 400.0), randomTime * 0.23 + time * 0.04)) * 0.2;
		g += perlinNoise(vec3(vUv * vec2(tWidth / 800.0, tHeight / 1800.0), randomTime * 1.64 + time * 0.05)) * 0.1;

	#endif

	r = r * 0.5 + 0.5;
	g = g * 0.5 + 0.5;

	gl_FragColor = vec4(r, g, 0.0, 1.0);

}
