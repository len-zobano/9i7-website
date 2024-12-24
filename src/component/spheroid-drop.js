import * as glMatrix from 'gl-matrix';
import SimpleDrawDelegate from './simple-draw-delegate';
import OBJFile from 'obj-file-parser';
import SphericalControlPoint from './spherical-control-point';

//3 floats position per vertex, 4 float colors per vertex, 3 indices per triangle

class SpheroidDrop {
  #selected = false;    
  get selected () {
    return this.#selected;
  }
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
        // let positions = objOutput.models[0].vertices.map((vertex) => {
        //   return [vertex.x, vertex.y, vertex.z];
        // }).reduce((a,b) => {
        //   return a.concat(b);
        // });

        // let colors = objOutput.models[0].vertices.map((vertex) => {
        //   return [Math.random(),Math.random(),Math.random(),1.0];
        // }).reduce((a,b) => {
        //   return a.concat(b);
        // });

        let indices = objOutput.models[0].faces.map((face) => {
          let ret = face.vertices.map((vertex) => {
            return vertex.vertexIndex - 1;
          });

          return ret;
        }).reduce((a, b) => {
          return a.concat(b);
        });

        let positions = indices.map((index) => {
            let vertex = objOutput.models[0].vertices[index];
            return [vertex.x, vertex.y, vertex.z];
        }).reduce((a, b) => {
            return a.concat(b);
        });

        let currentColor = [], timesReturned = 3;
        function getNextColor() {
            if (timesReturned === 3) {
                timesReturned = 0;
                // currentColor = [
                //     Math.random()*0.5+0.25,
                //     Math.random()*0.5+0.25,
                //     Math.random()*0.5+0.25,
                //     1.0
                // ];
                currentColor = [0.8,0.8,0.8,1.0];
            }
            ++timesReturned;
            return currentColor;
        }

        let colors = indices.map((index) => {
            return getNextColor();
        }).reduce((a, b) => {
            return a.concat(b);
        });

        //each face has one vertex normal. That has to be converted to three each
        //so indices are floored by three
        
        let normals = [], thisNormal;
        for (let i = 0; i < indices.length; ++i) {
            thisNormal = objOutput.models[0].vertexNormals[Math.floor(i/3)];
            normals = normals.concat([thisNormal.x, thisNormal.y, thisNormal.z]);
        }

        // let normals = indices.map((index) => {
        //     let vertex = objOutput.models[0].vertexNormals[index];
        //     return [vertex.x, vertex.y, vertex.z];
        // }).reduce((a, b) => {
        //     return a.concat(b);
        // });

        // let normals = indices.map((index) => {
        //     let normal = objOutput.models[0].vertexNormals[Math.floor(index/3)];
        //     let normalElement = [normal.x, normal.y, normal.z][index%3];
        //     // let ret = normalArray.concat(normalArray).concat(normalArray);
        //     return [normalElement];
        // }).reduce((a, b) => {
        //     return a.concat(b);
        // });
        // debugger;

        this.#drawDelegate = new SimpleDrawDelegate(this.#world, positions, colors, normals);
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

    get positionPoint () {
        return this.#positionPoint;
    }

    //convert position to control point
    set position(position) {
      this.#positionPoint = new SphericalControlPoint(this.#world, this, position);
    }

  #programInfo = null;
  #world = null;
  get world() {
    return this.#world;
  }
  #buffers = null;

  calculateTrajectory(world, interval) {
    this.controlPoints.forEach((controlPoint) => {
        controlPoint.calculateTrajectory(interval);
    });
  }

  simulate(world, interval) {
    this.controlPoints.forEach((controlPoint) => {
        controlPoint.simulate(interval);
    });
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

    glMatrix.mat4.translate(
      modelViewMatrix, // destination matrix
      modelViewMatrix, // matrix to translate
      drawPosition,
    ); // amount to translate

    let normalizedUp = this.#positionPoint.top;
    glMatrix.vec3.normalize(normalizedUp, normalizedUp);

    let normalizedRight = this.#positionPoint.right;
    glMatrix.vec3.normalize(normalizedRight, normalizedRight);

    let normalizedToward = glMatrix.vec3.create();
    glMatrix.vec3.cross(normalizedToward, normalizedRight, normalizedUp);
    glMatrix.vec3.subtract(normalizedToward, glMatrix.vec3.create(), normalizedToward);
    glMatrix.vec3.normalize(normalizedToward, normalizedToward);

    let drawDelegateMatrix = glMatrix.mat4.clone(modelViewMatrix);
    glMatrix.mat4.multiply(drawDelegateMatrix, drawDelegateMatrix, this.#positionPoint.drawMatrix);

    this.#drawDelegate.draw(drawDelegateMatrix);
    // this.#world.gl.depthMask(false);
    this.#world.gl.disable(this.#world.gl.DEPTH_TEST); 
    this.controlPoints.forEach((controlPoint) => {
        controlPoint.draw(glMatrix.mat4.clone(modelViewMatrix));
    });
    this.#world.gl.enable(this.#world.gl.DEPTH_TEST); 
    // this.#world.gl.depthMask(true);
  }
}

export default SpheroidDrop;