import * as glMatrix from 'gl-matrix';

class WireframeDrawDelegate {
    #world = null;
    #shaderProgram = null;

    draw(positions) {
        let gl = this.#world.gl;
        gl.useProgram(this.#shaderProgram);

        let vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        let coordinates = gl.getAttribLocation(this.#shaderProgram, "coordinates");
        gl.vertexAttribPointer(coordinates, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(coordinates);
        gl.drawArrays(gl.LINES, 0, Math.floor(positions.length/3));
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    constructor(world) {
        this.#world = world;
        let gl = world.gl;

        let vertexShaderSource =
        'attribute vec3 coordinates;' +
        'void main(void) {' +
           ' gl_Position = vec4(coordinates, 1.0);' +
        '}';

        let vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        let fragmentShaderSource = 
        'void main(void) {' +
            'gl_FragColor = vec4(1.0,0.0,0.0,1.0);' +
        '}';

        let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        this.#shaderProgram = gl.createProgram();
        gl.attachShader(this.#shaderProgram, vertexShader);
        gl.attachShader(this.#shaderProgram, fragmentShader);
        gl.linkProgram(this.#shaderProgram);
    }

}

export default WireframeDrawDelegate;