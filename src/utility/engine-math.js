import * as glMatrix from 'gl-matrix';

function EngineMath () {

    let randomSeeds = [0.5754007200665383, 0.22960470095431695, 0.4119573538127155];
    let randomIndex = 11;
     
    this.centerVector = glMatrix.vec3.create();
    this.topVector = glMatrix.vec3.fromValues(0.0,1.0,0.0);
    this.rightVector = glMatrix.vec3.fromValues(1.0,0.0,0.0);

    this.vec3ToArray = (v) => {
        let arrayFromVector = [];
        for (let i = 0; i < 3; ++i) {
            arrayFromVector.push(v[i]);
        }
        return arrayFromVector;
    };
    
    this.numberIsBetween = (num, a, b, inclusive) => {
        if (inclusive) {
            return (a <= num && num <= b) || (a >= num && num >= b);
        }
        else {
            return (a < num && num < b) || (a > num && num > b);
        }
    };

    this.setRandomSeeds = (a, b, c) => {
        randomSeeds = [a, b, c];
    };

    this.random = () => {
        // let randomNumber = 0;
        // for (let i = 0; i < randomSeeds.length; ++i) {
        //     randomNumber += randomSeeds[i]*(randomIndex++);
        //     randomNumber %= 1;
        // }

        // ++randomIndex;
        // return randomNumber;
        return Math.random();
    };


    this.transformVectorByAngle = (vector, angle) => {

        //TEMPORARY: to see if I got the ordering of these wrong
        let angleIndices = [0,1,2];

        let angleSines = [
            Math.sin(angle[angleIndices[0]]),
            Math.sin(angle[angleIndices[1]]),
            Math.sin(angle[angleIndices[2]])
        ];
    
        let angleCosines= [
            Math.cos(angle[angleIndices[0]]),
            Math.cos(angle[angleIndices[1]]),
            Math.cos(angle[angleIndices[2]])
        ];
    
        let rotationMatrices = [
            glMatrix.mat3.fromValues(
                1, 0, 0,
                0, angleCosines[0], -angleSines[0],
                0, angleSines[0], angleCosines[0]
            ),
            glMatrix.mat3.fromValues(
                angleCosines[1], 0, angleSines[1],
                0, 1, 0,
                -angleSines[1], 0, angleCosines[1]
            ),
            glMatrix.mat3.fromValues(
                angleCosines[2], -angleSines[2], 0,
                angleSines[2], angleCosines[2], 0,
                0, 0, 1
            )
        ];

        rotationMatrices.forEach((matrix) => {
            glMatrix.vec3.transformMat3(vector, vector, matrix);
        });
    };
    
    this.angleOfOne2DVector = (a, b) => {
        if (a === -0) a = 0;
        if (b === -0) b = 0;
        return Math.atan2(b, a);
    };
    
    this.shortestAngleBetweenTwo2DVectors = (a, c) => {
        if (a[0] === 0 && a[1] === 0) return 0;
        if (c[0] === 0 && c[1] === 0) return 0;
        let angle = this.angleOfOne2DVector(c[1],c[0]) - this.angleOfOne2DVector(a[1],a[0]);
        //if the angle is over 180, make it angle-360
        if (angle > Math.PI) {
            angle -= 2*Math.PI;
        }
        //if the angle is under -180, make it angle+360
        else if (angle < -Math.PI) {
            angle += 2*Math.PI;
        }
        
        return angle;
    }
    
    //normal truncated pyramid's top triangle is along the plane y=0
    this.isInsideNormalTruncatedPyramid = (vertex, topVertices, bottomVertices) => {
        if (vertex[1] > 0) {
            return false;
        }
        //TODO: you could optimize this by precalculating the bottom vertices to be where their relative position is y = -1
        let verticesAtPointOfIntersection = [];
        //if y value is zero, just clone the vertices
        for (let i = 0; i < 3; ++i) {
            //get relative vertex
            let relativePositionOfBottom = glMatrix.vec3.create();
            glMatrix.vec3.subtract(relativePositionOfBottom, bottomVertices[i], topVertices[i]);
            //get y value
            let toScale = vertex[1] / relativePositionOfBottom[1];
            glMatrix.vec3.scale(relativePositionOfBottom, relativePositionOfBottom, toScale);
            glMatrix.vec3.add(relativePositionOfBottom, topVertices[i], relativePositionOfBottom);
            verticesAtPointOfIntersection[i] = relativePositionOfBottom;
        }
        
        return engineMath.isInsideTriangle(
            vertex,
            verticesAtPointOfIntersection[0], 
            verticesAtPointOfIntersection[1],
            verticesAtPointOfIntersection[2]
        );
    }
    //TODO: this is a 2D function, and should be expressed as such
    this.isInsideTriangle = (pt, v1, v2, v3) => {
        function sign (p1, p2, p3)
        {
            return (p1[0] - p3[0]) * (p2[2] - p3[2]) - (p2[0] - p3[0]) * (p1[2] - p3[2]);
        }

        let 
            d1 = sign(pt, v1, v2),
            d2 = sign(pt, v2, v3),
            d3 = sign(pt, v3, v1);
    
        let has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        let has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    
        return !(has_neg && has_pos);
    }

    this.angleBetweenTwoVectors = (c, a) => {
        //XY, ZX, YZ

        //turn them to 3 2D angles
        let 
            AXY = glMatrix.vec2.fromValues(a[0], a[1]), 
            CXY = glMatrix.vec2.fromValues(c[0], c[1]),
            AYZ = glMatrix.vec2.fromValues(a[1], a[2]),
            CYZ = glMatrix.vec2.fromValues(c[1], c[2]),
            AZX = glMatrix.vec2.fromValues(a[2], a[0]),
            CZX = glMatrix.vec2.fromValues(c[2], c[0]);
    
        let ret = [];
        // ret[0] = this.shortestAngleBetweenTwo2DVectors(AZY, CZY);
        // ret[1] = -this.shortestAngleBetweenTwo2DVectors(AXZ, CXZ);
        // ret[2] = this.shortestAngleBetweenTwo2DVectors(AXY, CXY);

        ret[0] = this.shortestAngleBetweenTwo2DVectors(AYZ, CYZ);
        ret[1] = this.shortestAngleBetweenTwo2DVectors(AZX, CZX);
        ret[2] = this.shortestAngleBetweenTwo2DVectors(AXY, CXY);
    
        ret = ret.map((element) => {
            if (element === -0) {
                element = 0;
            }
            return element;
        });

        return glMatrix.vec3.fromValues(ret[0], ret[1], ret[2]);
    }    

    this.magnitudeOfAttractionForAngle = (angle) => {
        //whole-angle magnitude model
        let magnitude = 1;
        angle.forEach((angleComponent) => {
            let absoluteAngleComponent = Math.abs(angleComponent);
            if (absoluteAngleComponent > Math.PI/2) {
                magnitude *= (Math.PI-absoluteAngleComponent)/(Math.PI/2);
            }
        });
        return magnitude;
    }

    this.angleScaledToMagnitudeOfAttraction = (angle) =>{
        let magnitude = this.magnitudeOfAttractionForAngle(angle);
        return angle.map((angleComponent) => {
            return angleComponent*magnitude;
        });
    }

    this.averageOfVectors = (vectors) => {
        let average = glMatrix.vec3.create();
        vectors.forEach((vector) => {
            glMatrix.vec3.add(average, average, vector);
        });
        glMatrix.vec3.scale(average, average, 1/vectors.length);
        return average;
    };
}

let engineMath = new EngineMath();

export default engineMath;