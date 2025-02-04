  function Human (bodyThickness) {
    let body = {} 

    body.keyCommands = [{
      keyCode: 49,
      onKeyUp(controlPointsByName, state) {
        controlPointsByName['frontLeftShoulder'].setBondForControlPoint(
          controlPointsByName['frontRightJaw'],
          state.turnHeadLeftBond 
        );
      },
      onKeyDown(controlPointsByName, state) {
        state.turnHeadLeftBond = controlPointsByName['frontLeftShoulder'].getBondForControlPoint(controlPointsByName['frontRightJaw']);
        let newTurnHeadLeftBond = controlPointsByName['frontLeftShoulder'].getBondForControlPoint(controlPointsByName['frontRightJaw']);
        newTurnHeadLeftBond.idealDistance *= 2;
        controlPointsByName['frontLeftShoulder'].setBondForControlPoint(
          controlPointsByName['frontRightJaw'],
          newTurnHeadLeftBond
        );
      }
    }];
    
    let jawBondStrength = 1;

    body.joints = [{
      type: "circular",
      groups: [
        [
          "backLeftShoulder",
          "backRightShoulder",
          "frontRightShoulder",
          "frontLeftShoulder"
        ],
        [
          "backLeftJaw",
          "backRightJaw",
          "frontRightJaw",
          "frontLeftJaw"
        ]
      ],
      strength: jawBondStrength
    }];

    body.controlPoints = [{
      name: "crown",
      rigidGroup: "head"
    },
    {
      name: "core",
      rigidGroup: "torso",
      relativeTo: "crown",
      position: [0,-4,0],
      bondTo: [
        {strength: 10, name: "crown"},
        {strength: 10, name: "frontBottomLeftArmBall"},
        // {strength: 10, name: "backBottomLeftArmBall"},
        // {strength: 10, name: "frontTopLeftArmBall"},
        // {strength: 10, name: "backTopLeftArmBall"},
      ],
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
      // bondTo: [
      //   {strength: jawBondStrength, name: "backLeftJaw"},
      //   {strength: jawBondStrength, name: "frontLeftJaw"},
      //   {strength: jawBondStrength, name: "backRightJaw"}
      // ],
      rigidGroup: "torso"
    }, {
      name: "frontLeftShoulder",
      relativeTo: "crown",
      position: [-1.5,-3,bodyThickness/2],
      bondTo: [        
      //   {strength: jawBondStrength, name: "backLeftJaw"},
      //   {strength: jawBondStrength, name: "frontLeftJaw"},
      //   {strength: jawBondStrength, name: "frontRightJaw"},
        "backLeftShoulder"
      ],
      rigidGroup: "torso"
    }, {
      name: "backRightShoulder",
      relativeTo: "crown",
      position: [1.5,-3,-bodyThickness/2],
      bondTo: [        
      //   {strength: jawBondStrength, name: "backLeftJaw"},
      //   {strength: jawBondStrength, name: "frontRightJaw"},
      //   {strength: jawBondStrength, name: "backRightJaw"},
        "backLeftShoulder"
      ],
      rigidGroup: "torso"
    }, {
      name: "frontRightShoulder",
      relativeTo: "crown",
      position: [1.5,-3,bodyThickness/2],
      bondTo: [
        // {strength: jawBondStrength, name: "backRightJaw"},
        // {strength: jawBondStrength, name: "frontRightJaw"},
        // {strength: jawBondStrength, name: "frontLeftJaw"},
        ,"backRightShoulder","frontLeftShoulder"],
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
    //upper arm, armBall
    {
      name: "frontTopLeftArmBall",
      relativeTo: "frontLeftShoulder",
      position: [-0.5,0,0],
      bondTo: ["frontLeftShoulder"],
      rigidGroup: "leftArm"
    },
    {
      name: "frontBottomLeftArmBall",
      relativeTo: "frontLeftArmpit",
      position: [-0.5,0,0],
      bondTo: ["frontLeftArmpit","frontTopLeftArmBall"],
      rigidGroup: "leftArm"
    },
    {
      name: "backTopLeftArmBall",
      relativeTo: "backLeftShoulder",
      position: [-0.5,0,0],
      bondTo: ["backLeftShoulder","frontTopLeftArmBall"],
      rigidGroup: "leftArm"
    },
    {
      name: "backBottomLeftArmBall",
      relativeTo: "backLeftArmpit",
      position: [-0.5,0,0],
      bondTo: ["backLeftArmpit","backTopLeftArmBall","frontBottomLeftArmBall"],
      rigidGroup: "leftArm"
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