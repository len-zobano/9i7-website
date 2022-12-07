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
    let interval = time - this.#currentTime;

    this.#particles.forEach((particleA) => {
      this.#particles.forEach((particleB) => {
        particleA.calculateEffect(particleB, interval);
      });

      particleA.calculatePosition(interval);
    });

    this.#currentTime = time;
  }

  draw() {
    var canvas = document.getElementById("test-canvas");
    if (canvas) {
      console.log('drawing world');
      var ctx = canvas.getContext("2d"); 
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, 500, 500);

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

  constructor() {
    this.#repulsion = 1;
    this.#gravity = 1;
    this.#dimensions = 2;
    this.#position = new Array (this.#dimensions);
  }

  // constructor (repulsion, gravity) {
  //   this.#repulsion = repulsion;
  //   this.#gravity = gravity;
  //   this.#dimensions = 2;
  //   this.#position = new Array (this.#dimensions);
  // }

  // constructor (repulsion, gravity, dimensions) {
  //   this.#repulsion = repulsion;
  //   this.#gravity = gravity;
  //   this.#dimensions = dimensions;
  //   this.#position = new Array (this.#dimensions);
  // }

  set position (arr) {

    console.log('setting position with',arr);
    if (arr.length === this.#dimensions) {
      this.#position = arr.slice(0);
    }
    console.log('position:',this.#position);
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

  calculateEffect (otherParticle, time) {
    for (let i = 0; i < this.#dimensions; ++i) {
      //calculate based on other particle's gravity
      this.#velocity[i] += time*otherParticle.#gravity/(1+Math.pow((otherParticle.#position[i] - this.#position[i]), 2));
      //calculate based on other particle's repulsion
      this.#velocity[i] += -time*otherParticle.#repulsion/Math.pow((otherParticle.#position[i] - this.#position[i]), 2);
    }
  }

  calculatePosition (time) {
    for (let i = 0; i < this.#dimensions; ++i) {
      //calculate position 
      this.#position[i] += time*this.#velocity[i];
    } 
  }

  draw() {
    let viewportSize = [500, 500];

    let circle = {
      x: (1 + this.#position[0])*250,
      y: (1 + this.#position[1])*250,
      radius: 10,
      fill: "#ffff00"
    };

    console.log('drawing circle',circle,'with position',this.#position);

    var canvas = document.getElementById("test-canvas");
    if (canvas) {
      var ctx = canvas.getContext("2d"); 

      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI, false);
      if (circle.fill) {
        ctx.fillStyle = circle.fill;
        ctx.fill();
      }
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
      console.log("dimensions: ",getWindowDimensions());

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

function App() {
  let dimensions = getWindowDimensions();

  let world = new ParticleWorld();
  world.setTime(new Date().getTime());
  let particle = new Particle();
  particle.position = [0,0];

  world.addParticle(particle);

  function animate () {    
    // world.simulate(new Date().getTime());
    world.draw();

    window.requestAnimationFrame(animate);
  }

  animate();

  const { height, width } = useWindowDimensions();

  return (
    <Canvas/>
  );
}

export default App;
