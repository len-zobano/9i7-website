import * as glMatrix from 'gl-matrix';
import engineMath from '../utility/engine-math';

let globalVertexShaderSource = `
attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec4 aVertexColor;
attribute vec2 aVertexTextureCoordinate;

uniform mat4 uInverseModelViewMatrix;
uniform mat4 uCameraMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;
uniform vec4 uPointLightLocation;

varying lowp vec4 vColor;
varying highp vec3 vDiffuseLighting;
varying highp vec3 vSpecularLighting;
varying highp vec2 vVertexTextureCoordinate;

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

  vVertexTextureCoordinate = aVertexTextureCoordinate;
}
`,

globalFragmentShaderSource = `
varying lowp vec4 vColor;
varying highp vec3 vDiffuseLighting;
varying highp vec3 vSpecularLighting;
varying highp vec2 vVertexTextureCoordinate;
uniform sampler2D uSampler;

void main(void) {
  highp vec4 textureColor = texture2D(uSampler, vVertexTextureCoordinate);
  highp float textureValue = (textureColor.r + textureColor.g + textureColor.b)/3.0;
  highp float specularFactor = min((textureValue - 0.5) * 2.0, 1.0);
  specularFactor = max(specularFactor, 0.0);

//   gl_FragColor += vec4( vSpecularLighting, 1.0);
//   gl_FragColor = vec4 (gl_FragColor.r, gl_FragColor.g, gl_FragColor.b, gl_FragColor.a);
  gl_FragColor = vec4(textureColor.rgb * vDiffuseLighting + vSpecularLighting * specularFactor, vColor.a);
//   gl_FragColor = vec4(vColor.rgb * vDiffuseLighting + vSpecularLighting, vColor.a);
}
`,

globalFragmentShader = null,
globalVertexShader = null,
globalPointLightControlPoint = null;

class MaterialDrawDelegate {
    #buffers = null;
    #colorAttributes = null;
    #shaderProgram = null;
    #programInfo = null;
    #world = null;
    #positions = null;
    #colors = null;
    #indices = null;
    #normals = null;
    #textureForImage = null;

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

    setTextureCoordinateAttribute() {
        const num = 2; // every coordinate composed of 2 values
        const type = this.#world.gl.FLOAT; // the data in the buffer is 32-bit float
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set to the next
        const offset = 0; // how many bytes inside the buffer to start from
        this.#world.gl.bindBuffer(this.#world.gl.ARRAY_BUFFER, this.#buffers.texture);
        this.#world.gl.vertexAttribPointer(
          this.#programInfo.attribLocations.vertexTextureCoordinate,
          num,
          type,
          normalize,
          stride,
          offset,
        );
        this.#world.gl.enableVertexAttribArray(this.#programInfo.attribLocations.vertexTextureCoordinate);
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

    initTextureCoordinateBuffer (textureCoordinates) {
      const textureCoordinateBuffer = this.#world.gl.createBuffer();
      this.#world.gl.bindBuffer(this.#world.gl.ARRAY_BUFFER, textureCoordinateBuffer);

      this.#world.gl.bufferData(
        this.#world.gl.ARRAY_BUFFER,
        new Float32Array(textureCoordinates),
        this.#world.gl.STATIC_DRAW,
      );

      return textureCoordinateBuffer;
    }

    initTextureImage (textureImageURL) {
        const texture = this.#world.gl.createTexture();
        this.#world.gl.bindTexture(this.#world.gl.TEXTURE_2D, texture);
      
        // Because images have to be downloaded over the internet
        // they might take a moment until they are ready.
        // Until then put a single pixel in the texture so we can
        // use it immediately. When the image has finished downloading
        // we'll update the texture with the contents of the image.
        const level = 0;
        const internalFormat = this.#world.gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = this.#world.gl.RGBA;
        const srcType = this.#world.gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue

        this.#world.gl.texImage2D(
          this.#world.gl.TEXTURE_2D,
          level,
          internalFormat,
          width,
          height,
          border,
          srcFormat,
          srcType,
          pixel,
        );
      
        const image = new Image();
        image.onload = () => {
          this.#world.gl.bindTexture(this.#world.gl.TEXTURE_2D, texture);
          this.#world.gl.texImage2D(
            this.#world.gl.TEXTURE_2D,
            level,
            internalFormat,
            srcFormat,
            srcType,
            image,
          );
      
          // WebGL1 has different requirements for power of 2 images
          // vs. non power of 2 images so check if the image is a
          // power of 2 in both dimensions.
          if (engineMath.isPowerOf2(image.width) && engineMath.isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            this.#world.gl.generateMipmap(this.#world.gl.TEXTURE_2D);
          } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            this.#world.gl.texParameteri(this.#world.gl.TEXTURE_2D, this.#world.gl.TEXTURE_WRAP_S, this.#world.gl.CLAMP_TO_EDGE);
            this.#world.gl.texParameteri(this.#world.gl.TEXTURE_2D, this.#world.gl.TEXTURE_WRAP_T, this.#world.gl.CLAMP_TO_EDGE);
            this.#world.gl.texParameteri(this.#world.gl.TEXTURE_2D, this.#world.gl.TEXTURE_MIN_FILTER, this.#world.gl.LINEAR);
          }
        };
        image.src = textureImageURL;

        this.#world.gl.pixelStorei(this.#world.gl.UNPACK_FLIP_Y_WEBGL, true);   
        return texture;
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

        this.#world.gl.bindBuffer(this.#world.gl.ELEMENT_ARRAY_BUFFER, this.#buffers.indices);
        this.#world.gl.useProgram(this.#programInfo.program);
        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        this.setPositionAttribute(this.#world.gl, this.#buffers, this.#programInfo);
        // Tell WebGL to use our program when drawing
        this.setColorAttribute(this.#world.gl, this.#buffers, this.#programInfo);
        this.setNormalAttribute(this.#world.gl, this.#buffers, this.#programInfo);
        this.setTextureCoordinateAttribute(this.#world.gl, this.#buffers, this.#programInfo);
        
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

        // Tell WebGL we want to affect texture unit 0
        this.#world.gl.activeTexture(this.#world.gl.TEXTURE0);
        // Bind the texture to texture unit 0
        this.#world.gl.bindTexture(this.#world.gl.TEXTURE_2D, this.#textureForImage);
        // Tell the shader we bound the texture to texture unit 0
        this.#world.gl.uniform1i(this.#programInfo.uniformLocations.uSampler, 0);

        {
          const type = this.#world.gl.UNSIGNED_SHORT;
          this.#world.gl.drawElements(
            this.#world.gl.TRIANGLES, 
            this.#indices.length,
            type, 
            0 
          );
        }

        //TODO: move these functions into init / teardown fucntions
        this.#world.gl.disableVertexAttribArray(this.#programInfo.attribLocations.vertexTextureCoordinate);
      }

    constructor(world, positions, colors, normals, indices, textureCoordinates, textureImageURL) {

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
            this.#textureForImage = this.initTextureImage(textureImageURL);
            
            this.#buffers = {
              position: this.initPositionBuffer(positions),
              texture: this.initTextureCoordinateBuffer(textureCoordinates),
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
                    vertexTextureCoordinate: world.gl.getAttribLocation(this.#shaderProgram, "aVertexTextureCoordinate")
                },
                uniformLocations: {
                    projectionMatrix: world.gl.getUniformLocation(this.#shaderProgram, "uProjectionMatrix"),
                    modelViewMatrix: world.gl.getUniformLocation(this.#shaderProgram, "uModelViewMatrix"),
                    cameraMatrix: world.gl.getUniformLocation(this.#shaderProgram, "uCameraMatrix"),
                    inverseModelViewMatrix: world.gl.getUniformLocation(this.#shaderProgram, "uInverseModelViewMatrix"),
                    normalMatrix: world.gl.getUniformLocation(this.#shaderProgram,"uNormalMatrix"),
                    pointLightLocation: world.gl.getUniformLocation(this.#shaderProgram, "uPointLightLocation"),
                    uSampler: world.gl.getUniformLocation(this.#shaderProgram, "uSampler")
                },
            };
        }
      }

}

export default MaterialDrawDelegate;