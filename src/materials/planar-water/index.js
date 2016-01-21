import shader from "./inlined/shader";
import THREE from "three";

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

export function WaterMaterial(options) {

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

		fragmentShader: options.lowQuality ? shader.fragment.low : shader.fragment.high,
		vertexShader: shader.vertex,

		side: THREE.DoubleSide,
		fog: true

	});

}

WaterMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
WaterMaterial.prototype.constructor = WaterMaterial;
