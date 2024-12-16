import { useState, useEffect } from 'react';
import * as glMatrix from 'gl-matrix';
import RainbowCube from './rainbow-cube';
import World from './world';
import Sculpted from './sculpted';
import SpheroidDrop from './spheroid-drop'

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
  return <canvas id="test-canvas" width={width} height={height} style={{background: 'red'}}></canvas>;
}

//not the right way to run a one-time init function, but I don't know the React way yet
let didInit = false;

function UAGComponent() {

    let world = null;

    function initializeWorld() {
      world = new World();

      let cubeSize = 2;
      let distance = 2;
      let cubes = [];

      let spheroids = [
        new SpheroidDrop(world),
        new SpheroidDrop(world),
        new SpheroidDrop(world)
      ];

      spheroids[0].position = [0,0,-50];
      spheroids[1].position = [0,10,-50];
      spheroids[2].position = [10,0,-50];

      for (let i = 0; i < spheroids.length; ++i) {
        world.addDrawableAndSimulatable(spheroids[i]);
        world.addControllable(spheroids[i]);
        world.addSelectable(spheroids[i]);
        world.addPlottable(spheroids[i]);

        if (i === 0 || spheroids.length > 2) {
          spheroids[i].positionPoint.bondTo(spheroids[(i+1)%spheroids.length].positionPoint);
        }
      }

      // for (let i = 0; i < 2; ++i) {
      //   let cube = new SpheroidDrop(world);
      //   cubes[i] = cube;
      //   cube.position = [
      //     (i%cubeSize)*distance,
      //     ((Math.floor(i/(cubeSize)))%cubeSize)*distance,
      //     ((Math.floor(i/(cubeSize*cubeSize)))%cubeSize)*distance-10
      //   ];
  
      //   world.addDrawableAndSimulatable(cube);
      //   world.addControllable(cube);
      //   world.addSelectable(cube);
      //   world.addPlottable(cube);

      //   if (i > 0) {
      //     cube.positionPoint.bondTo(cubes[i-1].positionPoint);
      //   }
      // }
    }

    let ID = Math.floor(1000000*Math.random());
    // let cube2 = new RainbowCube();
    // cube2.position = [1,1,-20];
    
    document.addEventListener('keydown', function(event) {
      world.keyIsDown(event.keyCode);
    });

    document.addEventListener('keyup', function(event) {
      world.keyIsUp(event.keyCode);
    });

    let 
      lastStatTime = 0, 
      simulateTime = 0, 
      drawTime = 0, 
      doneTime = 0,
      averageSimulationDuration = 0,
      averageDrawDuration = 0,
      iterationsSinceStat = 0;

    function animate () {   

        if (!world) {
          if (document.getElementById("test-canvas")) {
            initializeWorld();
          }
        }
        else {
          simulateTime = new Date().getTime(); 
          world.simulate();
          drawTime = new Date().getTime();
          world.draw();
          doneTime = new Date().getTime();

          averageSimulationDuration += drawTime - simulateTime;
          averageDrawDuration += doneTime - drawTime;
          ++iterationsSinceStat;

          if (doneTime - lastStatTime > 1000) {
            console.log(`
            Stats for instance of world execution:
            ID: ${ID}
            Simulation took an average of ${averageSimulationDuration / iterationsSinceStat} ms
            Draw took an average of ${averageDrawDuration / iterationsSinceStat} ms
            There were ${iterationsSinceStat} iterations this interval
            `);
            lastStatTime = doneTime;
            iterationsSinceStat = averageDrawDuration = averageSimulationDuration = 0;
          }
        }

        window.requestAnimationFrame(animate);
    }

    animate();

  return (
    <Canvas/>
  );
}

export default UAGComponent;
