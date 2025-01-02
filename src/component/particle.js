import { useState, useEffect } from 'react';
import engineMath from '../utility/engine-math';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';

class ParticleWorld {
  #particles = [];
  #currentTime = 0;
  #gravityVector = [0,0,0];

  setTime(time) {
    this.#currentTime = time;
  }

  addParticle(particle) {
    this.#particles.push(particle);
  }

  simulate(time) {
    if (!time) {
      time = new Date().getTime();
    }
    let interval = (time - this.#currentTime)/5000;

    this.#particles.forEach((particleA) => {

      particleA.calculateGravityVector(this.#gravityVector, interval);
      
      this.#particles.forEach((particleB) => {
        if (particleA !== particleB) {
          particleA.calculateEffect(particleB, interval);
        }
      });

      particleA.calculatePosition(interval);
    });

    this.#currentTime = time;
  }

  draw() {

    let dimensions = getWindowDimensions();

    var canvas = document.getElementById("test-canvas");
    if (canvas) {
      var ctx = canvas.getContext("2d"); 
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      this.#particles.forEach((particle) => {
        particle.draw();
      });
    }
  }
}

class Particle {
  #dimensions = 3;
  #position = [];
  #velocity = [];
  #repulsion = 1;
  #gravity = 1;
  color = "white";
  anchor = false;

  constructor(repulsion, gravity) {
    this.#repulsion = repulsion || 1;
    this.#gravity = gravity || 1;

    for (let i = 0; i < this.#dimensions; ++i) {
      this.#position[i] = 0;
      this.#velocity[i] = 0;
    }
  }

  // constructor (repulsion, gravity, dimensions) {
  //   this.#repulsion = repulsion;
  //   this.#gravity = gravity;
  //   this.#dimensions = dimensions;
  //   this.#position = new Array (this.#dimensions);
  // }

  set position (arr) {
    if (arr.length === this.#dimensions) {
      this.#position = arr.slice(0);
    }
  }

  get position () {
    return this.#position.slice(0);
  }

  set velocity (arr) {
    if (arr.length === this.#dimensions) { 
      this.#velocity = arr.slice(0);
    }
  }

  get velocity () {
    return this.#velocity.slice(0);
  }

  get repulsion () {
    return this.#repulsion;
  }

  set repulsion (repulsion) {
    this.#repulsion = repulsion;
  }

  get gravity () {
    return this.#gravity;
  }

  set gravity (gravity) {
    this.#gravity = gravity;
  }
  
  calculateEffect (otherParticle, time) {
    if (!this.anchor) {
      let distanceSquared = 0;
      for (let i = 0; i < this.#dimensions; ++i) {
        distanceSquared += Math.pow((otherParticle.#position[i] - this.#position[i]),2);
      }

      let distance = Math.pow(distanceSquared, 0.5);
      let normal = [];
      for (let i = 0; i < this.#dimensions; ++i) {
        normal[i] = (otherParticle.#position[i] - this.#position[i])/distance;
      }

      let repulsionDistance = 0.1;

      for (let i = 0; i < this.#dimensions; ++i) {
        //calculate based on other particle's gravity
        if (otherParticle.#gravity > 0) {
          this.#velocity[i] += (time*otherParticle.#gravity/(distanceSquared+1)) * (normal[i]);
        }
        //calculate based on other particle's repulsion
        let repulsionBuffer = 0.01;
        if (otherParticle.#repulsion > 0 && distanceSquared < repulsionDistance) {
          // this.#velocity[i] += (repulsionDistance - distance)*otherParticle.#repulsion*(-normal[i]);
          this.#velocity[i] += (time*(otherParticle.#repulsion/(distanceSquared + repulsionBuffer) - otherParticle.#repulsion/(repulsionDistance + repulsionBuffer))) * (-normal[i]);
        }
        //calculate loss
        this.#velocity[i] -= time*this.velocity[i]*0.03;
      }
    }
  }

  calculateGravityVector (vector, time) {
    if (!this.anchor) {
      for (let i = 0; i < this.#dimensions; ++i) {
        this.#velocity[i] += time*vector[i];
      } 
    }
  }

  calculatePosition (time) {
    if (!this.anchor) {
      for (let i = 0; i < this.#dimensions; ++i) {
        //calculate position 
        this.#position[i] += time*this.#velocity[i];
      } 
    }
  }

  draw() {
    let dimensions = getWindowDimensions();

    let circle = {
      x: (this.#position[0])*dimensions.height/2 + dimensions.width/2,
      y: (1 + this.#position[1])*dimensions.height/2,
      radius: 3/(this.#position[2]+1),
      fill: this.color
    };

    let velocityCircle = {
      x: (this.#position[0] + this.#velocity[0])*dimensions.height/2 + dimensions.width/2,
      y: (1 + this.#position[1] + this.#velocity[1])*dimensions.height/2,
      radius: 2,
      fill: 'red'
    };

    var canvas = document.getElementById("test-canvas");
    if (canvas && circle.radius > 0) {
      var ctx = canvas.getContext("2d"); 

      // ctx.beginPath();
      // ctx.strokeStyle = 'rgb(127,0,0)';
      // ctx.moveTo(circle.x, circle.y);
      // ctx.lineTo(velocityCircle.x, velocityCircle.y);
      // ctx.stroke();

      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI, false);
      if (circle.fill) {
        ctx.fillStyle = circle.fill;
        ctx.fill();
      }

      // ctx.beginPath();
      // ctx.arc(velocityCircle.x, velocityCircle.y, velocityCircle.radius, 0, 2 * Math.PI, false);
      // if (velocityCircle.fill) {
      //   ctx.fillStyle = velocityCircle.fill;
      //   ctx.fill();
      // }
    }


  }
}

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

let circle = {
  x: 0,
  y: 0,
  radius: 0,
  fill: "#ffff00",
  stroke: "black",
  strokeWidth: 0
};

function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {

      let dimensions = getWindowDimensions();

      circle.x = dimensions.width/2;
      circle.y = dimensions.height/2;
      // drawCircle(ctx, dimensions.width/2, dimensions.height/2, 100, "#ffff00","black",0);
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}


function Canvas(props) {
  const { height, width } = useWindowDimensions();
  return <canvas id="test-canvas" width={width} height={height} style="backgrond: red"></canvas>;
}

//not the right way to run a one-time init function, but I don't know the React way yet
let didInit = false;

function ParticleComponent() {

  if (!didInit) {
    didInit = true;

    let world = new ParticleWorld();
    world.setTime(new Date().getTime());
    
    for (let i = 0; i < 200; ++i) {
      let seedX = Math.random(), seedY = Math.random(), seedZ = Math.random();

      let particle = new Particle(1,1);
      particle.position = [seedX*2-1,seedY*2-1,seedZ*2-1];

      particle.color = `rgb(${ Math.round(seedX*255) },127,${ Math.round(seedY*255) })`;

      world.addParticle(particle);
    }

    let anchorParticle = new Particle(1,100);
    anchorParticle.position = [0,0,0];
    // anchorParticle.color = "red";
    anchorParticle.anchor = true;
    world.addParticle(anchorParticle);
    
    document.addEventListener('mousemove', (e) => {
      let dimensions = getWindowDimensions();
      let xFromEvent = 2*e.clientX/dimensions.height - dimensions.width/dimensions.height,
      yFromEvent = 2*e.clientY/dimensions.height - 1;

      anchorParticle.position = [xFromEvent, yFromEvent, 0];
      console.log('mouse move',e,anchorParticle.position);
    });

    document.addEventListener('mousedown', () => {
      anchorParticle.repulsion = 100;
      anchorParticle.gravity = 0;
    });

    document.addEventListener('mouseup', () => {
      anchorParticle.repulsion = 1;
      anchorParticle.gravity = 100;
    });

    function animate () {    
      world.simulate();
      world.draw();
    
      window.requestAnimationFrame(animate);
    }
    
    animate();
  }

  return (
    <Canvas/>
  );
}

export default ParticleComponent;
