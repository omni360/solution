#define WATER

#include <common>
#include <logdepthbuf_pars_fragment>
#include <fog_pars_fragment>

uniform float time;
uniform float waterLevel;

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

uniform vec3 waterColor;
uniform float sunSpecular;
uniform float scatterAmount;
uniform vec3 scatterColor;

uniform float fade;
uniform vec3 luminosity;

varying vec3 vLightDirection;
varying vec3 vViewPosition;
varying vec4 vFragPosition;
varying mat3 vTbn;
varying vec2 vUv;

vec3 tangentSpace(vec3 v) {

	//v.y = -v.y;
	vec3 vec;
	vec.xy = v.xy;
	vec.z = sqrt(1.0 - dot(vec.xy, vec.xy));
	vec.xyz = normalize(vec.x * vTbn[0] + vec.y * vTbn[1] + vec.z * vTbn[2]);

	return vec;

}

/**
 * Computes fresnel reflectance without explicitly computing the refracted direction.
 */

float fresnelDielectric(vec3 viewDirection, vec3 normal, float eta) {

	float c = abs(dot(viewDirection, normal));
	float g = eta * eta - 1.0 + c * c;
	float A, B;
	float result = 1.0;

	if(g > 0.0)	{

		g = sqrt(g);
		A = (g - c) / (g + c);
		B = (c * (g + c) - 1.0) / (c * (g - c) + 1.0);
		result = 0.5 * A * A * (1.0 + B * B);

	}

	return result;

}

void main() {

	#include <logdepthbuf_fragment>

	vec2 fragCoord = (vFragPosition.xy / vFragPosition.w) * 0.5 + 0.5;
	fragCoord = clamp(fragCoord, 0.002, 0.998);

	// Normal map sampling.

	vec2 nCoord = vec2(0.0);
	vec2 offset = windDirection * time * windSpeed;

	vec2 t[3];
	t[0] = vec2(time * 0.005, time * 0.01);
	t[1] = vec2(time * 0.02, time * 0.03);
	t[2] = vec2(time * 0.06, time * 0.08);

	nCoord = vUv * (waveScale * 0.015) + offset * 0.03;
	vec3 normal0 = 2.0 * texture2D(normalMap, nCoord + vec2(-t[0][0], -t[0][1])).rgb - 1.0;
	nCoord = vUv * (waveScale * 0.05) + offset * 0.05 - normal0.xy * waveChoppiness;
	vec3 normal1 = 2.0 * texture2D(normalMap, nCoord + vec2(t[0][1], t[0][0])).rgb - 1.0;
 
	nCoord = vUv * (waveScale * 0.15) + offset * 0.1 - normal1.xy * waveChoppiness;
	vec3 normal2 = 2.0 * texture2D(normalMap, nCoord + vec2(-t[1][0], -t[1][1])).rgb - 1.0;
	nCoord = vUv * (waveScale * 0.5) + offset * 0.2 - normal2.xy * waveChoppiness;
	vec3 normal3 = 2.0 * texture2D(normalMap, nCoord + vec2(t[1][1], t[1][0])).rgb - 1.0;
  
	nCoord = vUv * (waveScale* 1.5) + offset * 1.0 - normal3.xy * waveChoppiness;
	vec3 normal4 = 2.0 * texture2D(normalMap, nCoord + vec2(-t[2][0], t[2][1])).rgb - 1.0;  
	nCoord = vUv * (waveScale * 5.0) + offset * 1.3 - normal4.xy * waveChoppiness;
	vec3 normal5 = 2.0 * texture2D(normalMap, nCoord + vec2(t[2][1], -t[2][0])).rgb - 1.0;

	vec3 viewDirection = normalize(vViewPosition);

	vec3 waveNormal = normalize(
		normal0 * bigWaves.x + normal1 * bigWaves.y +
		normal2 * midWaves.x + normal3 * midWaves.y +
		normal4 * smallWaves.x + normal5 * smallWaves.y
	);

	waveNormal = tangentSpace(waveNormal * waterBump);

	vec3 scatterNormal = normalize(
		normal0 * bigWaves.x + normal1 * bigWaves.y * 0.5 +
		normal2 * midWaves.x * 0.3 + normal3 * midWaves.y * 0.3 +
		normal4 * smallWaves.x * 0.2 + normal5 * smallWaves.y * 0.2
	);

	scatterNormal = tangentSpace(scatterNormal * waterBump);

	vec3 lR = reflect(vLightDirection, scatterNormal);
	float s = max(dot(lR, viewDirection) * 2.0 - 1.2, 0.0);
	float lightScatter = clamp((max(dot(-vLightDirection, scatterNormal) * 0.75 + 0.25, 0.0) * s) * scatterAmount, 0.0, 1.0);

	// Fresnel term.
	float ior = (cameraPosition.y > waterLevel) ? eta : 1.0 / eta;
	float fresnel = fresnelDielectric(-viewDirection, waveNormal, ior);

	// Texture edge bleed removal.
	vec2 distortFade = vec2(0.0);
	distortFade.s = clamp(fragCoord.s * fade, 0.0, 1.0);
	distortFade.s -= clamp(1.0 - (1.0 - fragCoord.s) * fade, 0.0, 1.0);
	distortFade.t = clamp(fragCoord.t * fade, 0.0, 1.0);
	distortFade.t -= clamp(1.0 - (1.0 - fragCoord.t) * fade, 0.0, 1.0);

	// Inverting frag coord s, because reflection sampler is mirrored along x axis.
	vec3 reflection = texture2D(reflectionMap, vec2(1.0 - fragCoord.s, fragCoord.t) + (waveNormal.xy * reflectionBump * distortFade)).rgb;

	float reflectivity = pow(dot(luminosity, reflection.rgb * 2.0), 3.0);

	vec3 R = reflect(viewDirection, waveNormal);

	float specular = pow(max(dot(R, vLightDirection), 0.0), sunSpecular) * reflectivity;

	vec2 rCoord = reflect(viewDirection, waveNormal).st;
	rCoord *= chromaticAberration;

	vec2 fCoord = fragCoord - (waveNormal.xy * refractionBump * distortFade);

	vec3 refraction = vec3(0.0);
	refraction.r = texture2D(refractionMap, fCoord).r;
	refraction.g = texture2D(refractionMap, fCoord - rCoord).g;
	refraction.b = texture2D(refractionMap, fCoord - rCoord * 2.0).b;

	vec3 transmittance = mix(refraction, refraction * waterColor, waterDensity);
	vec3 color = mix(mix(transmittance, scatterColor, lightScatter), reflection, clamp(fresnel, 0.0, 1.0));

	color += specular;

	gl_FragColor = vec4(color, 1.0);

	#include <premultiplied_alpha_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>

}
