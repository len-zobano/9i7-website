import { useState, useEffect } from 'react';

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
          alert(
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
    this.gl.attachShader(shaderProgram, vertexShader);
    this.gl.attachShader(shaderProgram, fragmentShader);
    this.gl.linkProgram(shaderProgram);
  
    // If creating the shader program failed, alert
  
    if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
      alert(
        `Unable to initialize the shader program: ${this.gl.getProgramInfoLog(
          shaderProgram,
        )}`,
      );
      return null;
    }
  }

  simulate() {

  }

  draw() {
    let dimensions = getWindowDimensions();

    var canvas = document.getElementById("test-canvas");
    if (canvas) {
      var ctx = canvas.getContext("webgl"); 
        // Set clear color to black, fully opaque
        ctx.clearColor(0.0, 0.0, 0.0, 1.0);
        // Clear the color buffer with specified clear color
        ctx.clear(ctx.COLOR_BUFFER_BIT);
    }
    //   ctx.fillStyle = "rgba(0,0,0,1)";
    //   ctx.fillRect(0, 0, dimensions.width, dimensions.height);
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
