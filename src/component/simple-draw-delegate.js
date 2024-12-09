import * as glMatrix from 'gl-matrix';

let globalVertexShaderSource = `
attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying lowp vec4 vColor;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  vColor = aVertexColor;
}
`,

globalFragmentShaderSource = `
varying lowp vec4 vColor;

void main(void) {
  gl_FragColor = vColor;
}
`,

globalFragmentShader = null,
globalVertexShader = null;

class SimpleDrawDelegate {
    #buffers = null;
    #colorAttributes = null;
    #shaderProgram = null;
    #programInfo = null;
    #world = null;

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    setPositionAttribute() {
        const numComponents = 3; // pull out 2 values per iteration
        const type = this.#world.gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, this.#buffers.position);
        gl.vertexAttribPointer(
            this.#programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset,
        );
        gl.enableVertexAttribArray(this.#programInfo.attribLocations.vertexPosition);
      }
  
    setColorAttribute() {
      const numComponents = 4;
      const type = this.#world.gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.#buffers.color);
      gl.vertexAttribPointer(
        this.#programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset,
      );
      gl.enableVertexAttribArray(this.#programInfo.attribLocations.vertexColor);
    }

    initIndexBuffer(indices) {
        const indexBuffer = this.#world.gl.createBuffer();
        this.#world.gl.bindBuffer(this.#world.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        // Now send the element array to GL
      
        gl.bufferData(
          gl.ELEMENT_ARRAY_BUFFER,
          new Uint16Array(indices),
          gl.STATIC_DRAW,
        );
      
        return indexBuffer;
      }

    initPositionBuffer(positions) {
        // Create a buffer for the square's positions.
        const positionBuffer = this.#world.gl.createBuffer();
    
        // Select the positionBuffer as the one to apply buffer
        // operations to from here out.
        gl.bindBuffer(this.#world.gl.ARRAY_BUFFER, positionBuffer);
        // Now pass the list of positions into WebGL to build the
        // shape. We do this by creating a Float32Array from the
        // JavaScript array, then use it to fill the current buffer.
        gl.bufferData(this.#world.gl.ARRAY_BUFFER, new Float32Array(positions), this.#world.gl.STATIC_DRAW);
    
        return positionBuffer;
    } 

    draw(world) {
        this.#world.gl.bindBuffer(this.#world.gl.ELEMENT_ARRAY_BUFFER, this.#buffers.indices);
        this.#world.gl.useProgram(globalProgramInfo.program);
        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        this.setPositionAttribute(this.#world.gl, this.#buffers, globalProgramInfo);
        // Tell WebGL to use our program when drawing
        this.setColorAttribute(this.#world.gl, this.#buffers, globalProgramInfo);
        
        // Set the shader uniforms
        this.#world.gl.uniformMatrix4fv(
          globalProgramInfo.uniformLocations.projectionMatrix,
          false,
          this.#world.projectionMatrix,
        );
        this.#world.gl.uniformMatrix4fv(
          globalProgramInfo.uniformLocations.modelViewMatrix,
          false,
          this.#world.modelViewMatrix,
        );
      
        {
          const type = this.#world.gl.UNSIGNED_SHORT;
          this.#world.gl.drawElements(
            this.#world.gl.TRIANGLES, 
            this.#buffers.indices.length, 
            type, 
            offset
          );
        }
      }

    constructor(world) {
        this.#world = world;
        if (!globalVertexShader) {
            globalVertexShader = this.loadShader(world.gl, world.gl.VERTEX_SHADER, globalVertexShaderSource);
        }
        if (!globalFragmentShader) {
            globalFragmentShader = this.loadShader(world.gl, world.gl.FRAGMENT_SHADER, globalFragmentShaderSource);
        }
        // Create the shader program
      
        if (!globalShaderProgram) {
            globalShaderProgram = world.gl.createProgram();
            world.gl.attachShader(globalShaderProgram, globalVertexShader);
            world.gl.attachShader(globalShaderProgram, globalFragmentShader);
            world.gl.linkProgram(globalShaderProgram);
    
            // If creating the shader program failed, console.log
            if (!world.gl.getProgramParameter(globalShaderProgram, world.gl.LINK_STATUS)) {
                console.log(
                `Unable to initialize the shader program: ${world.gl.getProgramInfoLog(
                    globalShaderProgram,
                )}`,
                );
                return null;
            }
        }
    
        if (!this.#buffers) {
            this.#buffers = this.initBuffers(this.#world.gl);
        }
    
        /*
            Initialize the shape buffer
        */
        
        if (!this.#programInfo) {
            this.#programInfo = {
                program: globalShaderProgram,
                attribLocations: {
                    vertexPosition: world.gl.getAttribLocation(globalShaderProgram, "aVertexPosition"),
                    vertexColor: world.gl.getAttribLocation(globalShaderProgram, "aVertexColor"),
                },
                uniformLocations: {
                    projectionMatrix: world.gl.getUniformLocation(globalShaderProgram, "uProjectionMatrix"),
                    modelViewMatrix: world.gl.getUniformLocation(globalShaderProgram, "uModelViewMatrix"),
                },
            };
        }
      }

}

export default SimpleDrawDelegate;