import shader from "./inlined/shader";
import THREE from "three";

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

export function LavaMaterial(noiseMap, options) {

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
			lavaColor: {type: "c", value: (options.lavaColor !== undefined) ? options.lavaColor : new THREE.Color(0.2, 0.07, 0.01)},

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
