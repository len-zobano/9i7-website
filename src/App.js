import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';

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
