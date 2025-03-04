import * as glMatrix from 'gl-matrix';
import SimpleDrawDelegate from './simple-draw-delegate';
import engineMath from '../utility/engine-math';

class TriangularSurface {
    #world = null;
    #vertices = [];
    #bottomVertices = [];
    #depth = 0;
    #vertexNormal = null;

    get vertexNormal () {
        return glMatrix.vec3.clone(this.#vertexNormal);
    }

    #invertedVertexNormal = null;
    //TODO: make sure this is vertex index 1 and 2 transformed by the context matrix
    #verticesInContext = [];
    #bottomVerticesInContext = [];
    #topDrawDelegate = null;
    #bottomDrawDelegate = null;
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
        return ret;
    }

    constructor(world, vertices, bottomVertices, depth) {
        this.#world = world;
        this.#depth = depth;
        world.addDrawable(this);
        world.addTriangularSurface(this);
        this.#ID = `${new Date().getTime()}${Math.round(engineMath.random()*10000)}`;

        let randomColor = engineMath.HSLToRGB(Math.random(), 0.3, 0.5);

        this.#vertices = vertices.map((vertex) => {
            return glMatrix.vec3.clone(vertex);
        });

        this.#bottomVertices = bottomVertices.map((vertex) => {
            return glMatrix.vec3.clone(vertex);
        });

        let topColorArray = this.#vertices.map((vertex) => {
            return [randomColor[0], randomColor[1], randomColor[2], 1.0];
        }).reduce((a, b) => {
            return a.concat(b);
        });

        let bottomColorArray = this.#vertices.map((vertex) => {
            return [1.0,0.5,0.5,1.0];
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

        //temporary: make sure the normal is never pointing down toward bottom vertices
        let topVertexPlusNormal = glMatrix.vec3.create();
        glMatrix.vec3.add(topVertexPlusNormal, vertices[0], product);
        let bottomVertexRelativeToTopVertex = glMatrix.vec3.create();
        glMatrix.vec3.sub(bottomVertexRelativeToTopVertex, bottomVertices[0], vertices[0]);
        let bottomVertexRelativeToTopVertexPlusNormal = glMatrix.vec3.create();
        glMatrix.vec3.sub(bottomVertexRelativeToTopVertexPlusNormal, bottomVertices[0], topVertexPlusNormal);
        if (glMatrix.vec3.length(bottomVertexRelativeToTopVertex) > glMatrix.vec3.length(bottomVertexRelativeToTopVertexPlusNormal)) {
            console.log('normal of triangular surface pointing down');
            debugger;
        }

        let normalArray = [].concat(
            engineMath.vec3ToArray(product),
            engineMath.vec3ToArray(product),
            engineMath.vec3ToArray(product)
        );

        let bottomNormalArray = [].concat(
            engineMath.vec3ToArray(inverseProduct),
            engineMath.vec3ToArray(inverseProduct),
            engineMath.vec3ToArray(inverseProduct) 
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

        this.#verticesInContext = this.#vertices.map((vertex) => {
            let vertexInContext = glMatrix.vec3.clone(vertex);
            glMatrix.vec3.transformMat4(vertexInContext, vertexInContext, this.#inverseContextMatrix);
            return vertexInContext;
        });

        this.#bottomVerticesInContext = this.#bottomVertices.map((vertex) => {
            let vertexInContext = glMatrix.vec3.clone(vertex);
            glMatrix.vec3.transformMat4(vertexInContext, vertexInContext, this.#inverseContextMatrix);
            return vertexInContext;
        });

        let topVertexArray = this.#vertices.map((vertex) => {
            return engineMath.vec3ToArray(vertex);
        }).reduce((a, b) => {
            return a.concat(b);
        });

        let bottomVertexArray = this.#bottomVertices.map((vertex) => {
            return engineMath.vec3ToArray(vertex);
        }).reduce((a, b) => {
            return a.concat(b);
        });

        let indices = [];
        for (let i = 0; i < topVertexArray.length; ++i) {
            indices.push(i);
        }

        this.#topDrawDelegate = new SimpleDrawDelegate(this.#world, topVertexArray, topColorArray, normalArray, indices);
        this.#bottomDrawDelegate = new SimpleDrawDelegate(this.#world, bottomVertexArray, bottomColorArray, normalArray, indices);
    }

    trajectoryChangeForControlPoint (controlPoint) {
        let trajectoryChange = null;

        let inContextControlPointPosition = glMatrix.vec3.clone(controlPoint.position);
        glMatrix.vec3.transformMat4(
            inContextControlPointPosition,
            inContextControlPointPosition,
            this.#inverseContextMatrix
        );

        let depth = engineMath.depthInsideNormalTruncatedPyramid(
            inContextControlPointPosition,
            this.#verticesInContext,
            this.#bottomVerticesInContext
        );

        if (depth < 0.0) {
            trajectoryChange = glMatrix.vec3.clone(this.#vertexNormal);
            glMatrix.vec3.scale(trajectoryChange, trajectoryChange, -0.1*depth);
        }

        return trajectoryChange;
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

        //returns negative value if it doesn't intersect
        function calculateIntersection (origin, termination, depth) {
            let intersection = null;
            //if origin is higher than 0 and termination is lower than 0,
            //reflect at 0

            if (origin > 0 && termination <= 0) {
                intersection = {
                    yValue: 0,
                    portionOfLineAfterIntersection: -origin/termination
                };
            }
            //else, if origin is lower than 0 and termination is lower than origin, reflect at origin
            else if (origin < 0 && origin >= depth && termination < origin) {
                intersection = {
                    yValue: origin,
                    portionOfLineAfterIntersection: 1
                };
            }            

            return intersection;
            /*
                { yValue: 0, portionOfLineAfterIntersection: 0}
            */
        }

        let intersectionData = calculateIntersection(inContextSegmentOrigin[1], inContextSegmentTermination[1], this.#depth);
        //if the line segment doesn't hit y=0, return nothing
        if (intersectionData) {
            let inContextPointOfIntersection = [
                inContextSegmentTermination[0]*(1-intersectionData.portionOfLineAfterIntersection) + inContextSegmentOrigin[0]*intersectionData.portionOfLineAfterIntersection,
                intersectionData.yValue,
                inContextSegmentTermination[2]*(1-intersectionData.portionOfLineAfterIntersection) + inContextSegmentOrigin[2]*intersectionData.portionOfLineAfterIntersection,
            ];

            if (
                engineMath.isInsideNormalTruncatedPyramid(
                    inContextPointOfIntersection,
                    this.#verticesInContext,
                    this.#bottomVerticesInContext
                )
            ) {

                // console.log(`
                //     Particle crossed the triangular plane. Is inside triangle: ${isInsideTriangle}
                //     In context point of intersection: ${inContextPointOfIntersection}
                //     In context top vertex - 0: ${this.#verticesInContext[0]}
                //     In context vertex at point of intersection - 0: ${verticesAtPointOfIntersection[0]}
                //     In context top vertex - b: ${this.#verticesInContext[1]}
                //     In context vertex at point of intersection - b: ${verticesAtPointOfIntersection[1]}
                //     In context top vertex - b: ${this.#verticesInContext[2]}
                //     In context vertex at point of intersection - c: ${verticesAtPointOfIntersection[2]}
                // `);

                let absolutePointOfIntersection = glMatrix.vec3.create();

                glMatrix.vec3.transformMat4(
                    absolutePointOfIntersection,
                    inContextPointOfIntersection,
                    this.#contextMatrix
                );


                //TODO: reexamine this mirroring code just to verify all the math is right
                //and come up with some kind of a unit test for it
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
                //move the vectors in the direction of the rebound by the amount of collision rebound padding
                newLineSegmentPart = [absolutePointOfIntersection, absoluteMirroredSegmentTermination];
            }
        }

        return newLineSegmentPart;
    }

    flattenAbsoluteVectorAlongPlane(vector) {
        let flattenedVector = glMatrix.vec3.clone(vector);

        glMatrix.vec3.transformMat4(flattenedVector, flattenedVector, this.#inverseContextMatrix);
        flattenedVector[1] = 0;
        glMatrix.vec3.transformMat4(flattenedVector, flattenedVector, this.#contextMatrix);

        return flattenedVector;
    }
    
    flattenRelativeVectorAlongPlane(vector) {
        let flattenedVector = glMatrix.vec3.clone(vector);

        glMatrix.vec3.transformMat4(flattenedVector, flattenedVector, this.#inverseDrawMatrix);
        flattenedVector[1] = 0;
        glMatrix.vec3.transformMat4(flattenedVector, flattenedVector, this.#drawMatrix);

        return flattenedVector;
    }

    mirrorAbsoluteVector(vector) {
        let mirroredVector = glMatrix.vec3.create();
        glMatrix.vec3.transformMat4(mirroredVector, vector, this.#inverseContextMatrix);
        mirroredVector = glMatrix.vec3.fromValues(
            mirroredVector[0],
            -mirroredVector[1],
            mirroredVector[2]
        );
        glMatrix.vec3.transformMat4(mirroredVector, mirroredVector, this.#contextMatrix);
        return mirroredVector;
    }

    mirrorRelativeVector(vector) {
        let mirroredVector = glMatrix.vec3.clone(vector);
        glMatrix.vec3.transformMat4(mirroredVector, vector, this.#inverseDrawMatrix);
        mirroredVector = glMatrix.vec3.fromValues(
            mirroredVector[0],
            -mirroredVector[1],
            mirroredVector[2]
        );
        glMatrix.vec3.transformMat4(mirroredVector, mirroredVector, this.#drawMatrix);
        return mirroredVector; 
    }

    draw() {
        let lightPosition = this.#world.getLights()[0].position;
        //draw the triangle with the delegate
        this.#topDrawDelegate.draw(this.#world.cameraMatrix, this.#world.modelViewMatrix, lightPosition);
        this.#bottomDrawDelegate.draw(this.#world.cameraMatrix, this.#world.modelViewMatrix, lightPosition);
    }
}

export default TriangularSurface;