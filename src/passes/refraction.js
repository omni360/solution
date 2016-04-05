import { WaterMaterial } from "../materials";
import { Pass } from "postprocessing";
import THREE from "three";

/**
 * The water pass renders the reflection and refraction of the given scene to a 
 * texture which is then used by a water material during the normal rendering 
 * process. The material's time value is updated automatically.
 *
 * You may disable the water material if you want to use the generated textures 
 * for something else.
 *
 * Add this pass to an EffectComposer and follow it up with a RenderPass.
 *
 * Manipulate the water mesh however you like. You may also add the water material 
 * to other objects.
 *
 * @class WaterPass
 * @constructor
 * @extends Pass
 * @param {Scene} scene - The scene to render.
 * @param {Camera} camera - The main camera.
 * @param {Boolean} lightPosition - The main light position.
 * @param {Texture} normalMap - A normalmap for the waves.
 * @param {Object} [options] - Additional options.
 * @param {Boolean} [options.disableWater=false] - Whether the water material should be created and updated every frame.
 * @param {Boolean} [options.reflection=true] - Whether the reflection should be rendered.
 * @param {Boolean} [options.refraction=true] - Whether the refraction should be rendered.
 * @param {Number} [options.resolution=256] - The render texture resolution.
 * @param {Number} [options.clipBias=0.2] - The clip plane offset.
 */

export function WaterPass(scene, camera, lightPosition, options) {

	Pass.call(this, scene, camera, null);

	if(options === undefined) { options = {}; }

	/**
	 * The reflection render texture.
	 *
	 * @property renderTargetReflection
	 * @type WebGLRenderTarget
	 */

	this.renderTargetReflection = new THREE.WebGLRenderTarget(1, 1, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter
	});

	this.renderTargetReflection.texture.generateMipmaps = false;

	/**
	 * The refraction render texture.
	 *
	 * @property renderTargetRefraction
	 * @type WebGLRenderTarget
	 */

	this.renderTargetRefraction = this.renderTargetReflection.clone();

	this.resolution = (options.resolution === undefined) ? 256 : options.resolution;

	/**
	 * The reflection camera.
	 *
	 * @property reflectionCamera
	 * @type Camera
	 * @private
	 */

	this.reflectionCamera = this.camera.clone();

	/**
	 * The refraction camera.
	 *
	 * @property refractionCamera
	 * @type Camera
	 * @private
	 */

	this.refractionCamera = this.reflectionCamera.clone();

	/**
	 * Whether the reflection texture should be rendered.
	 *
	 * @property renderReflection
	 * @type Boolean
	 */

	this.renderReflection = (options.reflection !== undefined) ? options.reflection : true;

	/**
	 * Whether the refraction texture should be rendered.
	 *
	 * @property renderRefraction
	 * @type Boolean
	 */

	this.renderRefraction = (options.refraction !== undefined) ? options.refraction : true;

	/**
	 * The water material.
	 *
	 * @property material
	 * @type WaterMaterial
	 */

	this.material = options.disableWater ? null : new WaterMaterial({
		lightPosition: lightPosition,
		normalMap: options.normalMap,
		lowQuality: options.lowQuality
	});

	if(this.material !== null) {

		this.material.uniforms.reflectionMap.value = this.renderTargetReflection;
		this.material.uniforms.refractionMap.value = this.renderTargetRefraction;

	}

	/**
	 * A plane mesh that represents the actual reflection/refraction plane.
	 *
	 * @property mesh
	 * @type Mesh
	 */

/*
	var geometry = new THREE.BufferGeometry(1, 1);
	geometry.type = "WaterBufferGeometry";

	var vertices = new Float32Array(4 * 3);
	vertices[0] = 2000; vertices[1] = 0; vertices[2] = -2000;
	vertices[3] = -2000; vertices[4] = 0; vertices[5] = 2000;
	vertices[6] = -2000; vertices[7] = 0; vertices[8] = -2000;
	vertices[9] = 2000; vertices[10] = 0; vertices[11] = 2000;

	var normals = new Float32Array(vertices.length);
	normals[0] = 0; normals[1] = 1; normals[2] = 0;
	normals[3] = 0; normals[4] = 1; normals[5] = 0;
	normals[6] = 0; normals[7] = 1; normals[8] = 0;
	normals[9] = 0; normals[10] = 1; normals[11] = 0;

	var uvs = new Float32Array(4 * 2);
	uvs[0] = 0; uvs[1] = 0;
	uvs[2] = 1; uvs[3] = 1;
	uvs[4] = 1; uvs[5] = 0;
	uvs[6] = 0; uvs[7] = 1;

	var indices = new Uint16Array(6);
	indices[0] = 1; indices[1] = 0; indices[2] = 2;
	indices[3] = 0; indices[4] = 1; indices[5] = 3;

	geometry.setIndex(new THREE.BufferAttribute(indices, 1));
	geometry.addAttribute("position", new THREE.BufferAttribute(vertices, 3));
	geometry.addAttribute("normal", new THREE.BufferAttribute(normals, 3));
	geometry.addAttribute("uv", new THREE.BufferAttribute(uvs, 2));
*/

	let geometry = new THREE.PlaneBufferGeometry(1, 1);

	let tangents = new Float32Array(4 * 4);
	tangents[0] = 1; tangents[1] = 0; tangents[2] = 0; tangents[3] = -1;
	tangents[4] = 1; tangents[5] = 0; tangents[6] = 0; tangents[7] = -1;
	tangents[8] = 1; tangents[9] = 0; tangents[10] = 0; tangents[11] = -1;
	tangents[12] = 1; tangents[13] = 0; tangents[14] = 0; tangents[15] = -1;

	geometry.addAttribute("tangent", new THREE.BufferAttribute(tangents, 4));

	this.mesh = new THREE.Mesh(geometry, this.material);

	this.scene.add(this.mesh);

	/**
	 * The reflection texture matrix for UV-mapping.
	 *
	 * @property textureMatrix
	 * @type Matrix4
	 * @private
	 */

	this.textureMatrix = new THREE.Matrix4();

	/**
	 * The reflection plane.
	 *
	 * @property plane
	 * @type Plane
	 * @private
	 */

	this.plane = new THREE.Plane();

	/**
	 * The normal of the reflection plane.
	 *
	 * @property normal
	 * @type Vector3
	 * @private
	 */

	this.normal = new THREE.Vector3(0, 0, 1);

	/**
	 * The world position of the reflection plane.
	 *
	 * @property worldPosition
	 * @type Vector3
	 * @private
	 */

	this.worldPosition = new THREE.Vector3();

	/**
	 * The world position of the camera.
	 *
	 * @property worldPosition
	 * @type Vector3
	 * @private
	 */

	this.cameraWorldPosition = new THREE.Vector3();

	/**
	 * A rotation matrix for the plane.
	 *
	 * @property rotationMatrix
	 * @type Matrix4
	 * @private
	 */

	this.rotationMatrix = new THREE.Matrix4();

	/**
	 * A look-at point.
	 *
	 * @property lookAtPosition
	 * @type Vector3
	 * @private
	 */

	this.lookAtPosition = new THREE.Vector3(0, 0, -1);

	/**
	 * Clip plane.
	 *
	 * @property clipPlane
	 * @type Vector4
	 */

	this.clipPlane = new THREE.Vector4();

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

WaterPass.prototype = Object.create(Pass.prototype);
WaterPass.prototype.constructor = WaterPass;

/**
 * The resolution of the render targets.
 * The value should be a power of two.
 *
 * @property resolution
 * @type Number
 * @default 256
 */

Object.defineProperty(WaterPass.prototype, "resolution", {

	get: function() { return this.renderTargetReflection.width; },

	set: function(x) {

		if(typeof x === "number" && x > 0) {

			this.renderTargetReflection.setSize(x, x);
			this.renderTargetRefraction.setSize(x, x);

		}

	}

});

/**
 * Renders the reflection and refraction textures.
 *
 * @method render
 * @param {WebGLRenderer} renderer - The renderer to use.
 * @param {WebGLRenderTarget} readBuffer - The read buffer.
 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
 * @param {Number} delta - The render delta time.
 */

WaterPass.prototype.render = function(renderer, readBuffer, writeBuffer, delta) {

	if(this.mesh.matrixNeedsUpdate) { this.update(); }
	//this.mesh.matrixNeedsUpdate = true;

	let visible = this.material.visible;
	this.material.visible = false;

	if(this.renderReflection) { renderer.render(this.scene, this.reflectionCamera, this.renderTargetReflection, true); }
	if(this.renderRefraction) { renderer.render(this.scene, this.refractionCamera, this.renderTargetRefraction, true); }

	this.material.visible = visible;
	if(this.material !== null) { this.material.uniforms.time.value += delta; }

};

/**
 * Updates the matrices.
 *
 * @method update
 * @private
 */

const view = new THREE.Vector3();
const target = new THREE.Vector3();
const q = new THREE.Vector4();

WaterPass.prototype.update = function() {

	this.mesh.updateMatrixWorld();
	this.camera.updateMatrixWorld();

	this.worldPosition.setFromMatrixPosition(this.mesh.matrixWorld);
	this.cameraWorldPosition.setFromMatrixPosition(this.camera.matrixWorld);

	this.rotationMatrix.extractRotation(this.mesh.matrixWorld);

	this.normal.set(0, 0, 1);
	this.normal.applyMatrix4(this.rotationMatrix);

	view.copy(this.worldPosition).sub(this.cameraWorldPosition);
	view.reflect(this.normal).negate();
	view.add(this.worldPosition);

	this.rotationMatrix.extractRotation(this.camera.matrixWorld);

	this.lookAtPosition.set(0, 0, -1);
	this.lookAtPosition.applyMatrix4(this.rotationMatrix);
	this.lookAtPosition.add(this.cameraWorldPosition);

	target.copy(this.worldPosition).sub(this.lookAtPosition);
	target.reflect(this.normal).negate();
	target.add(this.worldPosition);

	this.mesh.up.set(0, -1, 0);
	this.mesh.up.applyMatrix4(this.rotationMatrix);
	this.mesh.up.reflect(this.normal).negate();

	this.reflectionCamera.position.copy(view);
	this.reflectionCamera.up = this.mesh.up;
	this.reflectionCamera.lookAt(target);

	this.reflectionCamera.updateProjectionMatrix();
	this.reflectionCamera.updateMatrixWorld();
	this.reflectionCamera.matrixWorldInverse.getInverse(this.reflectionCamera.matrixWorld);

	// Update the reflection texture matrix.
	this.textureMatrix.set(
		0.5, 0.0, 0.0, 0.5,
		0.0, 0.5, 0.0, 0.5,
		0.0, 0.0, 0.5, 0.5,
		0.0, 0.0, 0.0, 1.0
	);

	this.textureMatrix.multiply(this.reflectionCamera.projectionMatrix);
	this.textureMatrix.multiply(this.reflectionCamera.matrixWorldInverse);

	// Now update projection matrix with new clip plan.
	// Code from: http://www.terathon.com/code/oblique.html
	// Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
	this.plane.setFromNormalAndCoplanarPoint(this.normal, this.worldPosition);
	this.plane.applyMatrix4(this.reflectionCamera.matrixWorldInverse);

	this.clipPlane.set(this.plane.normal.x, this.plane.normal.y, this.plane.normal.z, this.plane.constant);

	let projectionMatrix = this.reflectionCamera.projectionMatrix;

	q.x = (Math.sign(this.clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
	q.y = (Math.sign(this.clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
	q.z = -1.0;
	q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

	// Calculate the scaled plane vector.
	let c = this.clipPlane.multiplyScalar(2.0 / this.clipPlane.dot(q));

	// Replacing the third row of the projection matrix.
	projectionMatrix.elements[2] = c.x;
	projectionMatrix.elements[6] = c.y;
	projectionMatrix.elements[10] = c.z + 1.0 + this.clipBias;// minus?
	projectionMatrix.elements[14] = c.w;

};

/**
 * Adjusts the format of the render targets.
 *
 * @method initialise
 * @param {WebGLRenderer} renderer - The renderer.
 * @param {Boolean} alpha - Whether the renderer uses the alpha channel or not.
 */

WaterPass.prototype.initialise = function(renderer, alpha) {

	if(!alpha) {

		this.renderTargetReflection.texture.format = THREE.RGBFormat;
		this.renderTargetRefraction.texture.format = THREE.RGBFormat;

	}

};
