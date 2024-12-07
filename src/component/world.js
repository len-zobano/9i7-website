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
  #modelViewMatrix = null;//glMatrix.mat4.identity();

    get modelViewMatrix () {
        return glMatrix.mat4.clone(this.#modelViewMatrix);
    }

  keyIsUp(keyCode) {
    console.log('key up:',keyCode);
    
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

  setTime(time) {
    this.#currentTime = time;
  }

  initializeGL() {
    var canvas = document.getElementById("test-canvas");
    if (!canvas) return;
    this.gl = canvas.getContext("webgl"); 
    //initialize each drawable
    this.#drawables.forEach((drawable) => {
      drawable.initializeGL(this);
    });
  }

  simulate() {
    let thisTime = new Date().getTime();
    
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

        this.#gridSystem.iterate();
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

    this.#simulatables.forEach((simulatable) => {
      simulatable.simulate(this, thisTime);
    });
  }

    draw() {
        let dimensions = getWindowDimensions();
        var canvas = document.getElementById("test-canvas");

        if (canvas) {
            var gl = canvas.getContext("webgl"); 

            gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
            gl.clearDepth(1.0); // Clear everything
            gl.enable(gl.DEPTH_TEST); // Enable depth testing
            gl.depthFunc(gl.LEQUAL); // Near things obscure far things
          
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

            function vec3FromArray(a) {
                return glMatrix.vec3.fromValues(a[0],a[1],a[2]);
            }

            /*
            Camera view
            */

            if (!this.#cameraPlottable) {
                this.#cameraPlottable = new Plottable ([50,50,50]);
            }

            if (!this.#upPlottable) {
                this.#upPlottable = new Plottable ([0,1000,0]);
            }

            if (this.#cameraPlottable && this.#selected && this.#upPlottable) {
                //let cameraPosition = this.#cameraPlottable.position
                let cameraPosition = this.#cameraPlottable.position;
                //let cameraDirection = normalize(this.#cameraPlottable.position - this.#focalPointPlottable.position)
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