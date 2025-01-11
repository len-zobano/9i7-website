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
        let angleSines = [
            Math.sin(angle[0]),
            Math.sin(angle[1]),
            Math.sin(angle[2])
        ];
    
        let angleCosines= [
            Math.cos(angle[0]),
            Math.cos(angle[1]),
            Math.cos(angle[2])
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
    
    this.angleBetweenTwoVectors = (a, c) => {
        //turn them to 3 2D angles
        let 
            AXY = glMatrix.vec2.fromValues(a[0], a[1]), 
            CXY = glMatrix.vec2.fromValues(c[0], c[1]),
            AZY = glMatrix.vec2.fromValues(-a[2], a[1]),
            CZY = glMatrix.vec2.fromValues(-c[2], c[1]),
            AXZ = glMatrix.vec2.fromValues(a[0], a[2]),
            CXZ = glMatrix.vec2.fromValues(c[0], c[2]);
    
        let ret = [];
        ret[0] = this.shortestAngleBetweenTwo2DVectors(AZY, CZY);
        ret[1] = -this.shortestAngleBetweenTwo2DVectors(AXZ, CXZ);
        ret[2] = this.shortestAngleBetweenTwo2DVectors(AXY, CXY);
    
        return ret.map((element) => {
            if (element === -0) {
                element = 0;
            }
            return element;
        });
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
}

let engineMath = new EngineMath();

export default engineMath;