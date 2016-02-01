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

	setupScene(assets);

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
	controls.target.set(0, 0, 0);
	controls.enablePan = false;
	controls.maxDistance = 1000;
	controls.damping = 0.2;
	camera.position.set(0, 0, 100);
	camera.lookAt(controls.target);

	scene.add(camera);

	// Overlays.

	var stats = new Stats();
	stats.setMode(0);
	var aside = document.getElementById("aside");
	aside.style.visibility = "visible";
	aside.appendChild(stats.domElement);

	var gui = new dat.GUI();
	aside.appendChild(gui.domElement.parentNode);

	// Hide interface on alt key press.
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
		tint: new THREE.Color(0.25, 0.5, 0.5)
	});

	var time = material.uniforms.time;

	var geometry = new THREE.PlaneBufferGeometry(1, 1);
	var mesh = new THREE.Mesh(geometry, material);
	mesh.scale.set(100, 100, 1);

	scene.add(mesh);

	// Shader settings.

	var params = {
		"time scale": material.uniforms.timeScale.value,
		"smoothness": material.uniforms.smoothness.value,
		"fall acceleration": material.uniforms.fallAccel.value,
		"spread": material.uniforms.spread.value,
		"drops": material.uniforms.drops.value,
		"shape": material.uniforms.shape.value,
		"power": material.uniforms.power.value,
		"alpha": material.uniforms.alpha.value,
		"height": material.uniforms.height.value,
		"overflow": material.uniforms.overflow.value,
		"scale X": material.uniforms.scale.value.x,
		"scale Y": material.uniforms.scale.value.y,
		"strength X": material.uniforms.strength.value.x,
		"strength Y": material.uniforms.strength.value.y,
		"tint": material.uniforms.tint.value.getHex()
	};

	gui.add(params, "time scale").min(0.0).max(2.0).step(0.01).onChange(function() { material.uniforms.timeScale.value = params["time scale"]; });
	gui.add(params, "smoothness").min(0.0).max(0.0002).step(0.000001).onChange(function() { material.uniforms.smoothness.value = params["smoothness"]; });
	gui.add(params, "fall acceleration").min(0.0).max(10.0).step(0.1).onChange(function() { material.uniforms.fallAccel.value = params["fall acceleration"]; });
	gui.add(params, "spread").min(0.0).max(1.0).step(0.01).onChange(function() { material.uniforms.spread.value = params["spread"]; });
	gui.add(params, "drops").min(0.0).max(64.0).step(1.0).onChange(function() { material.uniforms.drops.value = params["drops"]; });
	gui.add(params, "shape").min(0.0).max(10.0).step(0.1).onChange(function() { material.uniforms.shape.value = params["shape"]; });
	gui.add(params, "power").min(0.0).max(4.0).step(0.01).onChange(function() { material.uniforms.power.value = params["power"]; });
	gui.add(params, "alpha").min(0.0).max(3.0).step(0.1).onChange(function() { material.uniforms.alpha.value = params["alpha"]; });
	gui.add(params, "height").min(0.0).max(4.0).step(0.01).onChange(function() { material.uniforms.height.value = params["height"]; });
	gui.add(params, "overflow").min(0.0).max(1.0).step(0.01).onChange(function() { material.uniforms.overflow.value = params["overflow"]; });

	var f = gui.addFolder("Scale");
	f.add(params, "scale X").min(0.0).max(4.0).step(0.1).onChange(function() { material.uniforms.scale.value.x = params["scale X"]; });
	f.add(params, "scale Y").min(0.0).max(4.0).step(0.1).onChange(function() { material.uniforms.scale.value.y = params["scale Y"]; });
	f.open();

	f = gui.addFolder("Strength");
	f.add(params, "strength X").min(0.0).max(20.0).step(0.25).onChange(function() { material.uniforms.strength.value.x = params["strength X"]; });
	f.add(params, "strength Y").min(0.0).max(50.0).step(0.5).onChange(function() { material.uniforms.strength.value.y = params["strength Y"]; });
	f.open();

	gui.addColor(params, "tint").onChange(function() { material.uniforms.tint.value.setHex(params["tint"]); });

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
