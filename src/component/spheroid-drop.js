import * as glMatrix from 'gl-matrix';
import SimpleDrawDelegate from './simple-draw-delegate';
import OBJFile from 'obj-file-parser';
import SphericalControlPoint from './spherical-control-point';

//3 floats position per vertex, 4 float colors per vertex, 3 indices per triangle

class SpheroidDrop {
  #lastTime = 0;
  #selected = false;    
  #ID = null;
  #speed = 5;
  #isCamera = false;
  #drawDelegate = null;

  #positionPoint = null; 

  get controlPoints () {
    return [this.#positionPoint];
  }

  get positionPoint () {
    return this.#positionPoint;
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

    let objFile = require('../models/drop.obj');

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
          return [Math.random(), 0.2,0.2,1.0];
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
      this.#positionPoint = new SphericalControlPoint(this.#world, this, position);
    }

  #programInfo = null;
  #world = null;
  #buffers = null;

  simulate(world, thisTime) {
    if (this.#lastTime) {
      let interval = thisTime - this.#lastTime;

      this.controlPoints.forEach((controlPoint) => {
        controlPoint.simulate(interval/10000);
      });
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
    let drawPosition = this.#positionPoint.position;
    drawPosition[0] += 1;
    drawPosition[1] += 1;
    drawPosition[2] += 1;

    glMatrix.mat4.translate(
      modelViewMatrix, // destination matrix
      modelViewMatrix, // matrix to translate
      drawPosition,
    ); // amount to translate

    let normalizedUp = this.#positionPoint.top;
    glMatrix.vec3.subtract(normalizedUp, normalizedUp, this.#positionPoint.positionAsVector);
    glMatrix.vec3.normalize(normalizedUp, normalizedUp);

    let normalizedRight = this.#positionPoint.right;
    glMatrix.vec3.subtract(normalizedRight, normalizedRight, this.#positionPoint.positionAsVector);
    glMatrix.vec3.normalize(normalizedRight, normalizedRight);

    let normalizedToward = glMatrix.vec3.create();
    glMatrix.vec3.cross(normalizedToward, normalizedRight, normalizedUp);
    glMatrix.vec3.normalize(normalizedToward, normalizedToward);
    glMatrix.vec3.subtract(normalizedToward, glMatrix.vec3.create(), normalizedToward);
    
    glMatrix.vec3.cross(normalizedRight, normalizedUp, normalizedToward);
    glMatrix.vec3.normalize(normalizedRight, normalizedRight);
    glMatrix.vec3.subtract(normalizedRight, glMatrix.vec3.create(), normalizedRight);

    let drawDelegateMatrix = glMatrix.mat4.clone(modelViewMatrix);
    let drawDelegateRotationMatrix = glMatrix.mat4.fromValues(
      normalizedRight[0], normalizedUp[0], normalizedToward[0], 0,
      normalizedRight[1], normalizedUp[1], normalizedToward[1], 0,
      normalizedRight[2], normalizedUp[2], normalizedToward[2], 0,
      0, 0, 0, 1
    );

    glMatrix.mat4.multiply(drawDelegateMatrix, drawDelegateMatrix, drawDelegateRotationMatrix);

    this.#drawDelegate.draw(drawDelegateMatrix);

    this.controlPoints.forEach((controlPoint) => {
      controlPoint.draw(glMatrix.mat4.clone(modelViewMatrix));
    });

    this.#positionPoint.draw(glMatrix.mat4.clone(modelViewMatrix));
  }
}

export default SpheroidDrop;