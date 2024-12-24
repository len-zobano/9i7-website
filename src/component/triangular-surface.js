import * as glMatrix from 'gl-matrix';
import SimpleDrawDelegate from './simple-draw-delegate';

function vec3ToArray (v) {
    let arrayFromVector = [];
    for (let i = 0; i < 3; ++i) {
        arrayFromVector.push(v[i]);
    }
    return arrayFromVector;
}

class TriangularSurface {
    #world = null;
    #vertices = [];
    #drawDelegate = null;
    #ID = null;

    get ID () {
        return this.#ID;
    }

    constructor(world, vertices) {
        this.#world = world;
        this.#ID = `${new Date().getTime()}${Math.round(Math.random()*10000)}`;

        this.#vertices = vertices.map((vertex) => {
            return glMatrix.vec3.clone(vertex);
        });
        
        let vertexArray = vertices.map((vertex) => {
            return vec3ToArray(vertex);
        }).reduce((a, b) => {
            return a.concat(b);
        });

        let colorArray = this.#vertices.map((vertex) => {
            return [1.0,1.0,1.0,1.0];
        }).reduce((a, b) => {
            return a.concat(b);
        });

        let normalArray = []
        for (let i = 0; i < 3; ++i) {
            //the cross product of the other two vertices
            let product = glMatrix.vec3.create();
            glMatrix.vec3.cross(product,vertices[(i+1)%3],vertices[(i+2)%3]);
            glMatrix.vec3.normalize(product, product);
            normalArray = normalArray.concat(vec3ToArray(product));
        }

        let indices = [];
        for (let i = 0; i < vertexArray.length; ++i) {
            indices.push(i);
        }

        this.#drawDelegate = new SimpleDrawDelegate(this.#world, vertexArray, colorArray, normalArray, indices);
    }

    draw() {
        const modelViewMatrix = this.#world.modelViewMatrix;
        //draw the triangle with the delegate
        this.#drawDelegate.draw(modelViewMatrix);
    }
}

export default TriangularSurface;