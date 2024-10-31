import { useState, useEffect } from 'react';
import * as glMatrix from 'gl-matrix';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';

class World {

    get vertexShaderSource () {return `
        attribute vec4 aVertexPosition;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        }
    `;}

    get fragmentShaderSource ()  { return `
        void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
    `;}

  initializeGL() {
    var canvas = document.getElementById("test-canvas");
    if (!canvas) return;
    this.gl = canvas.getContext("webgl"); 

    function loadShader(gl, type, source) {
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

    const vertexShader = loadShader(this.gl, this.gl.VERTEX_SHADER, this.vertexShaderSource);
    const fragmentShader = loadShader(this.gl, this.gl.FRAGMENT_SHADER, this.fragmentShaderSource);
  
    // Create the shader program
  
    const shaderProgram = this.gl.createProgram();
    this.shaderProgram = shaderProgram;
    this.gl.attachShader(shaderProgram, vertexShader);
    this.gl.attachShader(shaderProgram, fragmentShader);
    this.gl.linkProgram(shaderProgram);
  
    // If creating the shader program failed, console.log
  
    if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
      console.log(
        `Unable to initialize the shader program: ${this.gl.getProgramInfoLog(
          shaderProgram,
        )}`,
      );
      return null;
    }

    /*
        Initialize the shape buffer
    */
    
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: this.gl.getAttribLocation(shaderProgram, "aVertexPosition"),
        },
        uniformLocations: {
            projectionMatrix: this.gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
            modelViewMatrix: this.gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
        },
    };
  }

  simulate() {

  }

    draw() {
        function initBuffers(gl) {
            const positionBuffer = initPositionBuffer(gl);
          
            return {
              position: positionBuffer,
            };
        }

        function initPositionBuffer(gl) {
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
        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        function setPositionAttribute(gl, buffers, programInfo) {
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

        let dimensions = getWindowDimensions();

        var canvas = document.getElementById("test-canvas");
        if (canvas) {
            var gl = canvas.getContext("webgl"); 

            gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
            gl.clearDepth(1.0); // Clear everything
            gl.enable(gl.DEPTH_TEST); // Enable depth testing
            gl.depthFunc(gl.LEQUAL); // Near things obscure far things
          
            // Clear the canvas before we start drawing on it.
          
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          
            // Create a perspective matrix, a special matrix that is
            // used to simulate the distortion of perspective in a camera.
            // Our field of view is 45 degrees, with a width/height
            // ratio that matches the display size of the canvas
            // and we only want to see objects between 0.1 units
            // and 100 units away from the camera.
          
            const fieldOfView = (45 * Math.PI) / 180; // in radians
            const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
            const zNear = 0.1;
            const zFar = 100.0;
            const projectionMatrix = glMatrix.mat4.create();
          
            const programInfo = {
              program: this.shaderProgram,
              attribLocations: {
                vertexPosition: gl.getAttribLocation(this.shaderProgram, "aVertexPosition"),
              },
              uniformLocations: {
                projectionMatrix: gl.getUniformLocation(this.shaderProgram, "uProjectionMatrix"),
                modelViewMatrix: gl.getUniformLocation(this.shaderProgram, "uModelViewMatrix"),
              },
            };

            // note: glmatrix.js always has the first argument
            // as the destination to receive the result.
            glMatrix.mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
          
            // Set the drawing position to the "identity" point, which is
            // the center of the scene.
            const modelViewMatrix = glMatrix.mat4.create();
          
            // Now move the drawing position a bit to where we want to
            // start drawing the square.
            glMatrix.mat4.translate(
              modelViewMatrix, // destination matrix
              modelViewMatrix, // matrix to translate
              [-0.0, 0.0, -6.0],
            ); // amount to translate
          
            let buffers = initBuffers(gl);
            // Tell WebGL how to pull out the positions from the position
            // buffer into the vertexPosition attribute.
            setPositionAttribute(gl, buffers, programInfo);
          
            // Tell WebGL to use our program when drawing
            gl.useProgram(programInfo.program);
          
            // Set the shader uniforms
            gl.uniformMatrix4fv(
              programInfo.uniformLocations.projectionMatrix,
              false,
              projectionMatrix,
            );
            gl.uniformMatrix4fv(
              programInfo.uniformLocations.modelViewMatrix,
              false,
              modelViewMatrix,
            );
          
            {
              const offset = 0;
              const vertexCount = 4;
              gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
            }
        
        }
    }
}

class Character {
  draw() {
    let dimensions = getWindowDimensions();

    var canvas = document.getElementById("test-canvas");
        var ctx = canvas.getContext("webgl"); 
        // ctx.beginPath();
        // ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI, false);
        // if (circle.fill) {
        // ctx.fillStyle = circle.fill;
        // ctx.fill();
        // }
  }
}

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {

      let dimensions = getWindowDimensions();

    //   circle.x = dimensions.width/2;
    //   circle.y = dimensions.height/2;
      // drawCircle(ctx, dimensions.width/2, dimensions.height/2, 100, "#ffff00","black",0);
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}


function Canvas(props) {
  const { height, width } = useWindowDimensions();
  return <canvas id="test-canvas" width={width} height={height}></canvas>;
}

//not the right way to run a one-time init function, but I don't know the React way yet
let didInit = false;

function UAGComponent() {
    // document.addEventListener('mousemove', (e) => {
    //   let dimensions = getWindowDimensions();
    //   let xFromEvent = 2*e.clientX/dimensions.height - dimensions.width/dimensions.height,
    //   yFromEvent = 2*e.clientY/dimensions.height - 1;

    //   anchorParticle.position = [xFromEvent, yFromEvent, 0];
    //   console.log('mouse move',e,anchorParticle.position);
    // });

    // document.addEventListener('mousedown', () => {
    //   anchorParticle.repulsion = 100;
    //   anchorParticle.gravity = 0;
    // });

    // document.addEventListener('mouseup', () => {
    //   anchorParticle.repulsion = 1;
    //   anchorParticle.gravity = 100;
    // });
    let world = new World();

    function animate () {    
        if (!world.gl) {
            world.initializeGL();
        }

        world.simulate();
        world.draw();

        window.requestAnimationFrame(animate);
    }

    animate();

  return (
    <Canvas/>
  );
}

export default UAGComponent;