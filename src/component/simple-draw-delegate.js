import * as glMatrix from 'gl-matrix';

let globalVertexShaderSource = `
attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec4 aVertexColor;

uniform mat4 uInverseModelViewMatrix;
uniform mat4 uCameraMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;
uniform vec4 uPointLightLocation;

varying lowp vec4 vColor;
varying highp vec3 vDiffuseLighting;
varying highp vec3 vSpecularLighting;

void main() {
  highp mat4 allMatrix = uProjectionMatrix * uCameraMatrix * uModelViewMatrix;
  highp mat4 eyeMatrix = uCameraMatrix * uModelViewMatrix;
  gl_Position = allMatrix * aVertexPosition;
  vColor = aVertexColor;

  highp vec3 ambientLight = vec3(0.05 , 0.05, 0.05);
  highp vec3 directionalLightColor = vec3(1.0, 1.0, 1.0);

  highp vec3 transformedNormal = normalize( (uNormalMatrix * vec4(aVertexNormal, 1.0)).xyz );

  highp vec4 relativePositionOfLight = uPointLightLocation - eyeMatrix * aVertexPosition;
  highp vec3 normalizedRelativePositionOfLight = normalize(relativePositionOfLight.xyz);
  highp float distanceFromPointLight = length(relativePositionOfLight);
  highp float pointLightDirectional = max(dot(transformedNormal, normalizedRelativePositionOfLight), 0.0);
  highp float pointLightDistanceQuotient = 100.0/max( distanceFromPointLight, 1.0);
  highp float pointLightQuotient = min(pointLightDirectional * pointLightDistanceQuotient, 1.0);
  
  highp vec3 normalizedRelativePositionOfLightReflection = normalize(reflect(normalizedRelativePositionOfLight, transformedNormal))*-1.0;
  highp vec3 normalizedRelativePositionOfEye = normalize ( ((eyeMatrix * aVertexPosition) * -1.0).xyz );

  // highp vec3 specularComponentVector = normalizedRelativePositionOfLightReflection - normalizedRelativePositionOfEye;
  highp vec3 specularComponentVector = normalizedRelativePositionOfLightReflection - normalizedRelativePositionOfEye;
  highp float specularComponent = 0.0;
  
  //the specular component vector can't be over 2 (sphere of radius 1)
  highp float specularComponentLength = length(specularComponentVector)/2.0;
  highp float specularComponentNarrowness = 3.0;
  specularComponent = specularComponentNarrowness * ( 1.0 - specularComponentLength - (1.0 - 1.0/specularComponentNarrowness));
  specularComponent = min (1.0, specularComponent);
  specularComponent = max (0.0, specularComponent);

  vDiffuseLighting = ambientLight + (directionalLightColor * pointLightQuotient);
  vSpecularLighting = directionalLightColor * specularComponent;
}
`,

globalFragmentShaderSource = `
varying lowp vec4 vColor;
varying highp vec3 vDiffuseLighting;
varying highp vec3 vSpecularLighting;

void main(void) {
  gl_FragColor = vec4(vColor.rgb * vDiffuseLighting + vSpecularLighting, vColor.a);
}
`,

globalFragmentShader = null,
globalVertexShader = null,
globalPointLightControlPoint = null;

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


    // testVertexShader() {
    //   //naming

    //   //end naming
    //   let allMatrix = glMatrix.mat4.create();
    //   glMatrix.mat4.multiply(allMatrix, uProjectionMatrix, uCameraMatrix);
    //   glMatrix.mat4.multiply(allMatrix, allMatrix, uModelViewMatrix);

    //   let eyeMatrix = glMatrix.mat4.create();
    //   glMatrix.mat4.multiply(eyeMatrix, uCameraMatrix, uModelViewMatrix);
  
    //   let gl_Position = glMatrix.vec3.clone(aVertexPosition);
    //   glMatrix.vec3.transformMat4(gl_Position, gl_Position, allMatrix);

    //   let ambientLight = glMatrix.vec3.fromValues(0.2 , 0.2, 0.2);
    //   let directionalLightColor = glMatrix.vec3.fromValues(1.0, 1.0, 0.7);
    
    //   let transformedNormal = glMatrix.vec4.fromValues(aVertexNormal[0], aVertexNormal[1], aVertexNormal[2], 1.0);
    //   glMatrix.vec4.transformMat4(transformedNormal, transformedNormal, uNormalMatrix);
    //   glMatrix.vec4.normalize(transformedNormal, transformedNormal);
    
    //   let vertexPositionInEyeSpace = glMatrix.vec4.fromValues(aVertexPosition[0], aVertexPosition[1], aVertexPosition[2], 1.0);
    //   highp vec4 relativePositionOfLight = uPointLightLocation - eyeMatrix * aVertexPosition;
    //   highp float distanceFromPointLight = length(relativePositionOfLight);
    //   highp float pointLightDirectional = max(dot(normalize(transformedNormal.xyz), normalize(relativePositionOfLight.xyz)), 0.0);
    //   highp float pointLightDistanceQuotient = 100.0/max( distanceFromPointLight, 1.0);
    //   highp float pointLightQuotient = min(pointLightDirectional * pointLightDistanceQuotient, 1.0);
      
    //   highp vec4 normalizedRelativePositionOfLight = normalize(relativePositionOfLight);
    //   highp vec4 normalizedRelativePositionOfLightReflection = normalize(reflect(normalizedRelativePositionOfLight, transformedNormal));
    //   highp vec4 normalizedRelativePositionOfEye = normalize ( (eyeMatrix * aVertexPosition) * -1.0 );
    
    //   highp vec4 specularComponentVector = normalizedRelativePositionOfLightReflection - normalizedRelativePositionOfEye;
    //   highp float specularComponent = 0.0;
    //   highp float specularRatio = 1.0;
      
    //   //the specular component vector can't be over 2 (sphere of radius 1)
    //   specularComponent = min (1.0 - length(specularComponentVector) / 2.0, 1.0);
      
    //   specularComponent = 0.0;
    //   if (length(specularComponentVector) < 0.2) {
    //     specularComponent = 1.0;
    //   }
    
    //   vLighting = vec3 (
    //     pointLightQuotient,
    //     pointLightQuotient,
    //     specularComponent
    //   );
    //   // vLighting = ambientLight + (directionalLightColor * (pointLightQuotient * (1.0 - specularRatio) + specularComponent * specularRatio));
    // };

    setGlobalPointLightControlPoint (controlPoint) {
      globalPointLightControlPoint = controlPoint;
    }

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

    draw(cameraMatrix, modelViewMatrix, lightPosition) {
        let cameraAndModelViewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.multiply(cameraAndModelViewMatrix, cameraMatrix, modelViewMatrix);
        let inverseModelViewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.invert(inverseModelViewMatrix, cameraAndModelViewMatrix);
        let inverseCameraMatrix = glMatrix.mat4.create();

        this.#world.gl.bindBuffer(this.#world.gl.ELEMENT_ARRAY_BUFFER, this.#buffers.indices);
        this.#world.gl.useProgram(this.#programInfo.program);
        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        this.setPositionAttribute(this.#world.gl, this.#buffers, this.#programInfo);
        // Tell WebGL to use our program when drawing
        this.setColorAttribute(this.#world.gl, this.#buffers, this.#programInfo);
        this.setNormalAttribute(this.#world.gl, this.#buffers, this.#programInfo);
        
        let normalMatrix = glMatrix.mat4.create();
        glMatrix.mat4.invert(normalMatrix, cameraAndModelViewMatrix);
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
          this.#programInfo.uniformLocations.cameraMatrix,
        false,
        cameraMatrix,
        );
        this.#world.gl.uniformMatrix4fv(
          this.#programInfo.uniformLocations.inverseModelViewMatrix,
          false,
          inverseModelViewMatrix,
        );
        this.#world.gl.uniformMatrix4fv(
          this.#programInfo.uniformLocations.normalMatrix,
          false,
          normalMatrix,
        );
        
        //set the light location
        let pointLightLocation = glMatrix.vec3.create(0,0,0);
        if (lightPosition) {
          pointLightLocation = lightPosition;
        }

        let lightMatrix = glMatrix.mat4.create();
        lightMatrix = cameraMatrix;
        //experiment with the light matrix. not sure if the light position is correct here;
        glMatrix.vec3.transformMat4(pointLightLocation, pointLightLocation, lightMatrix);

        this.#world.gl.uniform4fv(
          this.#programInfo.uniformLocations.pointLightLocation,
          glMatrix.vec4.fromValues(
            pointLightLocation[0],
            pointLightLocation[1],
            pointLightLocation[2],
            1.0
          )
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
              normal: this.initNormalBuffer(normals)
            };
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
                    cameraMatrix: world.gl.getUniformLocation(this.#shaderProgram, "uCameraMatrix"),
                    inverseModelViewMatrix: world.gl.getUniformLocation(this.#shaderProgram, "uInverseModelViewMatrix"),
                    normalMatrix: world.gl.getUniformLocation(this.#shaderProgram,"uNormalMatrix"),
                    pointLightLocation: world.gl.getUniformLocation(this.#shaderProgram, "uPointLightLocation")
                },
            };
        }
      }

}

export default SimpleDrawDelegate;