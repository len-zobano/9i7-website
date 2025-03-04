import * as glMatrix from 'gl-matrix';
import DebugDrawDelegate from './debug-draw-delegate';
import OBJFile from 'obj-file-parser';
import engineMath from '../utility/engine-math';

let globalSpeed = 10;
let drawDelegates = {
    red: null,
    green: null,
    blue: null
};

//temporary: for debugging collision calculations
let shortestCollisionDistance = 1000, longestCollisionDistance = 0;

let 
    centerVector = glMatrix.vec3.create(),
    topVector = glMatrix.vec3.fromValues(0.0,1.0,0.0),
    rightVector = glMatrix.vec3.fromValues(1.0,0.0,0.0);

class SphericalControlPoint {
    #world = null;
    #position = null;
    #isSelected = false;
    #ID = null;
    #bounciness = 1;
    get ID () {
        return this.#ID;
    }

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
    get angularMomentum () {
        return this.#angularMomentum.slice(0);
    }

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
    #friction = 1.0;
    #composite = null;
    #radius = 1.2;

    #circumference = Math.PI*Math.pow(1.2,2)

    get radius () {
        return this.#radius;
    }

    #inertia = 1.0;
    #drawDelegate = null;

    constructor(world, composite, position, drag) {
        this.#ID = `${new Date().getTime()}${Math.round(engineMath.random()*10000)}`;
        this.#world = world;
        this.#composite = composite;
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

    bondToAnyWithinRadius(others, radius, strength) {
        others.forEach((other) => {
            if (other !== this) {
                let distance = glMatrix.vec3.distance(this.#position, other.positionAsVector);
                if (distance <= radius) {
                    this.bondTo(other, strength);
                }
            }
        })
    }

    bondTo(other, strength, isReciprocalBond) {
        if (this === other) {
            return null;
        }

        let bondExists = false;
        this.#bonds.forEach((bond) => {
            if (other === bond.controlPoint) {
                bondExists = true;
            }
        });

        if (bondExists) {
            return null;
        }

        if (!strength) {
            strength = 1.0;
        }
        let relativePosition = glMatrix.vec3.create();
        glMatrix.vec3.sub(relativePosition, other.positionAsVector, this.#position);
        relativePosition = glMatrix.vec3.fromValues(
            relativePosition[0],
            relativePosition[1],
            -relativePosition[2]
        );
        
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
        //TEMPORARY: calibrating strength?
        let strengthScale = 1;
        //TEMPORARY: variables to refine the chaos of angular momentum
        let twistScale = 1, whipScale = 1, angularMomentumScale = 0.1;
        twistScale *= angularMomentumScale;
        whipScale *= angularMomentumScale;
        //TEMPORARY: this is to detect spontaneous momentum calculated in error
        let isMoving = false;
        //TEMPORARY: angular momentum has to be adjusted for stability
        let angularMomentumFrictionFactor = 0.1, enableAngularTrajectoryCalculation = true, checkForParticleCollision = true;
        // //calculate attraction by bonds
        let bondedControlPoints = {};

        this.#bonds.forEach((bond) => {
            bondedControlPoints[bond.controlPoint.ID] = true;
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

            let angleOfBondToOther = engineMath.angleBetweenTwoVectors(
                idealRelativePosition,
                realRelativePosition
            );
            
            let scaledAngleOfBondToOther = engineMath.angleScaledToMagnitudeOfAttraction(angleOfBondToOther).map((angle) => {
                return angle*interval*bond.strength*strengthScale*globalSpeed*twistScale;
            });
            //add bond angle to angular momentum
            //interval * bondStrength * angle
            if (enableAngularTrajectoryCalculation) {
                for (let i = 0; i <  3; ++i) {
                    if (scaledAngleOfBondToOther[i] !== 0) {
                        isMoving = true;
                    }
                    this.#angularMomentum[i] += scaledAngleOfBondToOther[i];
                }
            }

            //TEMPORARY: this value is for testing stability
            let bondLinearMomentumScaling = 1;

                //calculate linear momentum using a comparison of the length of the vectors
            let distanceFromIdeal = glMatrix.vec3.length(realRelativePosition) - glMatrix.vec3.length(idealRelativePosition);
                //linear momentum should only be proportional to the distance when angle is corrected for
            let relativePositionNormal = glMatrix.vec3.clone(realRelativePosition);
            glMatrix.vec3.normalize(relativePositionNormal, relativePositionNormal);
                //so the difference in distance from center is corrected for angle
            glMatrix.vec3.scale(relativePositionNormal, relativePositionNormal, bondLinearMomentumScaling*distanceFromIdeal*interval*bond.strength*globalSpeed*strengthScale);
            if (glMatrix.vec3.length(relativePositionNormal) > 0) {
                isMoving = true;
            }
            glMatrix.vec3.add(this.#linearMomentum, this.#linearMomentum, relativePositionNormal);



            if (enableAngularTrajectoryCalculation) {
                //for the other bond to you,
                    //get the ideal position of your own particle relative to that bond
                let idealPositionOfThisFromOther = glMatrix.vec3.clone(bond.reciprocalBond.idealRelativePosition);
                    //transform the ideal postion by the other particle's draw matrix
                glMatrix.vec3.transformMat4(idealPositionOfThisFromOther, idealPositionOfThisFromOther, bond.controlPoint.drawMatrix);
                let anticipatedIdealPositionOfThisFromOther = glMatrix.vec3.clone(idealPositionOfThisFromOther);
                engineMath.transformVectorByAngle(anticipatedIdealPositionOfThisFromOther, bond.controlPoint.angularMomentum);
                    //get your real position by subtracting your position by theirs
                let realPositionOfThisFromOther = glMatrix.vec3.clone(this.position);
                glMatrix.vec3.subtract(realPositionOfThisFromOther, realPositionOfThisFromOther, bond.controlPoint.position);
                    //subtract real from ideal to get the momentum vector for this one

                let trajectoryAngle = engineMath.angleBetweenTwoVectors(anticipatedIdealPositionOfThisFromOther, realPositionOfThisFromOther);
                let trajectoryMagnitude = engineMath.magnitudeOfAttractionForAngle(trajectoryAngle);

                let scaledMomentumTowardIdeal = glMatrix.vec3.create();
                glMatrix.vec3.subtract(scaledMomentumTowardIdeal, anticipatedIdealPositionOfThisFromOther, realPositionOfThisFromOther);
                let magnitudeOfMomentumTowardIdeal = glMatrix.vec3.length(scaledMomentumTowardIdeal);
                if (magnitudeOfMomentumTowardIdeal > 0) {
                    //base this on the angle momentum calculation instead
                    // let strengthOfAngularBond = 0.5/magnitudeOfMomentumTowardIdeal;
                    let strengthOfAngularBond = trajectoryMagnitude;
                    //this should be a relatively weak force compared to the linear bond, because this is a result of the neighbor twisting, not pulling
                    //it should also scale with the distance
                    glMatrix.vec3.scale(scaledMomentumTowardIdeal, scaledMomentumTowardIdeal, strengthOfAngularBond*bondLinearMomentumScaling*interval*bond.strength*strengthScale*globalSpeed*whipScale);
                    if (glMatrix.vec3.length(scaledMomentumTowardIdeal) > 0) {
                        isMoving = true;
                    }
                    glMatrix.vec3.add(this.#linearMomentum, this.#linearMomentum, scaledMomentumTowardIdeal);
                }
            }
        });

        //calculate collision by local control points
        let tile = this.#world.gridSystem.getPrimaryTileCoordinatesForControlPoint(this);
        let localSphericalControlPoints  = this.#world.gridSystem.getCurrentControlPointsForTileCoordinates(tile);

        if (checkForParticleCollision) localSphericalControlPoints.forEach((otherSphericalControlPoint) => {
            if (otherSphericalControlPoint !== this && !bondedControlPoints[otherSphericalControlPoint.ID]) {
                let distance = glMatrix.vec3.distance(this.#position, otherSphericalControlPoint.position);
                let sharedDistance = this.radius + otherSphericalControlPoint.radius;

                if (distance - sharedDistance < shortestCollisionDistance) {
                    shortestCollisionDistance = distance - sharedDistance;
                }

                if (distance - sharedDistance > longestCollisionDistance) {
                    longestCollisionDistance = distance - sharedDistance;
                }

                if (distance < sharedDistance) {
                    //calculate the momentum of repulsion
                    let magnitude = interval*globalSpeed*(sharedDistance/distance-1)*100;
                    let world = this.#world;
                    if (magnitude > this.#world.maxRepulsionMagnitude) {
                        magnitude = this.#world.maxRepulsionMagnitude;
                    }
                    let relativePositionOfOther = glMatrix.vec3.create();
                    glMatrix.vec3.sub(relativePositionOfOther, otherSphericalControlPoint.position, this.#position);
                    let repulsionMomentum = glMatrix.vec3.clone(relativePositionOfOther);
                    //repulsion is away, so this has to be subtracted from zero
                    glMatrix.vec3.sub(repulsionMomentum,centerVector,repulsionMomentum);
                    glMatrix.vec3.scale(repulsionMomentum, repulsionMomentum, magnitude);
                    if (glMatrix.vec3.length(repulsionMomentum) > 0) {
                        isMoving = true;
                    }
                    glMatrix.vec3.add(this.#linearMomentum, this.#linearMomentum, repulsionMomentum);

                    //calculate the creation of angular momentum from impact
                    //the momentum vector of this should be subtracted with the momentum vector of other
                    let combinedLinearMomentum = glMatrix.vec3.create();
                    glMatrix.vec3.subtract(combinedLinearMomentum, this.#linearMomentum, otherSphericalControlPoint.linearMomentum);
                    let angularMomentumMagnitude = glMatrix.vec3.length(combinedLinearMomentum);
                    //the magnitude of the angular momentum should be the same as the angle between the combined momentum vector and (max abs pi/2)
                    let angularMomentumChange = engineMath.angleBetweenTwoVectors(combinedLinearMomentum, relativePositionOfOther).map((element) => {
                        let momentumChange = element*globalSpeed*interval*angularMomentumMagnitude*angularMomentumFrictionFactor;
                        if (momentumChange > 0) {
                            isMoving = true;
                        }
                        return momentumChange;
                    });
                    this.changeAngularMomentum(angularMomentumChange);
                }
            }
        });

        //add gravity to linear momentum
        let gravity = this.#world.getGravityForLocation(this.#position);
        glMatrix.vec3.scale(gravity, gravity, interval);
        glMatrix.vec3.add(this.#linearMomentum, this.#linearMomentum, gravity);

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

        let scaledAccelerationDecay = Math.pow(0.1,interval);
        glMatrix.vec3.scale(this.#linearAcceleration, this.#linearAcceleration, scaledAccelerationDecay);
        this.#angularAcceleration = this.#angularAcceleration.map((element) => {
            return element*scaledAccelerationDecay;
        });
    }

    decay (groupMomentum, scaledMomentumDecay, scaledAngularMomentumDecay) {
        //calculate the momentum relative to the frame of reference
        let relativeMomentum = glMatrix.vec3.create();
        glMatrix.vec3.sub(relativeMomentum, this.#linearMomentum, groupMomentum);
        //decay that momentum
        glMatrix.vec3.scale(relativeMomentum, relativeMomentum, scaledMomentumDecay);
        //add the decayed value and the frame of reference momentum to get the absolute momentum
        glMatrix.vec3.add(this.#linearMomentum, relativeMomentum, groupMomentum);
        
        this.#angularMomentum = this.#angularMomentum.map((element) => {
            return element*scaledMomentumDecay*scaledAngularMomentumDecay;
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

        let positionBeforeSurfaceCollision = glMatrix.vec3.create();
        //add scaled linear momentum to position
        glMatrix.vec3.add(positionBeforeSurfaceCollision, this.#position, scaledLinearMomentum);
        let triangularSurfaces = this.#world.triangularSurfaces;
        
        let collidedWithSurface = true, numberOfCollisions = 0;
        //keep searching for collisions until all surfaces are looped through without a collision occurring
        //don't collide with the same surface twice in a row. That's just a rounding error
        let lastCollidedSurface = null;
        while(collidedWithSurface) {
            collidedWithSurface = false;
            triangularSurfaces.forEach((triangularSurface) => {
                if (
                    triangularSurface.lineSegmentMayIntersect(this.#position, positionBeforeSurfaceCollision)
                ) {
                    let mirroredSegment = triangularSurface.mirrorLineSegmentAfterIntersection(this.#position, positionBeforeSurfaceCollision);
                    if (mirroredSegment && lastCollidedSurface !== triangularSurface) {
                        //set repeat collision detection data 
                        collidedWithSurface = true;
                        lastCollidedSurface = triangularSurface;
                        ++numberOfCollisions;
                        //calculate angular momentum
                        let 
                            firstLegOfBounce = glMatrix.vec3.create(),
                            secondLegOfBounce = glMatrix.vec3.create();

                        glMatrix.vec3.subtract(firstLegOfBounce, mirroredSegment[0], this.#position);
                        glMatrix.vec3.subtract(secondLegOfBounce, mirroredSegment[1], mirroredSegment[0]);
                        let angleOfCollision = engineMath.angleBetweenTwoVectors(triangularSurface.vertexNormal, secondLegOfBounce);
                        let lengthOfCollision = glMatrix.vec3.length(firstLegOfBounce) + glMatrix.vec3.length(secondLegOfBounce);
                        let magnitudeOfRotation = lengthOfCollision*this.#friction*5/this.#circumference;
                        //todo: radius should be factored into this
                        for (let i = 0; i < 3; ++i) {
                            this.#angularMomentum[i] += angleOfCollision[i]*magnitudeOfRotation;
                        }

                        let mangitudeOfMomentum = glMatrix.vec3.length(this.#linearMomentum);
                        let flattenParticle = mangitudeOfMomentum < 100;
                        //change particles
                        this.#position = mirroredSegment[0];
                        positionBeforeSurfaceCollision = mirroredSegment[1];
                        if (flattenParticle) {
                            positionBeforeSurfaceCollision = triangularSurface.flattenAbsoluteVectorAlongPlane(positionBeforeSurfaceCollision);
                        }
                        this.#linearMomentum = triangularSurface.mirrorRelativeVector(this.#linearMomentum);
                        if (flattenParticle) {
                            this.#linearMomentum = triangularSurface.flattenRelativeVectorAlongPlane(this.#linearMomentum);
                        }
                        glMatrix.vec3.scale(this.#linearMomentum, this.#linearMomentum, this.#bounciness);
                    }
                }
            });
        }
        
        this.#position = positionBeforeSurfaceCollision;
        //rotate top and right by scaled angular momentum
        engineMath.transformVectorByAngle(this.#top, scaledAngularMomentum);
        engineMath.transformVectorByAngle(this.#right, scaledAngularMomentum);
    }

    initializeDrawDelegates () {
        fetch('models/controlPoint.obj')
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
                red: new DebugDrawDelegate(this.#world, positions, colors.red, indices),
                green: new DebugDrawDelegate(this.#world, positions, colors.green, indices),
                blue: new DebugDrawDelegate(this.#world, positions, colors.blue, indices),
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

        let pointScale = 0.3;
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

        this.#bonds.forEach((bond) => {
            let idealRelativePosition = glMatrix.vec3.clone(bond.idealRelativePosition);
            glMatrix.vec3.transformMat4(idealRelativePosition, idealRelativePosition, this.drawMatrix);
            this.drawReferencePoint(glMatrix.mat4.clone(modelViewMatrix), idealRelativePosition, 'green');
        });

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
    }
}

export default SphericalControlPoint;