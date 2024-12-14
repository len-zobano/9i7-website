import * as glMatrix from 'gl-matrix';
import SimpleDrawDelegate from './simple-draw-delegate';
import OBJFile from 'obj-file-parser';

let globalDrawDelegate = null;

class SphericalControlPoint {
    #world = null;
    #position = null;

    get positionAsVector () {
        return glMatrix.vec3.clone(this.#position);
    }

    get position () {
        return this.#position.slice(0);
    }

    #bonds = [];
    #linearMomentum = null;
    //angular momentum is an array of three angles to rotate, one for the x, y, and z axis
    #angularMomentum = null;
    //top is a normal pointing in the direction of the top of the object (representing angular position)
    #top = null;
    #friction = 0.0;
    #plottable = null;
    #radius = 1.2;
    get radius () {
        return this.#radius;
    }

    #inertia = 1.0;
    #drawDelegate = null;

    constructor(world, plottable, position, drag) {
        this.#world = world;
        this.#plottable = plottable;
        this.#position = glMatrix.vec3.fromValues(
            position[0],
            position[1],
            position[2]
        );

        if (drag) {
            this.#friction = drag;
        }
        this.#linearMomentum = glMatrix.vec3.create();
        this.#angularMomentum = [0,0,0];
        this.#top = glMatrix.vec3.fromValues(0.0,1.0,0.0);
    }

    bondTo(other, strength, isReciprocalBond) {
        let relativePosition = glMatrix.vec3.create();
        glMatrix.vec3.sub(relativePosition, other.positionAsVector, this.#position);

        this.#bonds.push({
            controlPoint: other,
            relativePosition,
            strength
        });

        if (!isReciprocalBond) {
            other.bondTo(this, strength, true);
        }
    }
    
    //simulate against all control points in a tile
    simulate(interval) {
        // //calculate attraction by bonds
        this.#bonds.forEach((bond) => {
            
        });

        //calculate collision by local control points
        let tile = this.#world.gridSystem.getPrimaryTileCoordinatesForPlottable(this.#plottable);
        let plottables = this.#world.gridSystem.getCurrentPlottablesForTileCoordinates(tile);
        //optimize this by indexing the control points on the tile
        let localSphericalControlPoints = [];
        plottables.forEach((plottable) => {
            localSphericalControlPoints = localSphericalControlPoints.concat(plottable.controlPoints || []);
        });

        localSphericalControlPoints.forEach((otherSphericalControlPoint) => {
            if (otherSphericalControlPoint != this) {
                let distance = glMatrix.vec3.distance(this.#position, otherSphericalControlPoint.position);
            }
        });

        //scale momentum by interval
        let scaledMomentum = glMatrix.vec3.create();
        glMatrix.vec3.scale(scaledMomentum, this.#momentum, interval);
        //add momentum to position
        glMatrix.vec3.add(this.#position, this.#position, this.#momentum);
        //scale angular momentum by interval

        //rotate top by angular momentum


        glMatrix.vec3.scale(this.#momentum, this.#momentum, 0.99);
    }

    initializeGlobalDrawDelegate () {
        let objFile = require('../models/controlPoint.obj');

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
              return [1.0,0.0,0.0,1.0];
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
    
            globalDrawDelegate = new SimpleDrawDelegate(this.#world, positions, colors, indices);
          });
    }

    draw() {
        const modelViewMatrix = this.#world.modelViewMatrix;
  
        // Now move the drawing position a bit to where we want to
        // start drawing the square.
        glMatrix.mat4.translate(
          modelViewMatrix, // destination matrix
          modelViewMatrix, // matrix to translate
          this.#position.map((coordinate) => {
            return coordinate + 1.0;
          })
        ); // amount to translate

        glMatrix.mat4.scale(
            modelViewMatrix,
            modelViewMatrix,
            glMatrix.vec3.fromValues(0.2,0.2,0.2)
        );

        if (!globalDrawDelegate && this.#world) {
            this.initializeGlobalDrawDelegate();
        }

        if (globalDrawDelegate) {
            globalDrawDelegate.draw(glMatrix.mat4.clone(modelViewMatrix));
        }
    }

    changeLinearMomentum(momentumChangeArray) {
        console.log('changemomentum at control point');
        let momentumChange = glMatrix.vec3.fromValues(
            momentumChangeArray[0],
            momentumChangeArray[1],
            momentumChangeArray[2]
        );
        glMatrix.vec3.add(this.#linearMomentum, this.#linearMomentum, momentumChange);
    }

    changeAngularMomentum(momentumChangeArray) {
        for (let i = 0; i < 3; ++i) {
            this.#angularMomentum[i] += momentumChangeArray[i];
        }
    }
}

export default SphericalControlPoint;