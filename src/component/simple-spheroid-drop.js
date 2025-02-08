import * as glMatrix from 'gl-matrix';
import SimpleDrawDelegate from './simple-draw-delegate';
import OBJFile from 'obj-file-parser';
import SphericalControlPoint from './spherical-control-point';
import engineMath from '../utility/engine-math';
import SimpleControlPoint from './simple-control-point';

//3 floats position per vertex, 4 float colors per vertex, 3 indices per triangle

class SimpleSpheroidDrop {
  #ID = null;
  #isCamera = false;
  #drawDelegate = null;
  #visible = true;

  set visible (v) {
    this.#visible = v;
  }

  #topPoint = null;
  #backLeftPoint = null;
  #backRightPoint = null;
  #towardPoint = null;

  /*
    Vertex A (base): (0, 0, 0)
    Vertex B (base): (a/2, a*(sqrt(3))/2, 0)
    Vertex C (base): (-a/2, a*(sqrt(3))/2, 0)
    Apex (top): (0, 0, a*(sqrt(6))/3)
  */

  get controlPoints () {
    return [this.#topPoint, this.#backLeftPoint, this.#backRightPoint, this.#towardPoint];
  }

  set isCamera (isCamera) {
    this.#isCamera = isCamera;
  }

  get ID () {
    return this.#ID;
  }

  get broadCollisionRadius () {
    return 1;
  }

  constructor(world, position, radius) {
    this.#world = world;
    if (!radius) {
        radius = 1.0;
    }

    let 
        normalTopPosition = glMatrix.vec3.fromValues(1, 1, -1),
        normalTowardPosition = glMatrix.vec3.fromValues(-1, 1, 1),
        normalBackLeftPosition = glMatrix.vec3.fromValues(-1, -1, -1),
        normalBackRightPosition = glMatrix.vec3.fromValues(1, -1, 1);

    let vertices = [normalTopPosition, normalTowardPosition, normalBackLeftPosition, normalBackRightPosition];
    
    vertices.forEach((vertex) => {
        engineMath.transformVectorByAngle(vertex, [0, -Math.PI/4, 0]);
        engineMath.transformVectorByAngle(vertex, [-0.95535, 0, 0]);
        glMatrix.vec3.scale(vertex, vertex, radius/Math.pow(3, 0.5));
        glMatrix.vec3.add(vertex, vertex, position);
    });

    this.#topPoint = new SimpleControlPoint(world, normalTopPosition, radius*0.3);
    this.#towardPoint = new SimpleControlPoint(world, normalTowardPosition, radius*0.3);
    this.#backLeftPoint = new SimpleControlPoint(world, normalBackLeftPosition, radius*0.3);
    this.#backRightPoint = new SimpleControlPoint(world, normalBackRightPosition, radius*0.3);

    this.controlPoints.forEach((controlPoint) => {
        controlPoint.bondToAnyWithinRadius(this.controlPoints, radius*2, 10);
    });

    this.#ID = `${new Date().getTime()}${Math.round(engineMath.random()*10000)}`;

    // let objFile = require('../models/drop.obj');

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

    //   this.controlPoints.forEach((controlPoint) => {
    //     world.addControlPoint(controlPoint);
    //   });
      world.addDrawable(this);
  }

  #world = null;
  get world() {
    return this.#world;
  }

  draw() {

    if (!this.#drawDelegate || this.#isCamera || !this.#visible) {
        return;
    }
    // // Set the drawing position to the "identity" point, which is
    // // the center of the scene.
    // // const modelViewMatrix = glMatrix.mat4.create();
    const modelViewMatrix = this.#world.modelViewMatrix;
  
    // // Now move the drawing position a bit to where we want to
    // // start drawing the square.
    let drawPosition = engineMath.averageOfVectors([
        this.#backLeftPoint.position,
        this.#backRightPoint.position,
        this.#towardPoint.position
    ]);
    let drawDelegateMatrix = glMatrix.mat4.clone(modelViewMatrix);

    //TEMORARY: testing draw position fix
    // glMatrix.vec3.scale(drawPosition, drawPosition, -1);
    glMatrix.mat4.translate(
      drawDelegateMatrix, // destination matrix
      drawDelegateMatrix, // matrix to translate
      drawPosition,
    ); // amount to translate

    let topPoint = this.#topPoint;
    let normalizedUp = glMatrix.vec3.create();
    glMatrix.vec3.sub(normalizedUp, this.#topPoint.position, drawPosition);
    glMatrix.vec3.normalize(normalizedUp, normalizedUp);

    let normalizedTowardPoint = glMatrix.vec3.create();
    glMatrix.vec3.sub(normalizedTowardPoint, this.#towardPoint.position, drawPosition);
    glMatrix.vec3.normalize(normalizedTowardPoint, normalizedTowardPoint);

    let normalizedRight = glMatrix.vec3.create();
    glMatrix.vec3.cross(normalizedRight, normalizedUp, normalizedTowardPoint);
    glMatrix.vec3.normalize(normalizedRight, normalizedRight);
    
    let normalizedDrawToward = glMatrix.vec3.create();
    glMatrix.vec3.cross(normalizedDrawToward, normalizedRight, normalizedUp);
    glMatrix.vec3.normalize(normalizedDrawToward, normalizedDrawToward);

    let drawMatrix = glMatrix.mat4.fromValues(
        normalizedRight[0], normalizedUp[0], normalizedDrawToward[0], 0,
        normalizedRight[1], normalizedUp[1], normalizedDrawToward[1], 0,
        normalizedRight[2], normalizedUp[2], normalizedDrawToward[2], 0,
        0, 0, 0, 1
    );

    glMatrix.mat4.multiply(drawDelegateMatrix, drawDelegateMatrix, drawMatrix);
    // let normalizedRight = this.#positionPoint.right;
    // glMatrix.vec3.normalize(normalizedRight, normalizedRight);

    // let normalizedToward = glMatrix.vec3.create();
    // glMatrix.vec3.cross(normalizedToward, normalizedRight, normalizedUp);
    // glMatrix.vec3.subtract(normalizedToward, glMatrix.vec3.create(), normalizedToward);
    // glMatrix.vec3.normalize(normalizedToward, normalizedToward);

    // glMatrix.mat4.multiply(drawDelegateMatrix, drawDelegateMatrix, this.#positionPoint.drawMatrix);

    let lightPosition = this.#world.getLights()[0].position;
    glMatrix.vec3.transformMat4(lightPosition, lightPosition, modelViewMatrix);

    this.#drawDelegate.draw(drawDelegateMatrix, lightPosition);
  }
}

export default SimpleSpheroidDrop;