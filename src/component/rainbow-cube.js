import * as glMatrix from 'gl-matrix';

class RainbowCube {
  #lastTime = 0;
    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    setPositionAttribute(gl, buffers, programInfo) {
      const numComponents = 2; // pull out 2 values per iteration
      const type = gl.FLOAT; // the data in the buffer is 32bit floats
      const normalize = false; // don't normalize
      const stride = 0; // how many bytes to get from one set of values to the next
      // 0 = use type and numComponents above
      const offset = 0; // how many bytes inside the buffer to start from
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.vertexAttribPointer(
          programInfo.attribLocations.vertexPosition,
          numComponents,
          type,
          normalize,
          stride,
          offset,
      );
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }

  setColorAttribute(gl, buffers, programInfo) {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      numComponents,
      type,
      normalize,
      stride,
      offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
  }

  initPositionBuffer(gl) {
    // Create a buffer for the square's positions.
    const positionBuffer = gl.createBuffer();
  
    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
    // Now create an array of positions for the square.
    const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
  
    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
    return positionBuffer;
} 

  initColorBuffer(gl) {
    const colors = [
      1.0,
      1.0,
      1.0,
      1.0, // white
      1.0,
      0.0,
      0.0,
      1.0, // red
      0.0,
      1.0,
      0.0,
      1.0, // green
      0.0,
      0.0,
      1.0,
      1.0, // blue
    ];
  
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  
    return colorBuffer;
  }

  initBuffers(gl) {
    const positionBuffer = this.initPositionBuffer(gl);
    const colorBuffer = this.initColorBuffer(gl);
  
    return {
      color: colorBuffer,
      position: positionBuffer,
    };
  }

  #position = [0,0,0];

  get position() {
    return this.#position;
  }

  set position(position) {
    this.#position = position;
  }

  #programInfo = null;
  #world = null;
  #angle = 0;
  #buffers = null;

  get vertexShaderSource () {return `
  attribute vec4 aVertexPosition;
  attribute vec4 aVertexColor;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying lowp vec4 vColor;

  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;
  }
`;}

  get fragmentShaderSource ()  { return `
  varying lowp vec4 vColor;

  void main(void) {
    gl_FragColor = vColor;
  }
  `;}

  loadShader(gl, type, source) {
    const shader = gl.createShader(type);
  
    // Send the source to the shader object
    gl.shaderSource(shader, source);
  
    // Compile the shader program
    gl.compileShader(shader);
  
    // See if it compiled successfully
  
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log(
        `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
      );
      gl.deleteShader(shader);
      return null;
    }
  
    return shader;
  }

  initializeGL(world) {
    this.#world = world;
    const vertexShader = this.loadShader(world.gl, world.gl.VERTEX_SHADER, this.vertexShaderSource);
    const fragmentShader = this.loadShader(world.gl, world.gl.FRAGMENT_SHADER, this.fragmentShaderSource);
  
    // Create the shader program
  
    const shaderProgram = world.gl.createProgram();
    this.shaderProgram = shaderProgram;
    world.gl.attachShader(shaderProgram, vertexShader);
    world.gl.attachShader(shaderProgram, fragmentShader);
    world.gl.linkProgram(shaderProgram);
  
    // If creating the shader program failed, console.log
  
    if (!world.gl.getProgramParameter(shaderProgram, world.gl.LINK_STATUS)) {
      console.log(
        `Unable to initialize the shader program: ${world.gl.getProgramInfoLog(
          shaderProgram,
        )}`,
      );
      return null;
    }

    this.#buffers = this.initBuffers(this.#world.gl);

    /*
        Initialize the shape buffer
    */
    
    this.#programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: world.gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            vertexColor: world.gl.getAttribLocation(shaderProgram, "aVertexColor"),
        },
        uniformLocations: {
            projectionMatrix: world.gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
            modelViewMatrix: world.gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
        },
    };

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    this.setPositionAttribute(this.#world.gl, this.#buffers, this.#programInfo);
  
    // Tell WebGL to use our program when drawing
    this.setColorAttribute(this.#world.gl, this.#buffers, this.#programInfo);

  }

  simulate(world, thisTime) {
    if (this.#lastTime) {
      let interval = thisTime - this.#lastTime;
      this.#angle += interval / 500;
    }
    
    this.#lastTime = thisTime;
  }

  draw(world) {
    console.log("drawng cube");
    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = glMatrix.mat4.create();
  
    // Now move the drawing position a bit to where we want to
    // start drawing the square.
    glMatrix.mat4.translate(
      modelViewMatrix, // destination matrix
      modelViewMatrix, // matrix to translate
      this.#position,
    ); // amount to translate

    glMatrix.mat4.rotate(
      modelViewMatrix, // destination matrix
      modelViewMatrix, // matrix to rotate
      this.#angle, // amount to rotate in radians
      [0, 0, 1],
    );

    this.#world.gl.useProgram(this.#programInfo.program);
  
    // Set the shader uniforms
    this.#world.gl.uniformMatrix4fv(
      this.#programInfo.uniformLocations.projectionMatrix,
      false,
      this.#world.projectionMatrix,
    );
    this.#world.gl.uniformMatrix4fv(
      this.#programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix,
    );
  
    {
      const offset = 0;
      const vertexCount = 4;
      this.#world.gl.drawArrays(this.#world.gl.TRIANGLE_STRIP, offset, vertexCount);
    }
  }
}

export default RainbowCube;