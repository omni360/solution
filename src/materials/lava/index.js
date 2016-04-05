import THREE from "three";

import fragment from "./glsl/shader.frag";
import vertex from "./glsl/shader.vert";

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

export class LavaMaterial extends THREE.ShaderMaterial {

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

			fragmentShader: fragment,
			vertexShader: vertex,

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
