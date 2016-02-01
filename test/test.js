var lib = require("../build/solution");

module.exports = {

	"the distortion pass can be created and destroyed": function(test) {

		var x = new lib.DistortionPass();
		test.equals(typeof x, "object");
		x.dispose();

		test.done();

	}

};
