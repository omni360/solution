# Solution 
[![Build status](https://travis-ci.org/vanruesc/solution.svg?branch=master)](https://travis-ci.org/vanruesc/solution) 
[![npm version](https://badge.fury.io/js/solution.svg)](http://badge.fury.io/js/solution) 
[![Dependencies](https://david-dm.org/vanruesc/solution.svg?branch=master)](https://david-dm.org/vanruesc/solution)

An animation library for three.js that provides different kinds of liquid effects. 


## Installation

```sh
$ npm install solution
``` 


## Usage

```javascript
// Attention: Three is not yet an ES6 module!
import {
	WebGLRenderer,
	PerspectiveCamera,
	PlaneBufferGeometry,
	TextureLoader,
	Constants,
	Scene,
	Mesh
} from "three";

import { LavaMaterial } from "solution";

var renderer = new WebGLRenderer();
var camera = new PerspectiveCamera();
var scene = new Scene();

var geometry = new PlaneBufferGeometry(1, 1);
var mesh = new Mesh(geometry, null);

var textureLoader = new TextureLoader();

textureLoader.load("textures/noise.png", function(texture) {

	texture.wrapS = texture.wrapT = Constants.RepeatWrapping;
	mesh.material = new LavaMaterial(texture);
	mesh.material.uniforms.offsetRepeat.value.set(0, 0, 75, 75);
	mesh.rotation.set(-Math.PI / 2, 0, 0);
	mesh.scale.set(2000, 2000, 1);
	scene.add(mesh);

});

camera.position.set(0, 30, 50);
camera.lookAt(scene);

(function render(now) {

	renderer.render(scene, camera);
	requestAnimationFrame(render);

}());
```


## Included Effects
 - [Distortion Droplet Filter](http://vanruesc.github.io/solution/public/distortion.html) 
 - [Planar Water](http://vanruesc.github.io/solution/public/planar-water.html) (WIP) 
 - Oceanic Water 
 - [Waterfall](http://vanruesc.github.io/solution/public/waterfall.html) 
 - [Lava](http://vanruesc.github.io/solution/public/lava.html) 


## Documentation
[API](http://vanruesc.github.io/solution/docs)


## Contributing
Maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.


## License
This library is licensed under the [Zlib license](https://github.com/vanruesc/solution/blob/master/LICENSE)  
The original [lava shader](https://github.com/vanruesc/solution/blob/master/src/materials/lava/glsl/shader.frag#L50-L130) 
was written by [nimitz](https://www.shadertoy.com/user/nimitz) and is licensed under a 
[Creative Commons license](http://creativecommons.org/licenses/by-nc-sa/3.0/legalcode) 
