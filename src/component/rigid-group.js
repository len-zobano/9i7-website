import * as glMatrix from 'gl-matrix';
import engineMath from '../utility/engine-math';
import ControlPointGroup from './control-point-group';

class RigidGroup {
    #world = null;
    #totalMass = null;
    #centerOfMass = null;
    #radius = null;
    #circumference = null;
    #controlPoints = [];
    #linearMomentum = glMatrix.vec3.create();
    #angularMomentum = glMatrix.vec3.create();
    #ID = null;
    #linearMomentumDecay = 0.5;
    #angularMomentumDecay = 0.5;

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
        world.addRigidGroup(this);
    }

    addControlPoint (controlPoint) {
        this.#controlPoints.push(controlPoint);
        controlPoint.rigidGroup = this;
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

        this.#circumference = Math.PI*2*this.#radius;
    }

    changeTrajectory (controlPoint) {
        let 
            momentum = controlPoint.linearMomentum,
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

        if (distanceToScaledUp !== 0) {
            let directionalAngularMomentumFactor = 
                1 -
                Math.abs(distanceToScaledDown - distanceToScaledUp) / 
                (distanceToScaledDown + distanceToScaledUp);

            let lengthAngularMomentumFactor = lengthOfRelativeOrigin / this.#radius;
            
            let 
                angularMomentumFactor = directionalAngularMomentumFactor * lengthAngularMomentumFactor,
                angularMomentum = engineMath.angleBetweenTwoVectors(relativeOriginPlusMomentum, relativeOrigin);
            
            glMatrix.vec3.scale(scaledLinearMomentum, momentum, (1 - angularMomentumFactor)*magnitude);

            let totalLengthOfAngularMomentum = 0;

            this.#controlPoints.forEach((controlPoint) => {
                let newPosition = controlPoint.position;
                let positionRelativeToCenter = glMatrix.vec3.create();
                glMatrix.vec3.subtract(positionRelativeToCenter, newPosition, this.#centerOfMass);
                let rotatedPositionRelativeToCenter = glMatrix.vec3.clone(positionRelativeToCenter);
                engineMath.transformVectorByAngle(rotatedPositionRelativeToCenter, angularMomentum);
                let anglePositionComponent = glMatrix.vec3.create();
                glMatrix.vec3.subtract(anglePositionComponent, rotatedPositionRelativeToCenter, positionRelativeToCenter);
                totalLengthOfAngularMomentum += glMatrix.vec3.length(anglePositionComponent)*controlPoint.mass;
            });
            
            //total length should be momentum*angularMomentumFactor*controlPoint.mass
            if (totalLengthOfAngularMomentum > 0) {
                glMatrix.vec3.scale(scaledAngularMomentum, angularMomentum, lengthOfMomentum*angularMomentumFactor*controlPoint.mass/totalLengthOfAngularMomentum);
                glMatrix.vec3.add(this.#angularMomentum, this.#angularMomentum, scaledAngularMomentum);
            }


            glMatrix.vec3.add(this.#linearMomentum, this.#linearMomentum, scaledLinearMomentum);
        }
    }

    decay (interval) {
        glMatrix.vec3.scale(this.#linearMomentum, this.#linearMomentum, Math.pow(this.#linearMomentumDecay, interval));
        glMatrix.vec3.scale(this.#angularMomentum, this.#angularMomentum,  Math.pow(this.#angularMomentumDecay, interval));
    }

    applyTrajectory () {
        this.#controlPoints.forEach((controlPoint) => {
            let newPosition = controlPoint.position;
            let positionRelativeToCenter = glMatrix.vec3.create();
            glMatrix.vec3.subtract(positionRelativeToCenter, newPosition, this.#centerOfMass);
            let rotatedPositionRelativeToCenter = glMatrix.vec3.clone(positionRelativeToCenter);
            engineMath.transformVectorByAngle(rotatedPositionRelativeToCenter, this.#angularMomentum);
            let anglePositionComponent = glMatrix.vec3.create();
            glMatrix.vec3.subtract(anglePositionComponent, rotatedPositionRelativeToCenter, positionRelativeToCenter);

            //TODO: calculate total energty of rotation momentum and normalize it to the amount of momentum going into the application of the trajectory
            glMatrix.vec3.add(newPosition, newPosition, anglePositionComponent);
            
            glMatrix.vec3.add(newPosition, newPosition, this.#linearMomentum);
            controlPoint.position = newPosition;
        });
    }
}

export default RigidGroup;