#ifdef USE_FOG

	#define LOG2 1.442695
	#define saturate(a) clamp(a, 0.0, 1.0)
	#define whiteCompliment(a) (1.0 - saturate(a))

	uniform vec3 fogColor;

	#ifdef FOG_EXP2

		uniform float fogDensity;

	#else

		uniform float fogNear;
		uniform float fogFar;

	#endif

#endif

#ifdef USE_LOGDEPTHBUF

	uniform float logDepthBufFC;

	#ifdef USE_LOGDEPTHBUF_EXT

		varying float vFragDepth;

	#endif

#endif

uniform float time;
uniform float timeScale;

uniform float primarySpeed;
uniform float secondarySpeed;
uniform float displacement;
uniform float advection;
uniform float intensity;

uniform vec2 octaveScale;
uniform vec3 lavaColor;
uniform sampler2D noiseMap;

varying vec2 vUv;

float hash21(vec2 n) {

	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);

}

mat2 makem2(float theta) {

	float c = cos(theta);
	float s = sin(theta);

	return mat2(c, -s, s, c);

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
	float z = 2.0;
	float rz = 0.0;
	vec2 bp = p;

	for(float i = 1.0; i < 7.0; ++i) {

		p += t * primarySpeed;
		bp += t * secondarySpeed;

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

	float rz = flow(vUv);
	
	vec3 color = lavaColor / rz;
	color = pow(abs(color), vec3(1.4));

	#if defined(USE_LOGDEPTHBUF) && defined(USE_LOGDEPTHBUF_EXT)

		gl_FragDepthEXT = log2(vFragDepth) * logDepthBufFC * 0.5;

	#endif

	#ifdef USE_FOG

		#ifdef USE_LOGDEPTHBUF_EXT

			float depth = gl_FragDepthEXT / gl_FragCoord.w;

		#else

			float depth = gl_FragCoord.z / gl_FragCoord.w;

		#endif

		#ifdef FOG_EXP2

			float fogFactor = whiteCompliment(exp2(-fogDensity * fogDensity * depth * depth * LOG2));

		#else

			float fogFactor = smoothstep(fogNear, fogFar, depth);

		#endif

		color = mix(color, fogColor, fogFactor);

	#endif

	gl_FragColor = vec4(color, 1.0);

}
