import * as glMatrix from 'gl-matrix';
import SimpleDrawDelegate from './simple-draw-delegate';
import OBJFile from 'obj-file-parser';

let globalDrawDelegate = null;

class ParticleControlPoint {
    #world = null;
    #position = null;

    get positionAsVector () {
        return glMatrix.vec3.clone(this.#position);
    }

    get position () {
        return this.#position.slice(0);
    }

    #bonds = [];
    #momentum = null;
    #repulsion = 1.0;
    get repulsion () {
        return this.#repulsion;
    }
    #plottable = null;
    //the distance past which the particle won't repel another
    #radius = 1.2;
    get radius () {
        return this.#radius;
    }

    #inertia = 1.0;
    #drawDelegate = null;

    constructor(world, plottable, position) {
        this.#world = world;
        this.#plottable = plottable;
        this.#position = glMatrix.vec3.fromValues(
            position[0],
            position[1],
            position[2]
        );

        this.#momentum = glMatrix.vec3.create();
    }

    bondTo(other, strength, isReciprocalBond) {
        //TODO: make a bond a shared object between the two particles rather than a different reference for each
        this.#bonds.push({
            controlPoint: other,
            strength
        });

        if (!isReciprocalBond) {
            other.bondTo(this, strength, true);
        }
    }

    //calculate the bond strength needed to equal the repulsion at the given distance
    bondToInPlace(other) {
        this.bondTo(other, 0.1, false);
    }
    
    //simulate against all control points in a tile
    simulate(interval) {
        // //calculate attraction by bonds
        this.#bonds.forEach((bond) => {
            let distance = glMatrix.vec3.distance(this.#position, bond.controlPoint.position);
            let magnitude = interval * bond.strength * distance;

            let relativePosition = glMatrix.vec3.create();
            glMatrix.vec3.subtract(relativePosition, bond.controlPoint.positionAsVector, this.#position); 
            glMatrix.vec3.scale(relativePosition, relativePosition, magnitude);
            glMatrix.vec3.add(this.#momentum, this.#momentum, relativePosition);
        });

        //calculate repulsion by local control points
        let tile = this.#world.gridSystem.getPrimaryTileCoordinatesForPlottable(this.#plottable);
        let plottables = this.#world.gridSystem.getCurrentPlottablesForTileCoordinates(tile);
        //optimize this by indexing the control points on the tile
        let localParticleControlPoints = [];
        plottables.forEach((plottable) => {
            localParticleControlPoints = localParticleControlPoints.concat(plottable.controlPoints || []);
        }); 

        localParticleControlPoints.forEach((otherParticleControlPoint) => {
            if (otherParticleControlPoint != this) {

                let distance = glMatrix.vec3.distance(this.#position, otherParticleControlPoint.position);

                let magnitude = 
                    interval *(
                        otherParticleControlPoint.repulsion / 
                        distance/* -
                        otherParticleControlPoint.repulsion /
                        otherParticleControlPoint.radius*/
                    );

                if (distance < otherParticleControlPoint.radius) {
                    let relativePosition = glMatrix.vec3.create();
                    glMatrix.vec3.subtract(relativePosition, otherParticleControlPoint.positionAsVector, this.#position);
                    glMatrix.vec3.scale(relativePosition, relativePosition, magnitude);
        
                    glMatrix.vec3.subtract(this.#momentum, this.#momentum, relativePosition);
                }
            }
            //magnitude = interval * otherParticleControlPoint.repulsion / distance (this, otherParticleControlPoint) - (otherParticleControlPoint.repulsion / otherParticleControlPoint.radius)
            //momentum -= relativeLocation (this, otherParticleControlPoint) * magnitude

        });

        // //calculate gravity from world
        // this.#world.calculateGravityVectorForCoordinate(this.#position);

        //scale momentum by interval
        let scaledMomentum = glMatrix.vec3.create();
        glMatrix.vec3.scale(scaledMomentum, this.#momentum, interval*1000);
        //add momentum to position
        glMatrix.vec3.add(this.#position, this.#position, scaledMomentum);
        // console.log('simulating control point',this.#position);


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
    
            globalDrawDelegate = new SimpleDrawDelegate(this.#world, positions, colors, null, indices);
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

export default ParticleControlPoint;