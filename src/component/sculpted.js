import * as glMatrix from 'gl-matrix';
import SimpleDrawDelegate from './simple-draw-delegate';

//3 floats position per vertex, 4 float colors per vertex, 3 indices per triangle

class Sculpted {
  #lastTime = 0;
  #momentum = [0,0,0];
  #collisionMomentum = [0,0,0];

  #YAxisRotationsPerSecond = 0;
  #XAxisRotationsPerSecond = 0;
  #ZAxisRotationsPerSecond = 0;
  #selected = false;    
  #ID = null;
  #speed = 5;
  #isCamera = false;
  #drawDelegate = null;

  changeMomentum (momentum) {
    for (let i = 0; i < 3; ++i) {
        this.#momentum[i] += momentum[i];
    }
  }

  set isCamera (isCamera) {
    this.#isCamera = isCamera;
  }

  get ID () {
    return this.#ID;
  }

  get broadCollisionRadius () {
    return 1.2;
  }

  constructor(world) {
    this.#world = world;
    this.#ID = `${new Date().getTime()}${Math.round(Math.random()*10000)}`;


const positions = [
  // Front face
  -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
  
  // Back face
  -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
  
  // Top face
  -1.0, 1.0, -1.0, -1.0, 3.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
  
  // Bottom face
  -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
  
  // Right face
  1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
  
  // Left face
  -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
  ];
  
  const indices = [
      0,
      1,
      2,
      0,
      2,
      3, // front
      4,
      5,
      6,
      4,
      6,
      7, // back
      8,
      9,
      10,
      8,
      10,
      11, // top
      12,
      13,
      14,
      12,
      14,
      15, // bottom
      16,
      17,
      18,
      16,
      18,
      19, // right
      20,
      21,
      22,
      20,
      22,
      23, // left
  ];
  
  const faceColors = [
  [1.0, 1.0, 1.0, 1.0], // Front face: white
  [1.0, 0.0, 0.0, 1.0], // Back face: red
  [0.0, 1.0, 0.0, 1.0], // Top face: green
  [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
  [1.0, 1.0, 0.0, 1.0], // Right face: yellow
  [1.0, 0.0, 1.0, 1.0], // Left face: purple
  ];


  let colors = [];

  for (var j = 0; j < faceColors.length; ++j) {
      const c = faceColors[j];
      // Repeat each color four times for the four vertices of the face
      colors = colors.concat(c, c, c, c);
  }// Convert the array of colors into a table for all the vertices.


    this.#drawDelegate = new SimpleDrawDelegate(this.#world, positions, colors, indices);
  }

    #downKeys = {};

    detectCollision(otherPlottable) {
        let distance = Math.pow(
            Math.pow(otherPlottable.position[0] - this.position[0], 2) +
            Math.pow(otherPlottable.position[1] - this.position[1], 2) +
            Math.pow(otherPlottable.position[2] - this.position[2], 2)
        ,0.5);
        
        let minimumDistance = otherPlottable.broadCollisionRadius + this.broadCollisionRadius;

        return distance <= minimumDistance;
    }

    onCollision(otherPlottable) {
        //calculate magnitude of momentum
        let combinedMomentum = [], magnitudeOfCombinedMomentum = 0;
        for (let i = 0; i < 3; ++i) {
            combinedMomentum[i] = otherPlottable.#momentum[i] - this.#momentum[i];
            magnitudeOfCombinedMomentum += Math.pow(combinedMomentum[i],2);
        }
        magnitudeOfCombinedMomentum = Math.pow(magnitudeOfCombinedMomentum,0.5);
        //divide it in two

        //go in opposite direction of collision
        let relativePositionOfOther = [], distanceFromOther = 0;
        for (let i = 0; i < 3; ++i) {
            relativePositionOfOther[i] = otherPlottable.#position[i] - this.#position[i];
            distanceFromOther += Math.pow(relativePositionOfOther[i], 2);
        }
        distanceFromOther = Math.pow(distanceFromOther, 0.5);

        //make it a vector of length 1
        let normalizedPositionOfOther = relativePositionOfOther.map((relativePosition) => {
            return relativePosition / distanceFromOther; 
        });

        //go away from the direction of the other with the magnitude of half the combined momentum
        for (let i = 0; i < 3; ++i) {
            this.#collisionMomentum[i] -= normalizedPositionOfOther[i] * magnitudeOfCombinedMomentum / 2;
        }
    }

    select(selected) {
        console.log("select at cube");
        this.#selected = selected;
    }

    keyIsDown(keyCode) {
        this.#downKeys[keyCode] = true;
    }

    keyIsUp(keyCode) {
        this.#downKeys[keyCode] = false;
    }

  #position = [0,0,0];

  get position() {
    return this.#position;
  }

  set position(position) {
    this.#position = position;
  }

  #programInfo = null;
  #world = null;
  #XAngle = 0;
  #YAngle = 0;
  #buffers = null;

  simulate(world, thisTime) {
    if (this.#lastTime) {
      let interval = thisTime - this.#lastTime;

        if (this.#selected) {

            //right arrow
            if (this.#downKeys[39]) {
                this.#momentum[0] += this.#speed * interval / 20;
            }

            //up arrow
            if (this.#downKeys[38]) {
                if (this.#downKeys[16]) {
                    this.#momentum[2] += this.#speed * interval / 20;
                }
                else {
                    this.#momentum[1] += this.#speed * interval / 20;
                }
            }

            //down arrow
            if (this.#downKeys[40]) {         
                if (this.#downKeys[16]) {
                    this.#momentum[2] -= this.#speed * interval / 20;
                }
                else {
                    this.#momentum[1] -= this.#speed * interval / 20;
                }
            }

            //left arrow
            if (this.#downKeys[37]) {
                this.#momentum[0] -= this.#speed * interval / 20;
            }
        }

        this.#XAxisRotationsPerSecond *= Math.pow(0.9,this.#speed * interval/100);
        this.#YAxisRotationsPerSecond *= Math.pow(0.9,this.#speed * interval/100);

        //factor in the momentum change due to collision
        for (let i = 0; i < 3; ++i) {
            this.#momentum[i] += this.#collisionMomentum[i];
            this.#collisionMomentum[i] = 0;
        }

        this.#momentum = this.#momentum.map((momentum) => {
            return momentum * Math.pow(0.9,interval/100);
        })

        this.#YAngle += this.#YAxisRotationsPerSecond/interval;
        this.#XAngle += this.#XAxisRotationsPerSecond/interval;

        for (let i = 0; i < 3; ++i) {
            this.#position[i] += this.#momentum[i]/interval;
        }
    }

    this.#lastTime = thisTime;
  }

  draw() {
    if (this.#isCamera) {
        return;
    }
    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    // const modelViewMatrix = glMatrix.mat4.create();
    const modelViewMatrix = this.#world.modelViewMatrix;
  
    // Now move the drawing position a bit to where we want to
    // start drawing the square.
    glMatrix.mat4.translate(
      modelViewMatrix, // destination matrix
      modelViewMatrix, // matrix to translate
      this.#position,
    ); // amount to translate

    // glMatrix.mat4.rotate(
    //   modelViewMatrix, // destination matrix
    //   modelViewMatrix, // matrix to rotate
    //   this.#angle, // amount to rotate in radians
    //   [0, 0, 1],
    // );

    glMatrix.mat4.rotate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        this.#YAngle, // amount to rotate in radians
        [0, 1, 0],
    );

    glMatrix.mat4.rotate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        this.#XAngle, // amount to rotate in radians
        [1, 0, 0],
    );

    this.#drawDelegate.draw(glMatrix.mat4.clone(modelViewMatrix));
  }
}

export default Sculpted;