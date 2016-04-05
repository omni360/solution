#define WATERFALL

#include <common>
#include <logdepthbuf_pars_vertex>

uniform vec4 offsetRepeat;

varying vec2 vUv;

void main() {

	vUv = uv * offsetRepeat.zw + offsetRepeat.xy;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

	#include <logdepthbuf_vertex>

}
