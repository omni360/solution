import shader from "./inlined/shader";
import THREE from "three";

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

export function WaterfallMaterial(options) {

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

		fragmentShader: shader.fragment,
		vertexShader: shader.vertex,

		side: THREE.DoubleSide,
		transparent: true,
		fog: true

	});

}

WaterfallMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
WaterfallMaterial.prototype.constructor = WaterfallMaterial;
