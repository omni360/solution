window.addEventListener("load", function init() {

	window.removeEventListener("load", init);

	// Renderer and Scene.

	var renderer = new THREE.WebGLRenderer({antialias: true, logarithmicDepthBuffer: true});
	var scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0xffffff, 0.0001);
	renderer.setClearColor(0xffffff);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.getElementById("viewport").appendChild(renderer.domElement);

	// Camera.

	var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 40000);
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

	// Helpers.

	//scene.add(new THREE.DirectionalLightHelper(directionalLight, 1.0));

	// Sky.

	var path = "textures/skies/alps/";
	var format = ".png";
	var urls = [
		path + "pz" + format, path + "nz" + format,
		path + "py" + format, path + "ny" + format,
		path + "px" + format, path + "nx" + format
	];

	var cubeTextureLoader = new THREE.CubeTextureLoader();
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

		var skyMesh = new THREE.Mesh(new THREE.BoxGeometry(100000, 100000, 100000), skyBoxMaterial);

		camera.add(skyMesh);

	});

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
	composer.addPass(new POSTPROCESSING.RenderPass(scene, camera));

	var pass = new SOLUTION.DistortionPass({
		resolution: 0.4,
		rollOffSpeed: new THREE.Vector2(0.5, 0.004),
		waveStrength: new THREE.Vector2(0.25, 0.5),
		speed: 1.0
	});

	document.addEventListener("keyup", function(event) {

		var key = event.keyCode || event.which;

		if(key === 32) { pass.dissolve = !pass.dissolve; }

	});

	pass.renderToScreen = true;
	composer.addPass(pass);

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

	var TWO_PI = 2.0 * Math.PI;

	(function render(now) {

		stats.begin();

		object.rotation.x += 0.0005;
		object.rotation.y += 0.001;

		composer.render();

		// Prevent overflow.
		if(object.rotation.x >= TWO_PI) { object.rotation.x -= TWO_PI; }
		if(object.rotation.y >= TWO_PI) { object.rotation.y -= TWO_PI; }

		stats.end();

		requestAnimationFrame(render);

	}());

});
