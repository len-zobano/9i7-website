import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';

class ParticleWorld {
  #particles = [];
  #currentTime = 0;

  setTime(time) {
    this.#currentTime = time;
  }

  addParticle(particle) {
    this.#particles.push(particle);
  }

  simulate(time) {
    if (!time) {
      time = this.#currentTime + 33;
    }
    let interval = (time - this.#currentTime)/1000;

    this.#particles.forEach((particleA) => {
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
  #dimensions = 2;
  #position = [];
  #velocity = [];
  #repulsion = 1;
  #gravity = 1;
  color = "white";
  anchor = false;

  constructor(repulsion, gravity) {
    this.#repulsion = repulsion || 1;
    this.#gravity = gravity || 1;
    this.#dimensions = 2;

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

      for (let i = 0; i < this.#dimensions; ++i) {
        //calculate based on other particle's gravity
        this.#velocity[i] += (time*otherParticle.#gravity/(distanceSquared+1)) * (otherParticle.#position[i] - this.#position[i]);
        //calculate based on other particle's repulsion
        this.#velocity[i] += (time*otherParticle.#repulsion/(4*distanceSquared)) * (-otherParticle.#position[i] + this.#position[i]);
        //calculate loss
        this.#velocity[i] -= time*this.velocity[i]*0.05;
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
      radius: 5,
      fill: this.color
    };

    let velocityCircle = {
      x: (this.#position[0] + this.#velocity[0])*dimensions.height/2 + dimensions.width/2,
      y: (1 + this.#position[1] + this.#velocity[1])*dimensions.height/2,
      radius: 2,
      fill: 'red'
    };

    var canvas = document.getElementById("test-canvas");
    if (canvas) {
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
  return <canvas id="test-canvas" width={width} height={height}></canvas>;
}

//not the right way to run a one-time init function, but I don't know the React way yet
let didInit = false;

function test (e) {
  console.log('mouse moved ',e);
}

function App() {

  if (!didInit) {
    didInit = true;

    let world = new ParticleWorld();
    world.setTime(new Date().getTime());
    
    for (let i = 0; i < 200; ++i) {
      let seedX = Math.random(), seedY = Math.random();

      let particle = new Particle(3,1);
      particle.position = [seedX*2-1,seedY*2-1];

      particle.color = `rgb(${ Math.round(seedX*255) },127,${ Math.round(seedY*255) })`;

      world.addParticle(particle);
    }

    let anchorParticle = new Particle(50,50);
    anchorParticle.position = [0,0];
    // anchorParticle.color = "red";
    anchorParticle.anchor = true;
    world.addParticle(anchorParticle);
    
    document.addEventListener('mousemove', (e) => {
      let dimensions = getWindowDimensions();
      let xFromEvent = 2*e.clientX/dimensions.height - dimensions.width/dimensions.height,
      yFromEvent = 2*e.clientY/dimensions.height - 1;

      anchorParticle.position = [xFromEvent, yFromEvent];
      console.log('mouse move',e,anchorParticle.position);
    });

    document.addEventListener('mousedown', () => {
      anchorParticle.gravity = 200;
    });

    document.addEventListener('mouseup', () => {
      anchorParticle.gravity = 50;
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

export default App;
