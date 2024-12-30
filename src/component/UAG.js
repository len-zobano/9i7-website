import { useState, useEffect } from 'react';
import * as glMatrix from 'gl-matrix';
import RainbowCube from './rainbow-cube';
import World from './world';
import Sculpted from './sculpted';
import SpheroidDrop from './spheroid-drop'
import TriangularSurface from './triangular-surface'

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';
import ControlPointGroup from './control-point-group';

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
      let cubeSize = 4;
      let distance =4;
      let cubes = [];
      let jitter = 0  ;

      let dropGroup = new ControlPointGroup(world);
      let numberOfDrops = cubeSize*cubeSize*cubeSize;
      for (let i = 0; i < numberOfDrops; ++i) {
        let cube = new SpheroidDrop(world, [
          (i%cubeSize)*distance,
          ((Math.floor(i/(cubeSize)))%cubeSize)*distance+10,
          ((Math.floor(i/(cubeSize*cubeSize)))%cubeSize)*distance-70
        ].map((element) => {
          return element+Math.random()*jitter;
        }));

        dropGroup.addControlPoint(cube.controlPoints[0]);
        cubes[i] = cube;
      }

      cubes.forEach((cube) => {
        cube.positionPoint.bondToAnyWithinRadius(
          cubes.map((otherCube) => {
            return otherCube.positionPoint;
          }),
          1.7*distance,
          5
        )
      });

      let 
        mesh = [],
        meshSize = 5,
        meshJitter = 50,
        meshPosition = [-80,-30,-150],
        meshSquareWidth = 50,
        meshSquareLength = 50;


      for (let i = 0; i < meshSize*meshSize; ++i) {
        mesh[i] = meshPosition[1] + Math.random()*meshJitter - meshJitter / 2;
      }

      for (let x = 0; x < meshSize - 1; ++x) for (let y = 0; y < meshSize - 1; ++y) {
        let triangle1 = new TriangularSurface(
          world,
          [
            glMatrix.vec3.fromValues(
              meshPosition[0] + x*meshSquareWidth,
              mesh[y*meshSize + x],
              meshPosition[2] + y*meshSquareLength
            ),
            glMatrix.vec3.fromValues(
              meshPosition[0] + (x + 1)*meshSquareWidth,
              mesh[y*meshSize + x + 1],
              meshPosition[2] + y*meshSquareLength
            ),
            glMatrix.vec3.fromValues(
              meshPosition[0] + x*meshSquareWidth,
              mesh[(y+ 1)*meshSize + x],
              meshPosition[2] + (y + 1)*meshSquareLength
            ),
          ]
        );

        let triangle2 = new TriangularSurface(
          world,
          [
            glMatrix.vec3.fromValues(
              meshPosition[0] + (x + 1)*meshSquareWidth,
              mesh[(y+ 1)*meshSize + (x + 1)],
              meshPosition[2] + (y + 1)*meshSquareLength
            ),
            glMatrix.vec3.fromValues(
              meshPosition[0] + x*meshSquareWidth,
              mesh[(y+ 1)*meshSize + x],
              meshPosition[2] + (y + 1)*meshSquareLength
            ),
            glMatrix.vec3.fromValues(
              meshPosition[0] + (x + 1)*meshSquareWidth,
              mesh[y*meshSize + x + 1],
              meshPosition[2] + y*meshSquareLength
            ),
          ]
        );
      }
    }

    let ID = Math.floor(1000000*Math.random());
    
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
