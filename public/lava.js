/**
 * Manual asset loading.
 */

window.addEventListener("load", function loadAssets() {

	window.removeEventListener("load", loadAssets);

	var loadingManager = new THREE.LoadingManager();
	var textureLoader = new THREE.TextureLoader(loadingManager);

	var assets = {};

	loadingManager.onProgress = function(item, loaded, total) {

		if(loaded === total) { setupScene(assets); }

	};

	textureLoader.load("textures/noise.png", function(texture) {

		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		assets.noiseMapLava = texture;

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
	scene.fog = new THREE.FogExp2(0x000000, 0.02);
	renderer.setClearColor(0x000000);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.getElementById("viewport").appendChild(renderer.domElement);

	var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 20000);
	var controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 15, 0);
	controls.maxPolarAngle = Math.PI / 2 - 0.1;
	controls.enablePan = false;
	controls.maxDistance = 1000;
	controls.damping = 0.2;
	camera.position.set(0, 30, 50);
	camera.lookAt(controls.target);

	scene.add(camera);

	// Lights.

	var ambientLight = new THREE.AmbientLight(0x664400);
	scene.add(ambientLight);

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

	// Lava.

	var material = new SOLUTION.LavaMaterial(assets.noiseMapLava, {
		timeScale: 0.1,
		primarySpeed: 0.6,
		secondarySpeed: 1.9,
		displacement: 1.0,
		advection: 0.77,
		intensity: 1.4,
		octaveScale: new THREE.Vector2(2.0, 1.9),
		color: new THREE.Color(0.2, 0.07, 0.01)
	});

	material.uniforms.offsetRepeat.value.set(0, 0, 75, 75);

	var time = material.uniforms.time;

	var geometry = new THREE.PlaneBufferGeometry(1, 1);
	var mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.set(-Math.PI / 2, 0, 0);
	mesh.scale.set(2000, 2000, 1);

	scene.add(mesh);

	// Post-Processing.

	var composer = new POSTPROCESSING.EffectComposer(renderer);
	var renderPass = new POSTPROCESSING.RenderPass(scene, camera);
	//renderPass.renderToScreen = true;

	var bloomPass = new POSTPROCESSING.BloomPass({
		resolutionScale: 0.5,
		blurriness: 1.0,
		strength: 1.6
	});

	bloomPass.toneMappingMaterial.uniforms.averageLuminance.value = 0.075;
	//bloomPass.renderToScreen = true;

	var filmPass = new POSTPROCESSING.FilmPass({
		grayscale: false,
		noiseIntensity: 0.35,
		scanlinesIntensity: 0.95,
		scanlines: 1.4
	});

	filmPass.renderToScreen = true;

	composer.addPass(renderPass);
	composer.addPass(bloomPass);
	composer.addPass(filmPass);

	// Shader settings.

	var params = {
		"time scale": material.uniforms.timeScale.value,
		"primary speed": material.uniforms.primarySpeed.value,
		"secondary speed": material.uniforms.secondarySpeed.value,
		"displacement": material.uniforms.displacement.value,
		"advection": material.uniforms.advection.value,
		"intensity": material.uniforms.intensity.value,
		"octave scale X": material.uniforms.octaveScale.value.x,
		"octave scale Y": material.uniforms.octaveScale.value.y,
		"color": material.uniforms.lavaColor.value.getHex(),
		"fog density": scene.fog.density,
		"post processing": true
	};

	gui.add(params, "time scale").min(0.0).max(1.0).step(0.01).onChange(function() { material.uniforms.timeScale.value = params["time scale"]; });
	gui.add(params, "primary speed").min(0.0).max(4.0).step(0.1).onChange(function() { material.uniforms.primarySpeed.value = params["primary speed"]; });
	gui.add(params, "secondary speed").min(0.0).max(4.0).step(0.1).onChange(function() { material.uniforms.secondarySpeed.value = params["secondary speed"]; });
	gui.add(params, "displacement").min(0.0).max(3.0).step(0.1).onChange(function() { material.uniforms.displacement.value = params["displacement"]; });
	gui.add(params, "advection").min(-1.0).max(1.0).step(0.01).onChange(function() { material.uniforms.advection.value = params["advection"]; });

	var f = gui.addFolder("Octave scale");
	f.add(params, "octave scale X").min(0.0).max(4.0).step(0.1).onChange(function() { material.uniforms.octaveScale.value.x = params["octave scale X"]; });
	f.add(params, "octave scale Y").min(0.0).max(4.0).step(0.1).onChange(function() { material.uniforms.octaveScale.value.y = params["octave scale Y"]; });
	f.open();

	gui.add(params, "intensity").min(0.0).max(3.0).step(0.1).onChange(function() { material.uniforms.intensity.value = params["intensity"]; });
	gui.addColor(params, "color").onChange(function() { material.uniforms.lavaColor.value.setHex(params["color"]); });

	gui.add(params, "post processing").onChange(function() {

		var pp = params["post processing"];

		bloomPass.enabled = pp;
		filmPass.enabled = pp;

		renderPass.renderToScreen = !pp;

	});

	gui.add(params, "fog density").min(0.003).max(0.025).step(0.001).onChange(function() { scene.fog.density = params["fog density"]; });

	/**
	 * Handles resizing.
	 */

	window.addEventListener("resize", function resize() {

		var width = window.innerWidth;
		var height = window.innerHeight;

		renderer.setSize(width, height);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		composer.reset();

	});

	/**
	 * Animation loop.
	 */

	var dt = 1.0 / 60.0;

	(function render(now) {

		requestAnimationFrame(render);

		stats.begin();

		composer.render();

		time.value += dt;

		stats.end();

	}());

}
