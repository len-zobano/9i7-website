import * as glMatrix from 'gl-matrix';

class RainbowCube {
  #lastTime = 0;
  #YAxisRotationsPerSecond = 0;
  #XAxisRotationsPerSecond = 0;
  #ZAxisRotationsPerSecond = 0;
  #YAxisTranslationsPerSecond = 0;
  #XAxisTranslationsPerSecond = 0;
  #ZAxisTranslationsPerSecond = 0;
  #selected = false;    
  get broadCollisionRadius () {
    return 1.2;
  }
    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    setPositionAttribute(gl, buffers, programInfo) {
      const numComponents = 3; // pull out 2 values per iteration
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

    #downKeys = {};

    detectCollision(otherCollidable) {
        let distance = Math.pow(
            Math.pow(otherCollidable.position[0] - this.position[0], 2) +
            Math.pow(otherCollidable.position[1] - this.position[1], 2) +
            Math.pow(otherCollidable.position[2] - this.position[2], 2)
        ,0.5);
        
        let minimumDistance = otherCollidable.broadCollisionRadius + this.broadCollisionRadius;

        return distance <= minimumDistance;
    }

    onCollision(otherCollidable) {
        this.#XAxisTranslationsPerSecond *= -1;
        this.#YAxisTranslationsPerSecond *= -1;
        this.#ZAxisTranslationsPerSecond *= -1;
    }

    select(selected) {
        console.log("select at cube");
        this.#selected = selected;
    }

    keyIsDown(keyCode) {
        this.#downKeys[keyCode] = true;
    }

    keyIsUp(keyCode) {
        this.#downKeys[keyCode] = false;
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

  initIndexBuffer(gl) {
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  
    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.
  
    const indices = [
      0,
      1,
      2,
      0,
      2,
      3, // front
      4,
      5,
      6,
      4,
      6,
      7, // back
      8,
      9,
      10,
      8,
      10,
      11, // top
      12,
      13,
      14,
      12,
      14,
      15, // bottom
      16,
      17,
      18,
      16,
      18,
      19, // right
      20,
      21,
      22,
      20,
      22,
      23, // left
    ];
  
    // Now send the element array to GL
  
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW,
    );
  
    return indexBuffer;
  }

  initPositionBuffer(gl) {
    // Create a buffer for the square's positions.
    const positionBuffer = gl.createBuffer();
  
    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
    // Now create an array of positions for the square.
    const positions = [
        // Front face
        -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
      
        // Back face
        -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
      
        // Top face
        -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
      
        // Bottom face
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
      
        // Right face
        1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
      
        // Left face
        -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
      ];
  
    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
    return positionBuffer;
} 

  initColorBuffer(gl) {
    const faceColors = [
        [1.0, 1.0, 1.0, 1.0], // Front face: white
        [1.0, 0.0, 0.0, 1.0], // Back face: red
        [0.0, 1.0, 0.0, 1.0], // Top face: green
        [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
        [1.0, 1.0, 0.0, 1.0], // Right face: yellow
        [1.0, 0.0, 1.0, 1.0], // Left face: purple
      ];
      
      // Convert the array of colors into a table for all the vertices.

    let colors = [];

    for (var j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        // Repeat each color four times for the four vertices of the face
        colors = colors.concat(c, c, c, c);
    }// Convert the array of colors into a table for all the vertices.
  
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  
    return colorBuffer;
  }

  initBuffers(gl) {
    const positionBuffer = this.initPositionBuffer(gl);
    const colorBuffer = this.initColorBuffer(gl);
    const indexBuffer = this.initIndexBuffer(gl);

    return {
      indices: indexBuffer,
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
  #XAngle = 0;
  #YAngle = 0;
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


  }

  simulate(world, thisTime) {
    if (this.#lastTime) {
      let interval = thisTime - this.#lastTime;

        if (this.#selected) {
            //a is down
            if (this.#downKeys[65]) {
                this.#YAxisRotationsPerSecond -= interval / 50;
            }

            //d is down
            if (this.#downKeys[68]) {
                this.#YAxisRotationsPerSecond += interval / 50;
            }

            //w
            if (this.#downKeys[87]) {
                this.#XAxisRotationsPerSecond -= interval / 50;
            }

            //w
            if (this.#downKeys[83]) {
                this.#XAxisRotationsPerSecond += interval / 50;
            }

            //right arrow
            if (this.#downKeys[39]) {
                this.#XAxisTranslationsPerSecond += interval / 20;
            }

            //up arrow
            if (this.#downKeys[38]) {
                if (this.#downKeys[16]) {
                    this.#ZAxisTranslationsPerSecond += interval / 20;
                }
                else {
                    this.#YAxisTranslationsPerSecond += interval / 20;
                }
            }

            //down arrow
            if (this.#downKeys[40]) {         
                if (this.#downKeys[16]) {
                    this.#ZAxisTranslationsPerSecond -= interval / 20;
                }
                else {
                    this.#YAxisTranslationsPerSecond -= interval / 20;
                }
            }

            //left arrow
            if (this.#downKeys[37]) {
                this.#XAxisTranslationsPerSecond -= interval / 20;
            }
        }

        this.#XAxisRotationsPerSecond *= Math.pow(0.9,interval/100);
        this.#YAxisRotationsPerSecond *= Math.pow(0.9,interval/100);
        this.#XAxisTranslationsPerSecond *= Math.pow(0.9,interval/100);
        this.#YAxisTranslationsPerSecond *= Math.pow(0.9,interval/100);
        this.#ZAxisTranslationsPerSecond *= Math.pow(0.9,interval/100);

        this.#YAngle += this.#YAxisRotationsPerSecond/interval;
        this.#XAngle += this.#XAxisRotationsPerSecond/interval;

        this.#position[0] += this.#XAxisTranslationsPerSecond/interval;
        this.#position[1] += this.#YAxisTranslationsPerSecond/interval;
        this.#position[2] += this.#ZAxisTranslationsPerSecond/interval;
    }

    this.#lastTime = thisTime;
  }

  draw(world) {
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

    // glMatrix.mat4.rotate(
    //   modelViewMatrix, // destination matrix
    //   modelViewMatrix, // matrix to rotate
    //   this.#angle, // amount to rotate in radians
    //   [0, 0, 1],
    // );

    glMatrix.mat4.rotate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        this.#YAngle, // amount to rotate in radians
        [0, 1, 0],
    );

    glMatrix.mat4.rotate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        this.#XAngle, // amount to rotate in radians
        [1, 0, 0],
    );

    this.#world.gl.bindBuffer(this.#world.gl.ELEMENT_ARRAY_BUFFER, this.#buffers.indices);
    this.#world.gl.useProgram(this.#programInfo.program);
    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    this.setPositionAttribute(this.#world.gl, this.#buffers, this.#programInfo);
    // Tell WebGL to use our program when drawing
    this.setColorAttribute(this.#world.gl, this.#buffers, this.#programInfo);
    
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
      const vertexCount = 36;
      const type = this.#world.gl.UNSIGNED_SHORT;
      this.#world.gl.drawElements(this.#world.gl.TRIANGLES, vertexCount, type, offset);
    }
  }
}

export default RainbowCube;