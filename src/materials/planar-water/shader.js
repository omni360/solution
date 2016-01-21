var fs = require("fs");

var shader = {
	fragment: {
		high: fs.readFileSync(__dirname + "/glsl/shader.high.frag", "utf-8"),
		low: fs.readFileSync(__dirname + "/glsl/shader.low.frag", "utf-8")
	},
	vertex: fs.readFileSync(__dirname + "/glsl/shader.vert", "utf-8"),
};
