import * as glMatrix from 'gl-matrix';
import SimpleDrawDelegate from './simple-draw-delegate';

function vec3ToArray (v) {
    let arrayFromVector = [];
    for (let i = 0; i < 3; ++i) {
        arrayFromVector.push(v[i]);
    }
    return arrayFromVector;
}

function numberIsBetween (num, a, b) {
    return (a < num && num < b) || (a > num && num > b);
}

class TriangularSurface {
    #world = null;
    #vertices = [];
    #vertexNormal = null;
    #invertedVertexNormal = null;
    //TODO: make sure this is vertex index 1 and 2 transformed by the context matrix
    #verticesInContext = [];
    #drawDelegate = null;
    #ID = null;
    //The matrix where vertices[0] is center and vertices[0] is right and vertexNormal is up
    #contextMatrix = null;
    #drawMatrix = null;
    #cameraMatrix = null;
    #inverseDrawMatrix = null;
    #inverseContextMatrix = null;
    #inverseCameraMatrix = null;

    createCameraMatrix () {
        let normalizedUp = glMatrix.vec3.clone(this.#vertexNormal);
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
        let matrix = glMatrix.mat4.clone(this.#cameraMatrix);
        glMatrix.mat4.invert(matrix, matrix);
        return matrix;
    }

    createContextMatrixAt (origin) {
        //first, translate
        let contextMatrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(contextMatrix, contextMatrix, glMatrix.vec3.fromValues(
            origin[0],
            origin[1],
            origin[2]
        ));
        //then draw matrix 
        glMatrix.mat4.multiply(contextMatrix, contextMatrix, this.#drawMatrix);
        return contextMatrix;
    }

    createContextMatrix () {
        //first, translate
        let contextMatrix = glMatrix.mat4.create();
        let vertex = this.#vertices[0];
        glMatrix.mat4.translate(contextMatrix, contextMatrix, glMatrix.vec3.fromValues(
            this.#vertices[0][0],
            this.#vertices[0][1],
            this.#vertices[0][2]
        ));
        //then draw matrix 
        glMatrix.mat4.multiply(contextMatrix, contextMatrix, this.#drawMatrix);
        return contextMatrix;
    }

    get ID () {
        return this.#ID;
    }

    //a function that gives no false negatives but some false positives
    //for culling unnecessary surface collision calculations
    lineSegmentMayIntersect(a, b) {
        return true;
    }

    vectorIsOnNormalSide(vector) {
        let absoluteNormal = glMatrix.vec3.create(), absoluteInvertedNormal = glMatrix.vec3.create();
        absoluteNormal = glMatrix.vec3.add(absoluteNormal,this.#vertices[0],this.#vertexNormal);
        absoluteInvertedNormal = glMatrix.vec3.add(absoluteInvertedNormal,this.#vertices[0], this.#invertedVertexNormal);
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

        //create vertex normal and inverse mornal
        let product = glMatrix.vec3.create();
        let relativeVertices = [glMatrix.vec3.create(), glMatrix.vec3.create()];
        glMatrix.vec3.sub(relativeVertices[0],vertices[1],vertices[0]);
        glMatrix.vec3.sub(relativeVertices[1],vertices[2],vertices[0]);
        glMatrix.vec3.cross(product,relativeVertices[1],relativeVertices[0]);
        glMatrix.vec3.normalize(product, product);
        this.#vertexNormal = product;

        let inverseProduct = glMatrix.vec3.create();
        glMatrix.vec3.sub(inverseProduct, glMatrix.vec3.create(), product);
        this.#invertedVertexNormal = inverseProduct;

        let normalArray = [].concat(
            vec3ToArray(product),
            vec3ToArray(product),
            vec3ToArray(product)
        );

        this.#cameraMatrix = this.createCameraMatrix();
        this.#drawMatrix = this.createDrawMatrix();
        this.#contextMatrix = this.createContextMatrix();
        this.#inverseContextMatrix = glMatrix.mat4.create();
        this.#inverseContextMatrix = glMatrix.mat4.invert(this.#inverseContextMatrix, this.#contextMatrix);
        this.#inverseDrawMatrix = glMatrix.mat4.create();
        this.#inverseDrawMatrix = glMatrix.mat4.invert(this.#inverseDrawMatrix, this.#drawMatrix);
        this.#inverseCameraMatrix = glMatrix.mat4.create();
        this.#inverseCameraMatrix = glMatrix.mat4.invert(this.#inverseCameraMatrix, this.#cameraMatrix);

        this.#verticesInContext = [
            glMatrix.vec3.create(),
            glMatrix.vec3.create()
        ];

        glMatrix.vec3.transformMat4(this.#verticesInContext[0],this.#vertices[1],this.#inverseContextMatrix);
        glMatrix.vec3.transformMat4(this.#verticesInContext[1],this.#vertices[2],this.#inverseContextMatrix);

        let indices = [];
        for (let i = 0; i < vertexArray.length; ++i) {
            indices.push(i);
        }

        this.#drawDelegate = new SimpleDrawDelegate(this.#world, vertexArray, colorArray, normalArray, indices);
    }

    mirrorLineSegmentAfterIntersection(segmentOrigin, segmentTermination) {
        let newLineSegmentPart = null;
        //transform a and B in context matrix
        let 
            inContextSegmentOrigin = glMatrix.vec3.clone(segmentOrigin), 
            inContextSegmentTermination = glMatrix.vec3.clone(segmentTermination);

        glMatrix.vec3.transformMat4(
            inContextSegmentOrigin, 
            inContextSegmentOrigin, 
            this.#inverseContextMatrix
        );
        glMatrix.vec3.transformMat4(
            inContextSegmentTermination, 
            inContextSegmentTermination, 
            this.#inverseContextMatrix
        );

        //if the line segment doesn't hit y=0, return nothing
        if (numberIsBetween(0, inContextSegmentOrigin[1], inContextSegmentTermination[1])) {
            let portionOfLineAfterIntersection = Math.abs(inContextSegmentTermination[1])/(inContextSegmentOrigin[1]);
            let inContextPointOfIntersection = [
                inContextSegmentTermination[0]*portionOfLineAfterIntersection + inContextSegmentOrigin[0]*(1-portionOfLineAfterIntersection),
                0,
                inContextSegmentTermination[2]*portionOfLineAfterIntersection + inContextSegmentOrigin[2]*(1-portionOfLineAfterIntersection),
            ];
            //the triangle of intersection is on the x-z plane. The coordinates are [0,0], [c, 0], [dx, dz]
            let side1ZValueAtPointOfIntersection = (this.#verticesInContext[1][2]/this.#verticesInContext[1][0])*inContextPointOfIntersection[0];
            let side2ZValueAtPointOfIntersection =
                ((this.#verticesInContext[1][2] - this.#verticesInContext[0][2])/
                (this.#verticesInContext[1][0] - this.#verticesInContext[0][0]))*inContextPointOfIntersection[0]
                +
                ((this.#verticesInContext[0][2] - this.#verticesInContext[1][2])/
                (this.#verticesInContext[1][0] - this.#verticesInContext[0][0]))*this.#verticesInContext[0][0];

            let kValue = ((this.#verticesInContext[0][2] - this.#verticesInContext[1][2])/
            (this.#verticesInContext[1][0] - this.#verticesInContext[0][0]))*this.#verticesInContext[0][0];

            let slopeValue = ((this.#verticesInContext[1][2] - this.#verticesInContext[0][2])/
            (this.#verticesInContext[1][0] - this.#verticesInContext[0][0]));


            //if it's between x, it just has to be below z
            //otherwise, it has to be above the nearest and below the furthest
            //it always has to be above zero

            let isInsideTriangle = false;
            if (numberIsBetween(inContextPointOfIntersection[0],this.#verticesInContext[0][0],this.#verticesInContext[1][0])) {
                console.log('case 1 - is between x');
                //REMINDER: 
                //don't just see if it's less than like the commented out region below. see if it's closer to zero
                //isInsideTriangle = 
                //     inContextPointOfIntersection[2] < side2ZValueAtPointOfIntersection &&
                //     inContextPointOfIntersection[2] < side1ZValueAtPointOfIntersection
                isInsideTriangle = 
                    numberIsBetween(inContextPointOfIntersection[2], side2ZValueAtPointOfIntersection, 0) &&
                    numberIsBetween(inContextPointOfIntersection[2], side2ZValueAtPointOfIntersection, 0);
            }
            //the z values must have the same sign
            //if zero is not between them, they do
            else if (
                !numberIsBetween(0, side1ZValueAtPointOfIntersection, side2ZValueAtPointOfIntersection)
            ) {
                //has to be between the two top sides if it's not between the base vertices
                isInsideTriangle = numberIsBetween(
                    inContextPointOfIntersection[2], 
                    side2ZValueAtPointOfIntersection, 
                    side1ZValueAtPointOfIntersection
                );
            }

            //same side of x=0
            isInsideTriangle = isInsideTriangle && !numberIsBetween(0,inContextPointOfIntersection[2],side1ZValueAtPointOfIntersection);

            if (isInsideTriangle) {

                console.log(`
                    Collision detected between control point and triangle
                    In context point of intersection: ${inContextPointOfIntersection}
                    In context vertex b: ${this.#verticesInContext[0]}
                    In context vertex c: ${this.#verticesInContext[1]}
                    c -> 0 z value at point of intersection: ${side1ZValueAtPointOfIntersection}
                    b -> c z value at point of intersection: ${side2ZValueAtPointOfIntersection}

                    k value: ${kValue}
                    slope value: ${slopeValue}
                    x value: ${inContextPointOfIntersection[0]}
                `);

                // debugger;

                let absolutePointOfIntersection = glMatrix.vec3.create();

                glMatrix.vec3.transformMat4(
                    absolutePointOfIntersection,
                    inContextPointOfIntersection,
                    this.#contextMatrix
                );

                let mirroringContextMatrix = this.createContextMatrixAt(absolutePointOfIntersection);
                let invertedMirroringContextMatrix = glMatrix.mat4.create();
                glMatrix.mat4.invert(invertedMirroringContextMatrix, mirroringContextMatrix);

                let mirroredSegmentTerminationInMirroringContext = glMatrix.vec3.create();
                glMatrix.vec3.transformMat4(mirroredSegmentTerminationInMirroringContext, segmentTermination, invertedMirroringContextMatrix);
                mirroredSegmentTerminationInMirroringContext = glMatrix.vec3.fromValues(
                    mirroredSegmentTerminationInMirroringContext[0],
                    -mirroredSegmentTerminationInMirroringContext[1],
                    mirroredSegmentTerminationInMirroringContext[2]
                );
                let absoluteMirroredSegmentTermination = glMatrix.vec3.create();
                glMatrix.vec3.transformMat4(
                    absoluteMirroredSegmentTermination, 
                    mirroredSegmentTerminationInMirroringContext, 
                    mirroringContextMatrix
                );
                newLineSegmentPart = [absolutePointOfIntersection, absoluteMirroredSegmentTermination];
            }
        }

        return newLineSegmentPart;
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