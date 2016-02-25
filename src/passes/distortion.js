import { DistortionMaterial, NoiseMaterial } from "../materials";
import { Pass } from "postprocessing";
import THREE from "three";

/**
 * A distortion and droplet pass for underwater and wet lens effects.
 *
 * @class DistortionPass
 * @constructor
 * @param {Object} [options] - The options.
 * @param {Number} [options.resolution=512] - The size of the generated perturbation map, power of two.
 * @param {Vector2} [options.rollOffSpeed] - The droplet roll off speed.
 * @param {Vector2} [options.waveStrength] - The sine and cosine wave distortion strength.
 * @param {Boolean} [options.highQuality] - The effect quality. If set to true, double the amount of noise values will be computed.
 * @param {Number} [options.speed] - The effect's animation speed.
 */

export function DistortionPass(options) {

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

	// Set the resolution if already provided.
	this.resolution = (options.resolution === undefined) ? 512 : options.resolution;

	// Set the material for the rendering quad.
	this.quad.material = this.distortionMaterial;

}

DistortionPass.prototype = Object.create(Pass.prototype);
DistortionPass.prototype.constructor = DistortionPass;

/**
 * The resolution of the noise texture.
 * The value should be a power of two.
 *
 * @property resolution
 * @type Number
 * @default 512
 */

Object.defineProperty(DistortionPass.prototype, "resolution", {

	get: function() { return this.renderTargetPerturb.width; },

	set: function(x) {

		if(typeof x === "number" && x > 0) {

			this.noiseMaterial.uniforms.tWidth.value = x;
			this.noiseMaterial.uniforms.tHeight.value = x;
			this.noiseMaterial.uniforms.texelSize.value = 1.0 / x;
			this.noiseMaterial.uniforms.halfTexelSize.value = 0.5 / x;

			this.renderTargetPerturb.setSize(x, x);

		}

	}

});

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
 * Renders the effect.
 *
 * @method render
 * @param {WebGLRenderer} renderer - The renderer to use.
 * @param {WebGLRenderTarget} buffer - The read/write buffer.
 * @param {Number} delta - The render delta time.
 */

DistortionPass.prototype.render = function(renderer, buffer, delta) {

	let t = delta * this.speed;

	this.distortionMaterial.uniforms.tDiffuse.value = buffer;
	this.distortionMaterial.uniforms.time.value += t;

	//this.renderPerturbationMap(renderer); // Debug.

	if(this.dissolve && this.distortionMaterial.uniforms.resetTimer.value <= this.dissolutionEnd) {

		this.distortionMaterial.uniforms.resetTimer.value += t;
		this.renderPerturbationMap(renderer);

	}

	if(this.renderToScreen) {

		renderer.render(this.scene, this.camera);

	} else {

		renderer.render(this.scene, this.camera, buffer, false);

	}

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

	// Slow first time, maybe introduce init hook?
	//renderer.render(this.scene, this.camera); // Renders the perturb map to screen.
	renderer.render(this.scene, this.camera, this.renderTargetPerturb, false);

	this.quad.material = this.distortionMaterial;

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

	this.noiseMaterial.uniforms.tWidth.value = 512;
	this.noiseMaterial.uniforms.tHeight.value = 512;

	this.renderTargetPerturb.setSize(512, 512);

};
