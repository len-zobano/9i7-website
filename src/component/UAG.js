import { useState, useEffect } from 'react';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';

class ParticleWorld {
  draw() {

    let dimensions = getWindowDimensions();

    var canvas = document.getElementById("test-canvas");
    if (canvas) {
      var ctx = canvas.getContext("2d"); 
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    }
  }
}

class Character {
  draw() {
    let dimensions = getWindowDimensions();

    var canvas = document.getElementById("test-canvas");
        var ctx = canvas.getContext("2d"); 
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI, false);
        if (circle.fill) {
        ctx.fillStyle = circle.fill;
        ctx.fill();
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

function UAG() {
    
    // document.addEventListener('mousemove', (e) => {
    //   let dimensions = getWindowDimensions();
    //   let xFromEvent = 2*e.clientX/dimensions.height - dimensions.width/dimensions.height,
    //   yFromEvent = 2*e.clientY/dimensions.height - 1;

    //   anchorParticle.position = [xFromEvent, yFromEvent, 0];
    //   console.log('mouse move',e,anchorParticle.position);
    // });

    // document.addEventListener('mousedown', () => {
    //   anchorParticle.repulsion = 100;
    //   anchorParticle.gravity = 0;
    // });

    // document.addEventListener('mouseup', () => {
    //   anchorParticle.repulsion = 1;
    //   anchorParticle.gravity = 100;
    // });

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
