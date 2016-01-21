/**
 * Manual asset loading.
 */

window.addEventListener("load", function loadAssets() {

	window.removeEventListener("load", loadAssets);

	var loadingManager = new THREE.LoadingManager();
	var textureLoader = new THREE.TextureLoader(loadingManager);
	var modelLoader = new THREE.ObjectLoader(loadingManager);

	var assets = {};

	loadingManager.onProgress = function(item, loaded, total) {

		if(loaded === total) { setupScene(assets); }

	};

	textureLoader.load("textures/tex12.png", function(texture) {

		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		assets.noiseMap = texture;

	});

});

/**
 * Scene setup.
 *
 * @param {Object} assets - The pre-loaded assets.
 */

function setupScene(assets) {

	var renderer = new THREE.WebGLRenderer({antialias: true, logarithmicDepthBuffer: true});

	var scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x000000, 0.00025);
	renderer.setClearColor(0x000000);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.getElementById("viewport").appendChild(renderer.domElement);

	var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 20000);
	var controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.target.set(0, -10, 0);
	controls.enablePan = false;
	controls.maxDistance = 1000;
	controls.damping = 0.2;
	camera.position.set(0, -10, 50);
	camera.lookAt(controls.target);

	scene.add(camera);

	// Overlays.

	var stats = new Stats();
	stats.setMode(0);
	var aside = document.getElementById("aside");
	aside.style.visibility = "visible";
	aside.appendChild(stats.domElement);

	document.addEventListener("keydown", function(event) {

		if(event.altKey) {

			event.preventDefault();
			aside.style.visibility = (aside.style.visibility === "hidden") ? "visible" : "hidden";

		}

	});

	// Waterfall.

	var material = new SOLUTION.WaterfallMaterial({
		timeScale: 1.0,
		smoothness: 0.0001,
		fallAccel: 1.25,
		spread: 0.6,
		drops: 16.0,
		shape: 1.2,
		power: 0.7,
		alpha: 2.0,
		height: 0.8,
		overflow: 0.2,
		scale: new THREE.Vector2(1.0, 1.0),
		strength: new THREE.Vector2(6.0, 26.0),
		waterColor: new THREE.Color(0.25, 0.5, 0.5)
	});

	var time = material.uniforms.time;

	var geometry = new THREE.PlaneBufferGeometry(1, 1);
	var mesh = new THREE.Mesh(geometry, material);
	mesh.scale.set(100, 100, 1);

	scene.add(mesh);

	/**
	 * Handles resizing.
	 */

	window.addEventListener("resize", function resize() {

		var width = window.innerWidth;
		var height = window.innerHeight;

		renderer.setSize(width, height);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();

	});

	/**
	 * Animation loop.
	 */

	var dt = 1.0 / 60.0;

	(function render(now) {

		stats.begin();

		renderer.render(scene, camera);
		time.value += dt;

		stats.end();

		requestAnimationFrame(render);

	}());

}
