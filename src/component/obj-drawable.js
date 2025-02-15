import * as glMatrix from 'gl-matrix';
import MaterialDrawDelegate from './material-draw-delegate';
import SimpleDrawDelegate from './simple-draw-delegate';
import OBJFile from 'obj-file-parser';
import engineMath from '../utility/engine-math';

class ObjDrawable {
  #ID = null;
  #drawDelegate = null;
  #visible = true;
  #centerPoints = [];
  #topPoints = [];
  #frontPoints = [];

  set visible (v) {
    this.#visible = v;
  }
  get ID () {
    return this.#ID;
  }

  constructor(world, filename, centerPoints, topPoints, frontPoints) {
    this.#world = world;
    this.#centerPoints = centerPoints.slice(0);
    this.#topPoints = topPoints.slice(0);
    this.#frontPoints = frontPoints.slice(0);

    this.#ID = `${new Date().getTime()}${Math.round(engineMath.random()*10000)}`;

    fetch(filename)
      .then(response => response.text())
      .then((text) => {
        let objFile = new OBJFile (text);
        let objOutput = objFile.parse();

        let vertexIndices = objOutput.models[0].faces.map((face) => {
          let ret = face.vertices.map((vertex) => {
            return vertex.vertexIndex - 1;
          });

          return ret;
        }).reduce((a, b) => {
          return a.concat(b);
        });

        let positions = vertexIndices.map((index) => {
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
                currentColor = [1.0,1.0,1.0,1.0];
            }
            ++timesReturned;
            return currentColor;
        }

        let colors = vertexIndices.map((index) => {
            return getNextColor();
        }).reduce((a, b) => {
            return a.concat(b);
        });

        //each face has one vertex normal. That has to be converted to three each
        //so indices are floored by three
        
        let normalIndices = objOutput.models[0].faces.map((face) => {
          let ret = face.vertices.map((vertex) => {
            return vertex.vertexNormalIndex - 1;
          });

          return ret;
        }).reduce((a, b) => {
          return a.concat(b);
        });

        let normals = normalIndices.map((index) => {
            let vertex = objOutput.models[0].vertexNormals[index];
            return [vertex.x, vertex.y, vertex.z];
        }).reduce((a, b) => {
            return a.concat(b);
        });

        let textureCoordinateIndices = objOutput.models[0].faces.map((face) => {
            let ret = face.vertices.map((vertex) => {
              return vertex.textureCoordsIndex - 1;
            });
  
            return ret;
        }).reduce((a, b) => {
         return a.concat(b);
        });
  
        let textureCoordinates = textureCoordinateIndices.map((index) => {
            let textureCoordinate = objOutput.models[0].textureCoords[index];
            return [textureCoordinate.u, textureCoordinate.v];
        }).reduce((a, b) => {
            return a.concat(b);
        });

        this.#drawDelegate = new MaterialDrawDelegate(this.#world, positions, colors, normals, null, textureCoordinates, 'texture-images/nut-skin.png');
        // this.#drawDelegate = new SimpleDrawDelegate(this.#world, positions, colors, normals);
      });

      world.addDrawable(this);
  }

  #world = null;
  get world() {
    return this.#world;
  }

  draw() {

    if (!this.#drawDelegate || !this.#visible) {
        return;
    }
    // // Set the drawing position to the "identity" point, which is
    // // the center of the scene.
    // // const modelViewMatrix = glMatrix.mat4.create();
    let modelViewMatrix = this.#world.modelViewMatrix;
    let cameraMatrix = this.#world.cameraMatrix;
  
    let 
        centerPosition = glMatrix.vec3.create(),
        frontPosition = glMatrix.vec3.create(),
        topPosition = glMatrix.vec3.create();

    this.#centerPoints.forEach((centerPoint) => {
        glMatrix.vec3.add(centerPosition, centerPosition, centerPoint.position);
    });
    glMatrix.vec3.scale(centerPosition, centerPosition, 1/this.#centerPoints.length);
    
    this.#frontPoints.forEach((frontPoint) => {
        glMatrix.vec3.add(frontPosition, frontPosition, frontPoint.position);
    });
    glMatrix.vec3.scale(frontPosition, frontPosition, 1/this.#frontPoints.length);

    this.#topPoints.forEach((topPoint) => {
        glMatrix.vec3.add(topPosition, topPosition, topPoint.position);
    });
    glMatrix.vec3.scale(topPosition, topPosition, 1/this.#topPoints.length);

    //TEMORARY: testing draw position fix
    // glMatrix.vec3.scale(drawPosition, drawPosition, -1);
    glMatrix.mat4.translate(
      modelViewMatrix,
      modelViewMatrix, // matrix to translate
      centerPosition
    ); // amount to translate

    let normalizedUp = glMatrix.vec3.create();
    glMatrix.vec3.sub(normalizedUp, topPosition, centerPosition);
    //before normalizing, use this for scale
    let scale = glMatrix.vec3.length(normalizedUp);
    glMatrix.vec3.normalize(normalizedUp, normalizedUp);

    let normalizedFrontPoint = glMatrix.vec3.create();
    glMatrix.vec3.sub(normalizedFrontPoint, frontPosition, centerPosition);
    glMatrix.vec3.normalize(normalizedFrontPoint, normalizedFrontPoint);

    let normalizedRight = glMatrix.vec3.create();
    glMatrix.vec3.cross(normalizedRight, normalizedUp, normalizedFrontPoint);
    glMatrix.vec3.normalize(normalizedRight, normalizedRight);
    
    let normalizedDrawFront = glMatrix.vec3.create();
    glMatrix.vec3.cross(normalizedDrawFront, normalizedRight, normalizedUp);
    glMatrix.vec3.normalize(normalizedDrawFront, normalizedDrawFront);

    let drawMatrix = glMatrix.mat4.fromValues(
        normalizedRight[0], -normalizedUp[0], normalizedDrawFront[0], 0,
        normalizedRight[1], -normalizedUp[1], normalizedDrawFront[1], 0,
        normalizedRight[2], -normalizedUp[2], normalizedDrawFront[2], 0,
        0, 0, 0, 1
    );
    glMatrix.mat4.invert(drawMatrix, drawMatrix);

    glMatrix.mat4.multiply(modelViewMatrix, modelViewMatrix, drawMatrix);
    glMatrix.mat4.scale(modelViewMatrix, modelViewMatrix, glMatrix.vec3.fromValues(scale, scale, scale));

    let lightPosition = this.#world.getLights()[0].position;

    this.#drawDelegate.draw(cameraMatrix, modelViewMatrix, lightPosition);
  }
}

export default ObjDrawable;