import shader from "./inlined/shader";
import THREE from "three";

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

export function NoiseMaterial(highQuality) {

	THREE.ShaderMaterial.call(this, {

		uniforms: {

			tWidth: {type: "f", value: 0},
			tHeight: {type: "f", value: 0},

			time: {type: "f", value: 0.0},
			randomTime: {type: "f", value: Math.random() * 10.0 - 1.0}

		},

		fragmentShader: shader.fragment,
		vertexShader: shader.vertex

	});

	if(highQuality) { this.defines.HIGH_QUALITY = "1"; }

}

NoiseMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
NoiseMaterial.prototype.constructor = NoiseMaterial;
