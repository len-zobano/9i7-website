import { useState, useEffect } from 'react';
import * as glMatrix from 'gl-matrix';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';

class RainbowCube {

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
  #programInfo = null;
  #world = null;

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

  simulate() {

  }

  draw() {
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

    const squareRotation = 0.5;

    glMatrix.mat4.rotate(
      modelViewMatrix, // destination matrix
      modelViewMatrix, // matrix to rotate
      squareRotation, // amount to rotate in radians
      [0, 0, 1],
    );

    let buffers = this.initBuffers(this.#world.gl);
    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    this.setPositionAttribute(this.#world.gl, buffers, this.#programInfo);
  
    // Tell WebGL to use our program when drawing
    this.setColorAttribute(this.#world.gl, buffers, this.#programInfo);
    this.#world.gl.useProgram(this.#programInfo.program);
  
    // Set the shader uniforms
    this.#world.gl.uniformMatrix4fv(
      this.programInfo.uniformLocations.projectionMatrix,
      false,
      this.#world.projectionMatrix,
    );
    this.#world.gl.uniformMatrix4fv(
      this.programInfo.uniformLocations.modelViewMatrix,
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

class World {
  #currentTime = 0;
  #simulatables = [];
  #drawables = [];
  #projectionMatrix = null;

  addSimulatable(simulatableToAdd) {
    this.#simulatables.push(simulatableToAdd);
  }

  addDrawable(drawableToAdd) {
    this.#drawables.push(drawableToAdd);
  }

  addDrawableAndSimulatable(drawableAndSimulatableToAdd) {
    this.addSimulatable(drawableAndSimulatableToAdd);
    this.addDrawable(drawableAndSimulatableToAdd);
  }

  setTime(time) {
    this.#currentTime = time;
  }

  initializeGL() {
    var canvas = document.getElementById("test-canvas");
    if (!canvas) return;
    this.gl = canvas.getContext("webgl"); 
    //initialize each drawable
    this.#drawables.forEach((drawable) => {
      drawable.initializeGL(this);
    });
  }

  simulate(time) {
    if (!time) {
      time = new Date().getTime();
    }
    
    let interval = (time - this.#currentTime);
    this.#currentTime = time;
  }

    draw() {
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
            this.#projectionMatrix = glMatrix.mat4.create();
            // note: glmatrix.js always has the first argument
            // as the destination to receive the result.
            glMatrix.mat4.perspective(this.#projectionMatrix, fieldOfView, aspect, zNear, zFar);
        }
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
    let cube = new RainbowCube();

    let world = new World();
    world.addDrawableAndSimulatable(cube);

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
