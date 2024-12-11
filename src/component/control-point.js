import * as glMatrix from 'gl-matrix';

class ControlPoint {
    #world = null;
    #position = null;
    #bonds = [];
    #momentum = null;
    #repulsion = 1.0;
    //the distance past which the particle won't repel another
    #radius = 1.0;
    #inertia = 1.0;

    constructor(world, position) {
        this.#position = position;
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
    
    //simulate against all control points in a tile
    simulate(interval, tile) {
        //calculate attraction by bonds
        this.#bonds.forEach((bond) => {
            //momentum += relativeLocation (this, bond.controlPoint) * bond.strength * interval
        });

        //calculate repulsion by local control points
        let localControlPoints = tile.getControlPoints();
        localControlPoints.forEach((otherControlPoint) => {
            //magnitude = interval * otherControlPoint.repulsion / distance (this, otherControlPoint) - (otherControlPoint.repulsion / otherControlPoint.radius)
            //momentum -= relativeLocation (this, otherControlPoint) * magnitude
        });

        //calculate gravity from world
        this.#world.calculateGravityVectorForCoordinate(this.#position);
    }
}

export default ControlPoint;