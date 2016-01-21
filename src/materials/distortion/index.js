import shader from "./inlined/shader";
import THREE from "three";

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
 */

export function DistortionMaterial(options) {

	if(options === undefined) { options = {}; }

	var map = options.perturbMap;
	var speed = options.rollOffSpeed;
	var sinCos = options.waveStrength;

	THREE.ShaderMaterial.call(this, {

		defines: {

			T_DISSOLVE: "4.0",
			T_DROPLETS: "60.0"

		},

		uniforms: {

			tPerturb: {type: "t", value: (map !== undefined) ? map : null},
			tDiffuse: {type: "t", value: null},
			//tWidth: {type: "f", value: 0},
			//tHeight: {type: "f", value: 0},

			rollOffSpeed: {type: "v2", value: (speed !== undefined) ? speed : new THREE.Vector2(0.5, 0.02)},
			waveStrength: {type: "v2", value: (sinCos !== undefined) ? sinCos : new THREE.Vector2(0.25, 0.5)},

			time: {type: "f", value: Math.random() * 1000.0},
			resetTimer: {type: "f", value: 0.0}
			//randomTime: {type: "f", value: Math.random() * 10.0 - 1.0}

		},

		fragmentShader: shader.fragment,
		vertexShader: shader.vertex,

		extensions: {
			derivatives: true
		}

	});

}

DistortionMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
DistortionMaterial.prototype.constructor = DistortionMaterial;
