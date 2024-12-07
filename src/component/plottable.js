class Plottable {
  #position = [0,0,0];
  #broadCollisionRadius = 1.2;

  constructor (position) {
    this.#position = position.slice(0);
  }

  get broadCollisionRadius () {
    return this.#broadCollisionRadius;
  }

  get position () {
    return this.#position;
  }

  set position (p) {
    this.#position = p.slice(0);
  }
}

export default Plottable;