import * as glMatrix from 'gl-matrix';
import engineMath from '../utility/engine-math';

class ControlPointGroup {
    #world = null;
    #totalMass = null;
    #centerOfMass = null;
    #radius = null;
    #circumference = null;
    #isSelected = false;
    #controlPoints = [];
    #controlPointsByName = {};
    #linearMomentum = glMatrix.vec3.create();
    #angularMomentum = glMatrix.vec3.create();
    #linearMomentumDecay = 0.5;
    #angularMomentumDecay = 0.5;
    #rigidity = 0.0;
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

    #linearMomentum = null;
    get linearMomentum () {
        return glMatrix.vec3.clone(this.#linearMomentum);
    }

    constructor(world) {
        this.#ID = `${new Date().getTime()}${Math.round(engineMath.random()*10000)}`;
        this.#world = world;
        world.addControlPointGroup(this);
        this.#linearMomentum = glMatrix.vec3.create();
    }

    addControlPoint (controlPoint, name) {
        this.#controlPoints.push(controlPoint);
        controlPoint.group = this;

        if (name) {
            this.#controlPointsByName[name] = controlPoint;
        }
    }

    addControlPoints (controlPoints) {
        controlPoints.forEach((controlPoint) => {
            this.addControlPoint(controlPoint);
        });
    }

    addControlPointGroup () {
        //add the group
        //add all the group's points
        //set the group's parent
    }

    freeze() {
        return false;
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

    transferMomentumToGroup (controlPoint) {
        let 
            momentumToTransfer = controlPoint.linearMomentum,
            momentumToKeep = controlPoint.linearMomentum,
            origin = controlPoint.position,
            relativeOrigin = glMatrix.vec3.create(),
            relativeOriginPlusMomentum = glMatrix.vec3.create(),
            scaledUpRelativeOrigin = glMatrix.vec3.create(),
            scaledDownRelativeOrigin = glMatrix.vec3.create(),
            lengthOfMomentum = glMatrix.vec3.length(momentum),
            scaledLinearMomentum = glMatrix.vec3.create(),
            scaledAngularMomentum = glMatrix.vec3.create(),
            magnitude = controlPoint.mass / this.#totalMass;
        
        glMatrix.vec3.scale(momentumToTransfer, momentumToTransfer, this.#rigidity);
        glMatrix.vec3.subtract(momentumToKeep, momentumToKeep, momentumToTransfer);
        controlPoint.linearMomentum = momentumToKeep;

        glMatrix.vec3.subtract(relativeOrigin, origin, this.#centerOfMass);
        let lengthOfRelativeOrigin = glMatrix.vec3.length(relativeOrigin);
        glMatrix.vec3.add(relativeOriginPlusMomentum, relativeOrigin, momentumToTransfer);

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
            
            glMatrix.vec3.scale(scaledLinearMomentum, momentumToTransfer, (1 - angularMomentumFactor)*magnitude);

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
            this.#linearMomentum = glMatrix.vec3.create();
        }
    }

    //simulate against all control points in a tile
    calculateTrajectory(interval) {
        let averageLinearMomentum = glMatrix.vec3.create();
        this.#controlPoints.forEach((controlPoint) => {
            controlPoint.calculateTrajectory(interval);
            let linearMomentum = controlPoint.linearMomentum;
            glMatrix.vec3.scale(linearMomentum, linearMomentum, 1/(this.#controlPoints.length));
            glMatrix.vec3.add(averageLinearMomentum, averageLinearMomentum, linearMomentum);
        });

        this.#controlPoints.forEach((controlPoint) => {
            // controlPoint.decay(averageLinearMomentum, Math.pow(this.#linearMomentumDecay, interval), Math.pow(this.#angularMomentumDecay, interval));
            controlPoint.decay(glMatrix.vec3.create(), Math.pow(this.#linearMomentumDecay, interval), Math.pow(this.#angularMomentumDecay, interval));
        });
    }

    decay (interval) {
        glMatrix.vec3.scale(this.#linearMomentum, this.#linearMomentum, Math.pow(this.#linearMomentumDecay, interval));
        glMatrix.vec3.scale(this.#angularMomentum, this.#angularMomentum,  Math.pow(this.#angularMomentumDecay, interval));
    }

    simulate(interval) {
        this.#controlPoints.forEach((controlPoint) => {
            controlPoint.simulate(interval);
        });
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

    #keyCodesToCommands = {};

    addKeyCommand(keyCode, onKeyUp, onKeyDown) {
        this.#keyCodesToCommands[keyCode] = {
            onKeyUp,
            onKeyDown,
            state: {}
        };
    }

    onKeyUp(keyCode) {
        //TODO: start here. finish this, then hook the key commands in world up to this
        if (this.#keyCodesToCommands[keyCode]) {
            let command = this.#keyCodesToCommands[keyCode];
            command.onKeyUp(this.#controlPointsByName, command.state);
        }
    }

    onKeyDown(keyCode) {
        //TODO: start here. finish this, then hook the key commands in world up to this
        if (this.#keyCodesToCommands[keyCode]) {
            let command = this.#keyCodesToCommands[keyCode];
            command.onKeyDown(this.#controlPointsByName, command.state);
        }
    }

}

export default ControlPointGroup;