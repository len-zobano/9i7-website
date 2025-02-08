import * as glMatrix from 'gl-matrix';
import SimpleDrawDelegate from './simple-draw-delegate';
import OBJFile from 'obj-file-parser';
import SphericalControlPoint from './spherical-control-point';
import engineMath from '../utility/engine-math';

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
  #visible = true;

  set visible (v) {
    this.#visible = v;
  }

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

  constructor(world, position) {
    this.#world = world;
    this.#positionPoint = new SphericalControlPoint(this.#world, this, position);
    
    this.#ID = `${new Date().getTime()}${Math.round(engineMath.random()*10000)}`;

    // let objFile = require('models/drop.obj');

    fetch('models/drop.obj')
      .then(response => response.text())
      .then((text) => {
        let objFile = new OBJFile (text);
        let objOutput = objFile.parse();

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
                currentColor = [
                    engineMath.random()*0.5+0.25,
                    engineMath.random()*0.5+0.25,
                    engineMath.random()*0.5+0.25,
                    1.0
                ];
                // currentColor = [0.8,0.8,0.8,1.0];
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

        this.#drawDelegate = new SimpleDrawDelegate(this.#world, positions, colors, normals);
      });

      world.addControlPoint(this.#positionPoint);
      world.addDrawable(this);
  }

    select(selected) {
        this.#selected = selected;
    }

    //get position out of control point
    get position () {
      return this.#positionPoint.position;
    }

    get positionPoint () {
        return this.#positionPoint;
    }

  #programInfo = null;
  #world = null;
  get world() {
    return this.#world;
  }
  #buffers = null;

  calculateTrajectory(interval) {
    this.controlPoints.forEach((controlPoint) => {
        controlPoint.calculateTrajectory(interval);
    });
  }

  simulate(interval) {
    this.controlPoints.forEach((controlPoint) => {
        controlPoint.simulate(interval);
    });
  }



  draw() {

    if (!this.#drawDelegate || this.#isCamera || !this.#visible) {
        return;
    }
    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    // const modelViewMatrix = glMatrix.mat4.create();
    const modelViewMatrix = this.#world.modelViewMatrix;
  
    // Now move the drawing position a bit to where we want to
    // start drawing the square.
    let drawPosition = this.#positionPoint.position;
    let drawDelegateMatrix = glMatrix.mat4.clone(modelViewMatrix);

    glMatrix.mat4.translate(
      drawDelegateMatrix, // destination matrix
      drawDelegateMatrix, // matrix to translate
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

    glMatrix.mat4.multiply(drawDelegateMatrix, drawDelegateMatrix, this.#positionPoint.drawMatrix);

    let lightPosition = this.#world.getLights()[0].position;
    glMatrix.vec3.transformMat4(lightPosition, lightPosition, modelViewMatrix);

    this.#drawDelegate.draw(drawDelegateMatrix, lightPosition);
  }
}

export default SpheroidDrop;