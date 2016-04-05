import THREE from "three";

import fragment from "./glsl/shader.frag";
import vertex from "./glsl/shader.vert";

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

export class WaterMaterial extends THREE.ShaderMaterial {

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

			fragmentShader: fragment,
			vertexShader: vertex,

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
