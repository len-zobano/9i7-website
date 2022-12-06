import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';

class ParticleWorld {
  #particles = [];
}

class Particle {
  #dimensions = 2;
  #position = [];
  #velocity = [];
  #repulsion = 1;
  #gravity = 1;

  constructor (repulsion, gravity) {
    this.repulsion = repulsion;
    this.gravity = gravity;
    this.position = new Array (this.dimensions);
  }

  constructor (repulsion, gravity, dimensions) {
    this.repulsion = repulsion;
    this.gravity = gravity;
    this.dimensions = dimensions;
    this.position = new Array (this.dimensions);
  }

  set position (arr) {
    if (arr.length === this.dimensions) {
      this.position = arr.slice(0);
    }
  }

  get position () {
    return this.position.slice(0);
  }

  set velocity (arr) {
    if (arr.length === this.dimensions) { 
      this.velocity = arr.slice(0);
    }
  }

  get velocity () {
    return this.velocity.slice(0);
  }

  get repulsion () {
    return this.repulsion;
  }

  get gravity () {
    return this.gravity;
  }

  calculateEffect (otherParticle, time) {
    for (let i = 0; i < this.dimensions; ++i) {
      //calculate based on other particle's gravity
      this.velocity[i] += time*otherParticle.gravity/(1+Math.pow((otherParticle.position[i] - this.position[i]), 2));
      //calculate based on other particle's repulsion
      this.velocity[i] += -time*otherParticle.repulsion/Math.pow((otherParticle.position[i] - this.position[i]), 2);
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

function drawCircle(ctx) {
  var canvas = document.getElementById("test-canvas");
  if (canvas) {
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, circle.x*2, circle.y*2);
    ctx.beginPath()
    ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI, false)
    if (circle.fill) {
      ctx.fillStyle = circle.fill
      ctx.fill()
    }
    if (circle.stroke) {
      ctx.lineWidth = circle.strokeWidth
      ctx.strokeStyle = circle.stroke
      ctx.stroke()
    }
  }
}

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

  let startTime = new Date().getTime();

  let dimensions = getWindowDimensions();

  circle.x = dimensions.width/2;
  circle.y = dimensions.height/2;

  function animate () {
    let duration = new Date().getTime() - startTime;
    let phase = 0.5 + Math.sin(duration/500)/2;

    circle.radius = 100 + phase * 30;
    drawCircle();

    window.requestAnimationFrame(animate);
  }

  animate();

  const { height, width } = useWindowDimensions();

  return (
    <Canvas/>
  );
}

export default App;
