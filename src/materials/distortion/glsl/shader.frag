uniform sampler2D tPerturb;
uniform sampler2D tDiffuse;

uniform vec2 rollOffSpeed;
uniform vec2 waveStrength;

//uniform float tWidth;
//uniform float tHeight;

uniform float time;
uniform float resetTimer;
//uniform float randomTime;

varying vec2 vUv;

const float fade = 12.0;

/*const float permTexUnit = 1.0 / 256.0;
const float permTexUnitHalf = 0.5 / 256.0;

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

float fadeLinearly(float t) {

	return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);

}

float perlinNoise(vec3 p) {

	// Integer part, scaled so +1 moves permTexUnit texel.
	// Add 1/2 texel to sample texel centers.
	vec3 pi = permTexUnit * floor(p) + permTexUnitHalf;

	// Fractional part for interpolation.
	vec3 pf = fract(p);

	// Noise contributions from (x=0, y=0), z=0 and z=1.
	float perm00 = randA(pi.xy);
	vec3  grad000 = randRGB(vec2(perm00, pi.z)) * 4.0 - 1.0;
	float n000 = dot(grad000, pf);
	vec3  grad001 = randRGB(vec2(perm00, pi.z + permTexUnit)) * 4.0 - 1.0;
	float n001 = dot(grad001, pf - vec3(0.0, 0.0, 1.0));

	// Noise contributions from (x=0, y=1), z=0 and z=1.
	float perm01 = randA(pi.xy + vec2(0.0, permTexUnit));
	vec3  grad010 = randRGB(vec2(perm01, pi.z)) * 4.0 - 1.0;
	float n010 = dot(grad010, pf - vec3(0.0, 1.0, 0.0));
	vec3  grad011 = randRGB(vec2(perm01, pi.z + permTexUnit)) * 4.0 - 1.0;
	float n011 = dot(grad011, pf - vec3(0.0, 1.0, 1.0));

	// Noise contributions from (x=1, y=0), z=0 and z=1.
	float perm10 = randA(pi.xy + vec2(permTexUnit, 0.0));
	vec3  grad100 = randRGB(vec2(perm10, pi.z)) * 4.0 - 1.0;
	float n100 = dot(grad100, pf - vec3(1.0, 0.0, 0.0));
	vec3  grad101 = randRGB(vec2(perm10, pi.z + permTexUnit)) * 4.0 - 1.0;
	float n101 = dot(grad101, pf - vec3(1.0, 0.0, 1.0));

	// Noise contributions from (x=1, y=1), z=0 and z=1.
	float perm11 = randA(pi.xy + vec2(permTexUnit));
	vec3  grad110 = randRGB(vec2(perm11, pi.z)) * 4.0 - 1.0;
	float n110 = dot(grad110, pf - vec3(1.0, 1.0, 0.0));
	vec3  grad111 = randRGB(vec2(perm11, pi.z + permTexUnit)) * 4.0 - 1.0;
	float n111 = dot(grad111, pf - vec3(1.0, 1.0, 1.0));

	// Blend contributions along x.
	vec4 nX = mix(vec4(n000, n001, n010, n011), vec4(n100, n101, n110, n111), fadeLinearly(pf.x));

	// Blend contributions along y.
	vec2 nXY = mix(nX.xy, nX.zw, fadeLinearly(pf.y));

	// Blend contributions along z and return the final noise value.
	return mix(nXY.x, nXY.y, fadeLinearly(pf.z));

}*/

/*vec2 coordRot(vec2 tc, float angle) {

	float rotX = ((tc.x * 2.0 - 1.0) * (tWidth / tHeight) * cos(angle)) - ((tc.y * 2.0 - 1.0) * sin(angle));
	float rotY = ((tc.y * 2.0 - 1.0) * cos(angle)) + ((tc.x * 2.0 - 1.0) * (tWidth / tHeight) * sin(angle));
	rotX = ((rotX / (tWidth / tHeight)) * 0.5 + 0.5);
	rotY = rotY * 0.5 + 0.5;

	return vec2(rotX, rotY);

}*/

void main() {

	float n = 0.0;
	float drop = 0.0;

	float resetTimerFaster = resetTimer * rollOffSpeed.x;
	float resetTimerSlow = resetTimer * rollOffSpeed.y;

/*
	if(resetTimer > 0.0 && resetTimer < T_DISSOLVE) {

		//n += perlinNoise(vec3(vUv * vec2(tWidth / 50.0, tHeight / 80.0) + vec2(0.0, time * 0.8), time * 0.2)) * 0.1;
		n += perlinNoise(vec3(vUv * vec2(tWidth / 90.0, tHeight / 200.0) + vec2(0.0, time * 0.6), 1.0 + time * 0.2)) * 0.25;
		//n += perlinNoise(vec3(vUv * vec2(tWidth / 200.0, tHeight / 400.0) + vec2(0.0, time * 0.4), 2.0 + time * 0.4)) * 0.25;
		n += perlinNoise(vec3(vUv * vec2(tWidth / 1200.0, tHeight / 1800.0) + vec2(0.0, time * 0.5), 3.0 + time * 0.3)) * 0.75;

	}

	//n *= clamp(ceil(resetTimer / T_DISSOLVE), 0.0, 1.0);

	if(resetTimer > 0.0 && resetTimer < T_DROPLETS) {

		drop += perlinNoise(vec3(vUv * vec2(tWidth / 40.0, tHeight / 60.0), randomTime / 8.0 + time * 0.02)) * 0.2;
		drop += perlinNoise(vec3(vUv * vec2(tWidth / 80.0, tHeight / 200.0), randomTime * 2.1 + time * 0.03)) * 0.25;
		//drop += perlinNoise(vec3(vUv * vec2(tWidth / 200.0, tHeight / 400.0), randomTime * 0.23 + time * 0.04)) * 0.2;
		//drop += perlinNoise(vec3(vUv * vec2(tWidth / 800.0, tHeight / 1800.0), randomTime * 1.64 + time * 0.05)) * 0.1;

	}

	//drop *= clamp(ceil(resetTimer / T_DROPLETS), 0.0, 1.0);

	// Translate noise values to [0.0, 1.0].
	//n = n * 0.5 + 0.5;
	//drop = drop * 0.5 + 0.5;
*/

	vec2 perturbSample;

	if(resetTimer > 0.0) {

		perturbSample = texture2D(tPerturb, vUv).rg;

		if(resetTimer < T_DISSOLVE) {

			n = perturbSample.r;

		}

		if(resetTimer < T_DROPLETS) {

			drop = perturbSample.g;

		}

	}

	float drops = clamp(smoothstep(resetTimerFaster, 0.5 + resetTimerFaster, n), 0.0, 1.0);
	float droplet = clamp(smoothstep(0.75 + resetTimerSlow, 1.0 + resetTimerSlow, drop), 0.0, 1.0);

	droplet = pow(clamp(droplet + drops, 0.0, 1.0), 0.1) * 3.0;

	//drops = pow(drops, 0.1) * 2.0;
	vec2 droplets = vec2(dFdx(vUv + droplet).r, dFdy(vUv + droplet).g);		

	vec2 wave = vec2(0.0);

	vec2 waveCoordR;
	vec2 waveCoordG;
	vec2 waveCoordB;
	vec2 dropCoordR;
	vec2 dropCoordG;	
	vec2 dropCoordB;

	if(resetTimer < 1.0) {

		wave.x = sin((vUv.x - vUv.y * 2.0) - time * 1.5) * waveStrength.x;
		wave.x += cos((vUv.y * 4.0 - vUv.x * 6.0) + time * 4.2) * waveStrength.y;
		wave.x += sin((vUv.x * 9.0 + vUv.y * 8.0) + time * 3.5) * waveStrength.x;

		wave.y = sin((vUv.x * 2.0 + vUv.x * 2.5) + time * 2.5) * waveStrength.x;
		wave.y += cos((vUv.y * 3.0 + vUv.x * 6.0) - time * 2.5) * waveStrength.y;
		wave.y += sin((vUv.x * 11.0 - vUv.y * 12.0) + time * 4.5) * waveStrength.x;

	}

	//wave *= clamp(ceil(1.0 - resetTimer), 0.0, 1.0);

	// Texture edge bleed removal.
	vec2 distortFade = vec2(0.0);
	distortFade.s = clamp(vUv.s * fade, 0.0, 1.0);
	distortFade.s -= clamp(1.0 - (1.0 - vUv.s) * fade, 0.0, 1.0);
	distortFade.t = clamp(vUv.t * fade, 0.0, 1.0);
	distortFade.t -= clamp(1.0 - (1.0 - vUv.t) * fade, 0.0, 1.0); 

	//vec2 rotCoordsR = coordRot(vUv, angle?);

	float dfade = 1.0 - pow((1.0 - distortFade.s * distortFade.t), 2.0);
	wave = wave * dfade;
	droplets = droplets * dfade;

	waveCoordR = vUv - wave * 0.004;
	waveCoordG = vUv - wave * 0.006;	
	waveCoordB = vUv - wave * 0.008;

	dropCoordR = (vUv - droplets * 1.1);
	dropCoordG = (vUv - droplets * 1.2);	
	dropCoordB = (vUv - droplets * 1.3);	

	vec3 dropletColor = vec3(0.0);	
	dropletColor.r = texture2D(tDiffuse, dropCoordR).r;
	dropletColor.g = texture2D(tDiffuse, dropCoordG).g;
	dropletColor.b = texture2D(tDiffuse, dropCoordB).b;

	vec3 waveColor = vec3(0.0);
	waveColor.r = texture2D(tDiffuse, waveCoordR).r;
	waveColor.g = texture2D(tDiffuse, waveCoordG).g;
	waveColor.b = texture2D(tDiffuse, waveCoordB).b;

	float dropFade = clamp(resetTimer * 10.0, 0.0, 1.0);
	float dropletMask = smoothstep(0.77 + resetTimerSlow, 0.79 + resetTimerSlow, drop);
	float mask = smoothstep(0.02 + resetTimerFaster, 0.03 + resetTimerFaster, n);

	vec4 c = texture2D(tDiffuse, vUv);

	vec3 color = mix(waveColor, c.rgb, dropFade);
	color = mix(color, dropletColor, clamp(dropletMask + mask, 0.0, 1.0) * dropFade);

	gl_FragColor = vec4(color, c.a);

}
