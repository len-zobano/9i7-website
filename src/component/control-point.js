import * as glMatrix from 'gl-matrix';
import SimpleDrawDelegate from './simple-draw-delegate';
import OBJFile from 'obj-file-parser';

let globalDrawDelegate = null;

class ControlPoint {
    #world = null;
    #position = null;
    get position () {
        return this.#position.slice(0);
    }

    #bonds = [];
    #momentum = null;
    #repulsion = 1.0;
    //the distance past which the particle won't repel another
    #radius = 1.0;
    #inertia = 1.0;

    #drawDelegate = null;

    constructor(world, position) {
        this.#world = world;
        this.#position = glMatrix.vec3.fromValues(
            position[0],
            position[1],
            position[2]
        );

        this.#momentum = glMatrix.vec3.create();
    }

    bondTo(other, strength, isReciprocalBond) {
        this.#bonds.push({
            controlPoint: other,
            strength
        });

        if (!isReciprocalBond) {
            other.bondTo(this, strength, true);
        }
    }

    //calculate the bond strength needed to equal the repulsion at the given distance
    bondToInPlace(other, isReciprocalBond) {

    }
    
    //simulate against all control points in a tile
    simulate(interval, tile) {
        // //calculate attraction by bonds
        // this.#bonds.forEach((bond) => {
        //     //momentum += relativeLocation (this, bond.controlPoint) * bond.strength * interval
        // });

        // //calculate repulsion by local control points
        // let localControlPoints = tile.getControlPoints();
        // localControlPoints.forEach((otherControlPoint) => {
        //     //magnitude = interval * otherControlPoint.repulsion / distance (this, otherControlPoint) - (otherControlPoint.repulsion / otherControlPoint.radius)
        //     //momentum -= relativeLocation (this, otherControlPoint) * magnitude
        // });

        // //calculate gravity from world
        // this.#world.calculateGravityVectorForCoordinate(this.#position);

        //scale momentum by interval
        let scaledMomentum = glMatrix.vec3.create();
        glMatrix.vec3.scale(scaledMomentum, this.#momentum, interval);
        //add momentum to position
        glMatrix.vec3.add(this.#position, this.#position, scaledMomentum);
        // console.log('simulating control point',this.#position);


        glMatrix.vec3.scale(this.#momentum, this.#momentum, Math.pow(0.001,interval));
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

    changeMomentum(momentumChangeArray) {
        console.log('changemomentum at control point');
        let momentumChange = glMatrix.vec3.fromValues(
            momentumChangeArray[0],
            momentumChangeArray[1],
            momentumChangeArray[2]
        );
        glMatrix.vec3.add(this.#momentum, this.#momentum, momentumChange);
    }
}

export default ControlPoint;