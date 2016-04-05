import THREE from "three";

import fragment from "./glsl/shader.frag";
import vertex from "./glsl/shader.vert";

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

export class DropletNoiseMaterial extends THREE.ShaderMaterial {

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

			fragmentShader: fragment,
			vertexShader: vertex

		});

		if(highQuality) { this.defines.HIGH_QUALITY = "1"; }

	}

}
