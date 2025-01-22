import * as glMatrix from 'gl-matrix';
import DebugDrawDelegate from './debug-draw-delegate';
import OBJFile from 'obj-file-parser';
import engineMath from '../utility/engine-math';
import WireframeDrawDelegate from './wireframe-draw-delegate';

let drawDelegates = {
    red: null,
    green: null,
    blue: null,
    wireframe: null
};

class SimpleControlPoint {
    #world = null;
    #position = null;
    #ID = null;
    #bounciness = 1;

    get ID () {
        return this.#ID;
    }

    get position () {
        return glMatrix.vec3.clone(this.#position);
    }

    #bonds = [];
    #linearMomentum = null;
    get linearMomentum () {
        return glMatrix.vec3.clone(this.#linearMomentum);
    }

    #friction = 1.0;
    #radius = 1.0;

    get radius () {
        return this.#radius;
    }

    #inertia = 1.0;
    #drawDelegate = null;

    constructor(world, position, radius, friction) {
        this.#ID = `${new Date().getTime()}${Math.round(engineMath.random()*10000)}`;
        this.#world = world;
        this.#position = glMatrix.vec3.fromValues(
            position[0],
            position[1],
            position[2]
        );

        if (!radius) {
            radius = 1;
        }

        this.#radius = radius;

        if (friction) {
            this.#friction = friction;
        }

        this.#linearMomentum = glMatrix.vec3.create();
    }

    bondToAnyWithinRadius(others, radius, strength) {
        others.forEach((other) => {
            if (other !== this) {
                let distance = glMatrix.vec3.distance(this.#position, other.position);
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
        glMatrix.vec3.sub(relativePosition, other.position, this.#position);
        relativePosition = glMatrix.vec3.fromValues(
            relativePosition[0],
            relativePosition[1],
            relativePosition[2]
        );
        let distance = glMatrix.vec3.length(relativePosition);
        
        let bond = {
            controlPoint: other,
            idealDistance: distance,
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
        let bondedControlPoints = {};

        this.#bonds.forEach((bond) => {
            bondedControlPoints[bond.controlPoint.ID] = true;
            //for your bond to the other,
                //calculate angular momentum by angle of bond   
            let positionOfOther = bond.controlPoint.position;
            let relativePosition = glMatrix.vec3.fromValues(
                positionOfOther[0] - this.#position[0],
                positionOfOther[1] - this.#position[1],
                positionOfOther[2] - this.#position[2]
            );

                //calculate linear momentum using a comparison of the length of the vectors
            let distanceToIdeal = bond.idealDistance - glMatrix.vec3.length(relativePosition);
                //linear momentum should only be proportional to the distance when angle is corrected for
            let relativePositionNormal = glMatrix.vec3.clone(relativePosition);
            glMatrix.vec3.normalize(relativePositionNormal, relativePositionNormal);
                //so the difference in distance from center is corrected for angle
            glMatrix.vec3.scale(relativePositionNormal, relativePositionNormal, -distanceToIdeal*interval*bond.strength);
            glMatrix.vec3.add(this.#linearMomentum, this.#linearMomentum, relativePositionNormal);
        });

        //calculate collision by local control points
        let tile = this.#world.gridSystem.getPrimaryTileCoordinatesForControlPoint(this);
        let localControlPoints  = this.#world.gridSystem.getCurrentControlPointsForTileCoordinates(tile);

        localControlPoints.forEach((otherControlPoint) => {
            if (otherControlPoint !== this && !bondedControlPoints[otherControlPoint.ID]) {
                let distance = glMatrix.vec3.distance(this.#position, otherControlPoint.position);
                let sharedDistance = this.radius + otherControlPoint.radius;

                if (distance < sharedDistance) {
                    //calculate the momentum of repulsion
                    let magnitude = interval*(sharedDistance/distance-1)*100;
                    if (magnitude > this.#world.maxRepulsionMagnitude) {
                        magnitude = this.#world.maxRepulsionMagnitude;
                    }
                    let relativePositionOfOther = glMatrix.vec3.create();
                    glMatrix.vec3.sub(relativePositionOfOther, otherControlPoint.position, this.#position);
                    let repulsionMomentum = glMatrix.vec3.clone(relativePositionOfOther);
                    //repulsion is away, so this has to be subtracted from zero
                    glMatrix.vec3.scale(repulsionMomentum,repulsionMomentum, -magnitude);
                    glMatrix.vec3.add(this.#linearMomentum, this.#linearMomentum, repulsionMomentum);
                }
            }
        });

        //add gravity to linear momentum
        let gravity = this.#world.getGravityForLocation(this.#position);
        glMatrix.vec3.scale(gravity, gravity, interval);
        glMatrix.vec3.add(this.#linearMomentum, this.#linearMomentum, gravity);
    }

    decay (groupMomentum, scaledMomentumDecay, scaledAngularMomentumDecay) {
        //calculate the momentum relative to the frame of reference
        let relativeMomentum = glMatrix.vec3.create();
        glMatrix.vec3.sub(relativeMomentum, this.#linearMomentum, groupMomentum);
        //decay that momentum
        glMatrix.vec3.scale(relativeMomentum, relativeMomentum, scaledMomentumDecay);
        //add the decayed value and the frame of reference momentum to get the absolute momentum
        glMatrix.vec3.add(this.#linearMomentum, relativeMomentum, groupMomentum);
    }

    simulate(interval) {
        //scale linear momentum by interval
        let scaledLinearMomentum = glMatrix.vec3.create();
        glMatrix.vec3.scale(scaledLinearMomentum, this.#linearMomentum, interval);

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

                        let mangitudeOfMomentum = glMatrix.vec3.length(this.#linearMomentum);
                        let flattenParticle = mangitudeOfMomentum < 10;
                        //TEMPORARY: always bounce
                        flattenParticle = false;
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
                wireframe: new WireframeDrawDelegate(this.#world),
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
        const referencePointMatrix = this.#world.modelViewMatrix;
        // Now move the drawing position a bit to where we want to
        // start drawing the square.
        glMatrix.mat4.translate(
            referencePointMatrix, // destination matrix
            referencePointMatrix, // matrix to translate
            this.#position.map((coordinate) => {
                return coordinate;
            })
        ); 

        this.drawReferencePoint(glMatrix.mat4.clone(referencePointMatrix), [0,0,0], 'green');

        let vertices = [], bonds = this.#bonds;
        this.#bonds.forEach((bond) => {
            let otherControlPoint = bond.controlPoint;
            //TODO: optimize this, the array shouldn't be duplicated each loop
            let transformedPosition = glMatrix.vec3.clone(this.#position);
            let transformationMatrix = glMatrix.mat4.create();
            glMatrix.mat4.multiply(transformationMatrix, this.#world.projectionMatrix, this.#world.modelViewMatrix);
            glMatrix.vec3.transformMat4(transformedPosition, transformedPosition, transformationMatrix);
            vertices = vertices.concat(
                transformedPosition[0],
                transformedPosition[1],
                transformedPosition[2]
            );

            let transformedOtherPosition = glMatrix.vec3.clone(otherControlPoint.position);
            glMatrix.vec3.transformMat4(transformedOtherPosition, transformedOtherPosition, transformationMatrix);
            vertices = vertices.concat(
                transformedOtherPosition[0],
                transformedOtherPosition[1],
                transformedOtherPosition[2]
            );
        });

        // debugger;

        if (drawDelegates.wireframe) {
            drawDelegates.wireframe.draw(vertices);
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
}

export default SimpleControlPoint;