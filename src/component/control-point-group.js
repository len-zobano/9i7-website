import * as glMatrix from 'gl-matrix';
import engineMath from '../utility/engine-math';

class ControlPointGroup {
    #world = null;
    #childGroups = {};
    #parentGroup = null;

    #totalMass = null;
    #centerOfMass = null;
    #radius = null;
    #circumference = null;
    #isSelected = false;
    #controlPoints = [];
    #controlPointsByName = {};

    #linearMomentum = glMatrix.vec3.create();
    #angularMomentum = glMatrix.vec3.create();
    #averageLinearMomentum = glMatrix.vec3.create();
    #averageAngularMomentum = glMatrix.vec3.create();

    #linearMomentumDecay = 1.0;
    #angularMomentumDecay = 1.0;
    #rigidity = 0.0;
    #ID = null;

    set parentGroup (group) {
        this.#parentGroup = group;
    }

    get controlPoints () {
        return this.#controlPoints.slice(0);
    }

    get centerOfMass () {
        return this.#centerOfMass;
    }

    get radius () {
        return this.#radius;
    }

    get linearMomentum () {
        return glMatrix.vec3.clone(this.#linearMomentum);
    }

    constructor(world) {
        this.#ID = `${new Date().getTime()}${Math.round(engineMath.random()*10000)}`;
        this.#world = world;
        world.addControlPointGroup(this);
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

    addControlPointGroup (group) {
        //add the group
        this.#childGroups[group.ID] = {
            group,
            iterationOfLastTrajectoryCalculation: 0
        };
        //set the group's parent
        group.parentGroup = group;
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

    transferMomentumFromControlPoint (controlPoint) {

        if (this.#rigidity === 0) {
            return;
        }

        let 
            momentumToTransfer = controlPoint.linearMomentum,
            momentumToKeep = controlPoint.linearMomentum,
            origin = controlPoint.position,
            relativeOrigin = glMatrix.vec3.create(),
            relativeOriginPlusMomentum = glMatrix.vec3.create(),
            scaledUpRelativeOrigin = glMatrix.vec3.create(),
            scaledDownRelativeOrigin = glMatrix.vec3.create(),
            lengthOfMomentum = glMatrix.vec3.length(controlPoint.linearMomentum),
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
        }
    }

    calculateTrajectoryIfAllChildrenHaveCalculated (interval) {
        let allChildrenHaveCalculated = true;
        Object.keys(this.#childGroups).forEach((childGroupID) => {
            let childGroup = this.#childGroups[childGroupID];
            allChildrenHaveCalculated &&= (childGroup.iterationOfLastTrajectoryCalculation === this.#world.currentIteration);
        });

        if (allChildrenHaveCalculated) {
            this.calculateTrajectory(interval);
        }
    }

    childHasCalculated (group) {
        this.#childGroups[group.ID].iterationOfLastTrajectoryCalculation = this.#world.currentIteration;
    }

    calculateTrajectory (interval) {
        //TODO: calculate this beforehand, per iteration
        let averageLinearMomentum = glMatrix.vec3.create();
        this.getDescendentControlPoints().forEach((controlPoint) => {
            controlPoint.calculateTrajectory(interval);
            this.transferMomentumFromControlPoint(controlPoint);
            let linearMomentum = controlPoint.linearMomentum;
            glMatrix.vec3.scale(linearMomentum, linearMomentum, 1/(this.#controlPoints.length));
            glMatrix.vec3.add(averageLinearMomentum, averageLinearMomentum, linearMomentum);
        });

        this.applyTrajectory();

        //set child has calculated, and calculate the parent if all children have calculated
        if (this.#parentGroup) {
            this.#parentGroup.childHasCalculated(this);
            this.#parentGroup.calculateTrajectoryIfAllChildrenHaveCalculated(interval);
        }
        //if this is the top group, it's the local frame of reference, and calculates the decay
        else {
            //for each control point, get its momentum change due to linear momentum
            this.getDescendentControlPoints().forEach((controlPoint) => {
                // controlPoint.decay(averageLinearMomentum, Math.pow(this.#linearMomentumDecay, interval), Math.pow(this.#angularMomentumDecay, interval));
                debugger;
                controlPoint.decay(glMatrix.vec3.create(), Math.pow(this.#linearMomentumDecay, interval), Math.pow(this.#angularMomentumDecay, interval));
            });
        }
    }

    getDescendentControlPoints() {
        let controlPoints = this.#controlPoints.slice();

        Object.keys(this.#childGroups).forEach((childGroupID) => {
            let childGroup = this.#childGroups[childGroupID];
            controlPoints = controlPoints.concat(childGroup.getDescendentControlPoints());
        });

        return controlPoints;
    }

    simulate(interval) {
        this.#controlPoints.forEach((controlPoint) => {
            controlPoint.simulate(interval);
        });
    }

    //TODO: this functionality belongs in clculateTrajectory
    applyTrajectory () {
        this.#controlPoints.forEach((controlPoint) => {
            let newLinearMomentum = controlPoint.linearMomentum;
            let positionRelativeToCenter = glMatrix.vec3.create();
            glMatrix.vec3.subtract(positionRelativeToCenter, controlPoint.position, this.#centerOfMass);
            let rotatedPositionRelativeToCenter = glMatrix.vec3.clone(positionRelativeToCenter);
            engineMath.transformVectorByAngle(rotatedPositionRelativeToCenter, this.#angularMomentum);
            let anglePositionComponent = glMatrix.vec3.create();
            glMatrix.vec3.subtract(anglePositionComponent, rotatedPositionRelativeToCenter, positionRelativeToCenter);

            //TODO: calculate total energty of rotation momentum and normalize it to the amount of momentum going into the application of the trajectory
            glMatrix.vec3.add(newLinearMomentum, newLinearMomentum, anglePositionComponent);
            glMatrix.vec3.add(newLinearMomentum, newLinearMomentum, this.#linearMomentum);
            controlPoint.linearMomentum = newLinearMomentum;
        });

        this.#angularMomentum = glMatrix.vec3.create();
        this.#linearMomentum = glMatrix.vec3.create();
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