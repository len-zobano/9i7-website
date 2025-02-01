import * as glMatrix from 'gl-matrix';
import engineMath from '../utility/engine-math';

class ControlPointGroup {
    #world = null;
    #position = null;
    #isSelected = false;
    #controlPoints = [];
    #controlPointsByName = {};
    #linearMomentumDecay = 0.5;
    #angularMomentumDecay = 0.5;
    #ID = null;

    get controlPoints () {
        return this.#controlPoints.slice(0);
    }

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

    freeze() {
        return false;
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