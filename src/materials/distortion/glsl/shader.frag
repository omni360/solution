#define DISTORTION

uniform sampler2D tPerturb;
uniform sampler2D tDiffuse;

uniform float time;
uniform float resetTimer;

uniform vec2 rollOffSpeed;
uniform vec2 waveStrength;
uniform vec3 tint;

varying vec2 vUv;

const float FADE = 12.0;

void main() {

	float n = 0.0;
	float drop = 0.0;

	float resetTimerFaster = resetTimer * rollOffSpeed.x;
	float resetTimerSlow = resetTimer * rollOffSpeed.y;

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

	// if-less alternative.
	//perturbSample = texture2D(tPerturb, vUv).rg;
	//n = perturbSample.r;
	//drop = perturbSample.g;
	//n *= clamp(ceil(resetTimer / T_DISSOLVE), 0.0, 1.0);
	//drop *= clamp(ceil(resetTimer / T_DROPLETS), 0.0, 1.0);

	float drops = clamp(smoothstep(resetTimerFaster, 0.5 + resetTimerFaster, n), 0.0, 1.0);
	float droplet = clamp(smoothstep(0.75 + resetTimerSlow, 1.0 + resetTimerSlow, drop), 0.0, 1.0);

	droplet = pow(clamp(droplet + drops, 0.0, 1.0), 0.1) * 3.0;

	vec2 droplets = vec2(dFdx(vUv + droplet).r, dFdy(vUv + droplet).g);		

	vec2 wave = vec2(0.0);

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
	distortFade.s = clamp(vUv.s * FADE, 0.0, 1.0);
	distortFade.s -= clamp(1.0 - (1.0 - vUv.s) * FADE, 0.0, 1.0);
	distortFade.t = clamp(vUv.t * FADE, 0.0, 1.0);
	distortFade.t -= clamp(1.0 - (1.0 - vUv.t) * FADE, 0.0, 1.0); 

	float dfade = 1.0 - pow(1.0 - distortFade.s * distortFade.t, 2.0);
	wave = wave * dfade;
	droplets = droplets * dfade;

	vec2 waveCoordR = vUv - wave * 0.004;
	vec2 waveCoordG = vUv - wave * 0.006;	
	vec2 waveCoordB = vUv - wave * 0.008;

	vec2 dropCoordR = vUv - droplets * 1.1;
	vec2 dropCoordG = vUv - droplets * 1.2;	
	vec2 dropCoordB = vUv - droplets * 1.3;	

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
	color = mix(color, dropletColor * tint, clamp(dropletMask + mask, 0.0, 1.0) * dropFade);

	gl_FragColor = vec4(color, c.a);

}
