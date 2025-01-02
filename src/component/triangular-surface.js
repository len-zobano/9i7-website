import * as glMatrix from 'gl-matrix';
import SimpleDrawDelegate from './simple-draw-delegate';

function vec3ToArray (v) {
    let arrayFromVector = [];
    for (let i = 0; i < 3; ++i) {
        arrayFromVector.push(v[i]);
    }
    return arrayFromVector;
}

function numberIsBetween (num, a, b, inclusive) {
    if (inclusive) {
        return (a <= num && num <= b) || (a >= num && num >= b);
    }
    else {
        return (a < num && num < b) || (a > num && num > b);
    }
}

class TriangularSurface {
    #thickness;
    #world = null;
    #middleVertices = [];
    #topVertices = [];
    #bottomVertices = [];
    #vertexNormal = null;
    #invertedVertexNormal = null;
    #projectionPoint = null;
    //TODO: make sure this is vertex index 1 and 2 transformed by the context matrix
    #middleVerticesInContext = [];
    #topVerticesInContext = [];
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
        glMatrix.vec3.sub(normalizedRight, this.#middleVertices[0], this.#middleVertices[1]);
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
        let vertex = this.#middleVertices[0];
        glMatrix.mat4.translate(contextMatrix, contextMatrix, glMatrix.vec3.fromValues(
            this.#middleVertices[0][0],
            this.#middleVertices[0][1],
            this.#middleVertices[0][2]
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
        absoluteNormal = glMatrix.vec3.add(absoluteNormal,this.#middleVertices[0],this.#vertexNormal);
        absoluteInvertedNormal = glMatrix.vec3.add(absoluteInvertedNormal,this.#middleVertices[0], this.#invertedVertexNormal);
        let ret = glMatrix.vec3.distance(vector,absoluteNormal) < glMatrix.vec3.distance(vector,absoluteInvertedNormal);
        return ret;
    }

    constructor(world, vertices, projectionPoint, thickness = 10) {
        this.#world = world;
        this.#thickness = thickness;
        world.addDrawable(this);
        world.addTriangularSurface(this);
        this.#ID = `${new Date().getTime()}${Math.round(Math.random()*10000)}`;

        this.#middleVertices = vertices.map((vertex) => {
            return glMatrix.vec3.clone(vertex);
        });

        this.#topVertices = this.#middleVertices.map((vertex) => {
            //make a vector that is vertex minus projetion point
            let vertexRelativeToProjectionPoint = glMatrix.vec3.create();
            glMatrix.vec3.subtract(vertexRelativeToProjectionPoint, vertex, projectionPoint);
            //get the length of the vector
            let lengthOfProjection = glMatrix.vec3.length(vertexRelativeToProjectionPoint);
            //scale the vector by thickness/length
            glMatrix.vec3.scale(vertexRelativeToProjectionPoint, vertexRelativeToProjectionPoint, (lengthOfProjection + thickness)/lengthOfProjection);
            //add back the projection point to get the new vertex
            glMatrix.vec3.add(vertexRelativeToProjectionPoint, vertexRelativeToProjectionPoint, projectionPoint);
            return vertexRelativeToProjectionPoint;
        });


        this.#bottomVertices = this.#middleVertices.map((vertex) => {
            //make a vector that is vertex minus projetion point
            let vertexRelativeToProjectionPoint = glMatrix.vec3.create();
            glMatrix.vec3.subtract(vertexRelativeToProjectionPoint, vertex, projectionPoint);
            //get the length of the vector
            let lengthOfProjection = glMatrix.vec3.length(vertexRelativeToProjectionPoint);
            //scale the vector by (length-thickness)/length
            glMatrix.vec3.scale(vertexRelativeToProjectionPoint, vertexRelativeToProjectionPoint, (lengthOfProjection - thickness)/lengthOfProjection);
            //add back the projection point to get the new vertex
            glMatrix.vec3.add(vertexRelativeToProjectionPoint, vertexRelativeToProjectionPoint, projectionPoint);
            return vertexRelativeToProjectionPoint;
        });

        let topColorArray = this.#middleVertices.map((vertex) => {
            return [1.0,1.0,1.0,1.0];
        }).reduce((a, b) => {
            return a.concat(b);
        });

        let bottomColorArray = this.#middleVertices.map((vertex) => {
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

        this.#middleVerticesInContext = [
            glMatrix.vec3.create(),
            glMatrix.vec3.create()
        ];

        glMatrix.vec3.transformMat4(this.#middleVerticesInContext[0],this.#middleVertices[1],this.#inverseContextMatrix);
        glMatrix.vec3.transformMat4(this.#middleVerticesInContext[1],this.#middleVertices[2],this.#inverseContextMatrix);

        this.#topVerticesInContext = this.#topVertices.map((vertex) => {
            let vertexInContext = glMatrix.vec3.clone(vertex);
            glMatrix.vec3.transformMat4(vertexInContext, vertexInContext, this.#inverseContextMatrix);
            return vertexInContext;
        });

        this.#bottomVerticesInContext = this.#bottomVertices.map((vertex) => {
            let vertexInContext = glMatrix.vec3.clone(vertex);
            glMatrix.vec3.transformMat4(vertexInContext, vertexInContext, this.#inverseContextMatrix);
            return vertexInContext;
        });

        let topVertexArray = this.#topVertices.map((vertex) => {
            return vec3ToArray(vertex);
        }).reduce((a, b) => {
            return a.concat(b);
        });

        let bottomVertexArray = this.#bottomVertices.map((vertex) => {
            return vec3ToArray(vertex);
        }).reduce((a, b) => {
            return a.concat(b);
        });

        let indices = [];
        for (let i = 0; i < topVertexArray.length; ++i) {
            indices.push(i);
        }

        // let 
        //     topVertices = this.#topVertices, 
        //     bottomVertices = this.#bottomVertices, 
        //     middleVertices = this.#middleVertices,
        //     topVerticesInContext = this.#topVerticesInContext,
        //     bottomVerticesInContext = this.#bottomVerticesInContext,
        //     middleVerticesInContext = this.#middleVerticesInContext;
        // debugger;

        this.#topDrawDelegate = new SimpleDrawDelegate(this.#world, topVertexArray, topColorArray, normalArray, indices);
        this.#bottomDrawDelegate = new SimpleDrawDelegate(this.#world, bottomVertexArray, bottomColorArray, normalArray, indices);
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

        let intersectionPadding = this.#thickness;
        //returns negative value if it doesn't intersect
        function calculateIntersection (origin, termination) {
            let intersection = null;
            //if origin is higher than +padding and termination is lower than +padding,
            //reflect at +padding
            if (origin > intersectionPadding && termination <= intersectionPadding) {
                intersection = {
                    yValue: intersectionPadding,
                    portionOfLineAfterIntersection: (intersectionPadding - termination)/(origin - intersectionPadding)
                };
            }
            //else, if origin is lower than -padding and termination is higher than -padding, 
            //reflect at -padding
            else if (origin < -intersectionPadding && termination >= -intersectionPadding) {
                intersection = {
                    yValue: -intersectionPadding,
                    portionOfLineAfterIntersection: (intersectionPadding - termination)/(origin - intersectionPadding)
                };
            }
            //else, if origin is higher than 0 and termination is lower than origin, reflect at origin
            else if (origin < intersectionPadding && origin > 0 && termination < origin) {
                intersection = {
                    yValue: origin,
                    portionOfLineAfterIntersection: 1
                };
            }
            //else, if origin is lower than 0 and termination is higher than origin, reflect at origin
            else if (origin > intersectionPadding && origin < 0 && termination > origin) {
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

        let intersectionData = calculateIntersection(inContextSegmentOrigin[1], inContextSegmentTermination[1]);
        //if the line segment doesn't hit y=0, return nothing
        if (intersectionData) {
            let inContextPointOfIntersection = [
                inContextSegmentTermination[0]*intersectionData.portionOfLineAfterIntersection + inContextSegmentOrigin[0]*(1-intersectionData.portionOfLineAfterIntersection),
                intersectionData.yValue,
                inContextSegmentTermination[2]*intersectionData.portionOfLineAfterIntersection + inContextSegmentOrigin[2]*(1-intersectionData.portionOfLineAfterIntersection),
            ];

            let verticesAtPointOfIntersection = [];
            let depthQuotient = (intersectionData.yValue + this.#thickness)/(2*this.#thickness);
            for (let i = 0; i < 3; ++i) {
                verticesAtPointOfIntersection[i] = glMatrix.vec3.fromValues(
                    this.#topVerticesInContext[i][0]*depthQuotient + this.#bottomVerticesInContext[i][0]*(1-depthQuotient),
                    this.#topVerticesInContext[i][1]*depthQuotient + this.#bottomVerticesInContext[i][1]*(1-depthQuotient),
                    this.#topVerticesInContext[i][2]*depthQuotient + this.#bottomVerticesInContext[i][2]*(1-depthQuotient)
                );
            }
            //the triangle of intersection is on the x-z plane. The coordinates are [0,0], [c, 0], [dx, dz]
            let side1ZValueAtPointOfIntersection = (verticesAtPointOfIntersection[1][2]/verticesAtPointOfIntersection[1][0])*inContextPointOfIntersection[0];
            let side2ZValueAtPointOfIntersection =
                ((verticesAtPointOfIntersection[1][2] - verticesAtPointOfIntersection[0][2])/
                (verticesAtPointOfIntersection[1][0] - verticesAtPointOfIntersection[0][0]))*inContextPointOfIntersection[0]
                +
                ((verticesAtPointOfIntersection[0][2] - verticesAtPointOfIntersection[1][2])/
                (verticesAtPointOfIntersection[1][0] - verticesAtPointOfIntersection[0][0]))*verticesAtPointOfIntersection[0][0];

            let kValue = ((verticesAtPointOfIntersection[0][2] - verticesAtPointOfIntersection[1][2])/
            (verticesAtPointOfIntersection[1][0] - verticesAtPointOfIntersection[0][0]))*verticesAtPointOfIntersection[0][0];

            let slopeValue = ((verticesAtPointOfIntersection[1][2] - verticesAtPointOfIntersection[0][2])/  
            (verticesAtPointOfIntersection[1][0] - verticesAtPointOfIntersection[0][0]));
            
            let isInsideTriangle = false;
            //if one z value is infinite, must be lower than the other z value, and between the 2 vertices at x
            if (Math.abs(side1ZValueAtPointOfIntersection) === Infinity || Math.abs(side2ZValueAtPointOfIntersection) === Infinity ) {
                console.log('accounting for infinite z value');
                if (
                    Math.abs(side1ZValueAtPointOfIntersection) === Infinity && 
                    numberIsBetween(inContextPointOfIntersection[2],0,side2ZValueAtPointOfIntersection, true) &&
                    numberIsBetween(inContextPointOfIntersection[0],verticesAtPointOfIntersection[0][0], verticesAtPointOfIntersection[1][0])
                ) {
                    console.log('is inside true at infinite side 1');
                    isInsideTriangle = true;
                }

                if (
                    Math.abs(side2ZValueAtPointOfIntersection) === Infinity && 
                    numberIsBetween(inContextPointOfIntersection[2],0,side1ZValueAtPointOfIntersection, true) &&
                    numberIsBetween(inContextPointOfIntersection[0],verticesAtPointOfIntersection[0][0], verticesAtPointOfIntersection[1][0])
                ) {
                    console.log('is inside true at infinite side 2');
                    isInsideTriangle = true;
                }
            }
            //if c is between b and 0 on the x axis, intersection must be closer to z=0 than both z values
            else {
                if (
                    numberIsBetween(verticesAtPointOfIntersection[1][0],0,verticesAtPointOfIntersection[0][0]) &&
                    numberIsBetween(inContextPointOfIntersection[2],0,side1ZValueAtPointOfIntersection, true) &&
                    numberIsBetween(inContextPointOfIntersection[2],0,side2ZValueAtPointOfIntersection, true)
                ) {
                    console.log('is inside true at c is between');
                    isInsideTriangle = true;
                }
                //otherwise, intersection must be between z values
                if (
                    !numberIsBetween(verticesAtPointOfIntersection[1][0],0,verticesAtPointOfIntersection[0][0]) &&
                    numberIsBetween(inContextPointOfIntersection[2],side1ZValueAtPointOfIntersection,side2ZValueAtPointOfIntersection, true)
                ) {
                    console.log('is inside true at c is outside');
                    isInsideTriangle = true;
                }
            }

            console.log('is inside is',isInsideTriangle,'before lower bound check');

            //intersection has to be on same side of z as c
            if (isInsideTriangle && !numberIsBetween(inContextPointOfIntersection[2],0,verticesAtPointOfIntersection[1][2], true)) {
                console.log('is inside triangle set to false at lower bound check');
                isInsideTriangle = false;
            }

            console.log(`
                Particle crossed the triangular plane. Is inside triangle: ${isInsideTriangle}
                In context point of intersection: ${inContextPointOfIntersection}
                In context vertex at point of intersection - b: ${verticesAtPointOfIntersection[0]}
                In context vertex at point of intersection - c: ${verticesAtPointOfIntersection[1]}
                c -> 0 z value at point of intersection: ${side1ZValueAtPointOfIntersection}
                b -> c z value at point of intersection: ${side2ZValueAtPointOfIntersection}

                k value: ${kValue}
                slope value: ${slopeValue}
                x value: ${inContextPointOfIntersection[0]}
            `);

            if (isInsideTriangle) {
                console.log('Particle intersection is inside triangle');

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
                //move the vectors in the direction of the rebound by the amount of collision rebound padding
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
        const modelViewMatrix = this.#world.modelViewMatrix;
        //draw the triangle with the delegate
        this.#topDrawDelegate.draw(modelViewMatrix);
        this.#bottomDrawDelegate.draw(modelViewMatrix);
    }
}

export default TriangularSurface;