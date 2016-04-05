import { Pass } from "postprocessing";
import THREE from "three";

// Static computation helpers.
const cameraWorldPosition = new THREE.Vector3();
const lookAtPosition = new THREE.Vector3();
const worldPosition = new THREE.Vector3();
const viewPosition = new THREE.Vector3();
const clipPlane = new THREE.Vector4();
const rotation = new THREE.Matrix4();
const normal = new THREE.Vector3();
const target = new THREE.Vector3();
const plane = new THREE.Plane();
const q = new THREE.Vector4();

/**
 * A reflection pass.
 *
 * This pass renders the reflection of a given scene into a texture.
 *
 * @class ReflectionPass
 * @constructor
 * @extends Pass
 * @param {Scene} scene - The scene to render.
 * @param {Camera} camera - The main camera.
 * @param {Object} [options] - Additional options.
 * @param {Object3D} [options.object] - An object that represents the reflection plane in terms of position and rotation.
 * @param {Number} [options.resolution=256] - The render texture resolution.
 * @param {Number} [options.clipBias=0.2] - The clip plane offset.
 */

export class ReflectionPass extends Pass {

	constructor(scene, camera, options) {

		super(scene, camera, null);

		if(options === undefined) { options = {}; }

		/**
		 * The reflection render target.
		 *
		 * @property renderTargetReflection
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTargetReflection = new THREE.WebGLRenderTarget(1, 1, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			generateMipmaps: false,
			stencilBuffer: false
		});

		this.resolution = (options.resolution === undefined) ? 256 : options.resolution;

		/**
		 * The reflection texture.
		 *
		 * @property reflectionTexture
		 * @type Texture
		 */

		this.reflectionTexture = this.renderTargetReflection.texture;

		/**
		 * The reflection camera.
		 *
		 * @property reflectionCamera
		 * @type Camera
		 * @private
		 */

		this.reflectionCamera = this.camera.clone();

		/**
		 * An object that represents the internal reflection plane.
		 * If no object was provided a plane object will be created.
		 *
		 * Please assign a material that uses the reflection texture 
		 * to this object and add the object to your scene.
		 *
		 * @property object
		 * @type Object3D
		 */

		let geometry, tangents;

		if(options.object === undefined) {

			geometry = new THREE.PlaneBufferGeometry(1, 1);
			tangents = new Float32Array(4 * 4);

			tangents[0] = 1; tangents[1] = 0; tangents[2] = 0; tangents[3] = -1;
			tangents[4] = 1; tangents[5] = 0; tangents[6] = 0; tangents[7] = -1;
			tangents[8] = 1; tangents[9] = 0; tangents[10] = 0; tangents[11] = -1;
			tangents[12] = 1; tangents[13] = 0; tangents[14] = 0; tangents[15] = -1;

			geometry.addAttribute("tangent", new THREE.BufferAttribute(tangents, 4));

			options.object = new THREE.Mesh(geometry, null);

		}

		this.object = options.object;

		/**
		 * A collection of materials that use the reflection texture.
		 * These will temporarily be disabled during the render process.
		 *
		 * @property materials
		 * @type Array
		 */

		this.materials = [];

		/**
		 * Clip bias.
		 *
		 * @property clipBias
		 * @type Number
		 */

		this.clipBias = (options.clipBias !== undefined) ? options.clipBias : 0.2;

		// Update the matrices.
		this.update();

	}

	/**
	 * The resolution of the render target. Must be a power of two.
	 *
	 * @property resolution
	 * @type Number
	 * @default 256
	 */

	get resolution() { return this.renderTargetReflection.width; }

	set resolution(x) {

		if(typeof x === "number" && x > 0) {

			this.renderTargetReflection.setSize(x, x);

		}

	}

	/**
	 * Renders the reflection texture.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 */

	render(renderer) {

		let i, l, m;
		let visible = false;

		for(i = 0, l = this.materials.length; i < l; ++i) {

			this.materials[i].visible = false;

		}

		if(this.object.material !== null) {

			visible = this.object.material.visible;
			this.object.material.visible = false;

		}

		this.update();

		renderer.render(this.scene, this.reflectionCamera, this.renderTargetReflection, true);

		for(i = 0; i < l; ++i) {

			this.materials[i].visible = true;

		}

	}

	/**
	 * Updates the projection camera.
	 *
	 * Uses oblique camera frustum clipping.
	 * http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
	 *
	 * @method update
	 * @private
	 */

	update() {

		// Adjust the position and rotation of the reflection camera.

		this.object.updateMatrixWorld();
		this.camera.updateMatrixWorld();

		worldPosition.setFromMatrixPosition(this.object.matrixWorld);
		cameraWorldPosition.setFromMatrixPosition(this.camera.matrixWorld);

		rotation.extractRotation(this.object.matrixWorld);

		normal.set(0, 0, 1);
		normal.applyMatrix4(rotation);

		viewPosition.copy(worldPosition).sub(cameraWorldPosition);
		viewPosition.reflect(normal).negate();
		viewPosition.add(worldPosition);

		rotation.extractRotation(this.camera.matrixWorld);

		lookAtPosition.set(0, 0, -1);
		lookAtPosition.applyMatrix4(rotation);
		lookAtPosition.add(cameraWorldPosition);

		target.copy(worldPosition).sub(lookAtPosition);
		target.reflect(normal).negate();
		target.add(worldPosition);

		this.object.up.set(0, -1, 0);
		this.object.up.applyMatrix4(rotation);
		this.object.up.reflect(normal).negate();

		this.reflectionCamera.position.copy(viewPosition);
		this.reflectionCamera.up = this.object.up;
		this.reflectionCamera.lookAt(target);

		this.reflectionCamera.updateProjectionMatrix();
		this.reflectionCamera.updateMatrixWorld();
		this.reflectionCamera.matrixWorldInverse.getInverse(this.reflectionCamera.matrixWorld);

		// Update the projection matrix with the clip plane.

		plane.setFromNormalAndCoplanarPoint(normal, worldPosition);
		plane.applyMatrix4(this.reflectionCamera.matrixWorldInverse);

		clipPlane.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);

		let projectionMatrix = this.reflectionCamera.projectionMatrix;
		let elements = projectionMatrix.elements;

		q.x = (Math.sign(clipPlane.x) + elements[8]) / elements[0];
		q.y = (Math.sign(clipPlane.y) + elements[9]) / elements[5];
		q.z = -1.0;
		q.w = (1.0 + elements[10]) / elements[14];

		// Calculate the scaled plane vector.
		let c = clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));

		// Replace the third row of the projection matrix.
		elements[2] = c.x;
		elements[6] = c.y;
		elements[10] = c.z + 1.0 - this.clipBias;// minus?
		elements[14] = c.w;

	}

	/**
	 * Adjusts the format of the render targets.
	 *
	 * @method initialise
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {Boolean} alpha - Whether the renderer uses the alpha channel or not.
	 */

	initialise(renderer, alpha) {

		if(!alpha) { this.renderTargetReflection.texture.format = THREE.RGBFormat; }

	}

}
