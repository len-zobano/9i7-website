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
    #vertexNormals = [];
    #invertedVertexNormals = [];
    #drawDelegate = null;
    #ID = null;
    #contextMatrix = null;
    #drawMatrix = null;
    #cameraMatrix = null;
    #inverseDrawMatrix = null;
    #inverseContextMatrix = null;
    #inverseCameraMatrix = null;

    createCameraMatrix () {
        let normalizedUp = glMatrix.vec3.clone(this.#vertexNormals[0]);
        glMatrix.vec3.normalize(normalizedUp, normalizedUp);

        let normalizedRight = glMatrix.vec3.create();
        glMatrix.vec3.sub(normalizedRight, this.#vertices[0], this.#vertices[1]);
        glMatrix.vec3.normalize(normalizedRight, normalizedRight);

        let normalizedToward = glMatrix.vec3.create();
        glMatrix.vec3.cross(normalizedToward, normalizedRight, normalizedUp);
        glMatrix.vec3.subtract(normalizedToward, glMatrix.vec3.create(), normalizedToward);
        glMatrix.vec3.normalize(normalizedToward, normalizedToward);

        return glMatrix.mat4.fromValues(
            normalizedRight[0], normalizedUp[0], normalizedToward[0], 0,
            normalizedRight[1], normalizedUp[1], normalizedToward[1], 0,
            normalizedRight[2], normalizedUp[2], normalizedToward[2], 0,
            0, 0, 0, 1
        );
    }

    createDrawMatrix () {
        let matrix = this.#cameraMatrix;
        glMatrix.mat4.invert(matrix, matrix);
        return matrix;
    }

    createContextMatrix () {
        //first, translate
        let contextMatrix = glMatrix.mat4.create();
        let vertex = this.#vertices[0];
        // debugger;
        glMatrix.mat4.translate(contextMatrix, contextMatrix, glMatrix.vec3.fromValues(
            this.#vertices[0][0],
            this.#vertices[0][1],
            this.#vertices[0][2]
        ));
        //then draw matrix 
        glMatrix.mat4.multiply(contextMatrix, contextMatrix, this.#cameraMatrix);
        return contextMatrix;
    }

    get ID () {
        return this.#ID;
    }

    lineSegmentIntersects(a, b) {
        return true;
    }

    vectorIsOnNormalSide(vector) {
        let absoluteNormal = glMatrix.vec3.create(), absoluteInvertedNormal = glMatrix.vec3.create();
        absoluteNormal = glMatrix.vec3.add(absoluteNormal,this.#vertices[0],this.#vertexNormals[0]);
        absoluteInvertedNormal = glMatrix.vec3.add(absoluteInvertedNormal,this.#vertices[0], this.#invertedVertexNormals[0]);
        let ret = glMatrix.vec3.distance(vector,absoluteNormal) < glMatrix.vec3.distance(vector,absoluteInvertedNormal);
        // console.log('vector is on normal side: ',
        //     ret,
        //     'for vector',vector,
        //     'and absolute normal',absoluteNormal,
        //     'and absolute inverted normal',absoluteInvertedNormal,
        //     'and vertex',this.#vertices[0],
        //     'and normal',this.#vertexNormals[0],
        //     'and inverted normal',this.#invertedVertexNormals[0]
        // );
        return ret;
    }

    constructor(world, vertices) {
        this.#world = world;
        world.addDrawable(this);
        world.addTriangularSurface(this);
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
            let relativeVertices = [glMatrix.vec3.create(), glMatrix.vec3.create()];
            glMatrix.vec3.sub(relativeVertices[0],vertices[(i+1)%3],vertices[0]);
            glMatrix.vec3.sub(relativeVertices[1],vertices[(i+2)%3],vertices[0]);
            glMatrix.vec3.cross(product,relativeVertices[0],relativeVertices[1]);
            glMatrix.vec3.normalize(product, product);
            this.#vertexNormals.push(product);
            let inverseProduct = glMatrix.vec3.create();
            glMatrix.vec3.sub(inverseProduct, glMatrix.vec3.create(), product);
            this.#invertedVertexNormals.push(inverseProduct);
            normalArray = normalArray.concat(vec3ToArray(product));
        }

        this.#cameraMatrix = this.createCameraMatrix();
        this.#drawMatrix = this.createDrawMatrix();
        this.#contextMatrix = this.createContextMatrix();
        this.#inverseContextMatrix = glMatrix.mat4.create();
        this.#inverseContextMatrix = glMatrix.mat4.invert(this.#inverseContextMatrix, this.#contextMatrix);
        this.#inverseDrawMatrix = glMatrix.mat4.create();
        this.#inverseDrawMatrix = glMatrix.mat4.invert(this.#inverseDrawMatrix, this.#drawMatrix);
        this.#inverseCameraMatrix = glMatrix.mat4.create();
        this.#inverseCameraMatrix = glMatrix.mat4.invert(this.#inverseCameraMatrix, this.#cameraMatrix);

        let indices = [];
        for (let i = 0; i < vertexArray.length; ++i) {
            indices.push(i);
        }

        this.#drawDelegate = new SimpleDrawDelegate(this.#world, vertexArray, colorArray, normalArray, indices);
    }

    mirrorAbsoluteVector(vector) {
        let mirroredVector = glMatrix.vec3.create();
        glMatrix.vec3.transformMat4(mirroredVector, vector, this.#contextMatrix);
        mirroredVector = glMatrix.vec3.fromValues(
            mirroredVector[0],
            -mirroredVector[1],
            mirroredVector[2]
        );
        glMatrix.vec3.transformMat4(mirroredVector, mirroredVector, this.#inverseContextMatrix);
        return mirroredVector;
    }

    mirrorRelativeVector(vector) {
        let mirroredVector = glMatrix.vec3.create();
        glMatrix.vec3.transformMat4(mirroredVector, vector, this.#drawMatrix);
        mirroredVector = glMatrix.vec3.fromValues(
            mirroredVector[0],
            -mirroredVector[1],
            mirroredVector[2]
        );
        glMatrix.vec3.transformMat4(mirroredVector, mirroredVector, this.#inverseDrawMatrix);
        return mirroredVector; 
    }

    draw() {
        const modelViewMatrix = this.#world.modelViewMatrix;
        //draw the triangle with the delegate
        this.#drawDelegate.draw(modelViewMatrix);
    }
}

export default TriangularSurface;