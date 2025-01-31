import { useState, useEffect } from 'react';
import * as glMatrix from 'gl-matrix';
import World from './world';
import SpheroidDrop from './spheroid-drop'
import SimpleFollowPoint from './simple-follow-point';
import TriangularSurface from './triangular-surface'
import engineMath from '../utility/engine-math';
import SimpleDrawDelegate from './simple-draw-delegate';
import SimpleSpheroidDrop from './simple-spheroid-drop';
import Human from '../bodies/human';
import NonRigidHuman from '../bodies/non-rigid-human';
import Cube from '../bodies/cube';
import RigidGroup from './rigid-group';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';
import ControlPointGroup from './control-point-group';
import SimpleControlPoint from './simple-control-point';

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
      let cubes = [];
      let createDropArray = false;
      let createTestBody = true;

      if (createDropArray) {
        let cubeSize = 4;
        let distance =20;
        let jitter = 8;
        let cubePosition = [-150,-90,-150];

        let dropGroup = new ControlPointGroup(world);
        let numberOfDrops = cubeSize*cubeSize*cubeSize;
        for (let i = 0; i < numberOfDrops; ++i) {
          let cube = new SimpleControlPoint(world, [
            (i%cubeSize)*distance+cubePosition[0],
            ((Math.floor(i/(cubeSize)))%cubeSize)*distance+cubePosition[1],
            ((Math.floor(i/(cubeSize*cubeSize)))%cubeSize)*distance+cubePosition[2]
          ].map((element) => {
            return element+engineMath.random()*jitter;
          }));

          dropGroup.addControlPoint(cube);
          cubes[i] = cube;
        }
      }

      let bodyThickness = 1;

      if (createTestBody) {
        let bodyGroup = new ControlPointGroup(world);

        let bodyDeclaration = new Human (1);

        // bodyDeclaration = bodyDeclaration.slice(0,2);

        let bodyDeclarationMap = {}, bodyScale = 10, rigidGroupMap = {};

        bodyDeclaration.forEach((declaredPart) => {
          bodyDeclarationMap[declaredPart.name] = {};
          bodyDeclarationMap[declaredPart.name].bondTo = declaredPart.bondTo || []; 
          if (!declaredPart.position) {
            bodyDeclarationMap[declaredPart.name].absolutePosition = glMatrix.vec3.fromValues(0,0,0);
          }
          else if (declaredPart.relativeTo) {
            bodyDeclarationMap[declaredPart.name].relativeTo = declaredPart.relativeTo;
            bodyDeclarationMap[declaredPart.name].relativePosition = glMatrix.vec3.fromValues(
              declaredPart.position[0],
              declaredPart.position[1],
              declaredPart.position[2]
            );
          }
        });

        bodyDeclaration.forEach((declaredPart) => {
          //get absolute position
          let mappedPartToSearchForAbsolutePosition = bodyDeclarationMap[declaredPart.name], totalPosition = glMatrix.vec3.fromValues(0,0,0);
          //as long as you're searching for the absolute position, keep looking and adding to relative position
          console.log('beginning search for position for ',declaredPart.name);
          while (mappedPartToSearchForAbsolutePosition) {
            console.log('searching mapped part',mappedPartToSearchForAbsolutePosition,'for ',declaredPart.name);
            if (mappedPartToSearchForAbsolutePosition.absolutePosition) {
              glMatrix.vec3.add(totalPosition, totalPosition, mappedPartToSearchForAbsolutePosition.absolutePosition);
              console.log('added absolute position',mappedPartToSearchForAbsolutePosition.absolutePosition);
              bodyDeclarationMap[declaredPart.name].absolutePosition = totalPosition;
              mappedPartToSearchForAbsolutePosition = null;
            }
            else {
              glMatrix.vec3.add(totalPosition, totalPosition, mappedPartToSearchForAbsolutePosition.relativePosition);
              console.log('added relative position',mappedPartToSearchForAbsolutePosition.relativePosition);
              // bodyDeclarationMap[declaredPart.name].relativePosition = mappedPartToSearchForAbsolutePosition.relativeTo;
              let nameOfNextToSearchForPosition = mappedPartToSearchForAbsolutePosition.relativeTo;
              mappedPartToSearchForAbsolutePosition = bodyDeclarationMap[nameOfNextToSearchForPosition];
              console.log('searching next: ',nameOfNextToSearchForPosition,'for position of ',declaredPart.name);
              console.log('part for search next',mappedPartToSearchForAbsolutePosition);
              // if (!mappedPartToSearchForAbsolutePosition) {
              //   debugger;
              // }
            }
          }

          // if (declaredPart.name === 'backLeftElbow') {
            bodyDeclarationMap[declaredPart.name].absolutePosition = totalPosition;
            // debugger;
          // }
          //create drop
          let dropPosition = glMatrix.vec3.create();
          glMatrix.vec3.scale(dropPosition, totalPosition, bodyScale);
          let drop = new SimpleControlPoint(world, dropPosition, 0.1);
          bodyDeclarationMap[declaredPart.name].drop = drop;
          if (declaredPart.anchor) {
            drop.isAnchored = true;
          }
          if (declaredPart.rigidGroup) {
            if (!rigidGroupMap[declaredPart.rigidGroup]) {
              rigidGroupMap[declaredPart.rigidGroup] = new RigidGroup (world);
            }
            let thisRigidGroup = rigidGroupMap[declaredPart.rigidGroup];
            thisRigidGroup.addControlPoint(drop);
          }
          cubes.push(bodyDeclarationMap[declaredPart.name].drop);

          if (!world.selected) {
            world.selected = bodyDeclarationMap[declaredPart.name].drop;
            world.selected.anchor = true;
          }
          
          bodyGroup.addControlPoint(bodyDeclarationMap[declaredPart.name].drop, declaredPart.name);
        });

        bodyDeclaration.forEach((declaredPart) => {
          //bond to other
          bodyDeclarationMap[declaredPart.name].bondTo.forEach((nameOfOther) => {
            bodyDeclarationMap[declaredPart.name].drop.bondTo(
              bodyDeclarationMap[nameOfOther].drop,
              3
            );
          })
        });

        // debugger;
      }

      let camera = new SimpleFollowPoint(world, 100, 20, glMatrix.vec3.fromValues(10,10,10));
      camera.position = glMatrix.vec3.fromValues(-100,-30,-200);
      // camera.focused = cubes[0];

      let light = new SimpleFollowPoint(world, 50, 5, glMatrix.vec3.fromValues(0, 10, 0));
      light.position = glMatrix.vec3.fromValues(-200,-50,-200);
      light.focused = cubes[0];

      let positions = cubes.map((cube) => {
        return cube.position;
      });

      //TEMPORARY: this should have a better system
      world.addLight(light);
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
        meshSize = 5,
        meshJitter = 70,
        meshPosition = [-200,-100,-200],
        meshSquareWidth = 70,
        meshSquareLength = 70,
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
