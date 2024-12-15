import * as glMatrix from 'gl-matrix';
import SimpleDrawDelegate from './simple-draw-delegate';
import OBJFile from 'obj-file-parser';

let drawDelegates = {
    red: null,
    green: null,
    blue: null
};

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
    #linearAcceleration = null;
    //angular momentum is an array of three angles to rotate, one for the x, y, and z axis
    #angularMomentum = null;
    #angularAcceleration = null;
    //top is a normal pointing in the direction of the top of the object (representing angular position)
    #top = null;
    get top () {
        return glMatrix.vec3.clone(this.#top);
    }
    //right is a normal pointing in the direction of the right of the object (representing angular position)
    #right = null;
    get right () {
        return glMatrix.vec3.clone(this.#right);
    }
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
        this.#linearAcceleration = glMatrix.vec3.create();
        this.#angularAcceleration = glMatrix.vec3.create();
        this.#top = glMatrix.vec3.fromValues(0.0,1.0,0.0);
        this.#right = glMatrix.vec3.fromValues(1.0,0.0,0.0);
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
            //for your bond to the other,
                //calculate angular momentum by angle of bond

                //calculate linear momentum using a comparison of the length of the vectors
                //linear momentum should only be proportional to the distance when angle is corrected for
                //so the difference in distance from center is corrected for angle
            //for the other bond to you,
                //calculate the linear momentum based on the other position
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

        //add linear acceleration to linear momentum
        let scaledLinearAcceleration = glMatrix.vec3.create();
        glMatrix.vec3.scale(scaledLinearAcceleration, this.#linearAcceleration, interval);
        glMatrix.vec3.add(this.#linearMomentum, this.#linearMomentum, scaledLinearAcceleration);
        //scale linear momentum by interval
        let scaledLinearMomentum = glMatrix.vec3.create();
        glMatrix.vec3.scale(scaledLinearMomentum, this.#linearMomentum, interval);
        //add angular acceleration to angular momentum
        let scaledAngularAcceleration = this.#angularAcceleration.map((angle) => {
            return angle*interval;
        });
        for (let i = 0; i < 3; ++i) {
            this.#angularMomentum[i] += scaledAngularAcceleration[i];
        }
        //scale angular momentum by interval
        let scaledAngularMomentum = this.#angularMomentum.map((angle) => {
            return angle*interval;
        });
        //add scaled linear momentum to position
        glMatrix.vec3.add(this.#position, this.#position, scaledLinearMomentum);
        //rotate top and right by scaled angular momentum
        let angleSines = [
            Math.sin(scaledAngularMomentum[0]),
            Math.sin(scaledAngularMomentum[1]),
            Math.sin(scaledAngularMomentum[2])
        ];

        let angleCosines= [
            Math.cos(scaledAngularMomentum[0]),
            Math.cos(scaledAngularMomentum[1]),
            Math.cos(scaledAngularMomentum[2])
        ];

        let rotationMatrices = [
            glMatrix.mat3.fromValues(
                1, 0, 0,
                0, angleCosines[0], -angleSines[0],
                0, angleSines[0], angleCosines[0]
            ),
            glMatrix.mat3.fromValues(
                angleCosines[1], 0, angleSines[1],
                0, 1, 0,
                -angleSines[1], 0, angleCosines[1]
            ),
            glMatrix.mat3.fromValues(
                angleCosines[2], -angleSines[2], 0,
                angleSines[2], angleCosines[2], 0,
                0, 0, 1
            )
        ];

        rotationMatrices.forEach((matrix) => {
            glMatrix.vec3.transformMat3(this.#top, this.#top, matrix);
            glMatrix.vec3.transformMat3(this.#right, this.#right, matrix);
        });

        let scaledMomentumDecay = Math.pow(0.01,interval);
        glMatrix.vec3.scale(this.#linearMomentum, this.#linearMomentum, scaledMomentumDecay);
        this.#angularMomentum = this.#angularMomentum.map((element) => {
            return element*scaledMomentumDecay;
        });

        let scaledAccelerationDecay = Math.pow(0.00001,interval);
        glMatrix.vec3.scale(this.#linearAcceleration, this.#linearAcceleration, scaledAccelerationDecay);
        this.#angularAcceleration = this.#angularAcceleration.map((element) => {
            return element*scaledAccelerationDecay;
        });
    }

    initializeDrawDelegates () {
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
    
            let colors = {
                red: objOutput.models[0].vertices.map((vertex) => {
                    return [1.0,0.0,0.0,1.0];
                }).reduce((a,b) => {
                    return a.concat(b);
                }),
                green: objOutput.models[0].vertices.map((vertex) => {
                    return [0.0,1.0,0.0,1.0];
                }).reduce((a,b) => {
                    return a.concat(b);
                }),
                blue: objOutput.models[0].vertices.map((vertex) => {
                    return [0.0,0.0,1.0,1.0];
                }).reduce((a,b) => {
                    return a.concat(b);
                }),
            };
    
            let indices = objOutput.models[0].faces.map((face) => {
              let ret = face.vertices.map((vertex) => {
                return vertex.vertexIndex - 1;
              });
    
              return ret;
            }).reduce((a, b) => {
              return a.concat(b);
            });
    
            drawDelegates = {
                red: new SimpleDrawDelegate(this.#world, positions, colors.red, indices),
                green: new SimpleDrawDelegate(this.#world, positions, colors.green, indices),
                blue: new SimpleDrawDelegate(this.#world, positions, colors.blue, indices),
            }
          });
    }

    drawReferencePoint(matrix, coordinates, color) {
        glMatrix.mat4.translate(
            matrix, // destination matrix
            matrix, // matrix to translate
            coordinates.map((coordinate) => {
              return coordinate;
            })
        ); 

        let pointScale = 0.1;
        glMatrix.mat4.scale(
            matrix,
            matrix,
            glMatrix.vec3.fromValues(pointScale, pointScale, pointScale)
        );

        if (!drawDelegates.red && this.#world) {
            this.initializeDrawDelegates();
        }

        if (drawDelegates[color]) {
            drawDelegates[color].draw(glMatrix.mat4.clone(matrix));
        }
    }

    draw() {
        const modelViewMatrix = this.#world.modelViewMatrix;
        // Now move the drawing position a bit to where we want to
        // start drawing the square.
        glMatrix.mat4.translate(
          modelViewMatrix, // destination matrix
          modelViewMatrix, // matrix to translate
          this.#position.map((coordinate) => {
            return coordinate;
          })
        ); 

        this.drawReferencePoint(glMatrix.mat4.clone(modelViewMatrix), [0,0,0], 'green');
        this.drawReferencePoint(glMatrix.mat4.clone(modelViewMatrix), this.#top, 'red');
        this.drawReferencePoint(glMatrix.mat4.clone(modelViewMatrix), this.#right, 'blue');
    }

    changeLinearMomentum(momentumChangeArray) {
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

    changeLinearAcceleration (accelerationChangeArray) {
        let accelerationChange = glMatrix.vec3.fromValues(
            accelerationChangeArray[0],
            accelerationChangeArray[1],
            accelerationChangeArray[2]
        );
        glMatrix.vec3.add(this.#linearAcceleration , this.#linearAcceleration, accelerationChange);
    }

    changeAngularAcceleration(accelerationChangeArray) {
        for (let i = 0; i < 3; ++i) {
            this.#angularAcceleration[i] += accelerationChangeArray[i];
        }
        console.log('new angular acceleration',this.#angularAcceleration);
    }
}

export default SphericalControlPoint;