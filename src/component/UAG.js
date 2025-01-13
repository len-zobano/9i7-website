import { useState, useEffect } from 'react';
import * as glMatrix from 'gl-matrix';
import World from './world';
import SpheroidDrop from './spheroid-drop'
import SimpleFollowPoint from './simple-follow-point';
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
      let cubes = [];
      let createDropArray = false;
      let createTestBody = true;

      if (createDropArray) {
        let cubeSize = 4;
        let distance =20;
        let jitter = 8;
        let cubePosition = [-150,-90,-150];

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
            (i%cubeSize)*distance+cubePosition[0],
            ((Math.floor(i/(cubeSize)))%cubeSize)*distance+cubePosition[1],
            ((Math.floor(i/(cubeSize*cubeSize)))%cubeSize)*distance+cubePosition[2]
          ].map((element) => {
            return element+engineMath.random()*jitter;
          }));

          dropGroup.addControlPoint(cube.controlPoints[0]);
          cubes[i] = cube;
        }
      }

      let bodyThickness = 0.25;

      if (createTestBody) {
        let bodyGroup = new ControlPointGroup(world);

        let bodyDeclaration = [{
          name: "head"
        }, {
          name: "backLeftShoulder",
          relativeTo: "head",
          position: [-1,-1,-bodyThickness/2],
          bondTo: ["head"]
        }, {
          name: "frontLeftShoulder",
          relativeTo: "head",
          position: [-1,-1,bodyThickness/2],
          bondTo: ["head","backLeftShoulder"]
        }, {
          name: "backRightShoulder",
          relativeTo: "head",
          position: [1,-1,-bodyThickness/2],
          bondTo: ["head"]
        }, {
          name: "frontRightShoulder",
          relativeTo: "head",
          position: [1,-1,bodyThickness/2],
          bondTo: ["head","backRightShoulder"]
        },
        {
          name: "backLeftElbow",
          relativeTo: "backLeftShoudler",
          position: [-0.5,-2,0],
          bondTo: ["backLeftShoulder"]
        }, {
          name: "frontLeftElbow",
          relativeTo: "frontLeftShoulder",
          position: [-0.5,-2,0],
          bondTo: ["frontLeftShoulder", "backLeftElbow"]
        },
        {
          name: "backRightElbow",
          relativeTo: "backRightShoudler",
          position: [0.5,-2,0],
          bondTo: ["backRightShoulder"]
        }, {
          name: "frontRightElbow",
          relativeTo: "frontRightShoulder",
          position: [0.5,-2,0],
          bondTo: ["frontRightShoulder", "backRightElbow"]
        },
        {
          name: "leftHand",
          relativeTo: "frontLeftElbow",
          position: [-0.5, 2, 0],
          bondTo: ["frontLeftElbow", "backLeftElbow"]
        },
        {
          name: "rightHand",
          relativeTo: "frontRightElbow",
          position: [0.5, 2, 0],
          bondTo: ["frontRightElbow", "backRightElbow"]
        },
        {
          name: "leftAsscheek",
          relativeTo: "backLeftShoulder",
          position: [0.5,-4,0],
          bondTo: ["backLeftShoulder"]
        },
        {
          name: "rightAsscheek",
          relativeTo: "backRightShoulder",
          position: [-0.5,-4,0],
          bondTo: ["backRightShoulder", "leftAsscheek"]
        },
        {
          name: "leftHip",
          relativeTo: "frontLeftShoulder",
          position: [0,-4,0],
          bondTo: ["frontLeftShoulder"]
        },
        {
          name: "rightHip",
          relativeTo: "frontRightShoulder",
          position: [0,-4,0],
          bondTo: ["frontRightShoulder"]
        },
        {
          name: "nutsack",
          relativeTo: "leftHip",
          position: [1,0,0],
          bondTo: ["leftHip","rightHip"]
        },
        {
          name: "outsideLeftKnee",
          relativeTo: "leftHip",
          position: [0,-2,0],
          bondTo: ["leftHip"]
        },
        {
          name: "insideLeftKnee",
          relativeTo: "nutsack",
          position: [-0.25,-2, 0],
          bondTo: ["nutsack","outsideLeftKnee"]
        },
        {
          name: "outsideRightKnee",
          relativeTo: "rightHip",
          position: [0,-2,0],
          bondTo: ["rightHip"]
        },
        {
          name: "insideRightKnee",
          relativeTo: "nutsack",
          position: [0.25,-2, 0],
          bondTo: ["nutsack","outsideRightKnee"]
        },
        {
          name: "leftFoot",
          relativeTo: "outsideLeftKnee",
          position: [0.25,-2,0],
          bondTo: ["insideLeftKnee","outsideLeftKnee"]
        },
        {
          name: "rightFoot",
          relativeTo: "outsideRightKnee",
          position: [-0.25,-2,0],
          bondTo: ["insideRightKnee","outsideRightKnee"]
        }];

        // bodyDeclaration = bodyDeclaration.slice(0,8);

        let bodyDeclarationMap = {}, bodyScale = 10;

        bodyDeclaration.forEach((declaredPart) => {
          bodyDeclarationMap[declaredPart.name] = {};
          bodyDeclarationMap[declaredPart.name].bondTo = declaredPart.bondTo || []; 
          if (!declaredPart.position) {
            bodyDeclarationMap[declaredPart.name].absolutePosition = glMatrix.vec3.fromValues(0,0,0);
          }
          else {
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
          while (mappedPartToSearchForAbsolutePosition) {
            if (mappedPartToSearchForAbsolutePosition.absolutePosition) {
              glMatrix.vec3.add(totalPosition, totalPosition, mappedPartToSearchForAbsolutePosition.absolutePosition);
              bodyDeclarationMap[declaredPart.name].absolutePosition = totalPosition;
              mappedPartToSearchForAbsolutePosition = null;
            }
            else {
              glMatrix.vec3.add(totalPosition, totalPosition, mappedPartToSearchForAbsolutePosition.relativePosition);
              bodyDeclarationMap[declaredPart.name].relativePosition = mappedPartToSearchForAbsolutePosition.relativeTo;
              mappedPartToSearchForAbsolutePosition = bodyDeclarationMap[mappedPartToSearchForAbsolutePosition.relativeTo];
            }
          }
          //create drop
          let dropPosition = glMatrix.vec3.create();
          glMatrix.vec3.scale(dropPosition, totalPosition, bodyScale);
          bodyDeclarationMap[declaredPart.name].drop = new SpheroidDrop (world, dropPosition);
          cubes.push(bodyDeclarationMap[declaredPart.name].drop);
          bodyGroup.addControlPoint(bodyDeclarationMap[declaredPart.name].drop.controlPoints[0]);
        });

        bodyDeclaration.forEach((declaredPart) => {
          //bond to other
          bodyDeclarationMap[declaredPart.name].bondTo.forEach((nameOfOther) => {
            bodyDeclarationMap[declaredPart.name].drop.controlPoints[0].bondTo(
              bodyDeclarationMap[nameOfOther].drop.controlPoints[0]
            );
          })
        });
      }

      let camera = new SimpleFollowPoint(world, 100, 20, glMatrix.vec3.fromValues(10,10,10));
      camera.position = glMatrix.vec3.fromValues(-100,-30,-200);
      // camera.focused = cubes[0];

      let light = new SimpleFollowPoint(world, 50, 5, glMatrix.vec3.fromValues(0, 10, 0));
      light.position = glMatrix.vec3.fromValues(-200,-50,-200);
      light.focused = cubes[0];

      let positions = cubes.map((cube) => {
        return cube.controlPoints[0].position;
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
        meshJitter = 0,
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
