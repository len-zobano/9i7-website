import * as glMatrix from 'gl-matrix';
import { useState, useEffect } from 'react';
import Plottable from './plottable';

function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
      width,
      height
    };
  }
 
function vec3FromArray(a) {
    return glMatrix.vec3.fromValues(a[0],a[1],a[2]);
}

function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());
  
    useEffect(() => {
      function handleResize() {
  
        let dimensions = getWindowDimensions();
  
      //   circle.x = dimensions.width/2;
      //   circle.y = dimensions.height/2;
        // drawCircle(ctx, dimensions.width/2, dimensions.height/2, 100, "#ffff00","black",0);
        setWindowDimensions(getWindowDimensions());
      }
  
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  
    return windowDimensions;
}



//maintains a table of tiles as well as a table of ID keys to tile values
//the tiles track what iteration the elements were in. that way, a plottable is ignored in a tile if it isn't of the current iteration
class GridSystem {
    #iteration = 0;
    #scale = 2.0;
    #tiles = {};
    #tileOffsets = [];
    #controlPointsToPrimaryTileCoordinates = {};

    addControlPointToTile(controlPoint, coordinates) {
        let tileContainer = this.#tiles;
        for (let i = 0; i < 3; ++i) {
            if (!tileContainer[coordinates[i]]) {
                tileContainer[coordinates[i]] = {};
            }
            tileContainer = tileContainer[coordinates[i]];
        }
        return tileContainer[controlPoint.ID] = {
            iteration: this.#iteration,
            controlPoint
        };
    }

    getPrimaryTileCoordinatesForControlPoint(controlPoint) {
        return this.#controlPointsToPrimaryTileCoordinates[controlPoint.ID];
    }

    getTileForCoordinates(coordinates) {
        let tileContainer = this.#tiles;
        for (let i = 0; i < 3; ++i) {
            if (!tileContainer[coordinates[i]]) {
                tileContainer[coordinates[i]] = {};
            }
            tileContainer = tileContainer[coordinates[i]];
        } 
        return tileContainer;
    }

    getCurrentControlPointsForTileCoordinates (coordinates) {
        let tileContainer = this.#tiles;
        for (let i = 0; i < 3; ++i) {
            if (!tileContainer[coordinates[i]]) {
                tileContainer[coordinates[i]] = {};
            }
            tileContainer = tileContainer[coordinates[i]];
        }

        let tileContainerToReturn = {};
        for (let key in tileContainer) {
            //only return the control points that are of the current iteration
            if (tileContainer[key].iteration === this.#iteration) {
                tileContainerToReturn[key] = tileContainer[key];
            }
            //clean up the control points otherwise
            else {
                delete tileContainer[key];
            }
        }

        //this array fill can probably be optimized if it's combined with the above
        let arrayToReturn = [];
        for (let key in tileContainerToReturn) {
            arrayToReturn.push(tileContainerToReturn[key].controlPoint);
        }

        return arrayToReturn;
    }

    cleanTile(coordinates) {
        let tileContainer = this.#tiles;
        for (let i = 0; i < 3; ++i) {
            if (!tileContainer[coordinates[i]]) {
                //if it doesn't exist, it doesn't need to be cleaned
                return;
            }
            tileContainer = tileContainer[coordinates[i]];
        } 

        for (let key in tileContainer) {
            //delete if the plottable is of a previous iteration
            if (tileContainer[key].iteration !== this.#iteration) {
                delete tileContainer[key];
            }
        }
    }

    plotControlPoint(controlPoint) {
        //get coordinates of tile
        let tileContainer = this.#tiles, tileCoordinates = [];
        for (let i = 0; i < 3; ++i) {
            tileCoordinates[i] = Math.floor(controlPoint.position[i]/this.#scale);
        }

        //set tile and all adjacent tiles
        for (let i = 0; i < 27; ++i) {
            this.addControlPointToTile(controlPoint, [
                (i % 3) - 1 + tileCoordinates[0],
                (Math.floor(i/3) % 3) - 1 + tileCoordinates[1],
                (Math.floor(i/9) % 3) - 1 + tileCoordinates[2]
            ]);
        }
        //put the reference to the primary tile into the table
        this.#controlPointsToPrimaryTileCoordinates[controlPoint.ID] = tileCoordinates;
        //return the coordinates of the tile
        return tileCoordinates;
    }

    iterate() {
        ++this.#iteration;
    }
}

class World {
  #currentTime = 0;
  #drawables = [];
  #controlPoints = [];
  #selected = null;
  #projectionMatrix = null;
  #gridSystem = null;
  #gl = null;
  #globalGravityVector = glMatrix.vec3.fromValues(0,0,0);
  #isRunning = false;
  #cameraPosition = glMatrix.vec3.create();
  #upPosition = glMatrix.vec3.fromValues(0,1000,0);

  //TODO: is this the best way to avoid chaotically strong repulsion?
  get maxRepulsionMagnitude () {
    return 1000;
  }

  getGravityForLocation() {
    let existingGravityVector = this.#globalGravityVector;
    let toReturn = glMatrix.vec3.clone(this.#globalGravityVector);
    return toReturn;
  }

  get gl () {
    return this.#gl;
  }

  get gridSystem () {
    return this.#gridSystem;
  }

  #modelViewMatrix = null;
  #downKeys = {};

    get modelViewMatrix () {
        return glMatrix.mat4.clone(this.#modelViewMatrix);
    }

constructor() {
        // this.#upPlottable = new Plottable ([0,1000,0]);

        var canvas = document.getElementById("test-canvas");
        this.#gl = canvas.getContext("webgl", {alpha: false}); 
}

  keyIsUp(keyCode) {
    delete this.#downKeys[keyCode];
    //bracket - switch selected
    if (keyCode === 221) {
        let indexOfSelected = this.#controlPoints.indexOf(this.#selected);
        let indexOfNextSelected = (indexOfSelected + 1) % this.#controlPoints.length;
        let lastSelected = this.#selected;
        this.#selected = this.#controlPoints[indexOfNextSelected];
        lastSelected.select(false);
        this.#selected.select(true);
    }

    if (keyCode === 32) {
        this.#isRunning = !this.#isRunning;
    }

    // this.#controlPoints.forEach((controlPoint) => {
    //     if (!controlPoint) {
    //         debugger;
    //     }
    //     controlPoint.keyIsUp(keyCode);
    // });
  }

  keyIsDown(keyCode) {
    console.log('key down:',keyCode);
    this.#downKeys[keyCode] = true;
    // this.#controlPoints.forEach((controlPoint) => {
    //     if (!controlPoint) {
    //         debugger;
    //     }
    //     debugger;
    //     controlPoint.keyIsDown(keyCode);
    // });
  }

  get projectionMatrix() {
    return this.#projectionMatrix;
  }

  addControlPoint(controlPoint) {
    this.#controlPoints.push(controlPoint);
    if (!this.#selected) {
        this.#selected = controlPoint;
    }
  }

  addDrawable(drawableToAdd) {
    this.#drawables.push(drawableToAdd);
  }

  simulate() {
    if (!this.#currentTime) {
        this.#currentTime = new Date().getTime();
    }
    let lastTime = this.#currentTime;
    this.#currentTime = new Date().getTime();
    let interval = (this.#currentTime - lastTime)/1000;
    
    if (interval <= 0 || !this.#isRunning) {
        return;
    }

    if (interval > 0.05) {
        interval = 0.05;
    }

    if (!this.#gridSystem) {
        this.#gridSystem = new GridSystem();
    }

    //collision detection if optimized
    if (this.#gridSystem ) {
        this.#controlPoints.forEach((controlPoint) => {
            this.#gridSystem.plotControlPoint(controlPoint);
        });

        // this.#controlPoints.forEach((worldControlPoint) => {
        //     let coordinates = this.#gridSystem.getPrimaryTileCoordinatesForControlPoint(worldControlPoint);
        //     let tileControlPoints = this.#gridSystem.getCurrentControlPointsForTileCoordinates(coordinates);
        //     tileControlPoints.forEach((tileControlPoint) => {
        //         if (
        //             worldControlPoint !== tileControlPoint && 
        //             worldControlPoint.detectCollision(tileControlPoint)
        //         ) {
        //             worldControlPoint.onCollision(tileControlPoint);
        //         }
        //     });
        // });
    }
    //collision detection if not optimized
    else {
        // this.#controlPoints.forEach((firstControlPoint) => {
        //     this.#controlPoints.forEach((secondControlPoint) => {
        //         if (!(firstControlPoint === secondControlPoint)) {
        //             if (firstControlPoint.detectCollision(secondControlPoint)) {
        //                 firstControlPoint.onCollision(secondControlPoint);
        //             }
        //         }
        //     });
        // });
    }

    /*
    * camera-relative control calculations
    */
        let cameraDirection = glMatrix.vec3.create();
        glMatrix.vec3.subtract(
            cameraDirection, 
            vec3FromArray(this.#cameraPosition), 
            vec3FromArray(this.#selected.position)               
        );
        glMatrix.vec3.normalize(cameraDirection, cameraDirection);
        //a subtract operation, then a normalize operation
        //let cameraRight = normalize(cross(this.#upPlottable.position, cameraDirection))
        let cameraRight = glMatrix.vec3.create();
        glMatrix.vec3.cross(cameraRight, vec3FromArray(this.#upPosition), cameraDirection);
        glMatrix.vec3.normalize(cameraRight, cameraRight);
        //a cross operation, then a normalize operation
        let cameraUp = glMatrix.vec3.create();
        glMatrix.vec3.cross(cameraUp, cameraDirection, cameraRight)

    /*
    * end camera-relative control calculations
    */
    let speed = this.#downKeys[18] ? 100 : 10;
    let angularSpeedFactor = 0.1;

    //change this from setting vertex, sign, type from downKeys rather than custom line for each one

    let manupulationType = this.#downKeys[18] ? 'Acceleration' : 'Momentum';
    let angularFunctionName = `changeAngular${manupulationType}`;
    let linearFunctionName = `changeLinear${manupulationType}`;
    if (this.#downKeys[32]) {
        this.#selected.freeze();
    }
    // //a is down
    if (this.#downKeys[65]) {
        if (this.#downKeys[16]) {
            this.#selected[angularFunctionName](cameraUp.map((element) => {
                return element*speed*angularSpeedFactor;
            })); 
        }
        else {
            this.#selected[linearFunctionName](cameraRight.map((element) => {
                return -element*speed;
            }));
        }
    }

    //d is down
    if (this.#downKeys[68]) {
        if (this.#downKeys[16]) {
            this.#selected[angularFunctionName](cameraUp.map((element) => {
                return -element*speed*angularSpeedFactor;
            })); 
        }
        else {
            this.#selected[linearFunctionName](cameraRight.map((element) => {
                return element*speed;
            }));
        }
    }

    // //w
    if (this.#downKeys[87]) {
        if (this.#downKeys[16]) {
            this.#selected[angularFunctionName](cameraRight.map((element) => {
                return element*speed*angularSpeedFactor;
            })); 
        }
        else {
            this.#selected[linearFunctionName](cameraUp.map((element) => {
                return element*speed;
            }));
        }
    }

    // //s
    if (this.#downKeys[83]) {
        if (this.#downKeys[16]) {
            this.#selected[angularFunctionName](cameraRight.map((element) => {
                return -element*speed*angularSpeedFactor;
            })); 
        }
        else {
            this.#selected[linearFunctionName](cameraUp.map((element) => {
                return -element*speed;
            }));
        }
    }
    
    //x
    if (this.#downKeys[88]) {
        if (this.#downKeys[16]) {
            this.#selected[angularFunctionName](cameraDirection.map((element) => {
                return element*speed*angularSpeedFactor;
            })); 
        }
        else {
            this.#selected[linearFunctionName](cameraDirection.map((element) => {
                return element*speed;
            }));
        }
    }
    
    //z
    if (this.#downKeys[90]) {
        if (this.#downKeys[16]) {
            this.#selected[angularFunctionName](cameraDirection.map((element) => {
                return -element*speed*angularSpeedFactor;
            })); 
        }
        else {
            this.#selected[linearFunctionName](cameraDirection.map((element) => {
                return -element*speed;
            }));
        }
    }

    this.#controlPoints.forEach((controlPoint) => {
        if (controlPoint.calculateTrajectory) {
            controlPoint.calculateTrajectory(interval);
        }
    });
    
    this.#controlPoints.forEach((controlPoint) => {
        controlPoint.simulate(interval);
    });

    //only iterate after all other collisions are calculated
    if (this.#gridSystem) {
        this.#gridSystem.iterate();
    }
  }

    draw() {
        let dimensions = getWindowDimensions();
        var canvas = document.getElementById("test-canvas");

        if (canvas) {
            var gl = this.#gl; 
            gl.enable(gl.DEPTH_TEST); // Enable depth testing
            gl.depthFunc(gl.LEQUAL); // Near things obscure far things

            
            gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
            gl.clearDepth(1.0); // Clear everything

            // Clear the canvas before we start drawing on it.
          
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          
            const fieldOfView = (45 * Math.PI) / 180; // in radians
            const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
            const zNear = 0.1;
            const zFar = 1000.0;
            this.#projectionMatrix = glMatrix.mat4.create();
            // note: glmatrix.js always has the first argument
            // as the destination to receive the result.
            glMatrix.mat4.perspective(this.#projectionMatrix, fieldOfView, aspect, zNear, zFar);

            /*
            Camera view
            */

            if (this.#cameraPosition && this.#selected && this.#upPosition) {
                let cameraDirection = glMatrix.vec3.create();
                glMatrix.vec3.subtract(
                    cameraDirection, 
                    vec3FromArray(this.#cameraPosition), 
                    vec3FromArray(this.#selected.position)               
                );
                glMatrix.vec3.normalize(cameraDirection, cameraDirection);
                //a subtract operation, then a normalize operation
                //let cameraRight = normalize(cross(this.#upPlottable.position, cameraDirection))
                let cameraRight = glMatrix.vec3.create();
                glMatrix.vec3.cross(cameraRight, vec3FromArray(this.#upPosition), cameraDirection);
                glMatrix.vec3.normalize(cameraRight, cameraRight);
                //a cross operation, then a normalize operation
                let cameraUp = glMatrix.vec3.create();
                glMatrix.vec3.cross(cameraUp, cameraDirection, cameraRight)
                let lookAtLeft = glMatrix.mat4.fromValues(
                    cameraRight[0], cameraUp[0], cameraDirection[0], 0,
                    cameraRight[1], cameraUp[1], cameraDirection[1], 0,
                    cameraRight[2], cameraUp[2], cameraDirection[2], 0,
                    0, 0, 0, 1
                );

                let lookAtRight = glMatrix.mat4.fromValues(
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    -this.#cameraPosition[0], -this.#cameraPosition[1], -this.#cameraPosition[2], 1
                );

               this.#modelViewMatrix = glMatrix.mat4.create();
               glMatrix.mat4.multiply(this.#modelViewMatrix, lookAtLeft, lookAtRight);

                /*
                End camera view
                */

                this.#drawables.forEach((drawable) => {
                drawable.draw(this);
              }); 
            }
        }
    }
}

export default World;