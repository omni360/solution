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

uniform sampler2D reflectionMap;
uniform sampler2D refractionMap;
uniform sampler2D normalMap;

uniform float waveScale;
uniform vec2 bigWaves;
uniform vec2 midWaves;
uniform vec2 smallWaves;
uniform float waveChoppiness;

uniform float windSpeed;
uniform vec2 windDirection;

uniform float waterDensity;
uniform float chromaticAberration;
uniform float waterBump;
uniform float reflectionBump;
uniform float refractionBump;
uniform float eta;

uniform vec4 waterColor;
uniform float sunSpecular;
uniform float scatterAmount;
uniform vec4 scatterColor;

uniform float fade;
uniform vec3 luminosity;

varying vec3 vLightPosition;
varying vec4 vFragPosition;
varying vec3 vViewPosition;
varying vec3 vNormal;
varying vec2 vUv;

/**
 * Per-pixel tangent space normal mapping.
 * http://www.thetenthplanet.de/archives/1180
 */

mat3 deriveCotangentFrame(vec3 N, vec3 eyePos) {

	// Get edge vectors of the pixel triangle.
	vec3 dp1 = dFdx(eyePos);
	vec3 dp2 = dFdy(eyePos);
	vec2 duv1 = dFdx(vUv);
	vec2 duv2 = dFdy(vUv);
 
	// Solve the linear system.
	vec3 dp2perp = cross(dp2, N);
	vec3 dp1perp = cross(N, dp1);
	vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
	vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;
 
	// Construct a scale-invariant frame.
	float invmax = inversesqrt(max(dot(T, T), dot(B, B)));

	return mat3(T * invmax, B * invmax, N);

}

/**
 * Tangent space transformation.
 */

vec3 applyTangentSpace(mat3 tbn, vec3 normal) {

	normal.z = sqrt(1.0 - dot(normal.xy, normal.xy)); // Normalmap 2channel.
	normal.y = -normal.y; // Make normalmap green channel point up.

	//return normalize(normal.x * tbn[0] + normal.y * tbn[1] + normal.z * tbn[2]);
	return normalize(tbn * normal);

}

void main() {

	vec2 fragCoord = (vFragPosition.xy / vFragPosition.w) * 0.5 + 0.5;
	fragCoord = clamp(fragCoord, 0.002, 0.998);

	// Normal map.
	float t = time * timeScale;
	vec2 nCoord = vec2(0.0);

	nCoord = vUv * (waveScale * 0.15) + windDirection.xy * time * (windSpeed * 0.1);
	vec3 normal0 = 2.0 * texture2D(normalMap, nCoord + vec2(-time * 0.02, -time * 0.03)).rgb - 1.0;
	nCoord = vUv * (waveScale * 0.5) + windDirection.xy * time * (windSpeed * 0.2) - normal0.xy * waveChoppiness;
	vec3 normal1 = 2.0 * texture2D(normalMap, nCoord + vec2(time * 0.03, time * 0.02)).rgb - 1.0;

	nCoord = vUv * (waveScale * 1.5) + windDirection.xy * time * (windSpeed * 0.5) - normal1.xy * waveChoppiness;
	vec3 normal2 = 2.0 * texture2D(normalMap, nCoord + vec2(-time * 0.03, time * 0.04)).rgb - 1.0;
	nCoord = vUv * (waveScale * 4.0) + windDirection.xy * time * (windSpeed * 0.7) - normal2.xy * waveChoppiness;
	vec3 normal3 = 2.0 * texture2D(normalMap, nCoord + vec2(time * 0.04, -time * 0.02)).rgb - 1.0;

	vec3 viewDirection = normalize(vViewPosition);
	vec3 lightDirection = normalize(vLightPosition);

	vec3 surfaceNormal = vNormal;

	#ifdef DOUBLE_SIDED

		float facing = -1.0 + 2.0 * float(gl_FrontFacing);
		surfaceNormal *= facing;
		//lightDirection.y *= facing;

	#endif

	mat3 tbn = deriveCotangentFrame(surfaceNormal, vViewPosition);

	vec3 waveNormal = normalize(normal0 * midWaves.x + normal1 * midWaves.y +
		normal2 * bigWaves.x + normal3 * bigWaves.y);

	waveNormal = applyTangentSpace(tbn, waveNormal * waterBump);

	// Normal for light scattering.
	vec3 lightNormal = applyTangentSpace(tbn, normalize(normal0 * midWaves.x + normal1 * midWaves.y) * waterBump);

	vec3 lR = reflect(lightDirection, lightNormal);
	float s = max(dot(lR, viewDirection), 0.0);
	vec3 lightScatter = max(dot(-lightDirection, lightNormal) * 0.8 + 0.2, 0.0) * vec3(0.1, 0.9, 0.9) * scatterAmount * s;

	// Fresnel term.
	float R0 = pow((1.0 - eta) / (1.0 + eta), 2.0); 
	float cosine = abs(dot(-viewDirection, waveNormal)); 
	float fresnel = R0 + (1.0 - R0) * pow(1.0 - cosine, 5.0); 

	// Texture edge bleed removal.
	vec2 distortFade = vec2(0.0);
	distortFade.s = clamp(fragCoord.s * fade, 0.0, 1.0);
	distortFade.s -= clamp(1.0 - (1.0 - fragCoord.s) * fade, 0.0, 1.0);
	distortFade.t = clamp(fragCoord.t * fade, 0.0, 1.0);
	distortFade.t -= clamp(1.0 - (1.0 - fragCoord.t) * fade, 0.0, 1.0); 
	
	vec3 reflection = texture2D(reflectionMap, fragCoord + (waveNormal.st * reflectionBump * distortFade)).rgb;

	vec3 luminosity = vec3(0.30, 0.59, 0.11);
	float reflectivity = pow(dot(luminosity, reflection.rgb * 2.0), 3.0);

	vec3 R = reflect(viewDirection, waveNormal);

	float specular = pow(max(dot(R, lightDirection), 0.0), sunSpecular) * reflectivity * 0.25;

	vec2 rCoord = reflect(viewDirection, waveNormal).st;
	vec3 refraction = vec3(0.0);

	refraction.r = texture2D(refractionMap, (fragCoord - (waveNormal.st * refractionBump * distortFade)) * 1.0).r;
	refraction.g = texture2D(refractionMap, (fragCoord - (waveNormal.st * refractionBump * distortFade)) * 1.0 - (rCoord * chromaticAberration)).g;
	refraction.b = texture2D(refractionMap, (fragCoord - (waveNormal.st * refractionBump * distortFade)) * 1.0 - (rCoord * chromaticAberration * 2.0)).b;

	float waterDepth = 5.0;
	vec3 waterExt = 1.0 - vec3(0.7, 0.85, 0.88);

	vec3 absorbance = waterExt * -waterDepth;
	vec3 transmittance = refraction * exp(absorbance);

	vec3 color = mix(transmittance + lightScatter, reflection, clamp(fresnel, 0.0, 1.0));

	color += specular;

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
