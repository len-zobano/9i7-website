import * as glMatrix from 'gl-matrix';
import { useState, useEffect } from 'react';

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

class World {
  #currentTime = 0;
  #simulatables = [];
  #drawables = [];
  #controllables = [];
  #selectables = [];
  #selected = null;
  #projectionMatrix = null;

  keyIsUp(keyCode) {
    console.log('key up:',keyCode);
    
    //bracket - switch selected
    if (keyCode === 221) {
        let indexOfSelected = this.#selectables.indexOf(this.#selected);
        let indexOfNextSelected = (indexOfSelected + 1) % this.#selectables.length;
        let lastSelected = this.#selected;
        this.#selected = this.#selectables[indexOfNextSelected];
        lastSelected.select(false);
        this.#selected.select(true);
    }

    this.#controllables.forEach((controllable) => {
        controllable.keyIsUp(keyCode);
    });
  }

  keyIsDown(keyCode) {
    console.log('key down:',keyCode);
    this.#controllables.forEach((controllable) => {
        controllable.keyIsDown(keyCode);
    });
  }

  get projectionMatrix() {
    return this.#projectionMatrix;
  }

  addSimulatable(simulatableToAdd) {
    this.#simulatables.push(simulatableToAdd);
  }

  addDrawable(drawableToAdd) {
    this.#drawables.push(drawableToAdd);
  }

  addControllable(controllableToAdd) {
    this.#controllables.push(controllableToAdd);
  }

  addSelectable(selectable) {
    this.#selectables.push(selectable);
    if (this.#selectables.length === 1) {
        selectable.select(true);
        this.#selected = selectable;
    }
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

  simulate() {
    let thisTime = new Date().getTime();

    this.#simulatables.forEach((simulatable) => {
      simulatable.simulate(this, thisTime);
    });
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
            this.#drawables.forEach((drawable) => {
              drawable.draw(this);
            }); 
        }
    }
}

export default World;