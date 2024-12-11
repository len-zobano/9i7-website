import * as glMatrix from 'gl-matrix';

class ControlPoint {
    #world = null;
    #position = null;
    get position () {
        return this.#position.slice(0);
    }

    #bonds = [];
    #momentum = null;
    #repulsion = 1.0;
    //the distance past which the particle won't repel another
    #radius = 1.0;
    #inertia = 1.0;

    constructor(world, position) {
        this.#world = world;
        this.#position = glMatrix.vec3.fromValues(
            position[0],
            position[1],
            position[2]
        );

        this.#momentum = glMatrix.vec3.create();
    }

    bondTo(other, strength, isReciprocalBond) {
        this.#bonds.push({
            controlPoint: other,
            strength
        });

        if (!isReciprocalBond) {
            other.bondTo(this, strength, true);
        }
    }

    //calculate the bond strength needed to equal the repulsion at the given distance
    bondToInPlace(other, isReciprocalBond) {

    }
    
    //simulate against all control points in a tile
    simulate(interval, tile) {
        // //calculate attraction by bonds
        // this.#bonds.forEach((bond) => {
        //     //momentum += relativeLocation (this, bond.controlPoint) * bond.strength * interval
        // });

        // //calculate repulsion by local control points
        // let localControlPoints = tile.getControlPoints();
        // localControlPoints.forEach((otherControlPoint) => {
        //     //magnitude = interval * otherControlPoint.repulsion / distance (this, otherControlPoint) - (otherControlPoint.repulsion / otherControlPoint.radius)
        //     //momentum -= relativeLocation (this, otherControlPoint) * magnitude
        // });

        // //calculate gravity from world
        // this.#world.calculateGravityVectorForCoordinate(this.#position);

        //scale momentum by interval
        let scaledMomentum = glMatrix.vec3.create();
        glMatrix.vec3.scale(scaledMomentum, this.#momentum, interval);
        //add momentum to position
        glMatrix.vec3.add(this.#position, this.#position, scaledMomentum);
        // console.log('simulating control point',this.#position);


        glMatrix.vec3.scale(this.#momentum, this.#momentum, Math.pow(0.001,interval));
    }

    changeMomentum(momentumChangeArray) {
        console.log('changemomentum at control point');
        let momentumChange = glMatrix.vec3.fromValues(
            momentumChangeArray[0],
            momentumChangeArray[1],
            momentumChangeArray[2]
        );
        glMatrix.vec3.add(this.#momentum, this.#momentum, momentumChange);
    }
}

export default ControlPoint;