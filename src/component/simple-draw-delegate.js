import * as glMatrix from 'gl-matrix';

let globalVertexShaderSource = `
attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

varying lowp vec4 vColor;
varying highp vec3 vLighting;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  vColor = aVertexColor;

  highp vec3 ambientLight = vec3(0.2 , 0.2, 0.2);
  highp vec3 directionalLightColor = vec3(1, 1, 0.7);
  highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

  highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
  highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
  vLighting = ambientLight + (directionalLightColor * directional);
}
`,

globalFragmentShaderSource = `
varying lowp vec4 vColor;
varying highp vec3 vLighting;

void main(void) {
  // gl_FragColor = vColor;
  gl_FragColor = vec4(vColor.rgb * vLighting, vColor.a);
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
    #positions = null;
    #colors = null;
    #indices = null;
    #normals = null;

    setNormalAttribute() {
      const numComponents = 3;
      const type = this.#world.gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      this.#world.gl.bindBuffer(this.#world.gl.ARRAY_BUFFER, this.#buffers.normal);
      this.#world.gl.vertexAttribPointer(
        this.#programInfo.attribLocations.vertexNormal,
        numComponents,
        type,
        normalize,
        stride,
        offset,
      );
      this.#world.gl.enableVertexAttribArray(this.#programInfo.attribLocations.vertexNormal);
    }
    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    setPositionAttribute() {
        const numComponents = 3; // pull out 2 values per iteration
        const type = this.#world.gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from
        this.#world.gl.bindBuffer(this.#world.gl.ARRAY_BUFFER, this.#buffers.position);
        this.#world.gl.vertexAttribPointer(
            this.#programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset,
        );
        this.#world.gl.enableVertexAttribArray(this.#programInfo.attribLocations.vertexPosition);
      }
  
    setColorAttribute() {
      const numComponents = 4;
      const type = this.#world.gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      this.#world.gl.bindBuffer(this.#world.gl.ARRAY_BUFFER, this.#buffers.color);
      this.#world.gl.vertexAttribPointer(
        this.#programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset,
      );
      this.#world.gl.enableVertexAttribArray(this.#programInfo.attribLocations.vertexColor);
    }

    initIndexBuffer(indices) {
      const indexBuffer = this.#world.gl.createBuffer();
      this.#world.gl.bindBuffer(this.#world.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      // Now send the element array to GL
    
      this.#world.gl.bufferData(
        this.#world.gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        this.#world.gl.STATIC_DRAW,
      );
    
      return indexBuffer;
    }

    initNormalBuffer (normals) {
      const normalBuffer = this.#world.gl.createBuffer();
      this.#world.gl.bindBuffer(this.#world.gl.ARRAY_BUFFER, normalBuffer);
      this.#world.gl.bufferData(
        this.#world.gl.ARRAY_BUFFER,
        new Float32Array(normals),
        this.#world.gl.STATIC_DRAW
      );
      return normalBuffer;
    }

    initColorBuffer(colors) {
      const colorBuffer = this.#world.gl.createBuffer();
      this.#world.gl.bindBuffer(this.#world.gl.ARRAY_BUFFER, colorBuffer);
      this.#world.gl.bufferData(this.#world.gl.ARRAY_BUFFER, new Float32Array(colors), this.#world.gl.STATIC_DRAW);
      return colorBuffer;
    }

    initPositionBuffer(positions) {
        // Create a buffer for the square's positions.
        const positionBuffer = this.#world.gl.createBuffer();
    
        // Select the positionBuffer as the one to apply buffer
        // operations to from here out.
        this.#world.gl.bindBuffer(this.#world.gl.ARRAY_BUFFER, positionBuffer);
        // Now pass the list of positions into WebGL to build the
        // shape. We do this by creating a Float32Array from the
        // JavaScript array, then use it to fill the current buffer.
        this.#world.gl.bufferData(this.#world.gl.ARRAY_BUFFER, new Float32Array(positions), this.#world.gl.STATIC_DRAW);
    
        return positionBuffer;
    } 

    loadShader(type, source) {
      const shader = this.#world.gl.createShader(type);
    
      // Send the source to the shader object
      this.#world.gl.shaderSource(shader, source);
    
      // Compile the shader program
      this.#world.gl.compileShader(shader);
    
      // See if it compiled successfully
    
      if (!this.#world.gl.getShaderParameter(shader, this.#world.gl.COMPILE_STATUS)) {
        this.#world.gl.deleteShader(shader);
        return null;
      }
    
      return shader;
    }

    draw(modelViewMatrix) {
        this.#world.gl.bindBuffer(this.#world.gl.ELEMENT_ARRAY_BUFFER, this.#buffers.indices);
        this.#world.gl.useProgram(this.#programInfo.program);
        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        this.setPositionAttribute(this.#world.gl, this.#buffers, this.#programInfo);
        // Tell WebGL to use our program when drawing
        this.setColorAttribute(this.#world.gl, this.#buffers, this.#programInfo);
        this.setNormalAttribute(this.#world.gl, this.#buffers, this.#programInfo);
        
        const normalMatrix = glMatrix.mat4.create();
        glMatrix.mat4.invert(normalMatrix, modelViewMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);
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
        this.#world.gl.uniformMatrix4fv(
          this.#programInfo.uniformLocations.normalMatrix,
          false,
          normalMatrix,
        );

        {
          const type = this.#world.gl.UNSIGNED_SHORT;
          this.#world.gl.drawElements(
            this.#world.gl.TRIANGLES, 
            this.#indices.length,
            type, 
            0 
          );
        }
      }
      
    constructor(world, positions, colors, normals, indices) {

        if (!indices) {
          indices = [];
          for (let i = 0; i < positions.length; ++i) {
            indices.push(i);
          }
        }

        this.#world = world;
        this.#positions = positions;
        this.#colors = colors;
        this.#indices = indices; 
        this.#normals = normals;

        if (!globalVertexShader) {
            globalVertexShader = this.loadShader(world.gl.VERTEX_SHADER, globalVertexShaderSource);
        }
        if (!globalFragmentShader) {
            globalFragmentShader = this.loadShader(world.gl.FRAGMENT_SHADER, globalFragmentShaderSource);
        }
        // Create the shader program
      
        if (!this.#shaderProgram) {
            this.#shaderProgram = world.gl.createProgram();
            world.gl.attachShader(this.#shaderProgram, globalVertexShader);
            world.gl.attachShader(this.#shaderProgram, globalFragmentShader);
            world.gl.linkProgram(this.#shaderProgram);
    
            // If creating the shader program failed, console.log
            if (!world.gl.getProgramParameter(this.#shaderProgram, world.gl.LINK_STATUS)) {
                console.log(
                `Unable to initialize the shader program: ${world.gl.getProgramInfoLog(
                    this.#shaderProgram,
                )}`,
                );
                return null;
            }
        }
    
        if (!this.#buffers) {
            this.#buffers = {
              position: this.initPositionBuffer(positions),
              indices: this.initIndexBuffer(indices),
              color: this.initColorBuffer(colors),
              // normal: this.initNormalBuffer(normals)
            };

            if (normals) {
              this.#buffers.normal = this.initNormalBuffer(normals);
            }
        }
    
        /*
            Initialize the shape buffer
        */
        
        if (!this.#programInfo) {
            this.#programInfo = {
                program: this.#shaderProgram,
                attribLocations: {
                    vertexNormal: world.gl.getAttribLocation(this.#shaderProgram, "aVertexNormal"),
                    vertexPosition: world.gl.getAttribLocation(this.#shaderProgram, "aVertexPosition"),
                    vertexColor: world.gl.getAttribLocation(this.#shaderProgram, "aVertexColor"),
                },
                uniformLocations: {
                    projectionMatrix: world.gl.getUniformLocation(this.#shaderProgram, "uProjectionMatrix"),
                    modelViewMatrix: world.gl.getUniformLocation(this.#shaderProgram, "uModelViewMatrix"),
                    normalMatrix: world.gl.getUniformLocation(this.#shaderProgram,"uNormalMatrix"),
                },
            };
        }
      }

}

export default SimpleDrawDelegate;