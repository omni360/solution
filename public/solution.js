/**
 * solution v0.0.1 build Jan 30 2016
 * https://github.com/vanruesc/solution
 * Copyright 2016 Raoul van Rüschen, Zlib
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three')) :
	typeof define === 'function' && define.amd ? define(['exports', 'three'], factory) :
	(factory((global.SOLUTION = {}),global.THREE));
}(this, function (exports,THREE) { 'use strict';

	THREE = 'default' in THREE ? THREE['default'] : THREE;

	var shader$2 = {
		fragment: {
			high: "#ifdef USE_FOG\n\n\t#define LOG2 1.442695\n\t#define saturate(a) clamp(a, 0.0, 1.0)\n\t#define whiteCompliment(a) (1.0 - saturate(a))\n\n\tuniform vec3 fogColor;\n\n\t#ifdef FOG_EXP2\n\n\t\tuniform float fogDensity;\n\n\t#else\n\n\t\tuniform float fogNear;\n\t\tuniform float fogFar;\n\n\t#endif\n\n#endif\n\n#ifdef USE_LOGDEPTHBUF\n\n\tuniform float logDepthBufFC;\n\n\t#ifdef USE_LOGDEPTHBUF_EXT\n\n\t\tvarying float vFragDepth;\n\n\t#endif\n\n#endif\n\nuniform float time;\nuniform float waterLevel;\n\nuniform sampler2D reflectionMap;\nuniform sampler2D refractionMap;\nuniform sampler2D normalMap;\n\nuniform float waveScale;\nuniform vec2 bigWaves;\nuniform vec2 midWaves;\nuniform vec2 smallWaves;\nuniform float waveChoppiness;\n\nuniform float windSpeed;\nuniform vec2 windDirection;\n\nuniform float waterDensity;\nuniform float chromaticAberration;\nuniform float waterBump;\nuniform float reflectionBump;\nuniform float refractionBump;\nuniform float eta;\n\nuniform vec3 waterColor;\nuniform float sunSpecular;\nuniform float scatterAmount;\nuniform vec3 scatterColor;\n\nuniform float fade;\nuniform vec3 luminosity;\n\nvarying vec3 vLightDirection;\nvarying vec3 vViewPosition;\nvarying vec4 vFragPosition;\nvarying mat3 vTbn;\nvarying vec2 vUv;\n\nvec3 tangentSpace(vec3 v) {\n\n\t//v.y = -v.y;\n\tvec3 vec;\n\tvec.xy = v.xy;\n\tvec.z = sqrt(1.0 - dot(vec.xy, vec.xy));\n\tvec.xyz = normalize(vec.x * vTbn[0] + vec.y * vTbn[1] + vec.z * vTbn[2]);\n\n\treturn vec;\n\n}\n\n/**\n * Computes fresnel reflectance without explicitly computing the refracted direction.\n */\n\nfloat fresnelDielectric(vec3 viewDirection, vec3 normal, float eta) {\n\n\tfloat c = abs(dot(viewDirection, normal));\n\tfloat g = eta * eta - 1.0 + c * c;\n\tfloat A, B;\n\tfloat result = 1.0;\n\n\tif(g > 0.0)\t{\n\n\t\tg = sqrt(g);\n\t\tA = (g - c) / (g + c);\n\t\tB = (c * (g + c) - 1.0) / (c * (g - c) + 1.0);\n\t\tresult = 0.5 * A * A * (1.0 + B * B);\n\n\t}\n\n\treturn result;\n\n}\n\nvoid main() {\n\n\tvec2 fragCoord = (vFragPosition.xy / vFragPosition.w) * 0.5 + 0.5;\n\tfragCoord = clamp(fragCoord, 0.002, 0.998);\n\n\t// Normal map sampling.\n\n\tvec2 nCoord = vec2(0.0);\n\tvec2 offset = windDirection * time * windSpeed;\n\n\tvec2 t[3];\n\tt[0] = vec2(time * 0.005, time * 0.01);\n\tt[1] = vec2(time * 0.02, time * 0.03);\n\tt[2] = vec2(time * 0.06, time * 0.08);\n\n\tnCoord = vUv * (waveScale * 0.015) + offset * 0.03;\n\tvec3 normal0 = 2.0 * texture2D(normalMap, nCoord + vec2(-t[0][0], -t[0][1])).rgb - 1.0;\n\tnCoord = vUv * (waveScale * 0.05) + offset * 0.05 - normal0.xy * waveChoppiness;\n\tvec3 normal1 = 2.0 * texture2D(normalMap, nCoord + vec2(t[0][1], t[0][0])).rgb - 1.0;\n \n\tnCoord = vUv * (waveScale * 0.15) + offset * 0.1 - normal1.xy * waveChoppiness;\n\tvec3 normal2 = 2.0 * texture2D(normalMap, nCoord + vec2(-t[1][0], -t[1][1])).rgb - 1.0;\n\tnCoord = vUv * (waveScale * 0.5) + offset * 0.2 - normal2.xy * waveChoppiness;\n\tvec3 normal3 = 2.0 * texture2D(normalMap, nCoord + vec2(t[1][1], t[1][0])).rgb - 1.0;\n  \n\tnCoord = vUv * (waveScale* 1.5) + offset * 1.0 - normal3.xy * waveChoppiness;\n\tvec3 normal4 = 2.0 * texture2D(normalMap, nCoord + vec2(-t[2][0], t[2][1])).rgb - 1.0;  \n\tnCoord = vUv * (waveScale * 5.0) + offset * 1.3 - normal4.xy * waveChoppiness;\n\tvec3 normal5 = 2.0 * texture2D(normalMap, nCoord + vec2(t[2][1], -t[2][0])).rgb - 1.0;\n\n\tvec3 viewDirection = normalize(vViewPosition);\n\n\tvec3 waveNormal = normalize(\n\t\tnormal0 * bigWaves.x + normal1 * bigWaves.y +\n\t\tnormal2 * midWaves.x + normal3 * midWaves.y +\n\t\tnormal4 * smallWaves.x + normal5 * smallWaves.y\n\t);\n\n\twaveNormal = tangentSpace(waveNormal * waterBump);\n\n\tvec3 scatterNormal = normalize(\n\t\tnormal0 * bigWaves.x + normal1 * bigWaves.y * 0.5 +\n\t\tnormal2 * midWaves.x * 0.3 + normal3 * midWaves.y * 0.3 +\n\t\tnormal4 * smallWaves.x * 0.2 + normal5 * smallWaves.y * 0.2\n\t);\n\n\tscatterNormal = tangentSpace(scatterNormal * waterBump);\n\n\tvec3 lR = reflect(vLightDirection, scatterNormal);\n\tfloat s = max(dot(lR, viewDirection) * 2.0 - 1.2, 0.0);\n\tfloat lightScatter = clamp((max(dot(-vLightDirection, scatterNormal) * 0.75 + 0.25, 0.0) * s) * scatterAmount, 0.0, 1.0);\n\n\t// Fresnel term.\n\tfloat ior = (cameraPosition.y > waterLevel) ? eta : 1.0 / eta;\n\tfloat fresnel = fresnelDielectric(-viewDirection, waveNormal, ior);\n\n\t// Texture edge bleed removal.\n\tvec2 distortFade = vec2(0.0);\n\tdistortFade.s = clamp(fragCoord.s * fade, 0.0, 1.0);\n\tdistortFade.s -= clamp(1.0 - (1.0 - fragCoord.s) * fade, 0.0, 1.0);\n\tdistortFade.t = clamp(fragCoord.t * fade, 0.0, 1.0);\n\tdistortFade.t -= clamp(1.0 - (1.0 - fragCoord.t) * fade, 0.0, 1.0);\n\n\t// Inverting frag coord s, because reflection sampler is mirrored along x axis.\n\tvec3 reflection = texture2D(reflectionMap, vec2(1.0 - fragCoord.s, fragCoord.t) + (waveNormal.xy * reflectionBump * distortFade)).rgb;\n\n\tfloat reflectivity = pow(dot(luminosity, reflection.rgb * 2.0), 3.0);\n\n\tvec3 R = reflect(viewDirection, waveNormal);\n\n\tfloat specular = pow(max(dot(R, vLightDirection), 0.0), sunSpecular) * reflectivity;\n\n\tvec2 rCoord = reflect(viewDirection, waveNormal).st;\n\trCoord *= chromaticAberration;\n\n\tvec2 fCoord = fragCoord - (waveNormal.xy * refractionBump * distortFade);\n\n\tvec3 refraction = vec3(0.0);\n\trefraction.r = texture2D(refractionMap, fCoord).r;\n\trefraction.g = texture2D(refractionMap, fCoord - rCoord).g;\n\trefraction.b = texture2D(refractionMap, fCoord - rCoord * 2.0).b;\n\n\tvec3 transmittance = mix(refraction, refraction * waterColor, waterDensity);\n\tvec3 color = mix(mix(transmittance, scatterColor, lightScatter), reflection, clamp(fresnel, 0.0, 1.0));\n\n\tcolor += specular;\n\n\t#if defined(USE_LOGDEPTHBUF) && defined(USE_LOGDEPTHBUF_EXT)\n\n\t\tgl_FragDepthEXT = log2(vFragDepth) * logDepthBufFC * 0.5;\n\n\t#endif\n\n\t#ifdef USE_FOG\n\n\t\t#ifdef USE_LOGDEPTHBUF_EXT\n\n\t\t\tfloat depth = gl_FragDepthEXT / gl_FragCoord.w;\n\n\t\t#else\n\n\t\t\tfloat depth = gl_FragCoord.z / gl_FragCoord.w;\n\n\t\t#endif\n\n\t\t#ifdef FOG_EXP2\n\n\t\t\tfloat fogFactor = whiteCompliment(exp2(-fogDensity * fogDensity * depth * depth * LOG2));\n\n\t\t#else\n\n\t\t\tfloat fogFactor = smoothstep(fogNear, fogFar, depth);\n\n\t\t#endif\n\n\t\tcolor = mix(color, fogColor, fogFactor);\n\n\t#endif\n\n\tgl_FragColor = vec4(color, 1.0);\n\n}\n",
			low: "#ifdef USE_FOG\n\n\t#define LOG2 1.442695\n\t#define saturate(a) clamp(a, 0.0, 1.0)\n\t#define whiteCompliment(a) (1.0 - saturate(a))\n\n\tuniform vec3 fogColor;\n\n\t#ifdef FOG_EXP2\n\n\t\tuniform float fogDensity;\n\n\t#else\n\n\t\tuniform float fogNear;\n\t\tuniform float fogFar;\n\n\t#endif\n\n#endif\n\n#ifdef USE_LOGDEPTHBUF\n\n\tuniform float logDepthBufFC;\n\n\t#ifdef USE_LOGDEPTHBUF_EXT\n\n\t\tvarying float vFragDepth;\n\n\t#endif\n\n#endif\n\nuniform float time;\nuniform float timeScale;\n\nuniform sampler2D reflectionMap;\nuniform sampler2D refractionMap;\nuniform sampler2D normalMap;\n\nuniform float waveScale;\nuniform vec2 bigWaves;\nuniform vec2 midWaves;\nuniform vec2 smallWaves;\nuniform float waveChoppiness;\n\nuniform float windSpeed;\nuniform vec2 windDirection;\n\nuniform float waterDensity;\nuniform float chromaticAberration;\nuniform float waterBump;\nuniform float reflectionBump;\nuniform float refractionBump;\nuniform float eta;\n\nuniform vec4 waterColor;\nuniform float sunSpecular;\nuniform float scatterAmount;\nuniform vec4 scatterColor;\n\nuniform float fade;\nuniform vec3 luminosity;\n\nvarying vec3 vLightPosition;\nvarying vec4 vFragPosition;\nvarying vec3 vViewPosition;\nvarying vec3 vNormal;\nvarying vec2 vUv;\n\n/**\n * Per-pixel tangent space normal mapping.\n * http://www.thetenthplanet.de/archives/1180\n */\n\nmat3 deriveCotangentFrame(vec3 N, vec3 eyePos) {\n\n\t// Get edge vectors of the pixel triangle.\n\tvec3 dp1 = dFdx(eyePos);\n\tvec3 dp2 = dFdy(eyePos);\n\tvec2 duv1 = dFdx(vUv);\n\tvec2 duv2 = dFdy(vUv);\n \n\t// Solve the linear system.\n\tvec3 dp2perp = cross(dp2, N);\n\tvec3 dp1perp = cross(N, dp1);\n\tvec3 T = dp2perp * duv1.x + dp1perp * duv2.x;\n\tvec3 B = dp2perp * duv1.y + dp1perp * duv2.y;\n \n\t// Construct a scale-invariant frame.\n\tfloat invmax = inversesqrt(max(dot(T, T), dot(B, B)));\n\n\treturn mat3(T * invmax, B * invmax, N);\n\n}\n\n/**\n * Tangent space transformation.\n */\n\nvec3 applyTangentSpace(mat3 tbn, vec3 normal) {\n\n\tnormal.z = sqrt(1.0 - dot(normal.xy, normal.xy)); // Normalmap 2channel.\n\tnormal.y = -normal.y; // Make normalmap green channel point up.\n\n\t//return normalize(normal.x * tbn[0] + normal.y * tbn[1] + normal.z * tbn[2]);\n\treturn normalize(tbn * normal);\n\n}\n\nvoid main() {\n\n\tvec2 fragCoord = (vFragPosition.xy / vFragPosition.w) * 0.5 + 0.5;\n\tfragCoord = clamp(fragCoord, 0.002, 0.998);\n\n\t// Normal map.\n\tfloat t = time * timeScale;\n\tvec2 nCoord = vec2(0.0);\n\n\tnCoord = vUv * (waveScale * 0.15) + windDirection.xy * time * (windSpeed * 0.1);\n\tvec3 normal0 = 2.0 * texture2D(normalMap, nCoord + vec2(-time * 0.02, -time * 0.03)).rgb - 1.0;\n\tnCoord = vUv * (waveScale * 0.5) + windDirection.xy * time * (windSpeed * 0.2) - normal0.xy * waveChoppiness;\n\tvec3 normal1 = 2.0 * texture2D(normalMap, nCoord + vec2(time * 0.03, time * 0.02)).rgb - 1.0;\n\n\tnCoord = vUv * (waveScale * 1.5) + windDirection.xy * time * (windSpeed * 0.5) - normal1.xy * waveChoppiness;\n\tvec3 normal2 = 2.0 * texture2D(normalMap, nCoord + vec2(-time * 0.03, time * 0.04)).rgb - 1.0;\n\tnCoord = vUv * (waveScale * 4.0) + windDirection.xy * time * (windSpeed * 0.7) - normal2.xy * waveChoppiness;\n\tvec3 normal3 = 2.0 * texture2D(normalMap, nCoord + vec2(time * 0.04, -time * 0.02)).rgb - 1.0;\n\n\tvec3 viewDirection = normalize(vViewPosition);\n\tvec3 lightDirection = normalize(vLightPosition);\n\n\tvec3 surfaceNormal = vNormal;\n\n\t#ifdef DOUBLE_SIDED\n\n\t\tfloat facing = -1.0 + 2.0 * float(gl_FrontFacing);\n\t\tsurfaceNormal *= facing;\n\t\t//lightDirection.y *= facing;\n\n\t#endif\n\n\tmat3 tbn = deriveCotangentFrame(surfaceNormal, vViewPosition);\n\n\tvec3 waveNormal = normalize(normal0 * midWaves.x + normal1 * midWaves.y +\n\t\tnormal2 * bigWaves.x + normal3 * bigWaves.y);\n\n\twaveNormal = applyTangentSpace(tbn, waveNormal * waterBump);\n\n\t// Normal for light scattering.\n\tvec3 lightNormal = applyTangentSpace(tbn, normalize(normal0 * midWaves.x + normal1 * midWaves.y) * waterBump);\n\n\tvec3 lR = reflect(lightDirection, lightNormal);\n\tfloat s = max(dot(lR, viewDirection), 0.0);\n\tvec3 lightScatter = max(dot(-lightDirection, lightNormal) * 0.8 + 0.2, 0.0) * vec3(0.1, 0.9, 0.9) * scatterAmount * s;\n\n\t// Fresnel term.\n\tfloat R0 = pow((1.0 - eta) / (1.0 + eta), 2.0); \n\tfloat cosine = abs(dot(-viewDirection, waveNormal)); \n\tfloat fresnel = R0 + (1.0 - R0) * pow(1.0 - cosine, 5.0); \n\n\t// Texture edge bleed removal.\n\tvec2 distortFade = vec2(0.0);\n\tdistortFade.s = clamp(fragCoord.s * fade, 0.0, 1.0);\n\tdistortFade.s -= clamp(1.0 - (1.0 - fragCoord.s) * fade, 0.0, 1.0);\n\tdistortFade.t = clamp(fragCoord.t * fade, 0.0, 1.0);\n\tdistortFade.t -= clamp(1.0 - (1.0 - fragCoord.t) * fade, 0.0, 1.0); \n\t\n\tvec3 reflection = texture2D(reflectionMap, fragCoord + (waveNormal.st * reflectionBump * distortFade)).rgb;\n\n\tvec3 luminosity = vec3(0.30, 0.59, 0.11);\n\tfloat reflectivity = pow(dot(luminosity, reflection.rgb * 2.0), 3.0);\n\n\tvec3 R = reflect(viewDirection, waveNormal);\n\n\tfloat specular = pow(max(dot(R, lightDirection), 0.0), sunSpecular) * reflectivity * 0.25;\n\n\tvec2 rCoord = reflect(viewDirection, waveNormal).st;\n\tvec3 refraction = vec3(0.0);\n\n\trefraction.r = texture2D(refractionMap, (fragCoord - (waveNormal.st * refractionBump * distortFade)) * 1.0).r;\n\trefraction.g = texture2D(refractionMap, (fragCoord - (waveNormal.st * refractionBump * distortFade)) * 1.0 - (rCoord * chromaticAberration)).g;\n\trefraction.b = texture2D(refractionMap, (fragCoord - (waveNormal.st * refractionBump * distortFade)) * 1.0 - (rCoord * chromaticAberration * 2.0)).b;\n\n\tfloat waterDepth = 5.0;\n\tvec3 waterExt = 1.0 - vec3(0.7, 0.85, 0.88);\n\n\tvec3 absorbance = waterExt * -waterDepth;\n\tvec3 transmittance = refraction * exp(absorbance);\n\n\tvec3 color = mix(transmittance + lightScatter, reflection, clamp(fresnel, 0.0, 1.0));\n\n\tcolor += specular;\n\n\t#if defined(USE_LOGDEPTHBUF) && defined(USE_LOGDEPTHBUF_EXT)\n\n\t\tgl_FragDepthEXT = log2(vFragDepth) * logDepthBufFC * 0.5;\n\n\t#endif\n\n\t#ifdef USE_FOG\n\n\t\t#ifdef USE_LOGDEPTHBUF_EXT\n\n\t\t\tfloat depth = gl_FragDepthEXT / gl_FragCoord.w;\n\n\t\t#else\n\n\t\t\tfloat depth = gl_FragCoord.z / gl_FragCoord.w;\n\n\t\t#endif\n\n\t\t#ifdef FOG_EXP2\n\n\t\t\tfloat fogFactor = whiteCompliment(exp2(-fogDensity * fogDensity * depth * depth * LOG2));\n\n\t\t#else\n\n\t\t\tfloat fogFactor = smoothstep(fogNear, fogFar, depth);\n\n\t\t#endif\n\n\t\tcolor = mix(color, fogColor, fogFactor);\n\n\t#endif\n\n\tgl_FragColor = vec4(color, 1.0);\n\n}\n"
		},
		vertex: "#define EPSILON 1e-6\n\n#ifdef USE_LOGDEPTHBUF\n\n\tuniform float logDepthBufFC;\n\n\t#ifdef USE_LOGDEPTHBUF_EXT\n\n\t\tvarying float vFragDepth;\n\n\t#endif\n\n#endif\n\nuniform vec3 lightPosition;\nuniform vec4 offsetRepeat;\n\nvarying vec3 vLightDirection;\nvarying vec3 vViewPosition;\nvarying vec4 vFragPosition;\nvarying mat3 vTbn;\nvarying vec2 vUv;\n\nattribute vec4 tangent;\n\nvoid main() {\n\n\tvec3 transformedNormal = normalize(normalMatrix * normal);\n\tvec3 transformedTangent = normalize(normalMatrix * tangent.xyz);\n\n\tvTbn = mat3(\n\t\ttransformedTangent,\n\t\tnormalize(cross(transformedNormal, transformedTangent) * tangent.w),\n\t\ttransformedNormal\n\t);\n\n\tvUv = uv * offsetRepeat.zw + offsetRepeat.xy;\n\n\tmat3 m3 = mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz);\n\tvec3 worldPosition = m3 * position;\n\tvec4 mvPosition = modelViewMatrix * vec4(position, 1.0);\n\tvec4 lightVector = viewMatrix * vec4(lightPosition, 1.0);\n\n\tvLightDirection = normalize(lightVector.xyz - cameraPosition);\n\tvViewPosition = mvPosition.xyz;\n\tvFragPosition = projectionMatrix * mvPosition;\n\n\tgl_Position = vFragPosition;\n\n\t#ifdef USE_LOGDEPTHBUF\n\n\t\tgl_Position.z = log2(max(EPSILON, gl_Position.w + 1.0)) * logDepthBufFC;\n\n\t\t#ifdef USE_LOGDEPTHBUF_EXT\n\n\t\t\tvFragDepth = 1.0 + gl_Position.w;\n\n\t\t#else\n\n\t\t\tgl_Position.z = (gl_Position.z - 1.0) * gl_Position.w;\n\n\t\t#endif\n\n\t#endif\n\n}\n",
	};

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
	 * @param {Texture} [options.normalMap] - The normalmap to use for the waves.
	 * @param {Vector3} [options.lightPosition] - The position of the main light source.
	 * @param {Boolean} [options.lowQuality=false] - The quality of the shader.
	 */

	function WaterMaterial(options) {

		if(options === undefined) { options = {}; }

		THREE.ShaderMaterial.call(this, {

			uniforms: {

				fogDensity: {type: "f", value: 0.00025},
				fogNear: {type: "f", value: 1.0},
				fogFar: {type: "f", value: 2000.0},
				fogColor: {type: "c", value: new THREE.Color(0xffffff)},

				time: {type: "f", value: 0.0},
				waterLevel: {type: "f", value: 0.0},

				reflectionMap: {type: "t", value: null},
				refractionMap: {type: "t", value: null},
				normalMap: {type: "t", value: options.normalMap},
				offsetRepeat: {type: "v4", value: new THREE.Vector4(0.0, 0.0, 1.0, 1.0)},

				waveScale: {type: "f", value: 350.0},
				waveChoppiness: {type: "f", value: 0.01},
				bigWaves: {type: "v2", value: new THREE.Vector2(2.0, 3.0)},
				midWaves: {type: "v2", value: new THREE.Vector2(4.0, 2.0)},
				smallWaves: {type: "v2", value: new THREE.Vector2(1.0, 0.5)},

				windSpeed: {type: "f", value: 0.3},
				windDirection: {type: "v2", value: new THREE.Vector2(0.2, -0.5)},
				lightPosition: {type: "v3", value: options.lightPosition},

				waterDensity: {type: "f", value: 1.0},
				chromaticAberration: {type: "f", value: 0.002},
				waterBump: {type: "f", value: 1.0},
				reflectionBump: {type: "f", value: 0.1},
				refractionBump: {type: "f", value: 0.1},
				eta: {type: "f", value: 1.33},

				waterColor: {type: "c", value: new THREE.Color(0.2, 0.4, 0.5)},
				sunSpecular: {type: "f", value: 250.0},
				scatterAmount: {type: "f", value: 3.0},
				scatterColor: {type: "c", value: new THREE.Color(0.0, 1.0, 0.95)},

				fade: {type: "f", value: 12.0},
				luminosity: {type: "v3", value: new THREE.Vector3(0.16, 0.32, 0.11)}

			},

			fragmentShader: options.lowQuality ? shader$2.fragment.low : shader$2.fragment.high,
			vertexShader: shader$2.vertex,

			side: THREE.DoubleSide,
			fog: true

		});

	}

	WaterMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	WaterMaterial.prototype.constructor = WaterMaterial;

	var shader$3 = {
		fragment: "#ifdef USE_FOG\n\n\t#define LOG2 1.442695\n\t#define saturate(a) clamp(a, 0.0, 1.0)\n\t#define whiteCompliment(a) (1.0 - saturate(a))\n\n\tuniform vec3 fogColor;\n\n\t#ifdef FOG_EXP2\n\n\t\tuniform float fogDensity;\n\n\t#else\n\n\t\tuniform float fogNear;\n\t\tuniform float fogFar;\n\n\t#endif\n\n#endif\n\n#ifdef USE_LOGDEPTHBUF\n\n\tuniform float logDepthBufFC;\n\n\t#ifdef USE_LOGDEPTHBUF_EXT\n\n\t\tvarying float vFragDepth;\n\n\t#endif\n\n#endif\n\nuniform float time;\nuniform float timeScale;\n\nuniform float smoothness;\nuniform float fallAccel;\nuniform float spread;\nuniform float drops;\nuniform float shape;\nuniform float power;\nuniform float alpha;\nuniform float height;\nuniform float overflow;\nuniform vec2 scale;\nuniform vec2 strength;\nuniform vec3 tint;\n\nvarying vec2 vUv;\n\nconst float K1 = 0.366025404; // (sqrt(3) - 1) / 2\nconst float K2 = 0.211324865; // (3 - sqrt(3)) / 6\n\nvec2 hash(vec2 p) {\n\n\tp = vec2(\n\t\tdot(p, vec2(127.1, 311.7)),\n\t\tdot(p, vec2(269.5, 183.3))\n\t);\n\n\treturn -1.0 + 2.0 * fract(sin(p * smoothness) * 43758.5453123);\n\n}\n\nfloat noise(vec2 p) {\n\n\tvec2 i = floor(p + (p.x + p.y) * K1);\n\n\tvec2 a = p - i + (i.x + i.y) * K2;\n\tfloat z = clamp(ceil(a.x - a.y), 0.0, 1.0); // x > y = 1, else 0\n\tvec2 o = vec2(z, 1.0 - z);\n\tvec2 b = a - o + K2;\n\tvec2 c = a - 1.0 + 2.0 * K2;\n\n\tvec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);\n\n\tvec3 n = h * h * h * h * vec3(\n\t\tdot(a, hash(i)),\n\t\tdot(b, hash(i + o)),\n\t\tdot(c, hash(i + 1.0))\n\t);\n\n\treturn dot(n, vec3(70.0));\n\n}\n\nfloat fbm(vec2 uv) {\n\n\tmat2 m = mat2(1.6, 1.2, -1.2, 1.6);\n\n\tfloat f = 0.5000 * noise(uv);\n\tuv = m * uv; f += 0.2500 * noise(uv);\n\tuv = m * uv; f += 0.1250 * noise(uv);\n\tuv = m * uv; f += 0.0625 * noise(uv);\n\n\treturn spread + 0.5 * f;\n\n}\n\nvoid main() {\n\n\tvec2 q = -vec2(vUv);\n\n\tfloat t = time * timeScale;\n\n\tq.x *= scale.x;\n\tq.y *= scale.y;\n\n\tfloat T3 = max(3.0, 1.25 * strength.x) * t * 0.6 + pow(abs(q.y), fallAccel) * 2.0;\n\n\tfloat n = fbm(vec2(strength.x * q.x, strength.x * q.y) - vec2(0.0, T3));\n\n\tfloat T3B = max(3.0, 1.25 * strength.y) * t * 0.6 + pow(abs(q.y), fallAccel) * 2.0;\n\n\tn = n * 0.5 + (n * 0.5) / (0.001 + 1.5 * fbm(vec2(strength.y * q.x, strength.y * q.y) - vec2(0.0, T3B)));\n\n\tfloat intensity = abs(sin(t * overflow));\n\tn *= 1.0 + pow(intensity, 8.0) * 0.5;\n\n\tfloat c = 1.0 - (drops / abs(pow(q.y, 1.0) * 4.0 + 1.0)) * pow(max(0.0, length(q * vec2(1.8 + q.y * 1.5, 0.75)) - n * max(0.0, q.y + 0.25)), shape);\n\tfloat c1 = n * c * ((power + pow(intensity, height) * 0.9 - pow(intensity, 4.0) * 0.4) - pow(vUv.y, 2.0));\n\n\tc1 = c1 * 1.05 + sin(c1 * 3.4) * 0.4;\n\tc1 *= 0.95 - pow(q.y, 2.0);\n\tc1 = clamp(c1, 0.4, 1.0);\n\n\tfloat c4 = c1 * c1 * c1 * c1;\n\n\tvec3 color = vec3(\n\t\t(1.0 + tint.r) * c4,\n\t\t(1.0 + tint.g) * c4,\n\t\t(1.0 + tint.b) * c4 / c1\n\t);\n\n\tfloat a = c * (1.0 - pow(abs(vUv.y), alpha));\n\n\t#if defined(USE_LOGDEPTHBUF) && defined(USE_LOGDEPTHBUF_EXT)\n\n\t\tgl_FragDepthEXT = log2(vFragDepth) * logDepthBufFC * 0.5;\n\n\t#endif\n\n\t#ifdef USE_FOG\n\n\t\t#ifdef USE_LOGDEPTHBUF_EXT\n\n\t\t\tfloat depth = gl_FragDepthEXT / gl_FragCoord.w;\n\n\t\t#else\n\n\t\t\tfloat depth = gl_FragCoord.z / gl_FragCoord.w;\n\n\t\t#endif\n\n\t\t#ifdef FOG_EXP2\n\n\t\t\tfloat fogFactor = whiteCompliment(exp2(-fogDensity * fogDensity * depth * depth * LOG2));\n\n\t\t#else\n\n\t\t\tfloat fogFactor = smoothstep(fogNear, fogFar, depth);\n\n\t\t#endif\n\n\t\tcolor = mix(color, fogColor, fogFactor);\n\n\t#endif\n\n\tgl_FragColor = vec4(color, a);\n\n}\n",
		vertex: "#define EPSILON 1e-6\n\n#ifdef USE_LOGDEPTHBUF\n\n\tuniform float logDepthBufFC;\n\n\t#ifdef USE_LOGDEPTHBUF_EXT\n\n\t\tvarying float vFragDepth;\n\n\t#endif\n\n#endif\n\nuniform vec4 offsetRepeat;\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv * offsetRepeat.zw + offsetRepeat.xy;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n\t#ifdef USE_LOGDEPTHBUF\n\n\t\tgl_Position.z = log2(max(EPSILON, gl_Position.w + 1.0)) * logDepthBufFC;\n\n\t\t#ifdef USE_LOGDEPTHBUF_EXT\n\n\t\t\tvFragDepth = 1.0 + gl_Position.w;\n\n\t\t#else\n\n\t\t\tgl_Position.z = (gl_Position.z - 1.0) * gl_Position.w;\n\n\t\t#endif\n\n\t#endif\n\n}\n",
	};

	/**
	 * A mod of xbe's "fires" that creates a fast, smooth falling water effect.
	 *
	 * Original shader code by: https://www.shadertoy.com/user/bbcollinsworth
	 *
	 * @class WaterfallMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 * @param {Object} [options] - The options.
	 * @param {Number} [options.drops=16] - The sharpness of the water drops. The higher, the sharper.
	 */

	function WaterfallMaterial(options) {

		if(options === undefined) { options = {}; }

		THREE.ShaderMaterial.call(this, {

			uniforms: {

				fogDensity: {type: "f", value: 0.00025},
				fogNear: {type: "f", value: 1},
				fogFar: {type: "f", value: 2000},
				fogColor: {type: "c", value: new THREE.Color(0xffffff)},

				time: {type: "f", value: 0.0},
				timeScale: {type: "f", value: (options.timeScale !== undefined) ? options.timeScale : 1.0},

				smoothness: {type: "f", value: (options.smoothness !== undefined) ? options.smoothness : 0.0001},
				fallAccel: {type: "f", value: (options.fallAccel !== undefined) ? options.fallAccel : 1.25},
				spread: {type: "f", value: (options.spread !== undefined) ? options.spread : 0.6},
				drops: {type: "f", value: (options.drops !== undefined) ? options.drops : 16.0},
				shape: {type: "f", value: (options.shape !== undefined) ? options.shape : 1.2},
				power: {type: "f", value: (options.power !== undefined) ? options.power : 0.7},
				alpha: {type: "f", value: (options.alpha !== undefined) ? options.alpha : 10.0},
				height: {type: "f", value: (options.height !== undefined) ? options.height : 0.8},
				overflow: {type: "f", value: (options.overflow !== undefined) ? options.overflow : 0.2},
				scale: {type: "v2", value: (options.scale !== undefined) ? options.scale : new THREE.Vector2(1.0, 1.0)},
				strength: {type: "v2", value: (options.strength !== undefined) ? options.strength : new THREE.Vector2(6.0, 26.0)},
				tint: {type: "c", value: (options.tint !== undefined) ? options.tint : new THREE.Color(0.25, 0.5, 0.5)},

				offsetRepeat: {type: "v4", value: new THREE.Vector4(-0.5, -0.75, 1.0, 1.0)}

			},

			fragmentShader: shader$3.fragment,
			vertexShader: shader$3.vertex,

			side: THREE.DoubleSide,
			transparent: true,
			fog: true

		});

	}

	WaterfallMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	WaterfallMaterial.prototype.constructor = WaterfallMaterial;

	var shader = {
		fragment: "#ifdef USE_FOG\n\n\t#define LOG2 1.442695\n\t#define saturate(a) clamp(a, 0.0, 1.0)\n\t#define whiteCompliment(a) (1.0 - saturate(a))\n\n\tuniform vec3 fogColor;\n\n\t#ifdef FOG_EXP2\n\n\t\tuniform float fogDensity;\n\n\t#else\n\n\t\tuniform float fogNear;\n\t\tuniform float fogFar;\n\n\t#endif\n\n#endif\n\n#ifdef USE_LOGDEPTHBUF\n\n\tuniform float logDepthBufFC;\n\n\t#ifdef USE_LOGDEPTHBUF_EXT\n\n\t\tvarying float vFragDepth;\n\n\t#endif\n\n#endif\n\nuniform float time;\nuniform float timeScale;\n\nuniform float primarySpeed;\nuniform float secondarySpeed;\nuniform float displacement;\nuniform float advection;\nuniform float intensity;\n\nuniform vec2 octaveScale;\nuniform vec3 lavaColor;\nuniform sampler2D noiseMap;\n\n//varying float vViewTheta;\nvarying vec2 vUv;\n\nfloat hash21(vec2 n) {\n\n\treturn fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\n\n}\n\nmat2 makem2(float theta) {\n\n\tfloat c = cos(theta);\n\tfloat s = sin(theta);\n\n\t//float a = mix(c, s, vViewTheta);\n\t//float b = mix(s, c, vViewTheta);\n\n\treturn mat2(c, -s, s, c);\n\t//return mat2(a, -b, b, a);\n\n}\n\nfloat noise(vec2 x) {\n\n\treturn texture2D(noiseMap, x * 0.01).x;\n\n}\n\nvec2 gradn(vec2 p) {\n\n\tfloat ep = 0.09;\n\tfloat gradx = noise(vec2(p.x + ep, p.y)) - noise(vec2(p.x - ep, p.y));\n\tfloat grady = noise(vec2(p.x, p.y + ep)) - noise(vec2(p.x, p.y - ep));\n\n\treturn vec2(gradx, grady);\n\n}\n\nfloat flow(vec2 p) {\n\n\tfloat t = time * timeScale;\n\tfloat z = 2.0;\n\tfloat rz = 0.0;\n\tvec2 bp = p;\n\n\tfor(float i = 1.0; i < 7.0; ++i) {\n\n\t\tp += t * primarySpeed;\n\t\tbp += t * secondarySpeed;\n\n\t\t// Displacement field.\n\t\tvec2 gr = gradn(i * p * 0.34 + t * displacement);\n\n\t\t// Rotation of the displacement field.\n\t\tgr *= makem2(t * 6.0 - (0.05 * p.x + 0.03 * p.y) * 40.0);\n\n\t\t// Displace the system.\n\t\tp += gr * 0.5;\n\n\t\t// Add noise octave.\n\t\trz += (sin(noise(p) * 7.0) * 0.5 + 0.5) / z;\n\n\t\t// Blend.\n\t\tp = mix(bp, p, advection);\n\n\t\t// Intensity scaling.\n\t\tz *= intensity;\n\n\t\t// Octave scaling.\n\t\tp *= octaveScale.x;\n\t\tbp *= octaveScale.y;\n\n\t}\n\n\treturn rz;\n\n}\n\nvoid main() {\n\n\tfloat rz = flow(vUv);\n\t\n\tvec3 color = lavaColor / rz;\n\tcolor = pow(abs(color), vec3(1.4));\n\n\t#if defined(USE_LOGDEPTHBUF) && defined(USE_LOGDEPTHBUF_EXT)\n\n\t\tgl_FragDepthEXT = log2(vFragDepth) * logDepthBufFC * 0.5;\n\n\t#endif\n\n\t#ifdef USE_FOG\n\n\t\t#ifdef USE_LOGDEPTHBUF_EXT\n\n\t\t\tfloat depth = gl_FragDepthEXT / gl_FragCoord.w;\n\n\t\t#else\n\n\t\t\tfloat depth = gl_FragCoord.z / gl_FragCoord.w;\n\n\t\t#endif\n\n\t\t#ifdef FOG_EXP2\n\n\t\t\tfloat fogFactor = whiteCompliment(exp2(-fogDensity * fogDensity * depth * depth * LOG2));\n\n\t\t#else\n\n\t\t\tfloat fogFactor = smoothstep(fogNear, fogFar, depth);\n\n\t\t#endif\n\n\t\tcolor = mix(color, fogColor, fogFactor);\n\n\t#endif\n\n\tgl_FragColor = vec4(color, 1.0);\n\n}\n",
		vertex: "#define EPSILON 1e-6\n\n#ifdef USE_LOGDEPTHBUF\n\n\tuniform float logDepthBufFC;\n\n\t#ifdef USE_LOGDEPTHBUF_EXT\n\n\t\tvarying float vFragDepth;\n\n\t#endif\n\n#endif\n\nuniform vec4 offsetRepeat;\n\n//varying float vViewTheta;\nvarying vec2 vUv;\n\n//const vec2 Z = vec2(0.0, 1.0);\n\nvoid main() {\n\n\tvec4 mvPosition = modelViewMatrix * vec4(position, 1.0);\n\t//vViewTheta = clamp((normalize(cameraPosition - position).z + 1.0) * 0.5, 0.0, 1.0);\n\tvUv = uv * offsetRepeat.zw + offsetRepeat.xy;\n\tgl_Position = projectionMatrix * mvPosition;\n\n\t#ifdef USE_LOGDEPTHBUF\n\n\t\tgl_Position.z = log2(max(EPSILON, gl_Position.w + 1.0)) * logDepthBufFC;\n\n\t\t#ifdef USE_LOGDEPTHBUF_EXT\n\n\t\t\tvFragDepth = 1.0 + gl_Position.w;\n\n\t\t#else\n\n\t\t\tgl_Position.z = (gl_Position.z - 1.0) * gl_Position.w;\n\n\t\t#endif\n\n\t#endif\n\n}\n",
	};

	/**
	 * A noise-based flowing lava material.
	 *
	 * Original shader code by: https://www.shadertoy.com/user/nimitz 
	 *
	 * @class LavaMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 * @param {Texture} noiseMap - A simple noise map.
	 * @param {Object} [options] - The options.
	 * @param {Number} [options.timeScale=0.1] - The time scale.
	 * @param {Number} [options.primarySpeed=0.6] - The primary flow speed.
	 * @param {Number} [options.secondarySpeed=1.9] - The secondary flow speed (speed of the perceived flow).
	 * @param {Number} [options.displacement=1.0] - A time multiplier for the displacement field.
	 * @param {Number} [options.advection=0.77] - Blend factor (blending displaced system with base system). 0.5 ~ low, 0.95 ~ high.
	 * @param {Number} [options.intensity=1.4] - Overall intensity.
	 * @param {Vector2} [options.octaveScale=(2.0, 1.9)] - Used to scale the noise octave.
	 */

	function LavaMaterial(noiseMap, options) {

		if(options === undefined) { options = {}; }

		THREE.ShaderMaterial.call(this, {

			uniforms: {

				fogDensity: {type: "f", value: 0.00025},
				fogNear: {type: "f", value: 1.0},
				fogFar: {type: "f", value: 2000.0},
				fogColor: {type: "c", value: new THREE.Color(0xffffff)},

				time: {type: "f", value: 0.0},
				timeScale: {type: "f", value: (options.timeScale !== undefined) ? options.timeScale : 0.1},

				primarySpeed: {type: "f", value: (options.primarySpeed !== undefined) ? options.primarySpeed : 0.6},
				secondarySpeed: {type: "f", value: (options.secondarySpeed !== undefined) ? options.secondarySpeed : 1.9},
				displacement: {type: "f", value: (options.displacement !== undefined) ? options.displacement : 1.0},
				advection: {type: "f", value: (options.advection !== undefined) ? options.advection : 0.77},
				intensity: {type: "f", value: (options.intensity !== undefined) ? options.intensity : 1.4},
				octaveScale: {type: "v2", value: (options.octaveScale !== undefined) ? options.octaveScale : new THREE.Vector2(2.0, 1.9)},
				lavaColor: {type: "c", value: (options.color !== undefined) ? options.color : new THREE.Color(0.2, 0.07, 0.01)},

				noiseMap: {type: "t", value: noiseMap},
				offsetRepeat: {type: "v4", value: new THREE.Vector4(0.0, 0.0, 3.0, 3.0)}

			},

			fragmentShader: shader.fragment,
			vertexShader: shader.vertex,

			fog: true

		});

	}

	LavaMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	LavaMaterial.prototype.constructor = LavaMaterial;

	var shader$4 = {
		fragment: "uniform sampler2D tPerturb;\r\nuniform sampler2D tDiffuse;\r\n\r\nuniform float time;\r\nuniform float resetTimer;\r\n\r\nuniform vec2 rollOffSpeed;\r\nuniform vec2 waveStrength;\r\nuniform vec3 tint;\r\n\r\nvarying vec2 vUv;\r\n\r\nconst float fade = 12.0;\r\n\r\n/*vec2 coordRot(vec2 tc, float angle) {\r\n\r\n\tfloat rotX = ((tc.x * 2.0 - 1.0) * (tWidth / tHeight) * cos(angle)) - ((tc.y * 2.0 - 1.0) * sin(angle));\r\n\tfloat rotY = ((tc.y * 2.0 - 1.0) * cos(angle)) + ((tc.x * 2.0 - 1.0) * (tWidth / tHeight) * sin(angle));\r\n\trotX = ((rotX / (tWidth / tHeight)) * 0.5 + 0.5);\r\n\trotY = rotY * 0.5 + 0.5;\r\n\r\n\treturn vec2(rotX, rotY);\r\n\r\n}*/\r\n\r\nvoid main() {\r\n\r\n\tfloat n = 0.0;\r\n\tfloat drop = 0.0;\r\n\r\n\tfloat resetTimerFaster = resetTimer * rollOffSpeed.x;\r\n\tfloat resetTimerSlow = resetTimer * rollOffSpeed.y;\r\n\r\n\t//n *= clamp(ceil(resetTimer / T_DISSOLVE), 0.0, 1.0);\r\n\t//drop *= clamp(ceil(resetTimer / T_DROPLETS), 0.0, 1.0);\r\n\t// Translate noise values to [0.0, 1.0].\r\n\t//n = n * 0.5 + 0.5;\r\n\t//drop = drop * 0.5 + 0.5;\r\n\r\n\tvec2 perturbSample;\r\n\r\n\tif(resetTimer > 0.0) {\r\n\r\n\t\tperturbSample = texture2D(tPerturb, vUv).rg;\r\n\r\n\t\tif(resetTimer < T_DISSOLVE) {\r\n\r\n\t\t\tn = perturbSample.r;\r\n\r\n\t\t}\r\n\r\n\t\tif(resetTimer < T_DROPLETS) {\r\n\r\n\t\t\tdrop = perturbSample.g;\r\n\r\n\t\t}\r\n\r\n\t}\r\n\r\n\tfloat drops = clamp(smoothstep(resetTimerFaster, 0.5 + resetTimerFaster, n), 0.0, 1.0);\r\n\tfloat droplet = clamp(smoothstep(0.75 + resetTimerSlow, 1.0 + resetTimerSlow, drop), 0.0, 1.0);\r\n\r\n\tdroplet = pow(clamp(droplet + drops, 0.0, 1.0), 0.1) * 3.0;\r\n\r\n\tvec2 droplets = vec2(dFdx(vUv + droplet).r, dFdy(vUv + droplet).g);\t\t\r\n\r\n\tvec2 wave = vec2(0.0);\r\n\r\n\tvec2 waveCoordR;\r\n\tvec2 waveCoordG;\r\n\tvec2 waveCoordB;\r\n\tvec2 dropCoordR;\r\n\tvec2 dropCoordG;\t\r\n\tvec2 dropCoordB;\r\n\r\n\tif(resetTimer < 1.0) {\r\n\r\n\t\twave.x = sin((vUv.x - vUv.y * 2.0) - time * 1.5) * waveStrength.x;\r\n\t\twave.x += cos((vUv.y * 4.0 - vUv.x * 6.0) + time * 4.2) * waveStrength.y;\r\n\t\twave.x += sin((vUv.x * 9.0 + vUv.y * 8.0) + time * 3.5) * waveStrength.x;\r\n\r\n\t\twave.y = sin((vUv.x * 2.0 + vUv.x * 2.5) + time * 2.5) * waveStrength.x;\r\n\t\twave.y += cos((vUv.y * 3.0 + vUv.x * 6.0) - time * 2.5) * waveStrength.y;\r\n\t\twave.y += sin((vUv.x * 11.0 - vUv.y * 12.0) + time * 4.5) * waveStrength.x;\r\n\r\n\t}\r\n\r\n\t//wave *= clamp(ceil(1.0 - resetTimer), 0.0, 1.0);\r\n\r\n\t// Texture edge bleed removal.\r\n\tvec2 distortFade = vec2(0.0);\r\n\tdistortFade.s = clamp(vUv.s * fade, 0.0, 1.0);\r\n\tdistortFade.s -= clamp(1.0 - (1.0 - vUv.s) * fade, 0.0, 1.0);\r\n\tdistortFade.t = clamp(vUv.t * fade, 0.0, 1.0);\r\n\tdistortFade.t -= clamp(1.0 - (1.0 - vUv.t) * fade, 0.0, 1.0); \r\n\r\n\t//vec2 rotCoordsR = coordRot(vUv, angle?);\r\n\r\n\tfloat dfade = 1.0 - pow(1.0 - distortFade.s * distortFade.t, 2.0);\r\n\twave = wave * dfade;\r\n\tdroplets = droplets * dfade;\r\n\r\n\twaveCoordR = vUv - wave * 0.004;\r\n\twaveCoordG = vUv - wave * 0.006;\t\r\n\twaveCoordB = vUv - wave * 0.008;\r\n\r\n\tdropCoordR = vUv - droplets * 1.1;\r\n\tdropCoordG = vUv - droplets * 1.2;\t\r\n\tdropCoordB = vUv - droplets * 1.3;\t\r\n\r\n\tvec3 dropletColor = vec3(0.0);\t\r\n\tdropletColor.r = texture2D(tDiffuse, dropCoordR).r;\r\n\tdropletColor.g = texture2D(tDiffuse, dropCoordG).g;\r\n\tdropletColor.b = texture2D(tDiffuse, dropCoordB).b;\r\n\r\n\tvec3 waveColor = vec3(0.0);\r\n\twaveColor.r = texture2D(tDiffuse, waveCoordR).r;\r\n\twaveColor.g = texture2D(tDiffuse, waveCoordG).g;\r\n\twaveColor.b = texture2D(tDiffuse, waveCoordB).b;\r\n\r\n\tfloat dropFade = clamp(resetTimer * 10.0, 0.0, 1.0);\r\n\tfloat dropletMask = smoothstep(0.77 + resetTimerSlow, 0.79 + resetTimerSlow, drop);\r\n\tfloat mask = smoothstep(0.02 + resetTimerFaster, 0.03 + resetTimerFaster, n);\r\n\r\n\tvec4 c = texture2D(tDiffuse, vUv);\r\n\r\n\tvec3 color = mix(waveColor, c.rgb, dropFade);\r\n\tcolor = mix(color, dropletColor * tint, clamp(dropletMask + mask, 0.0, 1.0) * dropFade);\r\n\r\n\tgl_FragColor = vec4(color, c.a);\r\n\r\n}\r\n",
		vertex: "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n",
	};

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

	function DistortionMaterial(options) {

		if(options === undefined) { options = {}; }

		var map = options.perturbMap;
		var speed = options.rollOffSpeed;
		var sinCos = options.waveStrength;
		var color = options.color;

		THREE.ShaderMaterial.call(this, {

			defines: {

				T_DISSOLVE: "4.0",
				T_DROPLETS: "60.0"

			},

			uniforms: {

				tPerturb: {type: "t", value: (map !== undefined) ? map : null},
				tDiffuse: {type: "t", value: null},

				time: {type: "f", value: Math.random() * 1000.0},
				resetTimer: {type: "f", value: 0.0},

				rollOffSpeed: {type: "v2", value: (speed !== undefined) ? speed : new THREE.Vector2(0.5, 0.02)},
				waveStrength: {type: "v2", value: (sinCos !== undefined) ? sinCos : new THREE.Vector2(0.25, 0.5)},
				tint: {type: "c", value: (color !== undefined) ? color : new THREE.Color(1.0, 1.0, 1.0)},

			},

			fragmentShader: shader$4.fragment,
			vertexShader: shader$4.vertex,

			extensions: {
				derivatives: true
			}

		});

	}

	DistortionMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	DistortionMaterial.prototype.constructor = DistortionMaterial;

	var shader$1 = {
		fragment: "uniform float tWidth;\r\nuniform float tHeight;\r\n\r\nuniform float time;\r\nuniform float randomTime;\r\n\r\nvarying vec2 vUv;\r\n\r\nconst float permTexUnit = 1.0 / 256.0;\r\nconst float permTexUnitHalf = 0.5 / 256.0;\r\n\r\nvec3 randRGB(vec2 tc) {\r\n\r\n\tfloat noise = sin(dot(tc, vec2(12.9898, 78.233))) * 43758.5453;\r\n\r\n\treturn vec3(\r\n\t\tfract(noise) * 2.0 - 1.0,\r\n\t\tfract(noise * 1.2154) * 2.0 - 1.0,\r\n\t\tfract(noise * 1.3453) * 2.0 - 1.0\r\n\t);\r\n\r\n}\r\n\r\nfloat randA(vec2 tc) {\r\n\r\n\treturn fract(sin(dot(tc, vec2(12.9898, 78.233))) * 43758.5453 * 1.3647) * 2.0 - 1.0;\r\n\r\n}\r\n\r\nfloat fade(float t) {\r\n\r\n\treturn t * t * t * (t * (t * 6.0 - 15.0) + 10.0);\r\n\r\n}\r\n\r\nfloat perlinNoise(vec3 p) {\r\n\r\n\t// Integer part, scaled so +1 moves permTexUnit texel.\r\n\t// Add 1/2 texel to sample texel centers.\r\n\tvec3 pi = permTexUnit * floor(p) + permTexUnitHalf;\r\n\r\n\t// Fractional part for interpolation.\r\n\tvec3 pf = fract(p);\r\n\r\n\t// Noise contributions from (x=0, y=0), z=0 and z=1.\r\n\tfloat perm00 = randA(pi.xy);\r\n\tvec3  grad000 = randRGB(vec2(perm00, pi.z)) * 4.0 - 1.0;\r\n\tfloat n000 = dot(grad000, pf);\r\n\tvec3  grad001 = randRGB(vec2(perm00, pi.z + permTexUnit)) * 4.0 - 1.0;\r\n\tfloat n001 = dot(grad001, pf - vec3(0.0, 0.0, 1.0));\r\n\r\n\t// Noise contributions from (x=0, y=1), z=0 and z=1.\r\n\tfloat perm01 = randA(pi.xy + vec2(0.0, permTexUnit));\r\n\tvec3  grad010 = randRGB(vec2(perm01, pi.z)) * 4.0 - 1.0;\r\n\tfloat n010 = dot(grad010, pf - vec3(0.0, 1.0, 0.0));\r\n\tvec3  grad011 = randRGB(vec2(perm01, pi.z + permTexUnit)) * 4.0 - 1.0;\r\n\tfloat n011 = dot(grad011, pf - vec3(0.0, 1.0, 1.0));\r\n\r\n\t// Noise contributions from (x=1, y=0), z=0 and z=1.\r\n\tfloat perm10 = randA(pi.xy + vec2(permTexUnit, 0.0));\r\n\tvec3  grad100 = randRGB(vec2(perm10, pi.z)) * 4.0 - 1.0;\r\n\tfloat n100 = dot(grad100, pf - vec3(1.0, 0.0, 0.0));\r\n\tvec3  grad101 = randRGB(vec2(perm10, pi.z + permTexUnit)) * 4.0 - 1.0;\r\n\tfloat n101 = dot(grad101, pf - vec3(1.0, 0.0, 1.0));\r\n\r\n\t// Noise contributions from (x=1, y=1), z=0 and z=1.\r\n\tfloat perm11 = randA(pi.xy + vec2(permTexUnit));\r\n\tvec3  grad110 = randRGB(vec2(perm11, pi.z)) * 4.0 - 1.0;\r\n\tfloat n110 = dot(grad110, pf - vec3(1.0, 1.0, 0.0));\r\n\tvec3  grad111 = randRGB(vec2(perm11, pi.z + permTexUnit)) * 4.0 - 1.0;\r\n\tfloat n111 = dot(grad111, pf - vec3(1.0, 1.0, 1.0));\r\n\r\n\t// Blend contributions along x.\r\n\tvec4 nX = mix(vec4(n000, n001, n010, n011), vec4(n100, n101, n110, n111), fade(pf.x));\r\n\r\n\t// Blend contributions along y.\r\n\tvec2 nXY = mix(nX.xy, nX.zw, fade(pf.y));\r\n\r\n\t// Blend contributions along z and return the final noise value.\r\n\treturn mix(nXY.x, nXY.y, fade(pf.z));\r\n\r\n}\r\n\r\nvoid main() {\r\n\r\n\tfloat r = 0.0;\r\n\tfloat g = 0.0;\r\n\r\n\tr += perlinNoise(vec3(vUv * vec2(tWidth / 90.0, tHeight / 200.0) + vec2(0.0, time * 0.6), 1.0 + time * 0.2)) * 0.25;\r\n\tr += perlinNoise(vec3(vUv * vec2(tWidth / 1200.0, tHeight / 1800.0) + vec2(0.0, time * 0.5), 3.0 + time * 0.3)) * 0.75;\r\n\r\n\tg += perlinNoise(vec3(vUv * vec2(tWidth / 40.0, tHeight / 60.0), randomTime / 8.0 + time * 0.02)) * 0.2;\r\n\tg += perlinNoise(vec3(vUv * vec2(tWidth / 80.0, tHeight / 200.0), randomTime * 2.1 + time * 0.03)) * 0.25;\r\n\r\n\t#ifdef HIGH_QUALITY\r\n\r\n\t\tr += perlinNoise(vec3(vUv * vec2(tWidth / 50.0, tHeight / 80.0) + vec2(0.0, time * 0.8), time * 0.2)) * 0.1;\r\n\t\tr += perlinNoise(vec3(vUv * vec2(tWidth / 200.0, tHeight / 400.0) + vec2(0.0, time * 0.4), 2.0 + time * 0.4)) * 0.25;\r\n\r\n\t\tg += perlinNoise(vec3(vUv * vec2(tWidth / 200.0, tHeight / 400.0), randomTime * 0.23 + time * 0.04)) * 0.2;\r\n\t\tg += perlinNoise(vec3(vUv * vec2(tWidth / 800.0, tHeight / 1800.0), randomTime * 1.64 + time * 0.05)) * 0.1;\r\n\r\n\t#endif\r\n\r\n\tr = r * 0.5 + 0.5;\r\n\tg = g * 0.5 + 0.5;\r\n\r\n\tgl_FragColor = vec4(r, g, 0.0, 1.0);\r\n\r\n}\r\n",
		vertex: "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n",
	};

	/**
	 * A noise shader material.
	 *
	 * Shader code adopted from Martins Upitis' water/underwater blend:
	 * http://devlog-martinsh.blogspot.de/2013/09/waterunderwater-sky-shader-update-02.html
	 *
	 * @class NoiseMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 * @param {Boolean} highQuality - Generates double the amount of noise values. Stresses the GPU immensely.
	 */

	function NoiseMaterial(highQuality) {

		THREE.ShaderMaterial.call(this, {

			uniforms: {

				tWidth: {type: "f", value: 0},
				tHeight: {type: "f", value: 0},

				time: {type: "f", value: 0.0},
				randomTime: {type: "f", value: Math.random() * 10.0 - 1.0}

			},

			fragmentShader: shader$1.fragment,
			vertexShader: shader$1.vertex

		});

		if(highQuality) { this.defines.HIGH_QUALITY = "1"; }

	}

	NoiseMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	NoiseMaterial.prototype.constructor = NoiseMaterial;

	var shader$5 = {
		fragment: "uniform sampler2D tDiffuse;\nuniform float opacity;\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvec4 texel = texture2D(tDiffuse, vUv);\n\tgl_FragColor = opacity * texel;\n\n}\n",
		vertex: "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n",
	};

	/**
	 * A simple copy shader material.
	 *
	 * @class CopyMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 */

	function CopyMaterial() {

		THREE.ShaderMaterial.call(this, {

			uniforms: {

				tDiffuse: {type: "t", value: null},
				opacity: {type: "f", value: 1.0}

			},

			fragmentShader: shader$5.fragment,
			vertexShader: shader$5.vertex,

		});

	}

	CopyMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	CopyMaterial.prototype.constructor = CopyMaterial;

	var shader$8 = {
		fragment: "uniform sampler2D texture1;\nuniform sampler2D texture2;\n\nuniform float opacity1;\nuniform float opacity2;\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvec4 texel1 = texture2D(texture1, vUv);\n\tvec4 texel2 = texture2D(texture2, vUv);\n\n\t#ifdef INVERT_TEX1\n\n\t\ttexel1.rgb = vec3(1.0) - texel1.rgb;\n\n\t#endif\n\n\t#ifdef INVERT_TEX2\n\n\t\ttexel2.rgb = vec3(1.0) - texel2.rgb;\n\n\t#endif\n\n\tgl_FragColor = opacity1 * texel1 + opacity2 * texel2;\n\n}\n",
		vertex: "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n"
	};

	/**
	 * A material for combining two textures.
	 *
	 * @class CombineMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 * @param {Boolean} [invertTexture1=false] - Invert the first texture's rgb values.
	 * @param {Boolean} [invertTexture2=false] - Invert the second texture's rgb values.
	 */

	function CombineMaterial(invertTexture1, invertTexture2) {

		THREE.ShaderMaterial.call(this, {

			uniforms: {

				texture1: {type: "t", value: null},
				texture2: {type: "t", value: null},

				opacity1: {type: "f", value: 1.0},
				opacity2: {type: "f", value: 1.0}

			},

			fragmentShader: shader$8.fragment,
			vertexShader: shader$8.vertex

		});

		if(invertTexture1) { this.defines.INVERT_TEX1 = "1"; }
		if(invertTexture2) { this.defines.INVERT_TEX2 = "1"; }

	}

	CombineMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	CombineMaterial.prototype.constructor = CombineMaterial;

	var shader$12 = {
		fragment: "uniform sampler2D tDiffuse;\nuniform vec2 uImageIncrement;\nuniform float cKernel[KERNEL_SIZE_INT];\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvec2 coord = vUv;\n\tvec4 sum = vec4(0.0, 0.0, 0.0, 0.0);\n\n\tfor(int i = 0; i < KERNEL_SIZE_INT; ++i) {\n\n\t\tsum += texture2D(tDiffuse, coord) * cKernel[i];\n\t\tcoord += uImageIncrement;\n\n\t}\n\n\tgl_FragColor = sum;\n\n}\n",
		vertex: "uniform vec2 uImageIncrement;\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv - ((KERNEL_SIZE_FLOAT - 1.0) / 2.0) * uImageIncrement;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n",
	};

	/**
	 * Gauss kernel.
	 *
	 * Dropped [ sqrt(2 * pi) * sigma ] term (unnecessary when normalizing).
	 *
	 * @method gauss
	 * @param {Number} x - X.
	 * @param {Number} sigma - Sigma.
	 * @private
	 * @static
	 */

	function gauss(x, sigma) { return Math.exp(-(x * x) / (2.0 * sigma * sigma)); }

	/**
	 * A convolution shader material.
	 *
	 * @class ConvolutionMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 */

	function ConvolutionMaterial() {

		THREE.ShaderMaterial.call(this, {

			defines: {

				KERNEL_SIZE_FLOAT: "25.0",
				KERNEL_SIZE_INT: "25"

			},

			uniforms: {

				tDiffuse: {type: "t", value: null},
				uImageIncrement: {type: "v2", value: new THREE.Vector2(0.001953125, 0.0)},
				cKernel: {type: "fv1", value: []}

			},

			fragmentShader: shader$12.fragment,
			vertexShader: shader$12.vertex,

		});

	}

	ConvolutionMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	ConvolutionMaterial.prototype.constructor = ConvolutionMaterial;

	/**
	 * Creates a new kernel for this material.
	 *
	 * @param {Number} sigma - Sigma value.
	 * @private
	 */

	ConvolutionMaterial.prototype.buildKernel = function(sigma) {

		var i, values, sum, halfWidth;
		var kMaxKernelSize = 25;
		var kernelSize = 2 * Math.ceil(sigma * 3.0) + 1;

		if(kernelSize > kMaxKernelSize) { kernelSize = kMaxKernelSize; }

		halfWidth = (kernelSize - 1) * 0.5;
		values = this.uniforms.cKernel.value;
		values.length = 0;
		sum = 0.0;

		for(i = 0; i < kernelSize; ++i) {

			values[i] = gauss(i - halfWidth, sigma);
			sum += values[i];

		}

		// Normalize the kernel.
		for(i = 0; i < kernelSize; ++i) { values[i] /= sum; }

	};

	var shader$15 = {
		fragment: "uniform sampler2D tDiffuse;\nuniform float stepSize;\nuniform float decay;\nuniform float weight;\nuniform float exposure;\nuniform vec3 lightPosition;\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvec2 texCoord = vUv;\n\n\t// Calculate vector from pixel to light source in screen space.\n\tvec2 deltaTexCoord = texCoord - lightPosition.st;\n\tfloat distance = length(deltaTexCoord);\n\n\t// Step vector (uv space).\n\tvec2 step = stepSize * deltaTexCoord / distance;\n\n\t// Number of iterations between pixel and sun.\n\tint iterations = int(distance / stepSize);\n\n\t// Set up illumination decay factor.\n\tfloat illuminationDecay = 1.0;\n\n\t// Sample color.\n\tvec4 sample;\n\n\t// Color accumulator.\n\tvec4 color = vec4(0.0);\n\n\t// Estimate the probability of occlusion at each pixel by summing samples along a ray to the light source.\n\tfor(int i = 0; i < NUM_SAMPLES_INT; ++i) {\n\n\t\t// Don't do more than necessary.\n\t\tif(i <= iterations && texCoord.y < 1.0) {\n\n\t\t\tsample = texture2D(tDiffuse, texCoord);\n\n\t\t\t// Apply sample attenuation scale/decay factors.\n\t\t\tsample *= illuminationDecay * weight;\n\n\t\t\tcolor += sample;\n\n\t\t\t// Update exponential decay factor.\n\t\t\tilluminationDecay *= decay;\n\n\t\t}\n\n\t\ttexCoord -= step;\n\n\t}\n\n\t// Output final color with a further scale control factor.\n\tgl_FragColor = (color / NUM_SAMPLES_FLOAT) * exposure;\n\n}\n",
		vertex: "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n"
	};

	/**
	 * A crepuscular rays shader material.
	 *
	 * References:
	 *
	 * Nvidia, GPU Gems 3 - Chapter 13:
	 *  Volumetric Light Scattering as a Post-Process
	 *  http://http.developer.nvidia.com/GPUGems3/gpugems3_ch13.html
	 *
	 * Crytek, Sousa - GDC2008:
	 *  Crysis Next Gen Effects
	 *  http://www.crytek.com/sites/default/files/GDC08_SousaT_CrysisEffects.ppt
	 *
	 * @class GodRaysMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 */

	function GodRaysMaterial() {

		THREE.ShaderMaterial.call(this, {

			defines: {

				NUM_SAMPLES_FLOAT: "6.0",
				NUM_SAMPLES_INT: "6"

			},

			uniforms: {

				tDiffuse: {type: "t", value: null},
				stepSize: {type: "f", value: 1.5},
				decay: {type: "f", value: 1.0},
				weight: {type: "f", value: 1.0},
				exposure: {type: "f", value: 1.0},
				lightPosition: {type: "v3", value: null}

			},

			fragmentShader: shader$15.fragment,
			vertexShader: shader$15.vertex

		});

	}

	GodRaysMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	GodRaysMaterial.prototype.constructor = GodRaysMaterial;

	/**
	 * An abstract pass.
	 *
	 * This class implements a dispose method that frees memory on demand.
	 * The EffectComposer calls this method when it is being destroyed.
	 *
	 * For this mechanism to work properly, please assign your render targets, 
	 * materials or textures directly to your pass!
	 *
	 * You can prevent your disposable objects from being deleted by keeping 
	 * them inside deeper structures such as arrays or objects.
	 *
	 * @class Pass
	 * @constructor
	 * @param {Scene} [scene] - The scene to render.
	 * @param {Camera} [camera] - The camera will be added to the given scene if it has no parent.
	 * @param {Mesh} [quad] - A quad that fills the screen. Used for rendering the effect.
	 */

	function Pass(scene, camera, quad) {

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

		/**
		 * Render target swap flag.
		 *
		 * When set to true, the read and write buffers will be swapped 
		 * after this pass is done with rendering so that any following  
		 * pass can find the rendered result in the read buffer.
		 * Swapping is not necessary if, for example, a pass additively 
		 * renders into the read buffer.
		 *
		 * @property needsSwap
		 * @type Boolean
		 * @default false
		 */

		this.needsSwap = false;

		// Finally, add the camera and the quad to the scene.
		if(this.scene !== null) {

			if(this.camera !== null && this.camera.parent === null) { this.scene.add(this.camera); }
			if(this.quad !== null) { this.scene.add(this.quad);	}

		}

	}

	/**
	 * Renders the scene.
	 *
	 * This is an abstract method that must be overriden.
	 *
	 * @method render
	 * @throws {Error} An error is thrown if the method is not overridden.
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {Number} delta - The render delta time.
	 */

	Pass.prototype.render = function(renderer, writeBuffer, readBuffer, delta) {

		throw new Error("Render method not implemented!");

	};

	/**
	 * Updates this pass with the main render target's size.
	 *
	 * This is an abstract method that may be overriden in case 
	 * you want to be informed about the main render size.
	 *
	 * The effect composer calls this method when the pass is added 
	 * and when the effect composer is reset.
	 *
	 * @method setSize
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 * @example
	 *  this.myRenderTarget.width = width / 2;
	 */

	Pass.prototype.setSize = function(width, height) {};

	/**
	 * Performs a shallow search for properties that define a dispose
	 * method and deletes them. The pass will be inoperative after 
	 * this method was called!
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

	Pass.prototype.dispose = function() {

		var i, p;
		var keys = Object.keys(this);

		for(i = keys.length - 1; i >= 0; --i) {

			p = this[keys[i]];

			if(p !== null && typeof p.dispose === "function") {

				p.dispose();
				this[keys[i]] = null;

			}

		}

	};

	/**
	 * Used for saving the original clear color during rendering.
	 *
	 * @property clearColor
	 * @type Color
	 * @private
	 * @static
	 */

	var clearColor = new THREE.Color();

	// A constant blur spread factor.
	var BLUR = 0.001953125;

	/**
	 * A bloom pass.
	 *
	 * This pass renders a scene with superimposed blur 
	 * by utilising an approximated gauss kernel.
	 *
	 * Since the effect will be written to the readBuffer 
	 * render texture, you'll need to use a ShaderPass with 
	 * a CopyMaterial to render the texture to screen.
	 *
	 * @class BloomPass
	 * @constructor
	 * @extends Pass
	 * @param {Object} [options] - The options.
	 * @param {Number} [options.strength=1.0] - The bloom strength.
	 * @param {Number} [options.kernelSize=25] - The kernel size.
	 * @param {Number} [options.sigma=4.0] - The sigma value.
	 * @param {Number} [options.resolution=256] - The render resolution.
	 */

	function BloomPass(options) {

		Pass.call(this);

		if(options === undefined) { options = {}; }
		if(options.kernelSize === undefined) { options.kernelSize = 25; }

		/**
		 * A render target.
		 *
		 * @property renderTargetX
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTargetX = new THREE.WebGLRenderTarget(1, 1, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBFormat
		});

		this.renderTargetX.texture.generateMipmaps = false;

		/**
		 * Another render target.
		 *
		 * @property renderTargetY
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTargetY = this.renderTargetX.clone();
		this.renderTargetY.stencilBuffer = false;
		this.renderTargetY.depthBuffer = false;

		// Set the resolution.
		this.resolution = (options.resolution === undefined) ? 256 : options.resolution;

		/**
		 * The horizontal blur factor.
		 *
		 * @property blurX
		 * @type Vector2
		 * @private
		 */

		this.blurX = new THREE.Vector2(BLUR, 0.0);

		/**
		 * The vertical blur factor.
		 *
		 * @property blurY
		 * @type Vector2
		 * @private
		 */

		this.blurY = new THREE.Vector2(0.0, BLUR);

		/**
		 * Combine shader material.
		 *
		 * @property combineMaterial
		 * @type CombineMaterial
		 * @private
		 */

		this.combineMaterial = new CombineMaterial();

		if(options.strength !== undefined) { this.combineMaterial.uniforms.opacity2.value = options.strength; }

		/**
		 * Copy shader material.
		 *
		 * @property copyMaterial
		 * @type CopyMaterial
		 * @private
		 */

		this.copyMaterial = new CopyMaterial();
		this.copyMaterial.blending = THREE.AdditiveBlending;
		this.copyMaterial.transparent = true;

		if(options.strength !== undefined) { this.copyMaterial.uniforms.opacity.value = options.strength; }

		/**
		 * Convolution shader material.
		 *
		 * @property convolutionMaterial
		 * @type ConvolutionMaterial
		 * @private
		 */

		this.convolutionMaterial = new ConvolutionMaterial();

		this.convolutionMaterial.buildKernel((options.sigma !== undefined) ? options.sigma : 4.0);
		this.convolutionMaterial.defines.KERNEL_SIZE_FLOAT = options.kernelSize.toFixed(1);
		this.convolutionMaterial.defines.KERNEL_SIZE_INT = options.kernelSize.toFixed(0);

		/**
		 * Clear flag.
		 *
		 * This pass draws the blurred scene over the normal one.
		 * Set to true to see the fully blurred scene.
		 *
		 * @property clear
		 * @type Boolean
		 * @default true
		 */

		this.clear = false;

	}

	BloomPass.prototype = Object.create(Pass.prototype);
	BloomPass.prototype.constructor = BloomPass;

	/**
	 * The resolution of the render targets. Needs to be a power of 2.
	 *
	 * @property resolution
	 * @type Number
	 */

	Object.defineProperty(BloomPass.prototype, "resolution", {

		get: function() { return this.renderTargetX.width; },

		set: function(x) {

			if(typeof x === "number") {

				if(x <= 0) { x = 1; }

				this.renderTargetX.setSize(x, x);
				this.renderTargetY.setSize(x, x);

			}

		}

	});

	/**
	 * Renders the scene.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {Number} delta - The render delta time.
	 * @param {Boolean} maskActive - Disable stencil test.
	 */

	BloomPass.prototype.render = function(renderer, writeBuffer, readBuffer, delta, maskActive) {

		if(maskActive) { renderer.context.disable(renderer.context.STENCIL_TEST); }

		// Render quad with blurred scene into texture (convolution pass 1).
		this.quad.material = this.convolutionMaterial;
		this.convolutionMaterial.uniforms.tDiffuse.value = readBuffer;
		this.convolutionMaterial.uniforms.uImageIncrement.value.copy(this.blurX);
		renderer.render(this.scene, this.camera, this.renderTargetX, true);

		// Render quad with blurred scene into texture (convolution pass 2).
		this.convolutionMaterial.uniforms.tDiffuse.value = this.renderTargetX;
		this.convolutionMaterial.uniforms.uImageIncrement.value.copy(this.blurY);
		renderer.render(this.scene, this.camera, this.renderTargetY, true);

		if(maskActive) { renderer.context.enable(renderer.context.STENCIL_TEST); }

		// Render original scene with superimposed blur.
		if(this.renderToScreen) {

			// Combine read buffer with the generated blur and render the result to screen.
			this.quad.material = this.combineMaterial;
			this.combineMaterial.uniforms.texture1.value = readBuffer;
			this.combineMaterial.uniforms.texture2.value = this.renderTargetY;

			renderer.render(this.scene, this.camera);

		} else {

			// Render directly onto the read buffer. Saves one texel fetch compared to the combine strategy.
			this.quad.material = this.copyMaterial;
			this.copyMaterial.uniforms.tDiffuse.value = this.renderTargetY;

			renderer.render(this.scene, this.camera, readBuffer, this.clear);

		}

	};

	/**
	 * Updates this pass with the main render target's size.
	 *
	 * @method setSize
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	BloomPass.prototype.setSize = function(width, height) {

		if(width <= 0) { width = 1; }
		if(height <= 0) { height = 1; }

		// Scale one of the blur factors with the render target ratio.
		this.blurY.set(0.0, (width / height) * BLUR);

	};

	/**
	 * A crepuscular rays pass.
	 *
	 * @class GodRaysPass
	 * @constructor
	 * @extends Pass
	 * @param {Scene} scene - The main scene.
	 * @param {Camera} camera - The main camera.
	 * @param {Vector3} lightSource - The most important light source.
	 * @param {Object} [options] - The options.
	 * @param {Number} [options.rayLength=1.0] - The maximum length of god rays.
	 * @param {Number} [options.decay=1.0] - A constant attenuation coefficient.
	 * @param {Number} [options.weight=1.0] - A constant attenuation coefficient.
	 * @param {Number} [options.exposure=1.0] - A constant attenuation coefficient.
	 * @param {Number} [options.intensity=1.0] - A constant factor for additive blending.
	 * @param {Number} [options.resolution=512] - The god rays render texture resolution.
	 * @param {Number} [options.samples=9] - The number of samples per pixel.
	 */

	function GodRaysPass(scene, camera, lightSource, options) {

		Pass.call(this);

		if(options === undefined) { options = {}; }

		/**
		 * A render target.
		 *
		 * @property renderTargetX
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTargetX = new THREE.WebGLRenderTarget(1, 1, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBFormat
		});

		this.renderTargetX.texture.generateMipmaps = false;

		/**
		 * Another render target.
		 *
		 * @property renderTargetY
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTargetY = this.renderTargetX.clone();
		this.renderTargetY.stencilBuffer = false;
		this.renderTargetY.depthBuffer = false;

		// Set the resolution.
		this.resolution = (options.resolution === undefined) ? 512 : options.resolution;

		/**
		 * The light source.
		 *
		 * @property lightSource
		 * @type Object3D
		 */

		this.lightSource = (lightSource !== undefined) ? lightSource : new THREE.Object3D();

		/**
		 * The light position in screen space.
		 *
		 * @property screenLightPosition
		 * @type Vector3
		 * @private
		 */

		this.screenLightPosition = new THREE.Vector3();

		/**
		 * God rays shader material for the generate phase.
		 *
		 * @property godRaysMaterial
		 * @type GodRaysMaterial
		 * @private
		 */

		this.godRaysMaterial = new GodRaysMaterial();
		this.godRaysMaterial.uniforms.lightPosition.value = this.screenLightPosition;

		if(options.decay !== undefined) { this.godRaysMaterial.uniforms.decay.value = options.decay; }
		if(options.weight !== undefined) { this.godRaysMaterial.uniforms.weight.value = options.weight; }

		/**
		 * The exposure coefficient.
		 *
		 * This value is scaled based on the user's view direction. 
		 * The product is sent to the god rays shader each frame.
		 *
		 * @property exposure
		 * @type Number
		 */

		if(options.exposure !== undefined) { this.godRaysMaterial.uniforms.exposure.value = options.exposure; }

		this.exposure = this.godRaysMaterial.uniforms.exposure.value;

		/**
		 * Combine shader material for the final composite phase.
		 *
		 * @property combineMaterial
		 * @type CombineMaterial
		 * @private
		 */

		this.combineMaterial = new CombineMaterial();

		if(options.intensity !== undefined) { this.combineMaterial.uniforms.opacity2.value = options.intensity; }

		/**
		 * A material used for masking the scene objects.
		 *
		 * @property maskMaterial
		 * @type MeshBasicMaterial
		 * @private
		 */

		this.maskMaterial = new THREE.MeshBasicMaterial({color: 0x000000});

		/**
		 * The maximum length of god-rays.
		 *
		 * @property _rayLength
		 * @type Number
		 * @private
		 */

		this._rayLength = (options.rayLength !== undefined) ? options.rayLength : 1.0;

		/**
		 * The maximum ray length translated to step sizes for the 3 generate passes.
		 *
		 * @property stepSizes
		 * @type Float32Array
		 * @private
		 */

		this.stepSizes = new Float32Array(3);

		// Setting the amount of samples indirectly computes the actual step sizes.
		this.samples = options.samples;

		/**
		 * A main scene.
		 *
		 * @property mainScene
		 * @type Scene
		 */

		this.mainScene = (scene !== undefined) ? scene : new THREE.Scene();

		/**
		 * The main camera.
		 *
		 * @property mainCamera
		 * @type Camera
		 */

		this.mainCamera = (camera !== undefined) ? camera : new THREE.PerspectiveCamera();

		// Swap read and write buffer when done.
		this.needsSwap = true;

	}

	GodRaysPass.prototype = Object.create(Pass.prototype);
	GodRaysPass.prototype.constructor = GodRaysPass;

	/**
	 * The overall intensity of the effect.
	 *
	 * @property intensity
	 * @type Number
	 * @default 1.0
	 */

	Object.defineProperty(GodRaysPass.prototype, "intensity", {

		get: function() { return this.combineMaterial.uniforms.intensity.value; },

		set: function(x) {

			if(typeof x === "number") {

				this.combineMaterial.uniforms.intensity.value = x;

			}

		}

	});

	/**
	 * The resolution of the render targets. Needs to be a power of 2.
	 *
	 * @property resolution
	 * @type Number
	 * @default 512
	 */

	Object.defineProperty(GodRaysPass.prototype, "resolution", {

		get: function() { return this.renderTargetX.width; },

		set: function(x) {

			if(typeof x === "number") {

				if(x <= 0) { x = 1; }

				this.renderTargetX.setSize(x, x);
				this.renderTargetY.setSize(x, x);

			}

		}

	});

	/**
	 * The maximum length of god rays.
	 *
	 * A value of 1.5 is recommended, to ensure that the effect 
	 * fills the entire screen at all times.
	 *
	 * As a result, the whole effect will be spread out further 
	 * which requires a slightly higher number of samples per pixel  
	 * to prevent visual gaps along the rays. 
	 *
	 * @property rayLength
	 * @type Number
	 * @default 1.5
	 */

	Object.defineProperty(GodRaysPass.prototype, "rayLength", {

		get: function() { return this._rayLength; },

		set: function(x) {

			if(typeof x === "number" && x >= 0.0) {

				this._rayLength = x;
				this.calculateStepSizes();

			}

		}

	});

	/**
	 * The number of samples per pixel.
	 *
	 * This value must be carefully chosen. A higher value increases the 
	 * GPU load directly and doesn't necessarily yield better results!
	 *
	 * The recommended number of samples is 9.
	 * For render resolutions below 1024 and a ray length of 1.0, 7 samples 
	 * might also be sufficient.
	 *
	 * Values above 9 don't have a noticable impact on the quality.
	 *
	 * @property samples
	 * @type Number
	 * @default 9
	 */

	Object.defineProperty(GodRaysPass.prototype, "samples", {

		get: function() {

			return Number.parseInt(this.godRaysMaterial.defines.NUM_SAMPLES_INT);

		},

		set: function(x) {

			if(typeof x === "number" && x >= 1) {

				x = Math.floor(x);

				this.godRaysMaterial.defines.NUM_SAMPLES_FLOAT = x.toFixed(1);
				this.godRaysMaterial.defines.NUM_SAMPLES_INT = x.toFixed(0);

			}

			this.calculateStepSizes();

		}

	});

	/**
	 * Adjusts the sampling step sizes for the three generate passes.
	 *
	 * @method calculateStepSizes
	 * @private
	 */

	GodRaysPass.prototype.calculateStepSizes = function() {

		var x = this.samples;

		this.stepSizes[0] = this.rayLength * Math.pow(x, -1.0);
		this.stepSizes[1] = this.rayLength * Math.pow(x, -2.0);
		this.stepSizes[2] = this.rayLength * Math.pow(x, -3.0);

	};

	/**
	 * Used for saving the original clear color 
	 * during rendering the masked scene.
	 *
	 * @property clearColor
	 * @type Color
	 * @private
	 * @static
	 */

	var clearColor$1 = new THREE.Color();

	/**
	 * Renders the scene.
	 *
	 * The god rays pass has two phases with a total of 4 render steps.
	 *
	 * Generate-phase:
	 *  In the first pass, the masked scene is blurred along radial lines towards the light source.
	 *  The result of the previous pass is re-blurred twice with a decreased distance between the samples.
	 *
	 * Combine-phase:
	 *  The result is added to the normal scene.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 */

	GodRaysPass.prototype.render = function(renderer, writeBuffer, readBuffer) {

		var clearAlpha;

		// Compute the screen light position and translate the coordinates to [-1, 1].
		this.screenLightPosition.copy(this.lightSource.position).project(this.mainCamera);
		this.screenLightPosition.x = THREE.Math.clamp((this.screenLightPosition.x + 1.0) * 0.5, -1.0, 1.0);
		this.screenLightPosition.y = THREE.Math.clamp((this.screenLightPosition.y + 1.0) * 0.5, -1.0, 1.0);

		// Don't show the rays from acute angles.
		this.godRaysMaterial.uniforms.exposure.value = this.computeAngularScalar() * this.exposure;

		// Render the masked scene into texture.
		this.mainScene.overrideMaterial = this.maskMaterial;
		clearColor$1.copy(renderer.getClearColor());
		clearAlpha = renderer.getClearAlpha();
		renderer.setClearColor(0x000000, 1);
		//renderer.render(this.mainScene, this.mainCamera, undefined, true); // Debug.
		renderer.render(this.mainScene, this.mainCamera, this.renderTargetX, true);
		renderer.setClearColor(clearColor$1, clearAlpha);
		this.mainScene.overrideMaterial = null;

		// God rays - Pass 1.
		this.quad.material = this.godRaysMaterial;
		this.godRaysMaterial.uniforms.stepSize.value = this.stepSizes[0];
		this.godRaysMaterial.uniforms.tDiffuse.value = this.renderTargetX;
		renderer.render(this.scene, this.camera, this.renderTargetY);

		// God rays - Pass 2.
		this.godRaysMaterial.uniforms.stepSize.value = this.stepSizes[1];
		this.godRaysMaterial.uniforms.tDiffuse.value = this.renderTargetY;
		renderer.render(this.scene, this.camera, this.renderTargetX);

		// God rays - Pass 3.
		this.godRaysMaterial.uniforms.stepSize.value = this.stepSizes[2];
		this.godRaysMaterial.uniforms.tDiffuse.value = this.renderTargetX;
		renderer.render(this.scene, this.camera, this.renderTargetY);

		// Final pass - Composite god rays onto colors.
		this.quad.material = this.combineMaterial;
		this.combineMaterial.uniforms.texture1.value = readBuffer;
		this.combineMaterial.uniforms.texture2.value = this.renderTargetY;

		if(this.renderToScreen) {

			renderer.render(this.scene, this.camera);

		} else {

			renderer.render(this.scene, this.camera, writeBuffer);

		}

	};

	/**
	 * Computes the angle between the camera look direction and the light
	 * direction in order to create a scalar for the god rays exposure.
	 *
	 * @method computeAngularScalar
	 * @private
	 * @return {Number} A scalar in the range 0.0 to 1.0 for a linear transition.
	 */

	// Static computation helpers.
	var HALF_PI = Math.PI * 0.5;
	var localPoint = new THREE.Vector3(0, 0, -1);
	var cameraDirection = new THREE.Vector3();
	var lightDirection = new THREE.Vector3();

	GodRaysPass.prototype.computeAngularScalar = function() {

		//this.camera.getWorldDirection(cameraDirection);

		// Save camera space point. Using lightDirection as a clipboard.
		lightDirection.copy(localPoint);
		// Camera space to world space.
		cameraDirection.copy(localPoint.applyMatrix4(this.mainCamera.matrixWorld));
		// Restore local point.
		localPoint.copy(lightDirection);

		// Let these be one and the same point.
		lightDirection.copy(cameraDirection);
		// Now compute the actual directions.
		cameraDirection.sub(this.mainCamera.position);
		lightDirection.sub(this.lightSource.position);

		// Compute the angle between the directions.
		// Don't allow acute angles and make a scalar out of it.
		return THREE.Math.clamp(cameraDirection.angleTo(lightDirection) - HALF_PI, 0.0, 1.0);

	};

	/**
	 * The water pass renders the reflection and refraction of the given scene to a 
	 * texture which is then used by a water material during the normal rendering 
	 * process. The material's time value is updated automatically.
	 *
	 * You may disable the water material if you don't need it and want to use the 
	 * generated textures for something else!
	 *
	 * Add this pass to an EffectComposer and follow it up with a RenderPass. Don't 
	 * forget to set its renderToScreen flag to true!
	 *
	 * Manipulate the water mesh however you like. You may also add the water material 
	 * to other objects.
	 *
	 * @class WaterPass
	 * @constructor
	 * @extends Pass
	 * @param {Scene} scene - The scene to render.
	 * @param {Camera} camera - The main camera.
	 * @param {Boolean} lightPosition - The main light position.
	 * @param {Object} [options] - Additional options.
	 * @param {Boolean} [options.disableWater=false] - Whether the water material should be created and updated every frame.
	 * @param {Boolean} [options.reflection=true] - Whether the reflection should be rendered.
	 * @param {Boolean} [options.refraction=true] - Whether the refraction should be rendered.
	 * @param {Number} [options.resolution=256] - The render texture resolution.
	 * @param {Number} [options.clipBias=0.2] - The clip plane offset.
	 * @param {WebGLRenderTarget} [options.renderTarget] - A render target to use.
	 * @param {Texture} [options.normalMap] - A normalmap for the waves.
	 * @param {Boolean} [options.lowQuality=false] - Falls back to a less expensive water shader.
	 */

	function WaterPass(scene, camera, lightPosition, options) {

		Pass.call(this, scene, camera, null);

		if(options === undefined) { options = {}; }

		/**
		 * The reflection render texture.
		 *
		 * @property reflectionTexture
		 * @type WebGLRenderTarget
		 */

		var resolution = (options.resolution === undefined) ? 256 : options.resolution;

		if(options.renderTarget === undefined) {

			options.renderTarget = new THREE.WebGLRenderTarget(resolution, resolution, {
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				format: THREE.RGBFormat,
				stencilBuffer: false,
				depthBuffer: false
			});

		}

		this.reflectionTexture = options.renderTarget;

		/**
		 * The refraction render texture.
		 *
		 * @property refractionTexture
		 * @type WebGLRenderTarget
		 */

		this.refractionTexture = this.reflectionTexture.clone();

		/**
		 * The reflection camera.
		 *
		 * @property reflectionCamera
		 * @type Camera
		 * @private
		 */

		this.reflectionCamera = this.camera.clone();

		/**
		 * The refraction camera.
		 *
		 * @property refractionCamera
		 * @type Camera
		 * @private
		 */

		this.refractionCamera = this.reflectionCamera.clone();

		/**
		 * Whether the reflection texture should be rendered.
		 *
		 * @property renderReflection
		 * @type Boolean
		 */

		this.renderReflection = options.reflection;

		/**
		 * Whether the refraction texture should be rendered.
		 *
		 * @property renderRefraction
		 * @type Boolean
		 */

		this.renderRefraction = options.refraction;

		/**
		 * The water material.
		 *
		 * @property material
		 * @type WaterMaterial
		 */

		this.material = options.disableWater ? null : new WaterMaterial({
			lightPosition: lightPosition,
			normalMap: options.normalMap,
			lowQuality: options.lowQuality
		});

		this.material.uniforms.reflectionMap.value = this.reflectionTexture;
		this.material.uniforms.refractionMap.value = this.refractionTexture;

		/**
		 * A plane mesh that represents the actual reflection/refraction plane.
		 *
		 * @property mesh
		 * @type Mesh
		 */

	/*
		var geometry = new THREE.BufferGeometry(1, 1);
		geometry.type = "WaterBufferGeometry";

		var vertices = new Float32Array(4 * 3);
		vertices[0] = 2000; vertices[1] = 0; vertices[2] = -2000;
		vertices[3] = -2000; vertices[4] = 0; vertices[5] = 2000;
		vertices[6] = -2000; vertices[7] = 0; vertices[8] = -2000;
		vertices[9] = 2000; vertices[10] = 0; vertices[11] = 2000;

		var normals = new Float32Array(vertices.length);
		normals[0] = 0; normals[1] = 1; normals[2] = 0;
		normals[3] = 0; normals[4] = 1; normals[5] = 0;
		normals[6] = 0; normals[7] = 1; normals[8] = 0;
		normals[9] = 0; normals[10] = 1; normals[11] = 0;

		var uvs = new Float32Array(4 * 2);
		uvs[0] = 0; uvs[1] = 0;
		uvs[2] = 1; uvs[3] = 1;
		uvs[4] = 1; uvs[5] = 0;
		uvs[6] = 0; uvs[7] = 1;

		var indices = new Uint16Array(6);
		indices[0] = 1; indices[1] = 0; indices[2] = 2;
		indices[3] = 0; indices[4] = 1; indices[5] = 3;

		geometry.setIndex(new THREE.BufferAttribute(indices, 1));
		geometry.addAttribute("position", new THREE.BufferAttribute(vertices, 3));
		geometry.addAttribute("normal", new THREE.BufferAttribute(normals, 3));
		geometry.addAttribute("uv", new THREE.BufferAttribute(uvs, 2));
	*/

		var geometry = new THREE.PlaneBufferGeometry(1, 1);

		var tangents = new Float32Array(4 * 4);
		tangents[0] = 1; tangents[1] = 0; tangents[2] = 0; tangents[3] = -1;
		tangents[4] = 1; tangents[5] = 0; tangents[6] = 0; tangents[7] = -1;
		tangents[8] = 1; tangents[9] = 0; tangents[10] = 0; tangents[11] = -1;
		tangents[12] = 1; tangents[13] = 0; tangents[14] = 0; tangents[15] = -1;

		geometry.addAttribute("tangent", new THREE.BufferAttribute(tangents, 4));

		this.mesh = new THREE.Mesh(geometry, this.material);
		this.mesh.matrixNeedsUpdate = true;

		this.scene.add(this.mesh);

		/**
		 * The reflection texture matrix for UV-mapping.
		 *
		 * @property textureMatrix
		 * @type Matrix4
		 * @private
		 */

		this.textureMatrix = new THREE.Matrix4();

		/**
		 * The reflection plane.
		 *
		 * @property plane
		 * @type Plane
		 * @private
		 */

		this.plane = new THREE.Plane();

		/**
		 * The normal of the reflection plane.
		 *
		 * @property normal
		 * @type Vector3
		 * @private
		 */

		this.normal = new THREE.Vector3(0, 0, 1);

		/**
		 * The world position of the reflection plane.
		 *
		 * @property worldPosition
		 * @type Vector3
		 * @private
		 */

		this.worldPosition = new THREE.Vector3();

		/**
		 * The world position of the camera.
		 *
		 * @property worldPosition
		 * @type Vector3
		 * @private
		 */

		this.cameraWorldPosition = new THREE.Vector3();

		/**
		 * A rotation matrix for the plane.
		 *
		 * @property rotationMatrix
		 * @type Matrix4
		 * @private
		 */

		this.rotationMatrix = new THREE.Matrix4();

		/**
		 * A look-at point.
		 *
		 * @property lookAtPosition
		 * @type Vector3
		 * @private
		 */

		this.lookAtPosition = new THREE.Vector3(0, 0, -1);

		/**
		 * Clip plane.
		 *
		 * @property clipPlane
		 * @type Vector4
		 */

		this.clipPlane = new THREE.Vector4();

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

	WaterPass.prototype = Object.create(Pass.prototype);
	WaterPass.prototype.constructor = WaterPass;

	/**
	 * Renders the reflection texture.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 */

	// Make-shift solution.
	var dt = 1.0 / 60.0;

	WaterPass.prototype.render = function(renderer) {

		if(this.mesh.matrixNeedsUpdate) { this.update(); }
		//this.mesh.matrixNeedsUpdate = true;

		var visible = this.material.visible;
		this.material.visible = false;

		if(this.renderReflection) { renderer.render(this.scene, this.reflectionCamera, this.reflectionTexture, true); }
		if(this.renderRefraction) { renderer.render(this.scene, this.refractionCamera, this.refractionTexture, true); }

		this.material.visible = visible;
		if(this.material !== null) { this.material.uniforms.time.value += dt; }

	};

	/**
	 * Updates the matrices.
	 *
	 * @method update
	 * @private
	 */

	var view = new THREE.Vector3();
	var target = new THREE.Vector3();
	var q = new THREE.Vector4();

	WaterPass.prototype.update = function() {

		this.mesh.updateMatrixWorld();
		this.camera.updateMatrixWorld();

		this.worldPosition.setFromMatrixPosition(this.mesh.matrixWorld);
		this.cameraWorldPosition.setFromMatrixPosition(this.camera.matrixWorld);

		this.rotationMatrix.extractRotation(this.mesh.matrixWorld);

		this.normal.set(0, 0, 1);
		this.normal.applyMatrix4(this.rotationMatrix);

		view.copy(this.worldPosition).sub(this.cameraWorldPosition);
		view.reflect(this.normal).negate();
		view.add(this.worldPosition);

		this.rotationMatrix.extractRotation(this.camera.matrixWorld);

		this.lookAtPosition.set(0, 0, -1);
		this.lookAtPosition.applyMatrix4(this.rotationMatrix);
		this.lookAtPosition.add(this.cameraWorldPosition);

		target.copy(this.worldPosition).sub(this.lookAtPosition);
		target.reflect(this.normal).negate();
		target.add(this.worldPosition);

		this.mesh.up.set(0, -1, 0);
		this.mesh.up.applyMatrix4(this.rotationMatrix);
		this.mesh.up.reflect(this.normal).negate();

		this.reflectionCamera.position.copy(view);
		this.reflectionCamera.up = this.mesh.up;
		this.reflectionCamera.lookAt(target);

		this.reflectionCamera.updateProjectionMatrix();
		this.reflectionCamera.updateMatrixWorld();
		this.reflectionCamera.matrixWorldInverse.getInverse(this.reflectionCamera.matrixWorld);

		// Update the reflection texture matrix.
		this.textureMatrix.set(
			0.5, 0.0, 0.0, 0.5,
			0.0, 0.5, 0.0, 0.5,
			0.0, 0.0, 0.5, 0.5,
			0.0, 0.0, 0.0, 1.0
		);

		this.textureMatrix.multiply(this.reflectionCamera.projectionMatrix);
		this.textureMatrix.multiply(this.reflectionCamera.matrixWorldInverse);

		// Now update projection matrix with new clip plan.
		// Code from: http://www.terathon.com/code/oblique.html
		// Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
		this.plane.setFromNormalAndCoplanarPoint(this.normal, this.worldPosition);
		this.plane.applyMatrix4(this.reflectionCamera.matrixWorldInverse);

		this.clipPlane.set(this.plane.normal.x, this.plane.normal.y, this.plane.normal.z, this.plane.constant);

		var projectionMatrix = this.reflectionCamera.projectionMatrix;

		q.x = (Math.sign(this.clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
		q.y = (Math.sign(this.clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
		q.z = -1.0;
		q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

		// Calculate the scaled plane vector.
		var c = this.clipPlane.multiplyScalar(2.0 / this.clipPlane.dot(q));

		// Replacing the third row of the projection matrix.
		projectionMatrix.elements[2] = c.x;
		projectionMatrix.elements[6] = c.y;
		projectionMatrix.elements[10] = c.z + 1.0 + this.clipBias;// minus?
		projectionMatrix.elements[14] = c.w;

	};

	/**
	 * A distortion and droplet pass for underwater and wet lens effects.
	 *
	 * @class DistortionPass
	 * @constructor
	 * @param {Object} [options] - The options.
	 * @param {Number} [options.resolution=1.0] - The size of the generated perturbation map, relative to the main render size.
	 * @param {Vector2} [options.rollOffSpeed] - The droplet roll off speed.
	 * @param {Vector2} [options.waveStrength] - The sine and cosine wave distortion strength.
	 * @param {Boolean} [options.highQuality] - The effect quality. If set to true, double the amount of noise values will be computed.
	 * @param {Number} [options.speed] - The effect's animation speed.
	 */

	function DistortionPass(options) {

		Pass.call(this);

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
			format: THREE.RGBFormat,
			type: THREE.FloatType,
			stencilBuffer: false,
			depthBuffer: false
		});

		this.renderTargetPerturb.texture.generateMipmaps = false;

		/**
		 * The resolution scale, relative to the on-screen render size.
		 * You have to call the reset method of the EffectComposer after modifying this field.
		 *
		 * @property resolutionScale
		 * @type Number
		 */

		this.resolutionScale = (options.resolution === undefined) ? 1.0 : THREE.Math.clamp(options.resolution, 0.0, 1.0);

		/**
		 * Noise shader material.
		 *
		 * @property noiseMaterial
		 * @type NoiseMaterial
		 * @private
		 */

		this.noiseMaterial = new NoiseMaterial(options.highQuality);

		/**
		 * Distortion shader material.
		 *
		 * @property distortionMaterial
		 * @type DistortionMaterial
		 * @private
		 */

		this.distortionMaterial = new DistortionMaterial({
			perturbMap: this.renderTargetPerturb,
			rollOffSpeed: options.rollOffSpeed,
			waveStrength: options.waveStrength,
			tint: options.color
		});

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

		// Set the material for the rendering quad.
		this.quad.material = this.distortionMaterial;

	}

	DistortionPass.prototype = Object.create(Pass.prototype);
	DistortionPass.prototype.constructor = DistortionPass;

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

	Object.defineProperty(DistortionPass.prototype, "dissolve", {

		get: function() { return this._dissolve; },

		set: function(x) {

			this._dissolve = x;

			if(!this._dissolve) {

				this.distortionMaterial.uniforms.resetTimer.value = 0.0;
				this.distortionMaterial.uniforms.time.value = Math.random() * 1000.0;
				this.noiseMaterial.uniforms.randomTime.value = Math.random() * 10.0 - 1.0;

			}

		}

	});

	/**
	 * Renders the scene.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 */

	// Time constant to add per frame.
	var dt$1 = 1.0 / 60.0;

	DistortionPass.prototype.render = function(renderer, writeBuffer, readBuffer) {

		var t = dt$1 * this.speed;

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

	};

	/**
	 * Updates the perturbation map render size.
	 *
	 * @method setSize
	 * @param {Number} width - The width.
	 * @param {Number} heght - The height.
	 */

	DistortionPass.prototype.setSize = function(width, height) {

		width = Math.floor(width * this.resolutionScale);
		height = Math.floor(height * this.resolutionScale);

		if(width <= 0) { width = 1; }
		if(height <= 0) { height = 1; }

		this.noiseMaterial.uniforms.tWidth.value = width;
		this.noiseMaterial.uniforms.tHeight.value = height;

		this.renderTargetPerturb.setSize(width, height);

	};

	/**
	 * Renders a perturbation map for the droplets.
	 *
	 * @method renderPerturbationMap
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {Number} size - The texture size.
	 * @private
	 */

	DistortionPass.prototype.renderPerturbationMap = function(renderer) {

		this.quad.material = this.noiseMaterial;
		this.noiseMaterial.uniforms.time.value = this.distortionMaterial.uniforms.time.value;

		//renderer.render(this.scene, this.camera); // Renders the perturb map to screen.
		renderer.render(this.scene, this.camera, this.renderTargetPerturb, false);

		this.quad.material = this.distortionMaterial;

	};

	exports.WaterMaterial = WaterMaterial;
	exports.WaterfallMaterial = WaterfallMaterial;
	exports.LavaMaterial = LavaMaterial;
	exports.DistortionMaterial = DistortionMaterial;
	exports.NoiseMaterial = NoiseMaterial;
	exports.WaterPass = WaterPass;
	exports.DistortionPass = DistortionPass;

}));