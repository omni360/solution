import THREE from "three";

import fragment from "./glsl/shader.frag";
import vertex from "./glsl/shader.vert";

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

export class DistortionMaterial extends THREE.ShaderMaterial {

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
