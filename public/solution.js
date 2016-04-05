/**
 * solution v0.1.1 build Apr 05 2016
 * https://github.com/vanruesc/solution
 * Copyright 2016 Raoul van Rüschen, Zlib
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three')) :
	typeof define === 'function' && define.amd ? define(['exports', 'three'], factory) :
	(factory((global.SOLUTION = global.SOLUTION || {}),global.THREE));
}(this, function (exports,THREE) { 'use strict';

	THREE = 'default' in THREE ? THREE['default'] : THREE;

	var fragment = "#define DISTORTION\r\n\r\nuniform sampler2D tPerturb;\r\nuniform sampler2D tDiffuse;\r\n\r\nuniform float time;\r\nuniform float resetTimer;\r\n\r\nuniform vec2 rollOffSpeed;\r\nuniform vec2 waveStrength;\r\nuniform vec3 tint;\r\n\r\nvarying vec2 vUv;\r\n\r\nconst float FADE = 12.0;\r\n\r\nvoid main() {\r\n\r\n\tfloat n = 0.0;\r\n\tfloat drop = 0.0;\r\n\r\n\tfloat resetTimerFaster = resetTimer * rollOffSpeed.x;\r\n\tfloat resetTimerSlow = resetTimer * rollOffSpeed.y;\r\n\r\n\tvec2 perturbSample;\r\n\r\n\tif(resetTimer > 0.0) {\r\n\r\n\t\tperturbSample = texture2D(tPerturb, vUv).rg;\r\n\r\n\t\tif(resetTimer < T_DISSOLVE) {\r\n\r\n\t\t\tn = perturbSample.r;\r\n\r\n\t\t}\r\n\r\n\t\tif(resetTimer < T_DROPLETS) {\r\n\r\n\t\t\tdrop = perturbSample.g;\r\n\r\n\t\t}\r\n\r\n\t}\r\n\r\n\t// if-less alternative.\r\n\t//perturbSample = texture2D(tPerturb, vUv).rg;\r\n\t//n = perturbSample.r;\r\n\t//drop = perturbSample.g;\r\n\t//n *= clamp(ceil(resetTimer / T_DISSOLVE), 0.0, 1.0);\r\n\t//drop *= clamp(ceil(resetTimer / T_DROPLETS), 0.0, 1.0);\r\n\r\n\tfloat drops = clamp(smoothstep(resetTimerFaster, 0.5 + resetTimerFaster, n), 0.0, 1.0);\r\n\tfloat droplet = clamp(smoothstep(0.75 + resetTimerSlow, 1.0 + resetTimerSlow, drop), 0.0, 1.0);\r\n\r\n\tdroplet = pow(clamp(droplet + drops, 0.0, 1.0), 0.1) * 3.0;\r\n\r\n\tvec2 droplets = vec2(dFdx(vUv + droplet).r, dFdy(vUv + droplet).g);\t\t\r\n\r\n\tvec2 wave = vec2(0.0);\r\n\r\n\tif(resetTimer < 1.0) {\r\n\r\n\t\twave.x = sin((vUv.x - vUv.y * 2.0) - time * 1.5) * waveStrength.x;\r\n\t\twave.x += cos((vUv.y * 4.0 - vUv.x * 6.0) + time * 4.2) * waveStrength.y;\r\n\t\twave.x += sin((vUv.x * 9.0 + vUv.y * 8.0) + time * 3.5) * waveStrength.x;\r\n\r\n\t\twave.y = sin((vUv.x * 2.0 + vUv.x * 2.5) + time * 2.5) * waveStrength.x;\r\n\t\twave.y += cos((vUv.y * 3.0 + vUv.x * 6.0) - time * 2.5) * waveStrength.y;\r\n\t\twave.y += sin((vUv.x * 11.0 - vUv.y * 12.0) + time * 4.5) * waveStrength.x;\r\n\r\n\t}\r\n\r\n\t//wave *= clamp(ceil(1.0 - resetTimer), 0.0, 1.0);\r\n\r\n\t// Texture edge bleed removal.\r\n\tvec2 distortFade = vec2(0.0);\r\n\tdistortFade.s = clamp(vUv.s * FADE, 0.0, 1.0);\r\n\tdistortFade.s -= clamp(1.0 - (1.0 - vUv.s) * FADE, 0.0, 1.0);\r\n\tdistortFade.t = clamp(vUv.t * FADE, 0.0, 1.0);\r\n\tdistortFade.t -= clamp(1.0 - (1.0 - vUv.t) * FADE, 0.0, 1.0); \r\n\r\n\tfloat dfade = 1.0 - pow(1.0 - distortFade.s * distortFade.t, 2.0);\r\n\twave = wave * dfade;\r\n\tdroplets = droplets * dfade;\r\n\r\n\tvec2 waveCoordR = vUv - wave * 0.004;\r\n\tvec2 waveCoordG = vUv - wave * 0.006;\t\r\n\tvec2 waveCoordB = vUv - wave * 0.008;\r\n\r\n\tvec2 dropCoordR = vUv - droplets * 1.1;\r\n\tvec2 dropCoordG = vUv - droplets * 1.2;\t\r\n\tvec2 dropCoordB = vUv - droplets * 1.3;\t\r\n\r\n\tvec3 dropletColor = vec3(0.0);\t\r\n\tdropletColor.r = texture2D(tDiffuse, dropCoordR).r;\r\n\tdropletColor.g = texture2D(tDiffuse, dropCoordG).g;\r\n\tdropletColor.b = texture2D(tDiffuse, dropCoordB).b;\r\n\r\n\tvec3 waveColor = vec3(0.0);\r\n\twaveColor.r = texture2D(tDiffuse, waveCoordR).r;\r\n\twaveColor.g = texture2D(tDiffuse, waveCoordG).g;\r\n\twaveColor.b = texture2D(tDiffuse, waveCoordB).b;\r\n\r\n\tfloat dropFade = clamp(resetTimer * 10.0, 0.0, 1.0);\r\n\tfloat dropletMask = smoothstep(0.77 + resetTimerSlow, 0.79 + resetTimerSlow, drop);\r\n\tfloat mask = smoothstep(0.02 + resetTimerFaster, 0.03 + resetTimerFaster, n);\r\n\r\n\tvec4 c = texture2D(tDiffuse, vUv);\r\n\r\n\tvec3 color = mix(waveColor, c.rgb, dropFade);\r\n\tcolor = mix(color, dropletColor * tint, clamp(dropletMask + mask, 0.0, 1.0) * dropFade);\r\n\r\n\tgl_FragColor = vec4(color, c.a);\r\n\r\n}\r\n";

	var vertex = "#define DISTORTION\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n";

	/**
	 * A distortion shader material.
	 *
	 * Shader code taken from Martins Upitis' water/underwater blend:
	 * http://devlog-martinsh.blogspot.de/2013/09/waterunderwater-sky-shader-update-02.html
	 *
	 * @class DistortionMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 * @param {Object} [options] - The options.
	 * @param {Texture} [options.perturbMap] - If none is provided, the shader will generate perlin noise on the fly.
	 * @param {Vector2} [options.rollOffSpeed] - The water roll off speed. X affects the overall roll off, while Y controls the droplets.
	 * @param {Vector2} [options.waveStrength] - The distortion wave strength. X = sine, Y = cosine.
	 * @param {Color} [options.color] - The droplet tint.
	 */

	class DistortionMaterial extends THREE.ShaderMaterial {

		constructor(options) {

			if(options === undefined) { options = {}; }

			super({

				defines: {

					T_DISSOLVE: "4.0",
					T_DROPLETS: "60.0"

				},

				uniforms: {

					tPerturb: {type: "t", value: (options.perturbMap !== undefined) ? options.perturbMap : null},
					tDiffuse: {type: "t", value: null},

					time: {type: "1f", value: Math.random() * 1000.0},
					resetTimer: {type: "1f", value: 0.0},

					rollOffSpeed: {type: "v2", value: (options.rollOffSpeed !== undefined) ? options.rollOffSpeed : new THREE.Vector2(0.5, 0.02)},
					waveStrength: {type: "v2", value: (options.waveStrength !== undefined) ? options.waveStrength : new THREE.Vector2(0.25, 0.5)},
					tint: {type: "c", value: (options.color !== undefined) ? options.color : new THREE.Color(1.0, 1.0, 1.0)},

				},

				fragmentShader: fragment,
				vertexShader: vertex,

				extensions: {
					derivatives: true
				}

			});

		}

	}

	var fragment$1 = "#define DROPLET_NOISE\r\n\r\nuniform float tWidth;\r\nuniform float tHeight;\r\n\r\nuniform float texelSize;\r\nuniform float halfTexelSize;\r\n\r\nuniform float time;\r\nuniform float randomTime;\r\n\r\nvarying vec2 vUv;\r\n\r\n/*vec2 coordRot(vec2 tc, float angle) {\r\n\r\n\tfloat rotX = ((tc.x * 2.0 - 1.0) * (tWidth / tHeight) * cos(angle)) - ((tc.y * 2.0 - 1.0) * sin(angle));\r\n\tfloat rotY = ((tc.y * 2.0 - 1.0) * cos(angle)) + ((tc.x * 2.0 - 1.0) * (tWidth / tHeight) * sin(angle));\r\n\trotX = ((rotX / (tWidth / tHeight)) * 0.5 + 0.5);\r\n\trotY = rotY * 0.5 + 0.5;\r\n\r\n\treturn vec2(rotX, rotY);\r\n\r\n}*/\r\n\r\nvec3 randRGB(vec2 tc) {\r\n\r\n\tfloat noise = sin(dot(tc, vec2(12.9898, 78.233))) * 43758.5453;\r\n\r\n\treturn vec3(\r\n\t\tfract(noise) * 2.0 - 1.0,\r\n\t\tfract(noise * 1.2154) * 2.0 - 1.0,\r\n\t\tfract(noise * 1.3453) * 2.0 - 1.0\r\n\t);\r\n\r\n}\r\n\r\nfloat randA(vec2 tc) {\r\n\r\n\treturn fract(sin(dot(tc, vec2(12.9898, 78.233))) * 43758.5453 * 1.3647) * 2.0 - 1.0;\r\n\r\n}\r\n\r\nfloat fade(float t) {\r\n\r\n\treturn t * t * t * (t * (t * 6.0 - 15.0) + 10.0);\r\n\r\n}\r\n\r\nfloat perlinNoise(vec3 p) {\r\n\r\n\t// Integer part, scaled so +1 moves texelSize texel.\r\n\t// Add 1/2 texel to sample texel centers.\r\n\tvec3 pi = texelSize * floor(p) + halfTexelSize;\r\n\r\n\t// Fractional part for interpolation.\r\n\tvec3 pf = fract(p);\r\n\r\n\t// Noise contributions from (x=0, y=0), z=0 and z=1.\r\n\tfloat perm00 = randA(pi.xy);\r\n\tvec3  grad000 = randRGB(vec2(perm00, pi.z)) * 4.0 - 1.0;\r\n\tfloat n000 = dot(grad000, pf);\r\n\tvec3  grad001 = randRGB(vec2(perm00, pi.z + texelSize)) * 4.0 - 1.0;\r\n\tfloat n001 = dot(grad001, pf - vec3(0.0, 0.0, 1.0));\r\n\r\n\t// Noise contributions from (x=0, y=1), z=0 and z=1.\r\n\tfloat perm01 = randA(pi.xy + vec2(0.0, texelSize));\r\n\tvec3  grad010 = randRGB(vec2(perm01, pi.z)) * 4.0 - 1.0;\r\n\tfloat n010 = dot(grad010, pf - vec3(0.0, 1.0, 0.0));\r\n\tvec3  grad011 = randRGB(vec2(perm01, pi.z + texelSize)) * 4.0 - 1.0;\r\n\tfloat n011 = dot(grad011, pf - vec3(0.0, 1.0, 1.0));\r\n\r\n\t// Noise contributions from (x=1, y=0), z=0 and z=1.\r\n\tfloat perm10 = randA(pi.xy + vec2(texelSize, 0.0));\r\n\tvec3  grad100 = randRGB(vec2(perm10, pi.z)) * 4.0 - 1.0;\r\n\tfloat n100 = dot(grad100, pf - vec3(1.0, 0.0, 0.0));\r\n\tvec3  grad101 = randRGB(vec2(perm10, pi.z + texelSize)) * 4.0 - 1.0;\r\n\tfloat n101 = dot(grad101, pf - vec3(1.0, 0.0, 1.0));\r\n\r\n\t// Noise contributions from (x=1, y=1), z=0 and z=1.\r\n\tfloat perm11 = randA(pi.xy + vec2(texelSize));\r\n\tvec3  grad110 = randRGB(vec2(perm11, pi.z)) * 4.0 - 1.0;\r\n\tfloat n110 = dot(grad110, pf - vec3(1.0, 1.0, 0.0));\r\n\tvec3  grad111 = randRGB(vec2(perm11, pi.z + texelSize)) * 4.0 - 1.0;\r\n\tfloat n111 = dot(grad111, pf - vec3(1.0, 1.0, 1.0));\r\n\r\n\t// Blend contributions along x.\r\n\tvec4 nX = mix(vec4(n000, n001, n010, n011), vec4(n100, n101, n110, n111), fade(pf.x));\r\n\r\n\t// Blend contributions along y.\r\n\tvec2 nXY = mix(nX.xy, nX.zw, fade(pf.y));\r\n\r\n\t// Blend contributions along z and return the final noise value.\r\n\treturn mix(nXY.x, nXY.y, fade(pf.z));\r\n\r\n}\r\n\r\nvoid main() {\r\n\r\n\tfloat r = 0.0;\r\n\tfloat g = 0.0;\r\n\r\n\tr += perlinNoise(vec3(vUv * vec2(tWidth / 90.0, tHeight / 200.0) + vec2(0.0, time * 0.6), 1.0 + time * 0.2)) * 0.25;\r\n\tr += perlinNoise(vec3(vUv * vec2(tWidth / 1200.0, tHeight / 1800.0) + vec2(0.0, time * 0.5), 3.0 + time * 0.3)) * 0.75;\r\n\r\n\tg += perlinNoise(vec3(vUv * vec2(tWidth / 40.0, tHeight / 60.0), randomTime / 8.0 + time * 0.02)) * 0.2;\r\n\tg += perlinNoise(vec3(vUv * vec2(tWidth / 80.0, tHeight / 200.0), randomTime * 2.1 + time * 0.03)) * 0.25;\r\n\r\n\t#ifdef HIGH_QUALITY\r\n\r\n\t\tr += perlinNoise(vec3(vUv * vec2(tWidth / 50.0, tHeight / 80.0) + vec2(0.0, time * 0.8), time * 0.2)) * 0.1;\r\n\t\tr += perlinNoise(vec3(vUv * vec2(tWidth / 200.0, tHeight / 400.0) + vec2(0.0, time * 0.4), 2.0 + time * 0.4)) * 0.25;\r\n\r\n\t\tg += perlinNoise(vec3(vUv * vec2(tWidth / 200.0, tHeight / 400.0), randomTime * 0.23 + time * 0.04)) * 0.2;\r\n\t\tg += perlinNoise(vec3(vUv * vec2(tWidth / 800.0, tHeight / 1800.0), randomTime * 1.64 + time * 0.05)) * 0.1;\r\n\r\n\t#endif\r\n\r\n\tr = r * 0.5 + 0.5;\r\n\tg = g * 0.5 + 0.5;\r\n\r\n\tgl_FragColor = vec4(r, g, 0.0, 1.0);\r\n\r\n}\r\n";

	var vertex$1 = "#define DROPLET_NOISE\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n";

	/**
	 * A droplet noise shader material.
	 *
	 * Shader code adopted from Martins Upitis' water/underwater blend:
	 * http://devlog-martinsh.blogspot.de/2013/09/waterunderwater-sky-shader-update-02.html
	 *
	 * @class DropletNoiseMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 * @param {Boolean} [highQuality] - Generates double the amount of noise values. Stresses the GPU immensely.
	 */

	class DropletNoiseMaterial extends THREE.ShaderMaterial {

		constructor(highQuality) {

			super({

				uniforms: {

					tWidth: {type: "1f", value: 0},
					tHeight: {type: "1f", value: 0},

					texelSize: {type: "1f", value: 1.0},
					halfTexelSize: {type: "1f", value: 0.5},

					time: {type: "1f", value: 0.0},
					randomTime: {type: "1f", value: Math.random() * 10.0 - 1.0}

				},

				fragmentShader: fragment$1,
				vertexShader: vertex$1

			});

			if(highQuality) { this.defines.HIGH_QUALITY = "1"; }

		}

	}

	var fragment$2 = "#define LAVA\n\n#include <common>\n#include <logdepthbuf_pars_fragment>\n#include <fog_pars_fragment>\n\nuniform sampler2D noiseMap;\n\nuniform float time;\nuniform float timeScale;\n\nuniform float primarySpeed;\nuniform float secondarySpeed;\nuniform float displacement;\nuniform float advection;\nuniform float intensity;\n\nuniform vec2 octaveScale;\nuniform vec3 lavaColor;\n\nuniform float direction;\n\n//varying float vViewTheta;\nvarying vec2 vUv;\n\nfloat noise3(vec2 n) {\n\n\tfloat x = n.x * n.y * 1000.0;\n\tx = mod(x, 13.0) * mod(x, 123.0);\n\tx = mod(x, 0.01);\n\n\treturn clamp(0.1 + x * 100.0, 0.0, 1.0);\n\n\t//return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\n\n}\n\nmat2 makem2(float theta) {\n\n\tfloat c = cos(theta);\n\tfloat s = sin(theta);\n\n\tfloat a = mix(c, s, direction);\n\tfloat b = mix(s, c, direction);\n\n\t//return mat2(c, -s, s, c);\n\treturn mat2(a, -b, b, a);\n\n}\n\nfloat noise(vec2 x) {\n\n\treturn texture2D(noiseMap, x * 0.01).x;\n\n}\n\nvec2 gradn(vec2 p) {\n\n\tfloat ep = 0.09;\n\tfloat gradx = noise(vec2(p.x + ep, p.y)) - noise(vec2(p.x - ep, p.y));\n\tfloat grady = noise(vec2(p.x, p.y + ep)) - noise(vec2(p.x, p.y - ep));\n\n\treturn vec2(gradx, grady);\n\n}\n\nfloat flow(vec2 p) {\n\n\tfloat t = time * timeScale;\n\tfloat t1 = t * primarySpeed;\n\tfloat t2 = t * secondarySpeed;\n\n\tfloat z = 2.0;\n\tfloat rz = 0.0;\n\tvec2 bp = p;\n\n\tfor(float i = 1.0; i < 7.0; ++i) {\n\n\t\tp += t1;\n\t\tbp += t2;\n\n\t\t// Displacement field.\n\t\tvec2 gr = gradn(i * p * 0.34 + t * displacement);\n\n\t\t// Rotation of the displacement field.\n\t\tgr *= makem2(t * 6.0 - (0.05 * p.x + 0.03 * p.y) * 40.0);\n\n\t\t// Displace the system.\n\t\tp += gr * 0.5;\n\n\t\t// Add noise octave.\n\t\trz += (sin(noise(p) * 7.0) * 0.5 + 0.5) / z;\n\n\t\t// Blend.\n\t\tp = mix(bp, p, advection);\n\n\t\t// Intensity scaling.\n\t\tz *= intensity;\n\n\t\t// Octave scaling.\n\t\tp *= octaveScale.x;\n\t\tbp *= octaveScale.y;\n\n\t}\n\n\treturn rz;\n\n}\n\nvoid main() {\n\n\t#include <logdepthbuf_fragment>\n\n\tfloat rz = flow(vUv);\n\n\tvec3 color = lavaColor / rz;\n\tcolor = pow(abs(color), vec3(1.4));\n\n\tgl_FragColor = vec4(color, 1.0);\n\n\t#include <premultiplied_alpha_fragment>\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n\n}\n";

	var vertex$2 = "#define LAVA\n\n#include <common>\n#include <logdepthbuf_pars_vertex>\n\nuniform float scale;\n\n//varying float vViewTheta;\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvec4 mvPosition = modelViewMatrix * vec4(position, 1.0);\n\n\t//vViewTheta = clamp((normalize(cameraPosition - position).z + 1.0) * 0.5, 0.0, 1.0);\n\tvUv = uv * scale;\n\n\tgl_Position = projectionMatrix * mvPosition;\n\n\t#include <logdepthbuf_vertex>\n\n}\n";

	/**
	 * A noise-based flowing lava material.
	 *
	 * Original shader code by: https://www.shadertoy.com/user/nimitz 
	 *
	 * @class LavaMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 * @param {Object} [options] - The options.
	 * @param {Number} [options.timeScale=0.1] - The time scale.
	 * @param {Number} [options.primarySpeed=0.6] - The primary flow speed.
	 * @param {Number} [options.secondarySpeed=1.9] - The secondary flow speed (speed of the perceived flow).
	 * @param {Number} [options.displacement=1.0] - A time multiplier for the displacement field.
	 * @param {Number} [options.advection=0.77] - Blend factor (blending displaced system with base system). 0.5 ~ low, 0.95 ~ high.
	 * @param {Number} [options.intensity=1.4] - Overall intensity.
	 * @param {Vector2} [options.octaveScale=(2.0, 1.9)] - Used to scale the noise octave.
	 * @param {Vector2} [options.scale=(3.0, 3.0)] - The overall scale of the lava.
	 */

	class LavaMaterial extends THREE.ShaderMaterial {

		constructor(options) {

			if(options === undefined) { options = {}; }

			super({

				uniforms: THREE.UniformsUtils.merge([

					THREE.UniformsLib.fog,

					{

						time: {type: "1f", value: 0.0},
						timeScale: {type: "1f", value: (options.timeScale !== undefined) ? options.timeScale : 0.1},

						primarySpeed: {type: "1f", value: (options.primarySpeed !== undefined) ? options.primarySpeed : 0.6},
						secondarySpeed: {type: "1f", value: (options.secondarySpeed !== undefined) ? options.secondarySpeed : 1.9},
						displacement: {type: "1f", value: (options.displacement !== undefined) ? options.displacement : 1.0},
						advection: {type: "1f", value: (options.advection !== undefined) ? options.advection : 0.77},
						intensity: {type: "1f", value: (options.intensity !== undefined) ? options.intensity : 1.4},
						octaveScale: {type: "v2", value: (options.octaveScale !== undefined) ? options.octaveScale : new THREE.Vector2(2.0, 1.9)},
						lavaColor: {type: "c", value: (options.color !== undefined) ? options.color : new THREE.Color(0.2, 0.07, 0.01)},

						direction: {type: "1f", value: (options.direction !== undefined) ? options.direction : 0.0},

						noiseMap: {type: "t", value: null},
						scale: {type: "1f", value: 75.0}

					}

				]),

				fragmentShader: fragment$2,
				vertexShader: vertex$2,

				fog: true

			});

		}

		/**
		 * A noise map.
		 *
		 * @property noiseMap
		 * @type Texture
		 */

		get noiseMap() { return this.uniforms.noiseMap.value; }

		set noiseMap(x) {

			this.uniforms.noiseMap.value = x;

		}

	}

	var fragment$3 = "#define WATER\n\n#include <common>\n#include <logdepthbuf_pars_fragment>\n#include <fog_pars_fragment>\n\nuniform float time;\nuniform float waterLevel;\n\nuniform sampler2D reflectionMap;\nuniform sampler2D refractionMap;\nuniform sampler2D normalMap;\n\nuniform float waveScale;\nuniform vec2 bigWaves;\nuniform vec2 midWaves;\nuniform vec2 smallWaves;\nuniform float waveChoppiness;\n\nuniform float windSpeed;\nuniform vec2 windDirection;\n\nuniform float waterDensity;\nuniform float chromaticAberration;\nuniform float waterBump;\nuniform float reflectionBump;\nuniform float refractionBump;\nuniform float eta;\n\nuniform vec3 waterColor;\nuniform float sunSpecular;\nuniform float scatterAmount;\nuniform vec3 scatterColor;\n\nuniform float fade;\nuniform vec3 luminosity;\n\nvarying vec3 vLightDirection;\nvarying vec3 vViewPosition;\nvarying vec4 vFragPosition;\nvarying mat3 vTbn;\nvarying vec2 vUv;\n\nvec3 tangentSpace(vec3 v) {\n\n\t//v.y = -v.y;\n\tvec3 vec;\n\tvec.xy = v.xy;\n\tvec.z = sqrt(1.0 - dot(vec.xy, vec.xy));\n\tvec.xyz = normalize(vec.x * vTbn[0] + vec.y * vTbn[1] + vec.z * vTbn[2]);\n\n\treturn vec;\n\n}\n\n/**\n * Computes fresnel reflectance without explicitly computing the refracted direction.\n */\n\nfloat fresnelDielectric(vec3 viewDirection, vec3 normal, float eta) {\n\n\tfloat c = abs(dot(viewDirection, normal));\n\tfloat g = eta * eta - 1.0 + c * c;\n\tfloat A, B;\n\tfloat result = 1.0;\n\n\tif(g > 0.0)\t{\n\n\t\tg = sqrt(g);\n\t\tA = (g - c) / (g + c);\n\t\tB = (c * (g + c) - 1.0) / (c * (g - c) + 1.0);\n\t\tresult = 0.5 * A * A * (1.0 + B * B);\n\n\t}\n\n\treturn result;\n\n}\n\nvoid main() {\n\n\t#include <logdepthbuf_fragment>\n\n\tvec2 fragCoord = (vFragPosition.xy / vFragPosition.w) * 0.5 + 0.5;\n\tfragCoord = clamp(fragCoord, 0.002, 0.998);\n\n\t// Normal map sampling.\n\n\tvec2 nCoord = vec2(0.0);\n\tvec2 offset = windDirection * time * windSpeed;\n\n\tvec2 t[3];\n\tt[0] = vec2(time * 0.005, time * 0.01);\n\tt[1] = vec2(time * 0.02, time * 0.03);\n\tt[2] = vec2(time * 0.06, time * 0.08);\n\n\tnCoord = vUv * (waveScale * 0.015) + offset * 0.03;\n\tvec3 normal0 = 2.0 * texture2D(normalMap, nCoord + vec2(-t[0][0], -t[0][1])).rgb - 1.0;\n\tnCoord = vUv * (waveScale * 0.05) + offset * 0.05 - normal0.xy * waveChoppiness;\n\tvec3 normal1 = 2.0 * texture2D(normalMap, nCoord + vec2(t[0][1], t[0][0])).rgb - 1.0;\n \n\tnCoord = vUv * (waveScale * 0.15) + offset * 0.1 - normal1.xy * waveChoppiness;\n\tvec3 normal2 = 2.0 * texture2D(normalMap, nCoord + vec2(-t[1][0], -t[1][1])).rgb - 1.0;\n\tnCoord = vUv * (waveScale * 0.5) + offset * 0.2 - normal2.xy * waveChoppiness;\n\tvec3 normal3 = 2.0 * texture2D(normalMap, nCoord + vec2(t[1][1], t[1][0])).rgb - 1.0;\n  \n\tnCoord = vUv * (waveScale* 1.5) + offset * 1.0 - normal3.xy * waveChoppiness;\n\tvec3 normal4 = 2.0 * texture2D(normalMap, nCoord + vec2(-t[2][0], t[2][1])).rgb - 1.0;  \n\tnCoord = vUv * (waveScale * 5.0) + offset * 1.3 - normal4.xy * waveChoppiness;\n\tvec3 normal5 = 2.0 * texture2D(normalMap, nCoord + vec2(t[2][1], -t[2][0])).rgb - 1.0;\n\n\tvec3 viewDirection = normalize(vViewPosition);\n\n\tvec3 waveNormal = normalize(\n\t\tnormal0 * bigWaves.x + normal1 * bigWaves.y +\n\t\tnormal2 * midWaves.x + normal3 * midWaves.y +\n\t\tnormal4 * smallWaves.x + normal5 * smallWaves.y\n\t);\n\n\twaveNormal = tangentSpace(waveNormal * waterBump);\n\n\tvec3 scatterNormal = normalize(\n\t\tnormal0 * bigWaves.x + normal1 * bigWaves.y * 0.5 +\n\t\tnormal2 * midWaves.x * 0.3 + normal3 * midWaves.y * 0.3 +\n\t\tnormal4 * smallWaves.x * 0.2 + normal5 * smallWaves.y * 0.2\n\t);\n\n\tscatterNormal = tangentSpace(scatterNormal * waterBump);\n\n\tvec3 lR = reflect(vLightDirection, scatterNormal);\n\tfloat s = max(dot(lR, viewDirection) * 2.0 - 1.2, 0.0);\n\tfloat lightScatter = clamp((max(dot(-vLightDirection, scatterNormal) * 0.75 + 0.25, 0.0) * s) * scatterAmount, 0.0, 1.0);\n\n\t// Fresnel term.\n\tfloat ior = (cameraPosition.y > waterLevel) ? eta : 1.0 / eta;\n\tfloat fresnel = fresnelDielectric(-viewDirection, waveNormal, ior);\n\n\t// Texture edge bleed removal.\n\tvec2 distortFade = vec2(0.0);\n\tdistortFade.s = clamp(fragCoord.s * fade, 0.0, 1.0);\n\tdistortFade.s -= clamp(1.0 - (1.0 - fragCoord.s) * fade, 0.0, 1.0);\n\tdistortFade.t = clamp(fragCoord.t * fade, 0.0, 1.0);\n\tdistortFade.t -= clamp(1.0 - (1.0 - fragCoord.t) * fade, 0.0, 1.0);\n\n\t// Inverting frag coord s, because reflection sampler is mirrored along x axis.\n\tvec3 reflection = texture2D(reflectionMap, vec2(1.0 - fragCoord.s, fragCoord.t) + (waveNormal.xy * reflectionBump * distortFade)).rgb;\n\n\tfloat reflectivity = pow(dot(luminosity, reflection.rgb * 2.0), 3.0);\n\n\tvec3 R = reflect(viewDirection, waveNormal);\n\n\tfloat specular = pow(max(dot(R, vLightDirection), 0.0), sunSpecular) * reflectivity;\n\n\tvec2 rCoord = reflect(viewDirection, waveNormal).st;\n\trCoord *= chromaticAberration;\n\n\tvec2 fCoord = fragCoord - (waveNormal.xy * refractionBump * distortFade);\n\n\tvec3 refraction = vec3(0.0);\n\trefraction.r = texture2D(refractionMap, fCoord).r;\n\trefraction.g = texture2D(refractionMap, fCoord - rCoord).g;\n\trefraction.b = texture2D(refractionMap, fCoord - rCoord * 2.0).b;\n\n\tvec3 transmittance = mix(refraction, refraction * waterColor, waterDensity);\n\tvec3 color = mix(mix(transmittance, scatterColor, lightScatter), reflection, clamp(fresnel, 0.0, 1.0));\n\n\tcolor += specular;\n\n\tgl_FragColor = vec4(color, 1.0);\n\n\t#include <premultiplied_alpha_fragment>\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n\n}\n";

	var vertex$3 = "#define WATER\n\n#include <common>\n#include <logdepthbuf_pars_vertex>\n\nuniform vec3 lightPosition;\nuniform vec4 offsetRepeat;\n\nvarying vec3 vLightDirection;\nvarying vec3 vViewPosition;\nvarying vec4 vFragPosition;\nvarying mat3 vTbn;\nvarying vec2 vUv;\n\nattribute vec4 tangent;\n\nvoid main() {\n\n\tvec3 transformedNormal = normalize(normalMatrix * normal);\n\tvec3 transformedTangent = normalize(normalMatrix * tangent.xyz);\n\n\tvTbn = mat3(\n\t\ttransformedTangent,\n\t\tnormalize(cross(transformedNormal, transformedTangent) * tangent.w),\n\t\ttransformedNormal\n\t);\n\n\tvUv = uv * offsetRepeat.zw + offsetRepeat.xy;\n\n\tmat3 m3 = mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz);\n\tvec3 worldPosition = m3 * position;\n\tvec4 mvPosition = modelViewMatrix * vec4(position, 1.0);\n\tvec4 lightVector = viewMatrix * vec4(lightPosition, 1.0);\n\n\tvLightDirection = normalize(lightVector.xyz - cameraPosition);\n\tvViewPosition = mvPosition.xyz;\n\tvFragPosition = projectionMatrix * mvPosition;\n\n\tgl_Position = vFragPosition;\n\n\t#include <logdepthbuf_vertex>\n\n}\n";

	/**
	 * A water material.
	 *
	 * Shader code taken from Martins Upitis' water/underwater blend:
	 * http://www.elysiun.com/forum/showthread.php?378697-Multiple-Water-Shaders-in-BGE
	 *
	 * @class WaterMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 * @param {Object} [options] - The options.
	 * @param {Vector3} [options.lightPosition] - The position of the main light source.
	 * @param {Boolean} [options.lowQuality=false] - The quality of the shader.
	 */

	class WaterMaterial extends THREE.ShaderMaterial {

		constructor(options) {

			if(options === undefined) { options = {}; }

			super({

				uniforms: THREE.UniformsUtils.merge([

					THREE.UniformsLib.fog,

					{

						time: {type: "1f", value: 0.0},
						waterLevel: {type: "1f", value: 0.0},

						reflectionMap: {type: "t", value: null},
						refractionMap: {type: "t", value: null},
						normalMap: {type: "t", value: null},
						offsetRepeat: {type: "v4", value: new THREE.Vector4(0.0, 0.0, 1.0, 1.0)},

						waveScale: {type: "1f", value: 350.0},
						waveChoppiness: {type: "1f", value: 0.01},
						bigWaves: {type: "v2", value: new THREE.Vector2(2.0, 3.0)},
						midWaves: {type: "v2", value: new THREE.Vector2(4.0, 2.0)},
						smallWaves: {type: "v2", value: new THREE.Vector2(1.0, 0.5)},

						windSpeed: {type: "1f", value: 0.3},
						windDirection: {type: "v2", value: new THREE.Vector2(0.2, -0.5)},
						lightPosition: {type: "v3", value: options.lightPosition},

						waterDensity: {type: "1f", value: 1.0},
						chromaticAberration: {type: "1f", value: 0.002},
						waterBump: {type: "1f", value: 1.0},
						reflectionBump: {type: "1f", value: 0.1},
						refractionBump: {type: "1f", value: 0.1},
						eta: {type: "1f", value: 1.33},

						waterColor: {type: "c", value: new THREE.Color(0.2, 0.4, 0.5)},
						scatterColor: {type: "c", value: new THREE.Color(0.0, 1.0, 0.95)},
						scatterAmount: {type: "1f", value: 3.0},
						sunSpecular: {type: "1f", value: 250.0},

						fade: {type: "1f", value: 12.0},
						luminosity: {type: "v3", value: new THREE.Vector3(0.16, 0.32, 0.11)}

					}

				]),

				fragmentShader: fragment$3,
				vertexShader: vertex$3,

				shading: THREE.FlatShading,
				side: THREE.DoubleSide,
				fog: true

			});

		}

		/**
		 * The reflection map.
		 *
		 * @property reflectionMap
		 * @type Texture
		 */

		get reflectionMap() { return this.uniforms.reflectionMap.value; }

		set reflectionMap(x) {

			this.uniforms.reflectionMap.value = x;

		}

		/**
		 * The refraction map.
		 *
		 * @property refractionMap
		 * @type Texture
		 */

		get refractionMap() { return this.uniforms.refractionMap.value; }

		set refractionMap(x) {

			this.uniforms.refractionMap.value = x;

		}

		/**
		 * The wave normal map.
		 *
		 * @property normalMap
		 * @type Texture
		 */

		get normalMap() { return this.uniforms.normalMap.value; }

		set normalMap(x) {

			this.uniforms.normalMap.value = x;

		}

	}

	var fragment$4 = "#define WATERFALL\n\n#include <common>\n#include <logdepthbuf_pars_fragment>\n#include <fog_pars_fragment>\n\nuniform float time;\nuniform float timeScale;\n\nuniform float smoothness;\nuniform float fallAccel;\nuniform float spread;\nuniform float drops;\nuniform float shape;\nuniform float power;\nuniform float alpha;\nuniform float height;\nuniform float overflow;\nuniform vec2 scale;\nuniform vec2 strength;\nuniform vec3 tint;\n\nvarying vec2 vUv;\n\nconst float K1 = 0.366025404; // (sqrt(3) - 1) / 2\nconst float K2 = 0.211324865; // (3 - sqrt(3)) / 6\n\nvec2 hash(vec2 p) {\n\n\tp = vec2(\n\t\tdot(p, vec2(127.1, 311.7)),\n\t\tdot(p, vec2(269.5, 183.3))\n\t);\n\n\treturn -1.0 + 2.0 * fract(sin(p * smoothness) * 43758.5453123);\n\n}\n\nfloat noise(vec2 p) {\n\n\tvec2 i = floor(p + (p.x + p.y) * K1);\n\n\tvec2 a = p - i + (i.x + i.y) * K2;\n\tfloat z = clamp(ceil(a.x - a.y), 0.0, 1.0); // x > y = 1, else 0\n\tvec2 o = vec2(z, 1.0 - z);\n\tvec2 b = a - o + K2;\n\tvec2 c = a - 1.0 + 2.0 * K2;\n\n\tvec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);\n\n\tvec3 n = h * h * h * h * vec3(\n\t\tdot(a, hash(i)),\n\t\tdot(b, hash(i + o)),\n\t\tdot(c, hash(i + 1.0))\n\t);\n\n\treturn dot(n, vec3(70.0));\n\n}\n\nfloat fbm(vec2 uv) {\n\n\tmat2 m = mat2(1.6, 1.2, -1.2, 1.6);\n\n\tfloat f = 0.5000 * noise(uv);\n\tuv = m * uv; f += 0.2500 * noise(uv);\n\tuv = m * uv; f += 0.1250 * noise(uv);\n\tuv = m * uv; f += 0.0625 * noise(uv);\n\n\treturn spread + 0.5 * f;\n\n}\n\nvoid main() {\n\n\t#include <logdepthbuf_fragment>\n\n\tvec2 q = -vec2(vUv);\n\n\tfloat t = time * timeScale;\n\n\tq.x *= scale.x;\n\tq.y *= scale.y;\n\n\tfloat T3 = max(3.0, 1.25 * strength.x) * t * 0.6 + pow(abs(q.y), fallAccel) * 2.0;\n\n\tfloat n = fbm(vec2(strength.x * q.x, strength.x * q.y) - vec2(0.0, T3));\n\n\tfloat T3B = max(3.0, 1.25 * strength.y) * t * 0.6 + pow(abs(q.y), fallAccel) * 2.0;\n\n\tn = n * 0.5 + (n * 0.5) / (0.001 + 1.5 * fbm(vec2(strength.y * q.x, strength.y * q.y) - vec2(0.0, T3B)));\n\n\tfloat intensity = abs(sin(t * overflow));\n\tn *= 1.0 + pow(intensity, 8.0) * 0.5;\n\n\tfloat c = 1.0 - (drops / abs(pow(q.y, 1.0) * 4.0 + 1.0)) * pow(max(0.0, length(q * vec2(1.8 + q.y * 1.5, 0.75)) - n * max(0.0, q.y + 0.25)), shape);\n\tfloat c1 = n * c * ((power + pow(intensity, height) * 0.9 - pow(intensity, 4.0) * 0.4) - pow(vUv.y, 2.0));\n\n\tc1 = c1 * 1.05 + sin(c1 * 3.4) * 0.4;\n\tc1 *= 0.95 - pow(q.y, 2.0);\n\tc1 = clamp(c1, 0.4, 1.0);\n\n\tfloat c4 = c1 * c1 * c1 * c1;\n\n\tvec3 color = vec3(\n\t\t(1.0 + tint.r) * c4,\n\t\t(1.0 + tint.g) * c4,\n\t\t(1.0 + tint.b) * c4 / c1\n\t);\n\n\tfloat a = c * (1.0 - pow(abs(vUv.y), alpha));\n\n\tgl_FragColor = vec4(color, a);\n\n\t#include <premultiplied_alpha_fragment>\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n\n}\n";

	var vertex$4 = "#define WATERFALL\n\n#include <common>\n#include <logdepthbuf_pars_vertex>\n\nuniform vec4 offsetRepeat;\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv * offsetRepeat.zw + offsetRepeat.xy;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n\t#include <logdepthbuf_vertex>\n\n}\n";

	/**
	 * A mod of xbe's "fire" that creates a fast, smooth falling water effect.
	 *
	 * Original shader code by: https://www.shadertoy.com/user/bbcollinsworth
	 *
	 * @class WaterfallMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 * @param {Object} [options] - The options.
	 * @param {Number} [options.drops=16] - The sharpness of the water drops. The higher, the sharper.
	 */

	class WaterfallMaterial extends THREE.ShaderMaterial {

		constructor(options) {

			if(options === undefined) { options = {}; }

			super({

				uniforms: THREE.UniformsUtils.merge([

					THREE.UniformsLib.fog,

					{

						time: {type: "1f", value: 0.0},
						timeScale: {type: "1f", value: (options.timeScale !== undefined) ? options.timeScale : 1.0},

						smoothness: {type: "1f", value: (options.smoothness !== undefined) ? options.smoothness : 0.0001},
						fallAccel: {type: "1f", value: (options.fallAccel !== undefined) ? options.fallAccel : 1.25},
						spread: {type: "1f", value: (options.spread !== undefined) ? options.spread : 0.6},
						drops: {type: "1f", value: (options.drops !== undefined) ? options.drops : 16.0},
						shape: {type: "1f", value: (options.shape !== undefined) ? options.shape : 1.2},
						power: {type: "1f", value: (options.power !== undefined) ? options.power : 0.7},
						alpha: {type: "1f", value: (options.alpha !== undefined) ? options.alpha : 10.0},
						height: {type: "1f", value: (options.height !== undefined) ? options.height : 0.8},
						overflow: {type: "1f", value: (options.overflow !== undefined) ? options.overflow : 0.2},
						scale: {type: "v2", value: (options.scale !== undefined) ? options.scale : new THREE.Vector2(1.0, 1.0)},
						strength: {type: "v2", value: (options.strength !== undefined) ? options.strength : new THREE.Vector2(6.0, 26.0)},
						tint: {type: "c", value: (options.tint !== undefined) ? options.tint : new THREE.Color(0.25, 0.5, 0.5)},

						offsetRepeat: {type: "v4", value: new THREE.Vector4(-0.5, -0.75, 1.0, 1.0)}

					}

				]),

				fragmentShader: fragment$4,
				vertexShader: vertex$4,

				side: THREE.DoubleSide,
				transparent: true,
				fog: true

			});

		}

	}

	/**
	 * An abstract pass.
	 *
	 * This class implements a dispose method that frees memory on demand.
	 * The EffectComposer calls this method when it is being destroyed.
	 *
	 * For this mechanism to work properly, please assign your render targets, 
	 * materials or textures directly to your pass!
	 *
	 * You can prevent your disposable objects from being deleted by keeping them 
	 * inside deeper structures such as arrays or objects.
	 *
	 * @class Pass
	 * @constructor
	 * @param {Scene} [scene] - The scene to render.
	 * @param {Camera} [camera] - The camera will be added to the given scene if it has no parent.
	 * @param {Mesh} [quad] - A quad that fills the screen. Used for rendering a pure 2D effect. Set this to null, if you don't need it (see RenderPass).
	 */

	class Pass {

		constructor(scene, camera, quad) {

			/**
			 * The scene to render.
			 *
			 * @property scene
			 * @type Scene
			 * @private
			 * @default Scene()
			 */

			this.scene = (scene !== undefined) ? scene : new THREE.Scene();

			/**
			 * The camera to render with.
			 *
			 * @property camera
			 * @type Camera
			 * @private
			 * @default OrthographicCamera(-1, 1, 1, -1, 0, 1)
			 */

			this.camera = (camera !== undefined) ? camera : new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

			/**
			 * The quad mesh to use for rendering.
			 *
			 * Assign your shader material to this mesh!
			 *
			 * @property quad
			 * @type Mesh
			 * @private
			 * @default Mesh(PlaneBufferGeometry(2, 2), null)
			 * @example
			 *  this.quad.material = this.myMaterial;
			 */

			this.quad = (quad !== undefined) ? quad : new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);

			/**
			 * Indicates whether the read and write buffers should be swapped after this 
			 * pass has finished rendering.
			 *
			 * Set this to true if this pass renders to the write buffer so that a 
			 * following pass can find the result in the read buffer.
			 *
			 * @property needsSwap
			 * @type Boolean
			 * @private
			 * @default false
			 */

			this.needsSwap = false;

			/**
			 * Enabled flag.
			 *
			 * @property enabled
			 * @type Boolean
			 * @default true
			 */

			this.enabled = true;

			/**
			 * Render to screen flag.
			 *
			 * @property renderToScreen
			 * @type Boolean
			 * @default false
			 */

			this.renderToScreen = false;

			// Finally, add the camera and the quad to the scene.
			if(this.scene !== null) {

				if(this.camera !== null && this.camera.parent === null) { this.scene.add(this.camera); }
				if(this.quad !== null) { this.scene.add(this.quad); }

			}

		}

		/**
		 * Renders the effect.
		 *
		 * This is an abstract method that must be overridden.
		 *
		 * @method render
		 * @throws {Error} An error is thrown if the method is not overridden.
		 * @param {WebGLRenderer} renderer - The renderer to use.
		 * @param {WebGLRenderTarget} readBuffer - A read buffer. Contains the result of the previous pass.
		 * @param {WebGLRenderTarget} writeBuffer - A write buffer. Normally used as the render target.
		 * @param {Number} [delta] - The delta time.
		 * @param {Boolean} [maskActive] - Indicates whether a stencil test mask is active or not.
		 */

		render(renderer, readBuffer, writeBuffer, delta, maskActive) {

			throw new Error("Render method not implemented!");

		}

		/**
		 * Performs initialisation tasks.
		 *
		 * By implementing this abstract method you gain access to the renderer.
		 * You'll also be able to configure your custom render targets to use the 
		 * appropriate format (RGB or RGBA).
		 *
		 * The provided renderer can be used to warm up special off-screen render 
		 * targets by performing a preliminary render operation.
		 *
		 * The effect composer calls this method when this pass is added to its queue.
		 *
		 * @method initialise
		 * @param {WebGLRenderer} renderer - The renderer.
		 * @param {Boolean} alpha - Whether the renderer uses the alpha channel or not.
		 */

		initialise(renderer, alpha) {}

		/**
		 * Updates this pass with the renderer's size.
		 *
		 * This is an abstract method that may be overriden in case you want to be 
		 * informed about the main render size.
		 *
		 * The effect composer calls this method when its own size is updated.
		 *
		 * @method setSize
		 * @param {Number} width - The renderer's width.
		 * @param {Number} height - The renderer's height.
		 * @example
		 *  this.myRenderTarget.setSize(width, height);
		 */

		setSize(width, height) {}

		/**
		 * Performs a shallow search for properties that define a dispose method and 
		 * deletes them. The pass will be inoperative after this method was called!
		 *
		 * Disposable objects:
		 *  - render targets
		 *  - materials
		 *  - textures
		 *
		 * The EffectComposer calls this method automatically when it is being
		 * destroyed. You may, however, use it independently to free memory 
		 * when you are certain that you don't need this pass anymore.
		 *
		 * @method dispose
		 */

		dispose() {

			let i, p;
			let keys = Object.keys(this);

			for(i = keys.length - 1; i >= 0; --i) {

				p = this[keys[i]];

				if(p !== null && typeof p.dispose === "function") {

					p.dispose();
					this[keys[i]] = null;

				}

			}

		}

	}

	/**
	 * Used for saving the original clear color during 
	 * the rendering process of the masked scene.
	 *
	 * @property clearColor
	 * @type Color
	 * @private
	 * @static
	 */

	const clearColor = new THREE.Color();

	/**
	 * Used for saving the original clear color during rendering.
	 *
	 * @property clearColor
	 * @type Color
	 * @private
	 * @static
	 */

	const clearColor$1 = new THREE.Color();

	/**
	 * A distortion and droplet pass for underwater and wet lens effects.
	 *
	 * @class DistortionPass
	 * @constructor
	 * @param {Object} [options] - The options.
	 * @param {Number} [options.resolution=512] - The size of the generated perturbation map, power of two.
	 * @param {Vector2} [options.rollOffSpeed] - The droplet roll off speed.
	 * @param {Vector2} [options.waveStrength] - The sine and cosine wave distortion strength.
	 * @param {Boolean} [options.highQuality] - The effect quality. If set to true, double the amount of noise values will be computed.
	 * @param {Number} [options.speed] - The effect's animation speed.
	 */

	class DistortionPass extends Pass {

		constructor(options) {

			super();

			this.needsSwap = true;

			if(options === undefined) { options = {}; }

			/**
			 * Noise render texture.
			 *
			 * @property renderTargetPerturb
			 * @type WebGLRenderTarget
			 * @private
			 */

			this.renderTargetPerturb = new THREE.WebGLRenderTarget(1, 1, {
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				format: THREE.RGBFormat, // want RG16F or RG32F.
				type: THREE.FloatType,
				generateMipmaps: false,
				stencilBuffer: false,
				depthBuffer: false
			});

			/**
			 * Droplet noise shader material.
			 *
			 * @property noiseMaterial
			 * @type DropletNoiseMaterial
			 * @private
			 */

			this.noiseMaterial = new DropletNoiseMaterial(options.highQuality);

			this.resolution = (options.resolution === undefined) ? 512 : options.resolution;

			/**
			 * Distortion shader material.
			 *
			 * @property distortionMaterial
			 * @type DistortionMaterial
			 * @private
			 */

			this.distortionMaterial = new DistortionMaterial({
				perturbMap: this.renderTargetPerturb.texture,
				rollOffSpeed: options.rollOffSpeed,
				waveStrength: options.waveStrength,
				tint: options.color
			});

			this.quad.material = this.distortionMaterial;

			/**
			 * The effect speed.
			 *
			 * @property speed
			 * @type Number
			 */

			this.speed = (options.speed === undefined) ? 1.0 : options.speed;

			/**
			 * Maximum duration of the dissolution effect in seconds.
			 *
			 * @property dissolutionEnd
			 * @type Number
			 * @private
			 */

			this.dissolutionEnd = Number.parseFloat(this.distortionMaterial.defines.T_DROPLETS);

			/**
			 * Dissolution flag.
			 *
			 * @property _dissolve
			 * @type Boolean
			 * @default false
			 * @private
			 */

			this._dissolve = false;

		}

		/**
		 * The resolution of the noise texture.
		 * The value should be a power of two.
		 *
		 * @property resolution
		 * @type Number
		 * @default 512
		 */

		get resolution() { return this.renderTargetPerturb.width; }

		set resolution(x) {

			if(typeof x === "number" && x > 0) {

				this.noiseMaterial.uniforms.tWidth.value = x;
				this.noiseMaterial.uniforms.tHeight.value = x;
				this.noiseMaterial.uniforms.texelSize.value = 1.0 / x;
				this.noiseMaterial.uniforms.halfTexelSize.value = 0.5 / x;

				this.renderTargetPerturb.setSize(x, x);

			}

		}

		/**
		 * Dissolution flag.
		 *
		 * Set to false for wavy distortion,
		 * set to true for dissolution into droplets.
		 *
		 * @property dissolve
		 * @type Boolean
		 * @default false
		 */

		get dissolve() { return this._dissolve; }

		set dissolve(x) {

			this._dissolve = x;

			if(!this._dissolve) {

				this.distortionMaterial.uniforms.resetTimer.value = 0.0;
				this.distortionMaterial.uniforms.time.value = Math.random() * 1000.0;
				this.noiseMaterial.uniforms.randomTime.value = Math.random() * 10.0 - 1.0;

			}

		}

		/**
		 * Renders the effect.
		 *
		 * @method render
		 * @param {WebGLRenderer} renderer - The renderer to use.
		 * @param {WebGLRenderTarget} readBuffer - The read buffer.
		 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
		 * @param {Number} delta - The render delta time.
		 */

		render(renderer, readBuffer, writeBuffer, delta) {

			let t = delta * this.speed;

			this.distortionMaterial.uniforms.tDiffuse.value = readBuffer;
			this.distortionMaterial.uniforms.time.value += t;

			//this.renderPerturbationMap(renderer); // Debug.

			if(this.dissolve && this.distortionMaterial.uniforms.resetTimer.value <= this.dissolutionEnd) {

				this.distortionMaterial.uniforms.resetTimer.value += t;
				this.renderPerturbationMap(renderer);

			}

			if(this.renderToScreen) {

				renderer.render(this.scene, this.camera);

			} else {

				renderer.render(this.scene, this.camera, writeBuffer, false);

			}

		}

		/**
		 * Renders a perturbation noise map.
		 *
		 * @method renderPerturbationMap
		 * @param {WebGLRenderer} renderer - The renderer to use.
		 * @private
		 */

		renderPerturbationMap(renderer) {

			this.quad.material = this.noiseMaterial;
			this.noiseMaterial.uniforms.time.value = this.distortionMaterial.uniforms.time.value;

			//renderer.render(this.scene, this.camera); // Renders the perturb map to screen.
			renderer.render(this.scene, this.camera, this.renderTargetPerturb, false);

			this.quad.material = this.distortionMaterial;

		}

		/**
		 * Warms up the perturbation render target to avoid start-up hiccups.
		 *
		 * @method initialise
		 * @param {WebGLRenderer} renderer - The renderer.
		 */

		initialise(renderer) {

			this.renderPerturbationMap(renderer);

		}

	}

	// Static computation helpers.
	const cameraWorldPosition = new THREE.Vector3();
	const lookAtPosition = new THREE.Vector3();
	const worldPosition = new THREE.Vector3();
	const viewPosition = new THREE.Vector3();
	const clipPlane = new THREE.Vector4();
	const rotation = new THREE.Matrix4();
	const normal = new THREE.Vector3();
	const target = new THREE.Vector3();
	const plane = new THREE.Plane();
	const q = new THREE.Vector4();

	/**
	 * A reflection pass.
	 *
	 * This pass renders the reflection of a given scene into a texture.
	 *
	 * @class ReflectionPass
	 * @constructor
	 * @extends Pass
	 * @param {Scene} scene - The scene to render.
	 * @param {Camera} camera - The main camera.
	 * @param {Object} [options] - Additional options.
	 * @param {Object3D} [options.object] - An object that represents the reflection plane in terms of position and rotation.
	 * @param {Number} [options.resolution=256] - The render texture resolution.
	 * @param {Number} [options.clipBias=0.2] - The clip plane offset.
	 */

	class ReflectionPass extends Pass {

		constructor(scene, camera, options) {

			super(scene, camera, null);

			if(options === undefined) { options = {}; }

			/**
			 * The reflection render target.
			 *
			 * @property renderTargetReflection
			 * @type WebGLRenderTarget
			 * @private
			 */

			this.renderTargetReflection = new THREE.WebGLRenderTarget(1, 1, {
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				generateMipmaps: false,
				stencilBuffer: false
			});

			this.resolution = (options.resolution === undefined) ? 256 : options.resolution;

			/**
			 * The reflection texture.
			 *
			 * @property reflectionTexture
			 * @type Texture
			 */

			this.reflectionTexture = this.renderTargetReflection.texture;

			/**
			 * The reflection camera.
			 *
			 * @property reflectionCamera
			 * @type Camera
			 * @private
			 */

			this.reflectionCamera = this.camera.clone();

			/**
			 * An object that represents the internal reflection plane.
			 * If no object was provided a plane object will be created.
			 *
			 * Please assign a material that uses the reflection texture 
			 * to this object and add the object to your scene.
			 *
			 * @property object
			 * @type Object3D
			 */

			let geometry, tangents;

			if(options.object === undefined) {

				geometry = new THREE.PlaneBufferGeometry(1, 1);
				tangents = new Float32Array(4 * 4);

				tangents[0] = 1; tangents[1] = 0; tangents[2] = 0; tangents[3] = -1;
				tangents[4] = 1; tangents[5] = 0; tangents[6] = 0; tangents[7] = -1;
				tangents[8] = 1; tangents[9] = 0; tangents[10] = 0; tangents[11] = -1;
				tangents[12] = 1; tangents[13] = 0; tangents[14] = 0; tangents[15] = -1;

				geometry.addAttribute("tangent", new THREE.BufferAttribute(tangents, 4));

				options.object = new THREE.Mesh(geometry, null);

			}

			this.object = options.object;

			/**
			 * A collection of materials that use the reflection texture.
			 * These will temporarily be disabled during the render process.
			 *
			 * @property materials
			 * @type Array
			 */

			this.materials = [];

			/**
			 * Clip bias.
			 *
			 * @property clipBias
			 * @type Number
			 */

			this.clipBias = (options.clipBias !== undefined) ? options.clipBias : 0.2;

			// Update the matrices.
			this.update();

		}

		/**
		 * The resolution of the render target. Must be a power of two.
		 *
		 * @property resolution
		 * @type Number
		 * @default 256
		 */

		get resolution() { return this.renderTargetReflection.width; }

		set resolution(x) {

			if(typeof x === "number" && x > 0) {

				this.renderTargetReflection.setSize(x, x);

			}

		}

		/**
		 * Renders the reflection texture.
		 *
		 * @method render
		 * @param {WebGLRenderer} renderer - The renderer to use.
		 */

		render(renderer) {

			let i, l, m;
			let visible = false;

			for(i = 0, l = this.materials.length; i < l; ++i) {

				this.materials[i].visible = false;

			}

			if(this.object.material !== null) {

				visible = this.object.material.visible;
				this.object.material.visible = false;

			}

			this.update();

			renderer.render(this.scene, this.reflectionCamera, this.renderTargetReflection, true);

			for(i = 0; i < l; ++i) {

				this.materials[i].visible = true;

			}

		}

		/**
		 * Updates the projection camera.
		 *
		 * Uses oblique camera frustum clipping.
		 * http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
		 *
		 * @method update
		 * @private
		 */

		update() {

			// Adjust the position and rotation of the reflection camera.

			this.object.updateMatrixWorld();
			this.camera.updateMatrixWorld();

			worldPosition.setFromMatrixPosition(this.object.matrixWorld);
			cameraWorldPosition.setFromMatrixPosition(this.camera.matrixWorld);

			rotation.extractRotation(this.object.matrixWorld);

			normal.set(0, 0, 1);
			normal.applyMatrix4(rotation);

			viewPosition.copy(worldPosition).sub(cameraWorldPosition);
			viewPosition.reflect(normal).negate();
			viewPosition.add(worldPosition);

			rotation.extractRotation(this.camera.matrixWorld);

			lookAtPosition.set(0, 0, -1);
			lookAtPosition.applyMatrix4(rotation);
			lookAtPosition.add(cameraWorldPosition);

			target.copy(worldPosition).sub(lookAtPosition);
			target.reflect(normal).negate();
			target.add(worldPosition);

			this.object.up.set(0, -1, 0);
			this.object.up.applyMatrix4(rotation);
			this.object.up.reflect(normal).negate();

			this.reflectionCamera.position.copy(viewPosition);
			this.reflectionCamera.up = this.object.up;
			this.reflectionCamera.lookAt(target);

			this.reflectionCamera.updateProjectionMatrix();
			this.reflectionCamera.updateMatrixWorld();
			this.reflectionCamera.matrixWorldInverse.getInverse(this.reflectionCamera.matrixWorld);

			// Update the projection matrix with the clip plane.

			plane.setFromNormalAndCoplanarPoint(normal, worldPosition);
			plane.applyMatrix4(this.reflectionCamera.matrixWorldInverse);

			clipPlane.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);

			let projectionMatrix = this.reflectionCamera.projectionMatrix;
			let elements = projectionMatrix.elements;

			q.x = (Math.sign(clipPlane.x) + elements[8]) / elements[0];
			q.y = (Math.sign(clipPlane.y) + elements[9]) / elements[5];
			q.z = -1.0;
			q.w = (1.0 + elements[10]) / elements[14];

			// Calculate the scaled plane vector.
			let c = clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));

			// Replace the third row of the projection matrix.
			elements[2] = c.x;
			elements[6] = c.y;
			elements[10] = c.z + 1.0 - this.clipBias;// minus?
			elements[14] = c.w;

		}

		/**
		 * Adjusts the format of the render targets.
		 *
		 * @method initialise
		 * @param {WebGLRenderer} renderer - The renderer.
		 * @param {Boolean} alpha - Whether the renderer uses the alpha channel or not.
		 */

		initialise(renderer, alpha) {

			if(!alpha) { this.renderTargetReflection.texture.format = THREE.RGBFormat; }

		}

	}

	exports.DistortionMaterial = DistortionMaterial;
	exports.DropletNoiseMaterial = DropletNoiseMaterial;
	exports.LavaMaterial = LavaMaterial;
	exports.WaterMaterial = WaterMaterial;
	exports.WaterfallMaterial = WaterfallMaterial;
	exports.DistortionPass = DistortionPass;
	exports.ReflectionPass = ReflectionPass;

}));