import * as glMatrix from 'gl-matrix';
import SimpleDrawDelegate from './simple-draw-delegate';
import OBJFile from 'obj-file-parser';

//3 floats position per vertex, 4 float colors per vertex, 3 indices per triangle

class Sculpted {
  #lastTime = 0;
  #momentum = [0,0,0];
  #collisionMomentum = [0,0,0];

  #YAxisRotationsPerSecond = 0;
  #XAxisRotationsPerSecond = 0;
  #ZAxisRotationsPerSecond = 0;
  #selected = false;    
  #ID = null;
  #speed = 5;
  #isCamera = false;
  #drawDelegate = null;

  changeMomentum (momentum) {
    for (let i = 0; i < 3; ++i) {
        this.#momentum[i] += momentum[i];
    }
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
        //calculate magnitude of momentum
        let combinedMomentum = [], magnitudeOfCombinedMomentum = 0;
        for (let i = 0; i < 3; ++i) {
            combinedMomentum[i] = otherPlottable.#momentum[i] - this.#momentum[i];
            magnitudeOfCombinedMomentum += Math.pow(combinedMomentum[i],2);
        }
        magnitudeOfCombinedMomentum = Math.pow(magnitudeOfCombinedMomentum,0.5);
        //divide it in two

        //go in opposite direction of collision
        let relativePositionOfOther = [], distanceFromOther = 0;
        for (let i = 0; i < 3; ++i) {
            relativePositionOfOther[i] = otherPlottable.#position[i] - this.#position[i];
            distanceFromOther += Math.pow(relativePositionOfOther[i], 2);
        }
        distanceFromOther = Math.pow(distanceFromOther, 0.5);

        //make it a vector of length 1
        let normalizedPositionOfOther = relativePositionOfOther.map((relativePosition) => {
            return relativePosition / distanceFromOther; 
        });

        //go away from the direction of the other with the magnitude of half the combined momentum
        for (let i = 0; i < 3; ++i) {
            this.#collisionMomentum[i] -= normalizedPositionOfOther[i] * magnitudeOfCombinedMomentum / 2;
        }
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

  #position = [0,0,0];

  get position() {
    return this.#position;
  }

  set position(position) {
    this.#position = position;
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

    this.#drawDelegate.draw(glMatrix.mat4.clone(modelViewMatrix));
  }
}

export default Sculpted;