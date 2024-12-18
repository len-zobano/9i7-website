import * as glMatrix from 'gl-matrix';
import SimpleDrawDelegate from './simple-draw-delegate';
import OBJFile from 'obj-file-parser';

let globalSpeed = 10;
let drawDelegates = {
    red: null,
    green: null,
    blue: null
};

let 
    centerVector = glMatrix.vec3.create(),
    topVector = glMatrix.vec3.fromValues(0.0,1.0,0.0),
    rightVector = glMatrix.vec3.fromValues(1.0,0.0,0.0);

function transformVectorByAngle (vector, angle) {
    let angleSines = [
        Math.sin(angle[0]),
        Math.sin(angle[1]),
        Math.sin(angle[2])
    ];

    let angleCosines= [
        Math.cos(angle[0]),
        Math.cos(angle[1]),
        Math.cos(angle[2])
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
        glMatrix.vec3.transformMat3(vector, vector, matrix);
    });
}

function angleOfOne2DVector (a, b) {
    if (a === -0) a = 0;
    if (b === -0) b = 0;
    return Math.atan2(b, a);
}

function shortestAngleBetweenTwo2DVectors (a, c) {
    if (a[0] === 0 && a[1] === 0) return 0;
    if (c[0] === 0 && c[1] === 0) return 0;
    let angle = angleOfOne2DVector(c[1],c[0]) - angleOfOne2DVector(a[1],a[0]);
    //if the angle is over 180, make it angle-360
    if (angle > Math.PI) {
        angle -= 2*Math.PI;
    }
    //if the angle is under -180, make it angle+360
    else if (angle < -Math.PI) {
        angle += 2*Math.PI;
    }
    
    return angle;
}

function angleBetweenTwoVectors (a, c) {
    //turn them to 3 2D angles
    let 
        AXY = glMatrix.vec2.fromValues(a[0], a[1]), 
        CXY = glMatrix.vec2.fromValues(c[0], c[1]),
        AZY = glMatrix.vec2.fromValues(-a[2], a[1]),
        CZY = glMatrix.vec2.fromValues(-c[2], c[1]),
        AXZ = glMatrix.vec2.fromValues(a[0], a[2]),
        CXZ = glMatrix.vec2.fromValues(c[0], c[2]);

    // let ret = [
    //     angleBetweenTwo2DVectors(AZY, CZY),
    //     -angleBetweenTwo2DVectors(AXZ, CXZ),
    //     angleBetweenTwo2DVectors(AXY, CXY)
    // ];

    let ret = [];
    ret[0] = shortestAngleBetweenTwo2DVectors(AZY, CZY);
    ret[1] = -shortestAngleBetweenTwo2DVectors(AXZ, CXZ);
    ret[2] = shortestAngleBetweenTwo2DVectors(AXY, CXY);
    //x,y,z
    // let ret = [
    //     angleIsImmesurable(AYZ, CYZ) ? 0.0 : glMatrix.vec2.angle(AYZ, CYZ),//yz
    //     angleIsImmesurable(AXZ, CXZ) ? 0.0 : glMatrix.vec2.angle(AXZ, CXZ),//xz
    //     angleIsImmesurable(AXY, CXY) ? 0.0 : glMatrix.vec2.angle(AXY, CXY)//xy
    // ];
    //z,y,x
    // let ret = [
    //     glMatrix.vec3.equals(AXZ, CXZ) ? 0.0 : glMatrix.vec3.angle(AXY, CXY),//xy
    //     glMatrix.vec3.equals(AXZ, CXZ) ? 0.0 : glMatrix.vec3.angle(AXZ, CXZ),//xz
    //     glMatrix.vec3.equals(AYZ, CYZ) ? 0.0 : glMatrix.vec3.angle(AYZ, CYZ)//yz
    // ];

    return ret.map((element) => {
        if (element === -0) {
            element = 0;
        }
        return element;
    });
}

class SphericalControlPoint {
    #world = null;
    #position = null;

    get cameraMatrix () {
        let normalizedUp = this.top;
        glMatrix.vec3.normalize(normalizedUp, normalizedUp);

        let normalizedRight = this.right;
        glMatrix.vec3.normalize(normalizedRight, normalizedRight);

        let normalizedToward = glMatrix.vec3.create();
        glMatrix.vec3.cross(normalizedToward, normalizedRight, normalizedUp);
        glMatrix.vec3.subtract(normalizedToward, glMatrix.vec3.create(), normalizedToward);
        glMatrix.vec3.normalize(normalizedToward, normalizedToward);

        return glMatrix.mat4.fromValues(
            normalizedRight[0], normalizedUp[0], normalizedToward[0], 0,
            normalizedRight[1], normalizedUp[1], normalizedToward[1], 0,
            normalizedRight[2], normalizedUp[2], normalizedToward[2], 0,
            0, 0, 0, 1
        );
    }

    get drawMatrix () {
        let matrix = this.cameraMatrix;
        glMatrix.mat4.invert(matrix, matrix);
        return matrix;
    }

    get positionAsVector () {
        return glMatrix.vec3.clone(this.#position);
    }

    get position () {
        return this.#position.slice(0);
    }

    #bonds = [];
    #linearMomentum = null;
    get linearMomentum () {
        return glMatrix.vec3.clone(this.#linearMomentum);
    }
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

    freeze() {
        this.#linearMomentum = glMatrix.vec3.create();
        this.#linearAcceleration = glMatrix.vec3.create();
        this.#angularMomentum = [0,0,0];
        this.#angularAcceleration = [0,0,0];
    }

    bondTo(other, strength, isReciprocalBond) {
        if (!strength) {
            strength = 1.0;
        }
        let relativePosition = glMatrix.vec3.create();
        glMatrix.vec3.sub(relativePosition, other.positionAsVector, this.#position);
        
        let bond = {
            controlPoint: other,
            idealRelativePosition: relativePosition,
            strength
        };

        this.#bonds.push(bond);

        //create reciprocal bonds and update properties
        if (!isReciprocalBond) {
            let reciprocalBond = other.bondTo(this, strength, true);
            bond.reciprocalBond = reciprocalBond;
            reciprocalBond.reciprocalBond = bond;
        }

        return bond;
    }
    
    //simulate against all control points in a tile
    calculateTrajectory(interval) {
        // //calculate attraction by bonds
        this.#bonds.forEach((bond) => {
            //for your bond to the other,
                //calculate angular momentum by angle of bond   
            let positionOfOther = bond.controlPoint.position;
            let realRelativePosition = glMatrix.vec3.fromValues(
                positionOfOther[0] - this.#position[0],
                positionOfOther[1] - this.#position[1],
                positionOfOther[2] - this.#position[2]
            );

            let idealRelativePosition = glMatrix.vec3.clone(bond.idealRelativePosition);

            glMatrix.vec3.transformMat4(idealRelativePosition, idealRelativePosition, this.drawMatrix);

            let angleOfBondToOther = angleBetweenTwoVectors(
                idealRelativePosition,
                realRelativePosition
            )
            
            let scaledAngleOfBondToOther = angleOfBondToOther.map((angle) => {
                if (angle > Math.PI/2) angle = Math.PI - angle;
                if (angle < -Math.PI/2) angle = -Math.PI - angle;
                return angle*interval*bond.strength*globalSpeed;
            });

            // if (this.#plottable.selected) {
            //     console.log(`
            //         For selected control point:
            //             Angle between vectors: ${angleOfBondToOther}
            //             Scaled angle between vectors: ${scaledAngleOfBondToOther}
            //             Real relative position: ${realRelativePosition}
            //             Ideal relative position: ${idealRelativePosition}
            //     `);
            // }
            //add bond angle to angular momentum
            //interval * bondStrength * angle
            for (let i = 0; i <  3; ++i) {
                this.#angularMomentum[i] += scaledAngleOfBondToOther[i];
            }

                //calculate linear momentum using a comparison of the length of the vectors
            let distanceFromIdeal = glMatrix.vec3.length(realRelativePosition) - glMatrix.vec3.length(idealRelativePosition);
                //linear momentum should only be proportional to the distance when angle is corrected for
            let relativePositionNormal = glMatrix.vec3.clone(realRelativePosition);
            glMatrix.vec3.normalize(relativePositionNormal, relativePositionNormal);
                //so the difference in distance from center is corrected for angle
            glMatrix.vec3.scale(relativePositionNormal, relativePositionNormal, distanceFromIdeal*interval*bond.strength*globalSpeed);
            glMatrix.vec3.add(this.#linearMomentum, this.#linearMomentum, relativePositionNormal);




            //for the other bond to you,
                //get the ideal position of your own particle relative to that bond
            let idealPositionOfThisFromOther = glMatrix.vec3.clone(bond.reciprocalBond.idealRelativePosition);
                //transform the ideal postion by the other particle's draw matrix
            glMatrix.vec3.transformMat4(idealPositionOfThisFromOther, idealPositionOfThisFromOther, bond.controlPoint.drawMatrix);
                //get your real position by subtracting your position by theirs
            let realPositionOfThisFromOther = glMatrix.vec3.clone(this.position);
            glMatrix.vec3.subtract(realPositionOfThisFromOther, realPositionOfThisFromOther, bond.controlPoint.position);
                //subtract real from ideal to get the momentum vector for this one
            let scaledMomentumTowardIdeal = glMatrix.vec3.create();
            glMatrix.vec3.subtract(scaledMomentumTowardIdeal, idealPositionOfThisFromOther, realPositionOfThisFromOther);
            glMatrix.vec3.scale(scaledMomentumTowardIdeal, scaledMomentumTowardIdeal, interval*bond.strength*globalSpeed);
            glMatrix.vec3.add(this.#linearMomentum, this.#linearMomentum, scaledMomentumTowardIdeal);
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
                let sharedDistance = this.radius + otherSphericalControlPoint.radius;
                if (distance < sharedDistance) {
                    //calculate the momentum of repulsion
                    let magnitude = interval*globalSpeed*(sharedDistance/distance-1)*100;
                    let relativePositionOfOther = glMatrix.vec3.create();
                    glMatrix.vec3.sub(relativePositionOfOther, otherSphericalControlPoint.position, this.#position);
                    let repulsionMomentum = glMatrix.vec3.clone(relativePositionOfOther);
                    //repulsion is away, so this has to be subtracted from zero
                    glMatrix.vec3.sub(repulsionMomentum,centerVector,repulsionMomentum);
                    glMatrix.vec3.scale(repulsionMomentum, repulsionMomentum, magnitude);
                    glMatrix.vec3.add(this.#linearMomentum, this.#linearMomentum, repulsionMomentum);

                    //calculate the creation of angular momentum from impact
                    //the momentum vector of this should be subtracted with the momentum vector of other
                    let combinedLinearMomentum = glMatrix.vec3.create();
                    glMatrix.vec3.subtract(combinedLinearMomentum, this.#linearMomentum, otherSphericalControlPoint.linearMomentum);
                    let angularMomentumMagnitude = glMatrix.vec3.length(combinedLinearMomentum);
                    //the magnitude of the angular momentum should be the same as the angle between the combined momentum vector and (max abs pi/2)
                    let angularMomentumChange = angleBetweenTwoVectors(combinedLinearMomentum, relativePositionOfOther).map((element) => {
                        return element*globalSpeed*interval*angularMomentumMagnitude*0.25;
                    });
                    this.changeAngularMomentum(angularMomentumChange);
                }
            }
        });

        //add gravity to linear momentum
        let gravity = this.#plottable.world.getGravityForLocation(this.#position);
        glMatrix.vec3.scale(gravity, gravity, interval);
        glMatrix.vec3.add(this.#linearMomentum, this.#linearMomentum, gravity);

        //TEMPORARY: if below y=0, reverse linear y momentum
        if (this.#position[1] < 0 && this.#linearMomentum[1] < 0) {
            
//position = -0.73

            // //asymptotic repulsion
            // let radius = 1;
            // let position = this.#position[1];
            // if (position < 0.001-radius) position = 0.001-radius;
            // let magnitude = radius/(radius+position) - 1;
            // this.#linearMomentum = glMatrix.vec3.fromValues(
            //     this.#linearMomentum[0],
            //     this.#linearMomentum[1] + magnitude*interval*0.5,
            //     this.#linearMomentum[2]
            // );

            //

            // linear repulsion
            let radius = 1;
            let position = this.#position[1];
            let magnitude = -200*position;
            this.#linearMomentum = glMatrix.vec3.fromValues(
                this.#linearMomentum[0],
                this.#linearMomentum[1] + magnitude*interval,
                this.#linearMomentum[2]
            );
            
            // //stickiness is a property of a hard surface that helps the other objects not perpetually bounce
            // let stickiness = 0;
            // if (Math.abs(this.#linearMomentum[1]) < stickiness) {
            //     this.#linearMomentum = glMatrix.vec3.fromValues(
            //         this.#linearMomentum[0],
            //         0,
            //         this.#linearMomentum[2]
            //     ); 
            // }
        }

        //add linear acceleration to linear momentum
        let scaledLinearAcceleration = glMatrix.vec3.create();
        glMatrix.vec3.scale(scaledLinearAcceleration, this.#linearAcceleration, interval);
        glMatrix.vec3.add(this.#linearMomentum, this.#linearMomentum, scaledLinearAcceleration);

        //add angular acceleration to angular momentum
        let scaledAngularAcceleration = this.#angularAcceleration.map((angle) => {
            return angle*interval;
        });
        for (let i = 0; i < 3; ++i) {
            this.#angularMomentum[i] += scaledAngularAcceleration[i];
        }

        let scaledMomentumDecay = Math.pow(0.1,interval);
        glMatrix.vec3.scale(this.#linearMomentum, this.#linearMomentum, scaledMomentumDecay);
        this.#angularMomentum = this.#angularMomentum.map((element) => {
            return element*scaledMomentumDecay;
        });

        let scaledAccelerationDecay = Math.pow(0.5,interval);
        glMatrix.vec3.scale(this.#linearAcceleration, this.#linearAcceleration, scaledAccelerationDecay);
        this.#angularAcceleration = this.#angularAcceleration.map((element) => {
            return element*scaledAccelerationDecay;
        });
    }

    simulate(interval) {
        //scale linear momentum by interval
        let scaledLinearMomentum = glMatrix.vec3.create();
        glMatrix.vec3.scale(scaledLinearMomentum, this.#linearMomentum, interval);
        //scale angular momentum by interval
        let scaledAngularMomentum = this.#angularMomentum.map((angle) => {
            return angle*interval;
        });
        //add scaled linear momentum to position
        glMatrix.vec3.add(this.#position, this.#position, scaledLinearMomentum);
        //rotate top and right by scaled angular momentum
        transformVectorByAngle(this.#top, scaledAngularMomentum);
        transformVectorByAngle(this.#right, scaledAngularMomentum);
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

        if (this.#plottable.selected) {
            this.#bonds.forEach((bond) => {
                let idealRelativePosition = glMatrix.vec3.clone(bond.idealRelativePosition);
                glMatrix.vec3.transformMat4(idealRelativePosition, idealRelativePosition, this.drawMatrix);
                this.drawReferencePoint(glMatrix.mat4.clone(modelViewMatrix), idealRelativePosition, 'green');
            });

            this.drawReferencePoint(glMatrix.mat4.clone(modelViewMatrix), [0,0,0], 'green');
            this.drawReferencePoint(glMatrix.mat4.clone(modelViewMatrix), this.#top, 'red');
            this.drawReferencePoint(glMatrix.mat4.clone(modelViewMatrix), this.#right, 'blue');
        }
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
    }
}

export default SphericalControlPoint;