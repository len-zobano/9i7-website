  function Human (bodyThickness) {
    let body = {} 

    body.keyCommands = [{
      keyCode: 49,
      onKeyUp(controlPointsByName, state) {
        let 
          backHinge = controlPointsByName['backRightArmHinge'],
          frontHinge = controlPointsByName['frontRightArmHinge'],
          backRightShoulder = controlPointsByName['backRightShoulder'],
          frontRightShoulder = controlPointsByName['frontRightShoulder'];

          backHinge.setBondForControlPoint(backRightShoulder, state.backHingeBond);
          frontHinge.setBondForControlPoint(frontRightShoulder, state.frontHingeBond); 
      },
      onKeyDown(controlPointsByName, state) {
        let 
          backHinge = controlPointsByName['backRightArmHinge'],
          frontHinge = controlPointsByName['frontRightArmHinge'],
          backRightShoulder = controlPointsByName['backRightShoulder'],
          frontRightShoulder = controlPointsByName['frontRightShoulder'];

        state.backHingeBond = backHinge.getBondForControlPoint(backRightShoulder);
        state.frontHingeBond = frontHinge.getBondForControlPoint(frontRightShoulder);

        let 
          newBackHingeBond = backHinge.getBondForControlPoint(backRightShoulder),
          newFrontHingeBond = frontHinge.getBondForControlPoint(frontRightShoulder);

        newBackHingeBond.idealDistance /= 4;
        newFrontHingeBond.idealDistance /= 4;
        
        backHinge.setBondForControlPoint(backRightShoulder, newBackHingeBond);
        frontHinge.setBondForControlPoint(frontRightShoulder, newFrontHingeBond);
      }
    }];
    
    body.controlPoints = [{
      name: "head",
      rigidGroup: "torso"
    }, {
      name: "backLeftShoulder",
      relativeTo: "head",
      position: [-1,-1,-bodyThickness/2],
      bondTo: ["head"],
      rigidGroup: "torso"
    }, {
      name: "frontLeftShoulder",
      relativeTo: "head",
      position: [-1,-1,bodyThickness/2],
      bondTo: ["head","backLeftShoulder"],
      rigidGroup: "torso"
    }, {
      name: "backRightShoulder",
      relativeTo: "head",
      position: [1,-1,-bodyThickness/2],
      bondTo: ["head","backLeftShoulder"],
      rigidGroup: "torso"
    }, {
      name: "frontRightShoulder",
      relativeTo: "head",
      position: [1,-1,bodyThickness/2],
      bondTo: ["head","backRightShoulder","frontLeftShoulder"],
      rigidGroup: "torso"
    },
    {
      name: "backLeftArmpit",
      relativeTo: "backLeftShoulder",
      position: [0,-1,0],
      bondTo: ["backLeftShoulder"],
      rigidGroup: "torso"
    },
    {
      name: "frontLeftArmpit",
      relativeTo: "frontLeftShoulder",
      position: [0,-1,0],
      bondTo: ["frontLeftShoulder"],
      rigidGroup: "torso"
    },
    {
      name: "backRightArmpit",
      relativeTo: "backRightShoulder",
      position: [0,-1,0],
      bondTo: ["backRightShoulder"],
      rigidGroup: "torso"
    },
    {
      name: "frontRightArmpit",
      relativeTo: "frontRightShoulder",
      position: [0,-1,0],
      bondTo: ["frontRightShoulder"],
      rigidGroup: "torso"
    },
    {
      name: "backRightArmHinge",
      relativeTo: "backRightShoulder",
      position: [1.5,0, 0],
      bondTo: ["backRightShoulder"],
      rigidGroup: "rightArm"
    },
    {
      name: "frontRightArmHinge",
      relativeTo: "frontRightShoulder",
      position: [1.5,0, 0],
      bondTo: ["backRightArmHinge", "frontRightShoulder"],
      rigidGroup: "rightArm"
    },
    {
      name: "backRightArmFulcrum",
      relativeTo: "backRightArmHinge",
      position: [0.25,-1,0],
      bondTo: ["backRightArmHinge","backRightArmpit","backRightShoulder"],
      rigidGroup: "rightArm"
    },
    {
      name: "frontRightArmFulcrum",
      relativeTo: "frontRightArmHinge",
      position: [0.25,-1,0],
      bondTo: ["frontRightArmHinge","frontRightArmpit","frontRightShoulder"],
      rigidGroup: "rightArm"
    },
    {
      name: "backRightArmElbow",
      relativeTo: "backRightArmFulcrum",
      position: [1.25, -1, 0],
      bondTo: ["backRightArmFulcrum"],
      rigidGroup: "rightArm"
    },
    {
      name: "frontRightArmElbow",
      relativeTo: "frontRightArmFulcrum",
      position: [1.25, -1, 0],
      bondTo: ["frontRightArmFulcrum","backRightArmElbow"],
      rigidGroup: "rightArm"
    },
    {
      name: "backRightArmWrist",
      relativeTo: "backRightArmElbow",
      position: [1.25, -1, bodyThickness/4],
      bondTo: ["backRightArmElbow"],
      rigidGroup: "rightHand"
    },
    {
      name: "frontRightArmWrist",
      relativeTo: "frontRightArmElbow",
      position: [1.25, -1, -bodyThickness/4],
      bondTo: ["frontRightArmElbow","backRightArmWrist"],
      rigidGroup: "rightHand"
    },
    {
      name: "backRightArmKnuckles",
      relativeTo: "backRightArmWrist",
      position: [0.5,-0.5,0],
      bondTo: ["backRightArmWrist"],
      rigidGroup: "rightHand"
    },
    {
      name: "frontRightArmKnuckles",
      relativeTo: "frontRightArmWrist",
      position: [0.5,-0.5,0],
      bondTo: ["frontRightArmWrist","backRightArmKnuckles"],
      rigidGroup: "rightHand"
    },
    {
      name: "leftHip",
      relativeTo: "frontLeftShoulder",
      position: [0,-4,0],
      bondTo: ["frontLeftShoulder","backLeftShoulder"],
      rigidGroup: "torso"
    },
    {
      name: "rightHip",
      relativeTo: "frontRightShoulder",
      position: [0,-4,0],
      bondTo: ["frontRightShoulder","backRightShoulder","leftHip"],
      rigidGroup: "torso"
    },
    {
      name: "nutsack",
      relativeTo: "leftHip",
      position: [1,0,bodyThickness/2],
      bondTo: ["leftHip","rightHip"],
      rigidGroup: "torso"
    }];

    return body;
  }

  export default Human;