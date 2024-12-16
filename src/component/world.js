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
    #plottablesToPrimaryTileCoordinates = {};

    addPlottableToTile(plottable, coordinates) {
        let tileContainer = this.#tiles;
        for (let i = 0; i < 3; ++i) {
            if (!tileContainer[coordinates[i]]) {
                tileContainer[coordinates[i]] = {};
            }
            tileContainer = tileContainer[coordinates[i]];
        }
        return tileContainer[plottable.ID] = {
            iteration: this.#iteration,
            plottable
        };
    }

    getPrimaryTileCoordinatesForPlottable(plottable) {
        return this.#plottablesToPrimaryTileCoordinates[plottable.ID];
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

    getCurrentPlottablesForTileCoordinates (coordinates) {
        let tileContainer = this.#tiles;
        for (let i = 0; i < 3; ++i) {
            if (!tileContainer[coordinates[i]]) {
                tileContainer[coordinates[i]] = {};
            }
            tileContainer = tileContainer[coordinates[i]];
        }

        let tileContainerToReturn = {};
        for (let key in tileContainer) {
            //only return the plottables that are of the current iteration
            if (tileContainer[key].iteration === this.#iteration) {
                tileContainerToReturn[key] = tileContainer[key];
            }
            //clean up the plottable otherwise
            else {
                delete tileContainer[key];
            }
        }

        //this array fill can probably be optimized if it's combined with the above
        let arrayToReturn = [];
        for (let key in tileContainerToReturn) {
            arrayToReturn.push(tileContainerToReturn[key].plottable);
        }

        return arrayToReturn;
    }

    cleanPlottablesForTile(coordinates) {
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

    plot(plottable) {
        //get coordinates of tile
        let tileContainer = this.#tiles, tileCoordinates = [];
        for (let i = 0; i < 3; ++i) {
            tileCoordinates[i] = Math.floor(plottable.position[i]/this.#scale);
        }

        //set tile and all adjacent tiles
        for (let i = 0; i < 27; ++i) {
            this.addPlottableToTile(plottable, [
                (i % 3) - 1 + tileCoordinates[0],
                (Math.floor(i/3) % 3) - 1 + tileCoordinates[1],
                (Math.floor(i/9) % 3) - 1 + tileCoordinates[2]
            ]);
        }
        //put the reference to the primary tile into the table
        this.#plottablesToPrimaryTileCoordinates[plottable.ID] = tileCoordinates;
        //return the coordinates of the tile
        return tileCoordinates;
    }

    iterate() {
        ++this.#iteration;
    }
}

class World {
  #currentTime = 0;
  #simulatables = [];
  #drawables = [];
  #controllables = [];
  #selectables = [];
  #plottables = [];
  #cameraPlottable = null;
  #upPlottable = null;
  #selected = null;
  #projectionMatrix = null;
  #gridSystem = null;
  #gl = null;

  get gl () {
    return this.#gl;
  }

  get gridSystem () {
    return this.#gridSystem;
  }

  #modelViewMatrix = null;//glMatrix.mat4.identity();
  #downKeys = {};

    get modelViewMatrix () {
        return glMatrix.mat4.clone(this.#modelViewMatrix);
    }

constructor() {
        this.#cameraPlottable = new Plottable ([0,0,0]);
        this.#upPlottable = new Plottable ([0,1000,0]);

        var canvas = document.getElementById("test-canvas");
        this.#gl = canvas.getContext("webgl", {alpha: false}); 
}

  keyIsUp(keyCode) {
    console.log('key up:',keyCode);
    
    delete this.#downKeys[keyCode];
    //bracket - switch selected
    if (keyCode === 221) {
        let indexOfSelected = this.#selectables.indexOf(this.#selected);
        let indexOfNextSelected = (indexOfSelected + 1) % this.#selectables.length;
        let lastSelected = this.#selected;
        this.#selected = this.#selectables[indexOfNextSelected];
        lastSelected.select(false);
        this.#cameraPlottable.isCamera = false;
        this.#cameraPlottable = lastSelected;
        lastSelected.isCamera = true;
        this.#selected.select(true);
    }

    this.#controllables.forEach((controllable) => {
        controllable.keyIsUp(keyCode);
    });
  }

  keyIsDown(keyCode) {
    console.log('key down:',keyCode);
    this.#downKeys[keyCode] = true;
    this.#controllables.forEach((controllable) => {
        controllable.keyIsDown(keyCode);
    });
  }

  get projectionMatrix() {
    return this.#projectionMatrix;
  }

  addPlottable(plottable) {
    this.#plottables.push(plottable);
  }

  addSimulatable(simulatableToAdd) {
    this.#simulatables.push(simulatableToAdd);
  }

  addDrawable(drawableToAdd) {
    this.#drawables.push(drawableToAdd);
  }

  addControllable(controllableToAdd) {
    this.#controllables.push(controllableToAdd);
  }

  addSelectable(selectable) {
    this.#selectables.push(selectable);
    if (this.#selectables.length === 1) {
        selectable.select(true);
        this.#selected = selectable;
    }
  }

  addDrawableAndSimulatable(drawableAndSimulatableToAdd) {
    this.addSimulatable(drawableAndSimulatableToAdd);
    this.addDrawable(drawableAndSimulatableToAdd);
  }

  simulate() {
    if (!this.#currentTime) {
        this.#currentTime = new Date().getTime();
    }
    let lastTime = this.#currentTime;
    this.#currentTime = new Date().getTime();
    let interval = (this.#currentTime - lastTime)/1000;
    
    if (!this.#gridSystem) {
        this.#gridSystem = new GridSystem();
    }

    //collision detection if optimized
    if (this.#gridSystem ) {
        this.#plottables.forEach((plottable) => {
            this.#gridSystem.plot(plottable);
        });

        this.#plottables.forEach((worldPlottable) => {
            let coordinates = this.#gridSystem.getPrimaryTileCoordinatesForPlottable(worldPlottable);
            let tilePlottables = this.#gridSystem.getCurrentPlottablesForTileCoordinates(coordinates);
            tilePlottables.forEach((tilePlottable) => {
                if (worldPlottable !== tilePlottable && worldPlottable.detectCollision(tilePlottable)) {
                    worldPlottable.onCollision(tilePlottable);
                }
            });
        });
    }
    //collision detection if not optimized
    else {
        this.#plottables.forEach((firstPlottable) => {
            this.#plottables.forEach((secondPlottable) => {
                if (!(firstPlottable === secondPlottable)) {
                    if (firstPlottable.detectCollision(secondPlottable)) {
                        firstPlottable.onCollision(secondPlottable);
                    }
                }
            });
        });
    }

    /*
    * camera-relative control calculations
    */
        let cameraPosition = this.#cameraPlottable.position;
        let cameraDirection = glMatrix.vec3.create();
        glMatrix.vec3.subtract(
            cameraDirection, 
            vec3FromArray(this.#cameraPlottable.position), 
            vec3FromArray(this.#selected.position)               
        );
        glMatrix.vec3.normalize(cameraDirection, cameraDirection);
        //a subtract operation, then a normalize operation
        //let cameraRight = normalize(cross(this.#upPlottable.position, cameraDirection))
        let cameraRight = glMatrix.vec3.create();
        glMatrix.vec3.cross(cameraRight, vec3FromArray(this.#upPlottable.position), cameraDirection);
        glMatrix.vec3.normalize(cameraRight, cameraRight);
        //a cross operation, then a normalize operation
        let cameraUp = glMatrix.vec3.create();
        glMatrix.vec3.cross(cameraUp, cameraDirection, cameraRight)

    /*
    * end camera-relative control calculations
    */
    let speed = this.#downKeys[18] ? 100 : 5;

    //change this from setting vertex, sign, type from downKeys rather than custom line for each one

    let manupulationType = this.#downKeys[18] ? 'Acceleration' : 'Momentum';
    let angularFunctionName = `changeAngular${manupulationType}`;
    let linearFunctionName = `changeLinear${manupulationType}`;
    if (this.#downKeys[32]) {
        this.#selected.positionPoint.freeze();
    }
    // //a is down
    if (this.#downKeys[65]) {
        if (this.#downKeys[16]) {
            this.#selected.positionPoint[angularFunctionName](cameraUp.map((element) => {
                return element*speed;
            })); 
        }
        else {
            this.#selected.positionPoint[linearFunctionName](cameraRight.map((element) => {
                return -element*speed;
            }));
        }
    }

    //d is down
    if (this.#downKeys[68]) {
        if (this.#downKeys[16]) {
            this.#selected.positionPoint[angularFunctionName](cameraUp.map((element) => {
                return -element*speed;
            })); 
        }
        else {
            this.#selected.positionPoint[linearFunctionName](cameraRight.map((element) => {
                return element*speed;
            }));
        }
    }

    // //w
    if (this.#downKeys[87]) {
        if (this.#downKeys[16]) {
            this.#selected.positionPoint[angularFunctionName](cameraRight.map((element) => {
                return element*speed;
            })); 
        }
        else {
            this.#selected.positionPoint[linearFunctionName](cameraUp.map((element) => {
                return element*speed;
            }));
        }
    }

    // //s
    if (this.#downKeys[83]) {
        if (this.#downKeys[16]) {
            this.#selected.positionPoint[angularFunctionName](cameraRight.map((element) => {
                return -element*speed;
            })); 
        }
        else {
            this.#selected.positionPoint[linearFunctionName](cameraUp.map((element) => {
                return -element*speed;
            }));
        }
    }
    
    //x
    if (this.#downKeys[88]) {
        if (this.#downKeys[16]) {
            this.#selected.positionPoint[angularFunctionName](cameraDirection.map((element) => {
                return element*speed;
            })); 
        }
        else {
            this.#selected.positionPoint[linearFunctionName](cameraDirection.map((element) => {
                return element*speed;
            }));
        }
    }
    
    //z
    if (this.#downKeys[90]) {
        if (this.#downKeys[16]) {
            this.#selected.positionPoint[angularFunctionName](cameraDirection.map((element) => {
                return -element*speed;
            })); 
        }
        else {
            this.#selected.positionPoint[linearFunctionName](cameraDirection.map((element) => {
                return -element*speed;
            }));
        }
    }

    this.#simulatables.forEach((simulatable) => {
        simulatable.simulate(this, this.#currentTime);
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

            // gl.enable( gl.BLEND );
            // gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
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

            if (this.#cameraPlottable && this.#selected && this.#upPlottable) {
                let cameraPosition = this.#cameraPlottable.position;
                let cameraDirection = glMatrix.vec3.create();
                glMatrix.vec3.subtract(
                    cameraDirection, 
                    vec3FromArray(this.#cameraPlottable.position), 
                    vec3FromArray(this.#selected.position)               
                );
                glMatrix.vec3.normalize(cameraDirection, cameraDirection);
                //a subtract operation, then a normalize operation
                //let cameraRight = normalize(cross(this.#upPlottable.position, cameraDirection))
                let cameraRight = glMatrix.vec3.create();
                glMatrix.vec3.cross(cameraRight, vec3FromArray(this.#upPlottable.position), cameraDirection);
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
                /* lookatleft = 
                * [ cameraRight, 0 ]
                * [ cameraUp, 0 ]
                * [ cameraDirection, 0 ]
                * [ 0, 0, 0, 1 ]
                */
                let lookAtRight = glMatrix.mat4.fromValues(
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    -cameraPosition[0], -cameraPosition[1], -cameraPosition[2], 1
                );
                /* lookAtRight = 
                * [ 1, 0, 0, -cameraPosition[0] ]
                * [ 0, 1, 0, -cameraPosition[1] ]
                * [ 0, 0, 1, -cameraPosition[2] ]
                * [ 0, 0, 0, 1 ]
                */
               this.#modelViewMatrix = glMatrix.mat4.create();
               glMatrix.mat4.multiply(this.#modelViewMatrix, lookAtLeft, lookAtRight);
            }

            /*
            End camera view
            */

            this.#drawables.forEach((drawable) => {
              drawable.draw(this);
            }); 
        }
    }
}

export default World;