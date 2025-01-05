import * as glMatrix from 'gl-matrix';
import engineMath from '../utility/engine-math';

class SimpleCamera {
    #world = null;
    #distance = 10.0;
    #near = 10.0;
    #position = glMatrix.vec3.create();
    #ID = null;
    #focused = null;

    get position () {
        return glMatrix.vec3.clone(this.#position);
    }

    set focused (controlPoint) {
        this.#focused = controlPoint;
    }

    get ID () {
        return this.#ID;
    }

    constructor(world, distance = 10.0, near) {
        this.#ID = `${new Date().getTime()}${Math.round(engineMath.random()*10000)}`;
        this.#world = world;
        this.#world.addCamera(this);
        this.#distance = distance;
        if (!near) {
            this.#near = distance;
        }
    }
    
    //simulate against all control points in a tile
    calculateTrajectory(interval) {
        return true;
    }

    decay (groupMomentum, scaledMomentumDecay, scaledAngularMomentumDecay) {
        return true;
    }

    simulate(interval) {
      //focus  
      let relativePositionOfFocused = glMatrix.vec3.create();

        let focused = this.#focused;
        let position = this.#position;

      glMatrix.vec3.subtract(relativePositionOfFocused, this.#focused.position, this.#position);
      let distanceFromFocused = glMatrix.vec3.length(relativePositionOfFocused);
      //if distance is longer than this.#distance
      if (distanceFromFocused > this.#distance) {
        let distanceToMove = distanceFromFocused - this.#distance;
        //note: the naming of this variable is no longer accurate. relativePositionOfFocused is now the amount to move
        glMatrix.vec3.scale(relativePositionOfFocused, relativePositionOfFocused, distanceToMove/distanceFromFocused);
        glMatrix.vec3.add(this.#position, this.#position, relativePositionOfFocused);
      }
      //otherwise, if distance is shorter than this.#near
      if (distanceFromFocused < this.#near) {
        let distanceToMove = this.#near - distanceFromFocused;

        glMatrix.vec3.scale(relativePositionOfFocused, relativePositionOfFocused, distanceToMove/distanceFromFocused);
        glMatrix.vec3.subtract(this.#position, this.#position, relativePositionOfFocused);
      }
    }
}

export default SimpleCamera;