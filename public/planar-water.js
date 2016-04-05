window.addEventListener("load", function loadAssets() {

	window.removeEventListener("load", loadAssets);

	var loadingManager = new THREE.LoadingManager();
	var textureLoader = new THREE.TextureLoader(loadingManager);
	var modelLoader = new THREE.ObjectLoader(loadingManager);
	var cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager);

	var assets = {};

	loadingManager.onProgress = function(item, loaded, total) {

		if(loaded === total) { setupScene(assets); }

	};

	var path = "textures/skies/sunny/";
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

	textureLoader.load("textures/normals1.jpg", function(texture) {

		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

		assets.normalMapWater = texture;

	});

	textureLoader.load("textures/ocean1.jpg", function(texture) {

		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		assets.colorMapGround = texture;

	});

	textureLoader.load("textures/stonenormals.jpg", function(texture) {

		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		assets.normalMapGround = texture;

	});

});

function setupScene(assets) {

	var viewport = document.getElementById("viewport");
	viewport.removeChild(viewport.children[0]);

	// Renderer and Scene.

	var renderer = new THREE.WebGLRenderer({antialias: true, logarithmicDepthBuffer: true});
	var scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0xc1d0bd, 0.00);
	renderer.setClearColor(0xc1d0bd);
	renderer.setSize(window.innerWidth, window.innerHeight);
	viewport.appendChild(renderer.domElement);

	// Camera.

	var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
	var controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 2, 0);
	//controls.enablePan = false;
	//controls.maxDistance = 1000;
	controls.damping = 0.2;
	camera.position.set(5, 2, -10);
	camera.lookAt(controls.target);

	scene.add(camera);

	// Overlay.

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

	var hemisphereLight = new THREE.HemisphereLight(0xbbffbb, 0x080820, 0.5);
	var directionalLight = new THREE.DirectionalLight(0xffbbaa);

	directionalLight.position.set(450, 200, -200);
	directionalLight.target.position.copy(scene.position);

	scene.add(directionalLight);
	scene.add(hemisphereLight);

	// Sky.

	scene.add(assets.sky);

	// Ground.

	var object = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1), new THREE.MeshPhongMaterial());

	assets.colorMapGround.repeat.set(4, 4);
	assets.normalMapGround.repeat.set(4, 4);
	object.material.map = assets.colorMapGround;
	object.material.normalMap = assets.normalMapGround;
	object.material.shininess = 1.0;
	object.rotation.set(-Math.PI / 2, 0, 0);
	object.position.set(0, -100, 0);
	object.scale.set(2000, 2000, 1);

	scene.add(object);

	// Reflection and refraction.

	var composer = new POSTPROCESSING.EffectComposer(renderer);

	var reflectionPass = new SOLUTION.ReflectionPass(scene, camera, {
		resolution: 256,
		clipBias: 0.2
	});

	var mesh = reflectionPass.object;

	composer.addPass(reflectionPass);

	var renderPass = new POSTPROCESSING.RenderPass(scene, camera);
	renderPass.renderToScreen = true;

	composer.addPass(renderPass);

	// Water.

	var material = new SOLUTION.WaterMaterial({
		lightPosition: directionalLight.position,
		normalMap: assets.normalMapWater
	});

	material.uniforms.waveScale.value = 1400;

	material.normalMap = assets.normalMapWater;
	material.reflectionMap = reflectionPass.reflectionTexture;
	material.refractionMap = assets.colorMapGround;

	var time = material.uniforms.time;

	mesh.material = material;
	reflectionPass.materials.push(material);

	mesh.rotation.set(-Math.PI / 2, 0, 0);
	mesh.scale.set(2000, 2000, 1);

	scene.add(mesh);

	// Render textures.

	var billboardMaterial = new THREE.PointsMaterial({
		color: 0xffffff,
		map: reflectionPass.reflectionTexture,
		sizeAttenuation: false,
		transparent: false,
		depthWrite: false,
		fog: false,
		size: 128
	});

	reflectionPass.materials.push(billboardMaterial);

	var billboardGeometry = new THREE.Geometry();
	billboardGeometry.vertices.push(new THREE.Vector3());
	var billboard = new THREE.Points(billboardGeometry, billboardMaterial);

	billboard.position.set(-0.0, -0.0, -1.0);

	camera.add(billboard);

	/**
	 * Handles resizing.
	 */

	function resize() {

		var width = window.innerWidth;
		var height = window.innerHeight;

		composer.setSize(width, height);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();

	}

	resize();

	window.addEventListener("resize", resize);

	/**
	 * Animation loop.
	 */

	var clock = new THREE.Clock(true);

	(function render(now) {

		requestAnimationFrame(render);

		stats.begin();

		composer.render();

		time.value += clock.getDelta();

		stats.end();

	}());

}
