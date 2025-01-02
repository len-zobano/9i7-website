
function EngineMath () {

    let randomSeeds = [0.5754007200665383, 0.22960470095431695, 0.4119573538127155];
    let randomIndex = 0;

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
        let randomNumber = 0;
        for (let i = 0; i < randomSeeds.length; ++i) {
            randomNumber += randomSeeds[i]*randomIndex;
            randomNumber %= 1;
        }

        ++randomIndex;
        return randomNumber;
    }
}

let engineMath = new EngineMath();

export default engineMath;