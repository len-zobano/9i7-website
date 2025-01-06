import { useState, useEffect } from 'react';
import * as glMatrix from 'gl-matrix';
import World from './world';
import SpheroidDrop from './spheroid-drop'
import SimpleCamera from './simple-camera';
import TriangularSurface from './triangular-surface'
import engineMath from '../utility/engine-math';
import SimpleDrawDelegate from './simple-draw-delegate';

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
      let distance =20;
      let cubes = [];
      let jitter = 8  ;

      // let randomValues = [];
      // for (let i = 0; i < 100; ++i) {
      //   randomValues.push(engineMath.random());
      // }
      // randomValues.sort((a, b) => {
      //   return a-b;
      // });
      // let differences = [];
      // for (let i = 0; i < 99; ++i) {
      //   differences.push(randomValues[i+1] - randomValues[i]);
      // }

      let dropGroup = new ControlPointGroup(world);
      let numberOfDrops = cubeSize*cubeSize*cubeSize;
      for (let i = 0; i < numberOfDrops; ++i) {
        let cube = new SpheroidDrop(world, [
          (i%cubeSize)*distance-100,
          ((Math.floor(i/(cubeSize)))%cubeSize)*distance+150,
          ((Math.floor(i/(cubeSize*cubeSize)))%cubeSize)*distance-70
        ].map((element) => {
          return element+engineMath.random()*jitter;
        }));

        dropGroup.addControlPoint(cube.controlPoints[0]);
        cubes[i] = cube;
      }

      let camera = new SimpleCamera(world, 20, 5);
      camera.position = glMatrix.vec3.fromValues(0,-70,-300);
      // camera.focused = cubes[0];

      //TEMPORARY: this should have a better system
      let drawDelegate = new SimpleDrawDelegate(world, [], [], [], []);
      drawDelegate.setGlobalPointLightControlPoint(cubes[0].controlPoints[0]);
      // cubes.forEach((cube) => {
      //   cube.positionPoint.bondToAnyWithinRadius(
      //     cubes.map((otherCube) => {
      //       return otherCube.positionPoint;
      //     }),
      //     1.7*distance,
      //     5
      //   )
      // });

      let 
        mesh = [],
        meshSize = 6,
        meshJitter = 70,
        meshPosition = [-200,-100,-200],
        meshSquareWidth = 50,
        meshSquareLength = 50,
        thickness = -50;


      for (let i = 0; i < meshSize*meshSize; ++i) {
        mesh[i] = meshPosition[1] + Math.pow(engineMath.random(),3)*meshJitter - meshJitter / 2;
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
          ],
          [
            glMatrix.vec3.fromValues(
              meshPosition[0] + x*meshSquareWidth,
              mesh[y*meshSize + x] + thickness,
              meshPosition[2] + y*meshSquareLength
            ),
            glMatrix.vec3.fromValues(
              meshPosition[0] + (x + 1)*meshSquareWidth,
              mesh[y*meshSize + x + 1] + thickness,
              meshPosition[2] + y*meshSquareLength
            ),
            glMatrix.vec3.fromValues(
              meshPosition[0] + x*meshSquareWidth,
              mesh[(y+ 1)*meshSize + x] + thickness,
              meshPosition[2] + (y + 1)*meshSquareLength
            ),
          ], 
          thickness
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
          ],
          [
            glMatrix.vec3.fromValues(
              meshPosition[0] + (x + 1)*meshSquareWidth,
              mesh[(y+ 1)*meshSize + (x + 1)] + thickness,
              meshPosition[2] + (y + 1)*meshSquareLength
            ),
            glMatrix.vec3.fromValues(
              meshPosition[0] + x*meshSquareWidth,
              mesh[(y+ 1)*meshSize + x] + thickness,
              meshPosition[2] + (y + 1)*meshSquareLength
            ),
            glMatrix.vec3.fromValues(
              meshPosition[0] + (x + 1)*meshSquareWidth,
              mesh[y*meshSize + x + 1] + thickness,
              meshPosition[2] + y*meshSquareLength
            ),
          ],
          thickness
        );
      }
    }

    let ID = Math.floor(1000000*engineMath.random());
    
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
