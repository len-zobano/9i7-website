import * as glMatrix from 'gl-matrix';

class ControlPointGroup {
    #world = null;
    #position = null;
    #isSelected = false;
    #controlPoints = [];
    #linearMomentumDecay = 0.5;
    #angularMomentumDecay = 0.5;
    #ID = null;

    get positionAsVector () {
        return glMatrix.vec3.clone(this.#position);
    }

    get position () {
        return this.#position.slice(0);
    }

    #linearMomentum = null;
    get linearMomentum () {
        return glMatrix.vec3.clone(this.#linearMomentum);
    }

    #friction = 0.0;
    #composite = null;
    #radius = 1.2;
    get radius () {
        return this.#radius;
    }

    #inertia = 1.0;
    #drawDelegate = null;

    constructor(world) {
        this.#ID = `${new Date().getTime()}${Math.round(Math.random()*10000)}`;
        this.#world = world;
        world.addControlPointGroup(this);
        this.#linearMomentum = glMatrix.vec3.create();
    }

    addControlPoint (controlPoint) {
        this.#controlPoints.push(controlPoint);
    }

    freeze() {
        return false;
    }

    //simulate against all control points in a tile
    calculateTrajectory(interval) {
        this.#controlPoints.forEach((controlPoint) => {
            controlPoint.calculateTrajectory(interval);
            controlPoint.decay(Math.pow(this.#linearMomentumDecay, interval), Math.pow(this.#angularMomentumDecay, interval));
        })
    }

    simulate(interval) {
        this.#controlPoints.forEach((controlPoint) => {
            controlPoint.simulate(interval);
        });
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