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

        newBackHingeBond.idealDistance /= 2;
        newFrontHingeBond.idealDistance /= 2;
        
        backHinge.setBondForControlPoint(backRightShoulder, newBackHingeBond);
        frontHinge.setBondForControlPoint(frontRightShoulder, newFrontHingeBond);
      }
    }];
    
    let jawBondStrength = 2.5;

    body.controlPoints = [{
      name: "crown",
      rigidGroup: "head"
    },
    {
      name: "core",
      rigidGroup: "torso",
      relativeTo: "crown",
      position: [0,-4,0],
      bondTo: [{strength: 10, name: "crown"}],
    },
    {
      name: "backLeftSkull",
      relativeTo: "crown",
      position: [-0.75,-1,-bodyThickness],
      bondTo: ["crown"],
      rigidGroup: "head"
    },
    {
      name: "backRightSkull",
      relativeTo: "crown",
      position: [0.75,-1,-bodyThickness],
      bondTo: ["crown"],
      rigidGroup: "head"
    },
    {
      name: "frontLeftSkull",
      relativeTo: "crown",
      position: [-0.75,-1,bodyThickness/2],
      bondTo: ["crown"],
      rigidGroup: "head"
    },
    {
      name: "frontRightSkull",
      relativeTo: "crown",
      position: [0.75,-1,bodyThickness/2],
      bondTo: ["crown"],
      rigidGroup: "head"
    },
    {
      name: "backLeftJaw",
      relativeTo: "crown",
      position: [-0.75,-2,-bodyThickness/2],
      bondTo: ["backLeftSkull"],
      rigidGroup: "head"
    },
    {
      name: "backRightJaw",
      relativeTo: "crown",
      position: [0.75,-2,-bodyThickness/2],
      bondTo: ["backRightSkull"],
      rigidGroup: "head"
    },
    {
      name: "frontLeftJaw",
      relativeTo: "crown",
      position: [-0.75,-2,bodyThickness/2],
      bondTo: ["frontLeftSkull"],
      rigidGroup: "head"
    },
    {
      name: "frontRightJaw",
      relativeTo: "crown",
      position: [0.75,-2,bodyThickness/2],
      bondTo: ["frontRightSkull"],
      rigidGroup: "head"
    },
    {
      name: "backLeftShoulder",
      relativeTo: "crown",
      position: [-1.5,-3,-bodyThickness/2],
      bondTo: [{strength: jawBondStrength, name: "backLeftJaw"}],
      rigidGroup: "torso"
    }, {
      name: "frontLeftShoulder",
      relativeTo: "crown",
      position: [-1.5,-3,bodyThickness/2],
      bondTo: [{strength: jawBondStrength, name: "frontLeftJaw"},"backLeftShoulder"],
      rigidGroup: "torso"
    }, {
      name: "backRightShoulder",
      relativeTo: "crown",
      position: [1.5,-3,-bodyThickness/2],
      bondTo: [{strength: jawBondStrength, name: "backRightJaw"},"backLeftShoulder"],
      rigidGroup: "torso"
    }, {
      name: "frontRightShoulder",
      relativeTo: "crown",
      position: [1.5,-3,bodyThickness/2],
      bondTo: [{strength: jawBondStrength, name: "frontRightJaw"},"backRightShoulder","frontLeftShoulder"],
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
      name: "frontLeftHip",
      relativeTo: "frontLeftShoulder",
      position: [0.5,-4,0],
      bondTo: ["frontLeftArmpit"],
      rigidGroup: "torso"
    },
    {
      name: "frontRightHip",
      relativeTo: "frontRightShoulder",
      position: [-0.5,-4,0],
      bondTo: ["frontRightArmpit","frontLeftHip"],
      rigidGroup: "torso"
    },
    {
      name: "backLeftHip",
      relativeTo: "backLeftShoulder",
      position: [0.5,-4,0],
      bondTo: ["backLeftArmpit","frontLeftHip"],
      rigidGroup: "torso"
    },
    {
      name: "backRightHip",
      relativeTo: "backRightShoulder",
      position: [-0.5,-4,0],
      bondTo: ["backRightArmpit","backLeftHip","frontRightHip"],
      rigidGroup: "torso"
    },
  ];

    return body;
  }

  export default Human;