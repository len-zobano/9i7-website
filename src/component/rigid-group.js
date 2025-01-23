import * as glMatrix from 'gl-matrix';
import engineMath from '../utility/engine-math';

class RigidGroup {
    #world = null;
    #centerOfMass = null;
    #radius = null;
    #controlPoints = [];
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

    applyTrajectory (controlPoint, momentum) {
        
    }

    changeLinearMomentum(momentumChangeArray) {
        //change linear momentum of each particle
        return false;
    }

    changeAngularMomentum(momentumChangeArray) {
        return false;
    }
}

export default ControlPointGroup;