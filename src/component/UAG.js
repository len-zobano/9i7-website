import { useState, useEffect } from 'react';
import * as glMatrix from 'gl-matrix';
import RainbowCube from './rainbow-cube';
import World from './world';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';

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


function Canvas(props) {
  const { height, width } = useWindowDimensions();
  return <canvas id="test-canvas" width={width} height={height}></canvas>;
}

//not the right way to run a one-time init function, but I don't know the React way yet
let didInit = false;

function UAGComponent() {
    let cube = new RainbowCube();
    cube.position = [0,0,-24];

    let cube2 = new RainbowCube();
    cube2.position = [1,1,-20];

    let world = new World();
    world.addDrawableAndSimulatable(cube);
    world.addControllable(cube);
    world.addSelectable(cube);
    world.addDrawableAndSimulatable(cube2);
    world.addControllable(cube2);
    world.addSelectable(cube2);
    
    document.addEventListener('keydown', function(event) {
      world.keyIsDown(event.keyCode);
    });

    document.addEventListener('keyup', function(event) {
      world.keyIsUp(event.keyCode);
    });

    function animate () {    
        if (!world.gl) {
            world.initializeGL();
        }

        world.simulate();
        world.draw();

        window.requestAnimationFrame(animate);
    }

    animate();

  return (
    <Canvas/>
  );
}

export default UAGComponent;
