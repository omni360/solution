/**
 * Manual asset loading.
 */

window.addEventListener("load", function loadAssets() {

	window.removeEventListener("load", loadAssets);

	var loadingManager = new THREE.LoadingManager();
	var cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager);

	var assets = {};

	loadingManager.onProgress = function(item, loaded, total) {

		if(loaded === total) { setupScene(assets); }

	};

	var path = "textures/skies/alps/";
	var format = ".png";
	var urls = [
		path + "px" + format, path + "nx" + format,
		path + "py" + format, path + "ny" + format,
		path + "pz" + format, path + "nz" + format
	];

	cubeTextureLoader.load(urls, function(textureCube) {

		var shader = THREE.ShaderLib.cube;
		shader.uniforms.tCube.value = textureCube;

		var skyBoxMaterial = new THREE.ShaderMaterial( {
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader,
			uniforms: shader.uniforms,
			depthWrite: false,
			side: THREE.BackSide,
			fog: false
		});

		assets.sky = new THREE.Mesh(new THREE.BoxGeometry(2000, 2000, 2000), skyBoxMaterial);

	});

});

function setupScene(assets) {

	// Renderer and Scene.

	var renderer = new THREE.WebGLRenderer({antialias: true, logarithmicDepthBuffer: true});
	var scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0xffffff, 0.0001);
	renderer.setClearColor(0xffffff);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.getElementById("viewport").appendChild(renderer.domElement);

	// Camera.

	var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
	var controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 0, 0);
	controls.damping = 0.2;
	camera.position.set(25, -12, 10);
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

	document.addEventListener("keydown", function(event) {

		if(event.altKey) {

			event.preventDefault();
			aside.style.visibility = (aside.style.visibility === "hidden") ? "visible" : "hidden";

		}

	});

	// Lights.

	var hemisphereLight = new THREE.AmbientLight(0x444444);
	var directionalLight = new THREE.DirectionalLight(0xffbbaa);

	directionalLight.position.set(-1, 0.75, -0.375).multiplyScalar(1000.0);
	directionalLight.target.position.copy(scene.position);

	scene.add(directionalLight);
	scene.add(hemisphereLight);

	// Sky.

	camera.add(assets.sky);

	// Random objects.

	object = new THREE.Object3D();

	var i, mesh;
	var geometry = new THREE.SphereBufferGeometry(0.1, 4, 4);
	var material = new THREE.MeshPhongMaterial({color: 0xffffff, shading: THREE.FlatShading});

	for(i = 0; i < 100; ++i) {

		material = new THREE.MeshPhongMaterial({color: 0xffffff * Math.random(), shading: THREE.FlatShading});

		mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
		mesh.position.multiplyScalar(Math.random() * 75);
		mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
		mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 10;
		object.add(mesh);

	}

	scene.add(object);

	// Post-Processing.

	var composer = new POSTPROCESSING.EffectComposer(renderer);
	var renderPass = new POSTPROCESSING.RenderPass(scene, camera);
	composer.addPass(renderPass);

	var pass = new SOLUTION.DistortionPass({
		resolution: 512,
		rollOffSpeed: new THREE.Vector2(0.5, 0.004),
		waveStrength: new THREE.Vector2(0.25, 0.5),
		highQuality: false
	});

	pass.renderToScreen = true;
	composer.addPass(pass);

	// Shader settings.

	var params = {
		"speed": pass.speed,
		"resolution": Math.round(Math.log(pass.resolution) / Math.log(2)),
		"drops": pass.distortionMaterial.uniforms.rollOffSpeed.value.x,
		"droplets": pass.distortionMaterial.uniforms.rollOffSpeed.value.y,
		"sine": pass.distortionMaterial.uniforms.waveStrength.value.x,
		"cosine": pass.distortionMaterial.uniforms.waveStrength.value.y,
		"tint": pass.distortionMaterial.uniforms.tint.value.getHex(),
		"high quality": pass.noiseMaterial.defines.HIGH_QUALITY !== undefined,
		"dissolve": pass.dissolve
	};

	gui.add(params, "speed").min(0.0).max(3.0).step(0.01).onChange(function() { pass.speed = params["speed"]; });
	gui.add(params, "resolution").min(6).max(11).step(1).onChange(function() { pass.resolution = Math.pow(2, params["resolution"]); });

	var f = gui.addFolder("Roll-off speed");
	f.add(params, "drops").min(0.5).max(1.5).step(0.01).onChange(function() { pass.distortionMaterial.uniforms.rollOffSpeed.value.x = params["drops"]; });
	f.add(params, "droplets").min(0.0).max(0.05).step(0.001).onChange(function() { pass.distortionMaterial.uniforms.rollOffSpeed.value.y = params["droplets"]; });
	f.open();

	f = gui.addFolder("Wave strength");
	f.add(params, "sine").min(0.0).max(3.0).step(0.01).onChange(function() { pass.distortionMaterial.uniforms.waveStrength.value.x = params["sine"]; });
	f.add(params, "cosine").min(0.0).max(3.0).step(0.01).onChange(function() { pass.distortionMaterial.uniforms.waveStrength.value.y = params["cosine"]; });
	f.open();

	gui.addColor(params, "tint").onChange(function() { pass.distortionMaterial.uniforms.tint.value.setHex(params["tint"]); });

	gui.add(params, "high quality").onChange(function() {

		renderPass.renderToScreen = true;
		pass.enabled = false;
		pass.noiseMaterial.dispose();
		pass.noiseMaterial = new SOLUTION.NoiseMaterial(params["high quality"]);
		pass.resolution = Math.pow(2, params["resolution"]);
		pass.enabled = true;
		renderPass.renderToScreen = false;

	});

	gui.add(params, "dissolve").onChange(function() { pass.dissolve = params["dissolve"]; }).listen();

	document.addEventListener("keyup", function(event) {

		var key = event.keyCode || event.which;
		if(key === 32) { params["dissolve"] = pass.dissolve = !pass.dissolve; }

	});

	/**
	 * Handles resizing.
	 */

	window.addEventListener("resize", function resize() {

		var width = window.innerWidth;
		var height = window.innerHeight;

		composer.setSize(width, height);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();

	});

	/**
	 * Animation loop.
	 */

	var TWO_PI = 2.0 * Math.PI;
	var dt = 1.0 / 60.0;

	(function render(now) {

		requestAnimationFrame(render);

		stats.begin();

		object.rotation.x += 0.0005;
		object.rotation.y += 0.001;

		composer.render(dt);

		// Prevent overflow.
		if(object.rotation.x >= TWO_PI) { object.rotation.x -= TWO_PI; }
		if(object.rotation.y >= TWO_PI) { object.rotation.y -= TWO_PI; }

		stats.end();

	}());

};
