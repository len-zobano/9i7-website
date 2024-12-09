import * as glMatrix from 'gl-matrix';

class Sculpted {
  #lastTime = 0;
  #selected = false;    
  #ID = null;

  get ID () {
    return this.#ID;
  }

  constructor() {
    this.#ID = `${new Date().getTime()}${Math.round(Math.random()*10000)}`;
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
  #buffers = null;

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



  simulate(world, thisTime) {
    if (this.#lastTime) {
      let interval = thisTime - this.#lastTime;

        if (this.#selected) {

            //right arrow
            if (this.#downKeys[39]) {
                this.#momentum[0] += this.#speed * interval / 20;
            }

            //up arrow
            if (this.#downKeys[38]) {
                if (this.#downKeys[16]) {
                    this.#momentum[2] += this.#speed * interval / 20;
                }
                else {
                    this.#momentum[1] += this.#speed * interval / 20;
                }
            }

            //down arrow
            if (this.#downKeys[40]) {         
                if (this.#downKeys[16]) {
                    this.#momentum[2] -= this.#speed * interval / 20;
                }
                else {
                    this.#momentum[1] -= this.#speed * interval / 20;
                }
            }

            //left arrow
            if (this.#downKeys[37]) {
                this.#momentum[0] -= this.#speed * interval / 20;
            }
        }

        this.#XAxisRotationsPerSecond *= Math.pow(0.9,this.#speed * interval/100);
        this.#YAxisRotationsPerSecond *= Math.pow(0.9,this.#speed * interval/100);

        //factor in the momentum change due to collision
        for (let i = 0; i < 3; ++i) {
            this.#momentum[i] += this.#collisionMomentum[i];
            this.#collisionMomentum[i] = 0;
        }

        this.#momentum = this.#momentum.map((momentum) => {
            return momentum * Math.pow(0.9,interval/100);
        })

        this.#YAngle += this.#YAxisRotationsPerSecond/interval;
        this.#XAngle += this.#XAxisRotationsPerSecond/interval;

        for (let i = 0; i < 3; ++i) {
            this.#position[i] += this.#momentum[i]/interval;
        }
    }

    this.#lastTime = thisTime;
  }

  draw(world) {
    if (this.#isCamera) {
        return;
    }
    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    // const modelViewMatrix = glMatrix.mat4.create();
    const modelViewMatrix = this.#world.modelViewMatrix;
  
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

    this.#world.gl.bindBuffer(this.#world.gl.ELEMENT_ARRAY_BUFFER, globalBuffers.indices);
    this.#world.gl.useProgram(globalProgramInfo.program);
    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    this.setPositionAttribute(this.#world.gl, globalBuffers, globalProgramInfo);
    // Tell WebGL to use our program when drawing
    this.setColorAttribute(this.#world.gl, globalBuffers, globalProgramInfo);
    
    // Set the shader uniforms
    this.#world.gl.uniformMatrix4fv(
      globalProgramInfo.uniformLocations.projectionMatrix,
      false,
      this.#world.projectionMatrix,
    );
    this.#world.gl.uniformMatrix4fv(
      globalProgramInfo.uniformLocations.modelViewMatrix,
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