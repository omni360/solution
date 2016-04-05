"use strict";

const LIBRARY = require("../build/solution");

module.exports = {

	"Passes": {

		"can be created and destroyed": function(test) {

			let pass = new LIBRARY.DistortionPass();
			test.ok(pass, "distortion");
			pass.dispose();

			pass = new LIBRARY.ReflectionPass();
			test.ok(pass, "reflection");
			pass.dispose();

			//pass = new LIBRARY.RefractionPass();
			//test.ok(pass, "refraction");
			//pass.dispose();

			test.done();

		}

	},

	"Materials": {

		"can be created": function(test) {

			let material = new LIBRARY.DistortionMaterial();
			test.ok(material, "distortion");

			material = new LIBRARY.DropletNoiseMaterial();
			test.ok(material, "droplet noise");

			material = new LIBRARY.LavaMaterial();
			test.ok(material, "lava");

			//material = new LIBRARY.OceanMaterial();
			//test.ok(material, "ocean");

			material = new LIBRARY.WaterMaterial();
			test.ok(material, "water");

			material = new LIBRARY.WaterfallMaterial();
			test.ok(material, "waterfall");

			test.done();

		}

	}

};
