import * as glMatrix from 'gl-matrix';
import engineMath from '../utility/engine-math';

class RigidGroup {
    #world = null;
    #totalMass = null;
    #centerOfMass = null;
    #radius = null;
    #controlPoints = [];
    #linearMomentum = glMatrix.vec3.create();
    #angularMomentum = glMatrix.vec3.create();
    #ID = null;

    get controlPoints () {
        return this.#controlPoints.slice(0);
    }

    get centerOfMass () {
        return this.#centerOfMass;
    }

    get radius () {
        return this.#radius;
    }

    constructor(world) {
        this.#ID = `${new Date().getTime()}${Math.round(engineMath.random()*10000)}`;
        this.#world = world;
    }

    addControlPoint (controlPoint) {
        this.#controlPoints.push(controlPoint);
    }

    addControlPoints (controlPoints) {
        controlPoints.forEach((controlPoint) => {
            this.addControlPoint(controlPoint);
        });
    }

    calculateProperties () {
        this.#totalMass = 0;
        this.#centerOfMass = glMatrix.vec3.create();
        this.#radius = 0;

        //calculate mass
        this.#controlPoints.forEach((controlPoint) => {
            this.#totalMass += controlPoint.mass;
            let scaledPosition = controlPoint.position;
            glMatrix.vec3.scale(scaledPosition, scaledPosition, controlPoint.mass);
            glMatrix.vec3.add(this.#centerOfMass, this.#centerOfMass, scaledPosition);
        });

        glMatrix.vec3.scale(this.#centerOfMass, this.#centerOfMass, 1/this.#totalMass);
        //calculate radius
        this.#controlPoints.forEach((controlPoint) => {
            let thisRadius = glMatrix.vec3.create();
            glMatrix.vec3.subtract(thisRadius, controlPoint.position, this.#centerOfMass);
            let thisRadiusLength = glMatrix.vec3.length(thisRadius);
            if (thisRadiusLength > this.#radius) {
                this.#radius = thisRadiusLength;
            }
        });
    }

    changeTrajectory (controlPoint, momentum) {
        let 
            origin = controlPoint.position,
            relativeOrigin = glMatrix.vec3.create(),
            relativeOriginPlusMomentum = glMatrix.vec3.create(),
            scaledUpRelativeOrigin = glMatrix.vec3.create(),
            scaledDownRelativeOrigin = glMatrix.vec3.create(),
            lengthOfMomentum = glMatrix.vec3.length(momentum),
            scaledLinearMomentum = glMatrix.vec3.create(),
            scaledAngularMomentum = glMatrix.vec3.create(),
            magnitude = controlPoint.mass / this.#totalMass;

        glMatrix.vec3.subtract(relativeOrigin, origin, this.#centerOfMass);
        let lengthOfRelativeOrigin = glMatrix.vec3.length(relativeOrigin);
        glMatrix.vec3.add(relativeOriginPlusMomentum, relativeOrigin, momentum);

        glMatrix.vec3.scale(scaledUpRelativeOrigin, relativeOrigin, (lengthOfRelativeOrigin + lengthOfMomentum)/lengthOfRelativeOrigin);
        glMatrix.vec3.scale(scaledDownRelativeOrigin, relativeOrigin, (lengthOfRelativeOrigin - lengthOfMomentum)/lengthOfRelativeOrigin);

        let 
            distanceToScaledDown = glMatrix.vec3.squaredDistance(relativeOriginPlusMomentum, scaledDownRelativeOrigin),
            distanceToScaledUp = glMatrix.vec3.squaredDistance(relativeOriginPlusMomentum, scaledUpRelativeOrigin);

        let directionalAngularMomentumFactor = 
            1 -
            Math.abs(distanceToScaledDown - distanceToScaledUp) / 
            (distanceToScaledDown + distanceToScaledUp);

        let lengthAngularMomentumFactor = lengthOfRelativeOrigin / this.#radius;

        //should this factor in the mass of the 
        let 
            angularMomentumFactor = directionalAngularMomentumFactor * lengthAngularMomentumFactor,
            angularMomentum = engineMath.angleBetweenTwoVectors(relativeOrigin, relativeOriginPlusMomentum);
        
        glMatrix.vec3.scale(scaledLinearMomentum, momentum, (1 - angularMomentumFactor)*magnitude);
        glMatrix.vec3.add(this.#linearMomentum, this.#linearMomentum, scaledLinearMomentum);

        glMatrix.vec3.scale(scaledAngularMomentum, angularMomentum, angularMomentumFactor*magnitude);
        glMatrix.vec3.add(this.#angularMomentum, this.#angularMomentum, scaledAngularMomentum);
    }

    applyTrajectory () {
        this.#controlPoints.forEach((controlPoint) => {
            let newPosition = controlPoint.position;
            let positionRelativeToCenter = glMatrix.vec3.create();
            glMatrix.vec3.subtract(positionRelativeToCenter, this.#centerOfMass, newPosition);
            let rotatedPositionRelativeToCenter = glMatrix.vec3.clone(positionRelativeToCenter);
            engineMath.transformVectorByAngle(rotatedPositionRelativeToCenter, this.#angularMomentum);
            let anglePositionComponent = glMatrix.vec3.create();
            glMatrix.vec3.subtract(anglePositionComponent, rotatedPositionRelativeToCenter, positionRelativeToCenter);

            glMatrix.vec3.add(newPosition, newPosition, this.#linearMomentum);
            glMatrix.vec3.add(newPosition, newPosition, anglePositionComponent);

            controlPoint.position = newPosition;
        });
    }
}

export default ControlPointGroup;