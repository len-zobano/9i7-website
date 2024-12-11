import * as glMatrix from 'gl-matrix';
import SimpleDrawDelegate from './simple-draw-delegate';
import OBJFile from 'obj-file-parser';
import ControlPoint from './control-point';

//3 floats position per vertex, 4 float colors per vertex, 3 indices per triangle

class Sculpted {
  #lastTime = 0;
  #selected = false;    
  #ID = null;
  #speed = 5;
  #isCamera = false;
  #drawDelegate = null;

  #positionPoint = null; 
  #upPoint = null;
  #rightPoint = null;

  changeMomentum (momentum) {
    this.#positionPoint.changeMomentum(momentum);
  }

  set isCamera (isCamera) {
    this.#isCamera = isCamera;
  }

  get ID () {
    return this.#ID;
  }

  get broadCollisionRadius () {
    return 1.2;
  }

  constructor(world) {
    this.#world = world;
    this.#ID = `${new Date().getTime()}${Math.round(Math.random()*10000)}`;

    let objFile = require('../models/blah.obj');

    fetch(objFile)
      .then(response => response.text())
      .then((text) => {
        let objFile = new OBJFile (text);
        let objOutput = objFile.parse();
        let positions = objOutput.models[0].vertices.map((vertex) => {
          return [vertex.x, vertex.y, vertex.z];
        }).reduce((a,b) => {
          return a.concat(b);
        });

        let colors = objOutput.models[0].vertices.map((vertex) => {
          return [Math.random(), Math.random(), Math.random(), 1.0];
        }).reduce((a,b) => {
          return a.concat(b);
        });

        let indices = objOutput.models[0].faces.map((face) => {
          let ret = face.vertices.map((vertex) => {
            return vertex.vertexIndex - 1;
          });

          return ret;
        }).reduce((a, b) => {
          return a.concat(b);
        });

        this.#drawDelegate = new SimpleDrawDelegate(this.#world, positions, colors, indices);
        // debugger;
      });

  }

    #downKeys = {};

    detectCollision(otherPlottable) {
        let distance = Math.pow(
            Math.pow(otherPlottable.position[0] - this.position[0], 2) +
            Math.pow(otherPlottable.position[1] - this.position[1], 2) +
            Math.pow(otherPlottable.position[2] - this.position[2], 2)
        ,0.5);
        
        let minimumDistance = otherPlottable.broadCollisionRadius + this.broadCollisionRadius;

        return distance <= minimumDistance;
    }

    onCollision(otherPlottable) {
      //this collision function should only be used for object interaction, not physics
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

    //get position out of control point
    get position () {
      return this.#positionPoint.position;
    }

    //convert position to control point
    set position(position) {
      this.#positionPoint = new ControlPoint(this.#world, position);
    }

  #programInfo = null;
  #world = null;
  #XAngle = 0;
  #YAngle = 0;
  #buffers = null;

  simulate(world, thisTime) {
    if (this.#lastTime) {
      let interval = thisTime - this.#lastTime;

        if (this.#selected) {

            //right arrow
            if (this.#downKeys[39]) {
                this.#positionPoint.changeMomentum([this.#speed * interval / 20, 0, 0]);
            }

            //up arrow
            if (this.#downKeys[38]) {
                if (this.#downKeys[16]) {
                    this.#positionPoint.changeMomentum([0,0,this.#speed * interval / 20]);
                }
                else {
                    // this.#momentum[1] += this.#speed * interval / 20;
                    this.#positionPoint.changeMomentum([0,this.#speed * interval / 20,0]);
                }
            }

            //down arrow
            if (this.#downKeys[40]) {         
                if (this.#downKeys[16]) {
                    // this.#momentum[2] -= this.#speed * interval / 20;
                    this.#positionPoint.changeMomentum([0,0,-this.#speed * interval / 20]);
                }
                else {
                    // this.#momentum[1] -= this.#speed * interval / 20;
                    this.#positionPoint.changeMomentum([0,-this.#speed * interval / 20,0]);
                }
            }

            //left arrow
            if (this.#downKeys[37]) {
                // this.#momentum[0] -= this.#speed * interval / 20;
                this.#positionPoint.changeMomentum([-this.#speed * interval / 20, 0, 0]);
            }
        }

        // this.#XAxisRotationsPerSecond *= Math.pow(0.9,this.#speed * interval/100);
        // this.#YAxisRotationsPerSecond *= Math.pow(0.9,this.#speed * interval/100);

        //factor in the momentum change due to collision
        // for (let i = 0; i < 3; ++i) {
        //     this.#momentum[i] += this.#collisionMomentum[i];
        //     this.#collisionMomentum[i] = 0;
        // }

        // this.#momentum = this.#momentum.map((momentum) => {
        //     return momentum * Math.pow(0.9,interval/100);
        // })

        // for (let i = 0; i < 3; ++i) {
        //     this.#position[i] += this.#momentum[i]/interval;
        // }
        this.#positionPoint.simulate(interval/10000, null);
    }

    this.#lastTime = thisTime;
  }

  draw() {

    if (!this.#drawDelegate || this.#isCamera) {
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
      this.#positionPoint.position,
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

    this.#drawDelegate.draw(glMatrix.mat4.clone(modelViewMatrix));
  }
}

export default Sculpted;