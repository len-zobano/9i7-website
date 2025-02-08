  function Human (bodyThickness) {
    let body = {} 

    body.keyCommands = [{
      keyCode: 49,
      onKeyUp(controlPointsByName, state) {
        controlPointsByName['leftUpperArmHinge'].setBondForControlPoint(
          controlPointsByName['leftForearmHinge'],
          state.contractLeftBicepBond 
        );
      },
      onKeyDown(controlPointsByName, state) {
        state.contractLeftBicepBond = controlPointsByName['leftUpperArmHinge'].getBondForControlPoint(controlPointsByName['leftForearmHinge']);
        let newContractLeftBicepBond = controlPointsByName['leftUpperArmHinge'].getBondForControlPoint(controlPointsByName['leftForearmHinge']);
        newContractLeftBicepBond.idealDistance *= 0.4;
        controlPointsByName['leftUpperArmHinge'].setBondForControlPoint(
          controlPointsByName['leftForearmHinge'],
          newContractLeftBicepBond
        );

        // state.turnHeadLeftBond = controlPointsByName['frontLeftShoulder'].getBondForControlPoint(controlPointsByName['frontRightJaw']);
        // let newTurnHeadLeftBond = controlPointsByName['frontLeftShoulder'].getBondForControlPoint(controlPointsByName['frontRightJaw']);
        // newTurnHeadLeftBond.idealDistance *= 2;
        // controlPointsByName['frontLeftShoulder'].setBondForControlPoint(
        //   controlPointsByName['frontRightJaw'],
        //   newTurnHeadLeftBond
        // );
      }
    }];
    
    let jawBondStrength = 1, armBoneLength = 2, hipHeight = 1, bodyWidth = 3, thighLength = 2.5, shinLength = 2, boneDiameterRatio = 0.7; 

    body.drawables = [{
      type: "obj-drawable",
      center: ["frontLeftSkull","backRightSkull"],
      top: ["crown"],
      front: ["frontLeftSkull","frontRightSkull"],
      // filename: '../models/drop.obj'
      filename: 'models/head.obj'
    }];

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
    },{
      type: "circular",
      groups: [
        [
          "frontLeftShoulder",
          "frontLeftArmpit",
          "backLeftArmpit",
          "backLeftShoulder"
        ],
        [
          "frontTopLeftArmBall",
          "frontBottomLeftArmBall",
          "backBottomLeftArmBall",
          "backTopLeftArmBall"
        ]
      ],
      strength: jawBondStrength
    },{
      type: "circular",
      groups: [
        [
          "frontBottomLeftArmBall",
          "backBottomLeftArmBall",
          "backLeftOutsideShoulder",
          "frontLeftOutsideShoulder"
        ],
        [
          "frontInsideLeftShoulderInsert",
          "backInsideLeftShoulderInsert",
          "backOutsideLeftShoulderInsert",
          "frontOutsideLeftShoulderInsert"
        ]
      ],
      strength: jawBondStrength
    },{
      type: "circular",
      groups: [
        [
          "frontInsideLeftElbowSocket",
          "backInsideLeftElbowSocket",
          "backOutsideLeftElbowSocket",
          "frontOutsideLeftElbowSocket"
        ],
        [
          "frontInsideLeftElbowInsert",
          "backInsideLeftElbowInsert",
          "backOutsideLeftElbowInsert",
          "frontOutsideLeftElbowInsert"
        ]
      ],
      strength: jawBondStrength
    },{
      type: "circular",
      groups: [
        [
          "frontLeftHipSocket",
          "backLeftHipSocket",
          "backRightHipSocket",
          "frontRightHipSocket"
        ],
        [
          "frontLeftHipInsert",
          "backLeftHipInsert",
          "backRightHipInsert",
          "frontRightHipInsert"
        ]
      ],
      strength: jawBondStrength
    },{
      type: "circular",
      groups: [
        [
          "frontLeftLeftThighSocket",
          "frontGroin",
          "backGroin",
          "backLeftLeftThighSocket"
        ],
        [
          "frontLeftLeftThighInsert",
          "frontRightLeftThighInsert",
          "backRightLeftThighInsert",
          "backLeftLeftThighInsert"
        ]
      ],
      strength: jawBondStrength
    },{
      type: "circular",
      groups: [
        [
          "frontLeftLeftKneeSocket",
          "frontRightLeftKneeSocket",
          "backRightLeftKneeSocket",
          "backLeftLeftKneeSocket"
        ],
        [
          "frontLeftLeftKneeInsert",
          "frontRightLeftKneeInsert",
          "backRightLeftKneeInsert",
          "backLeftLeftKneeInsert"
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
        // {strength: 10, name: "backLeftOutsideShoulder"},
        // {strength: 10, name: "frontLeftOutsideShoulder"},
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
      position: [-bodyWidth/2,-3,-bodyThickness/2],
      rigidGroup: "torso"
    }, {
      name: "frontLeftShoulder",
      relativeTo: "crown",
      position: [-bodyWidth/2,-3,bodyThickness/2],
      bondTo: ["backLeftShoulder"],
      rigidGroup: "torso"
    }, {
      name: "backRightShoulder",
      relativeTo: "crown",
      position: [bodyWidth/2,-3,-bodyThickness/2],
      bondTo: ["backLeftShoulder"],
      rigidGroup: "torso"
    }, {
      name: "frontRightShoulder",
      relativeTo: "crown",
      position: [bodyWidth/2,-3,bodyThickness/2],
      bondTo: ["backRightShoulder","frontLeftShoulder"],
      rigidGroup: "torso"
    },
    {
      name: "backLeftArmpit",
      relativeTo: "backLeftShoulder",
      position: [0,-bodyThickness,0],
      bondTo: ["backLeftShoulder"],
      rigidGroup: "torso"
    },
    {
      name: "frontLeftArmpit",
      relativeTo: "frontLeftShoulder",
      position: [0,-bodyThickness,0],
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
      position: [0,0,0],
      rigidGroup: "leftShoulder"
    },
    {
      name: "frontBottomLeftArmBall",
      relativeTo: "frontLeftArmpit",
      position: [0,0,0],
      bondTo: ["frontTopLeftArmBall"],
      rigidGroup: "leftShoulder"
    },
    {
      name: "backTopLeftArmBall",
      relativeTo: "backLeftShoulder",
      position: [0,0,0],
      bondTo: ["frontTopLeftArmBall"],
      rigidGroup: "leftShoulder"
    },
    {
      name: "backBottomLeftArmBall",
      relativeTo: "backLeftArmpit",
      position: [0,0,0],
      bondTo: ["backTopLeftArmBall","frontBottomLeftArmBall"],
      rigidGroup: "leftShoulder"
    },
    {
      name: "backLeftOutsideShoulder",
      relativeTo: "backBottomLeftArmBall",
      position: [-bodyThickness*0.75,0,0],
      bondTo: ["backBottomLeftArmBall"],
      rigidGroup: "leftShoulder"
    },
    {
      name: "frontLeftOutsideShoulder",
      relativeTo: "frontBottomLeftArmBall",
      position: [-bodyThickness*0.75,0,0],
      bondTo: ["frontBottomLeftArmBall"],
      rigidGroup: "leftShoulder"
    },
    //shoulder insert
    {
      name: "frontInsideLeftShoulderInsert",
      relativeTo: "frontBottomLeftArmBall",
      position: [0,0,0],
      rigidGroup: "leftUpperArm"
    },
    {
      name: "backInsideLeftShoulderInsert",
      relativeTo: "backBottomLeftArmBall",
      position: [0,0,0],
      rigidGroup: "leftUpperArm"
    },
    {
      name: "frontOutsideLeftShoulderInsert",
      relativeTo: "frontLeftOutsideShoulder",
      position: [0,0,0],
      rigidGroup: "leftUpperArm"
    },
    {
      name: "backOutsideLeftShoulderInsert",
      relativeTo: "backLeftOutsideShoulder",
      position: [0,0,0],
      rigidGroup: "leftUpperArm"
    },
    {
      name: "leftUpperArmHinge",
      relativeTo: "frontOutsideLeftShoulderInsert",
      position: [bodyThickness*0.75*0.5, 0, bodyThickness*0.5],
      bondTo: ["frontOutsideLeftShoulderInsert","frontInsideLeftShoulderInsert"],
      rigidGroup: "leftUpperArm"
    },
    //elbow socket
    {
      name: "backInsideLeftElbowSocket",
      relativeTo: "backInsideLeftShoulderInsert",
      position: [0,-armBoneLength,bodyThickness/4],
      bondTo: ["backInsideLeftShoulderInsert"],
      rigidGroup: "leftUpperArm"
    },
    {
      name: "frontInsideLeftElbowSocket",
      relativeTo: "frontInsideLeftShoulderInsert",
      position: [0,-armBoneLength,-bodyThickness/4],
      bondTo: ["frontInsideLeftShoulderInsert"],
      rigidGroup: "leftUpperArm"
    },
    {
      name: "backOutsideLeftElbowSocket",
      relativeTo: "backOutsideLeftShoulderInsert",
      position: [0,-armBoneLength,bodyThickness/4],
      bondTo: ["backOutsideLeftShoulderInsert"],
      rigidGroup: "leftUpperArm"
    },
    {
      name: "frontOutsideLeftElbowSocket",
      relativeTo: "frontOutsideLeftShoulderInsert",
      position: [0,-armBoneLength,-bodyThickness/4],
      bondTo: ["frontOutsideLeftShoulderInsert"],
      rigidGroup: "leftUpperArm"
    },
    //elbow insert
    {
      name: "backInsideLeftElbowInsert",
      relativeTo: "backInsideLeftElbowSocket",
      position: [0,0,0],
      rigidGroup: "leftForearm"
    },
    {
      name: "frontInsideLeftElbowInsert",
      relativeTo: "frontInsideLeftElbowSocket",
      position: [0,0,0],
      rigidGroup: "leftForearm"
    },
    {
      name: "backOutsideLeftElbowInsert",
      relativeTo: "backOutsideLeftElbowSocket",
      position: [0,0,0],
      rigidGroup: "leftForearm"
    },
    {
      name: "frontOutsideLeftElbowInsert",
      relativeTo: "frontOutsideLeftElbowSocket",
      position: [0,0,0],
      rigidGroup: "leftForearm"
    },
    {
      name: "leftForearmHinge",
      relativeTo: "frontOutsideLeftElbowSocket",
      // Protruding hinge
      // position: [bodyThickness*0.75*0.5, 0, bodyThickness*0.5],
      // Inserted hinge
      position: [bodyThickness*0.75*0.5, -bodyThickness, 0],
      bondTo: ["frontOutsideLeftElbowSocket","frontInsideLeftElbowSocket",{
        name: "leftUpperArmHinge",
        strength: 3
      }],
      rigidGroup: "leftForearm"
    },
    //wrist socket
    {
      name: "backInsideLeftWristSocket",
      relativeTo: "backInsideLeftElbowInsert",
      position: [0,-armBoneLength,0],
      bondTo: ["backInsideLeftElbowInsert"],
      rigidGroup: "leftForearm"
    },
    {
      name: "frontInsideLeftWristSocket",
      relativeTo: "frontInsideLeftElbowInsert",
      position: [0,-armBoneLength,0],
      bondTo: ["frontInsideLeftElbowInsert"],
      rigidGroup: "leftForearm"
    },
    {
      name: "backOutsideLeftWristSocket",
      relativeTo: "backOutsideLeftElbowInsert",
      position: [0,-armBoneLength,0],
      bondTo: ["backOutsideLeftElbowInsert"],
      rigidGroup: "leftForearm"
    },
    {
      name: "frontOutsideLeftWristSocket",
      relativeTo: "frontOutsideLeftElbowInsert",
      position: [0,-armBoneLength,0],
      bondTo: ["frontOutsideLeftElbowInsert"],
      rigidGroup: "leftForearm"
    },
    //hip socket
    {
      name: "frontLeftHipSocket",
      relativeTo: "frontLeftShoulder",
      position: [0.5,-3,0],
      bondTo: ["frontLeftArmpit"],
      rigidGroup: "torso"
    },
    {
      name: "frontRightHipSocket",
      relativeTo: "frontRightShoulder",
      position: [-0.5,-3,0],
      bondTo: ["frontRightArmpit","frontLeftHipSocket"],
      rigidGroup: "torso"
    },
    {
      name: "backLeftHipSocket",
      relativeTo: "backLeftShoulder",
      position: [0.5,-3,0],
      bondTo: ["backLeftArmpit","frontLeftHipSocket"],
      rigidGroup: "torso"
    },
    {
      name: "backRightHipSocket",
      relativeTo: "backRightShoulder",
      position: [-0.5,-3,0],
      bondTo: ["backRightArmpit","backLeftHipSocket","frontRightHipSocket"],
      rigidGroup: "torso"
    },
    //hip bone
    {
      name: "frontLeftHipInsert",
      relativeTo: "frontLeftHipSocket",
      position: [0,0,0],
      rigidGroup: "hip"
    },
    {
      name: "frontRightHipInsert",
      relativeTo: "frontRightHipSocket",
      position: [0,0,0],
      rigidGroup: "hip"
    },
    {
      name: "backLeftHipInsert",
      relativeTo: "backLeftHipSocket",
      position: [0,0,0],
      rigidGroup: "hip"
    },
    {
      name: "backRightHipInsert",
      relativeTo: "backRightHipSocket",
      position: [0,0,0],
      rigidGroup: "hip"
    },
    //left leg socket
    {
      name: "frontLeftLeftThighSocket",
      relativeTo: "frontLeftHipInsert",
      position: [0,-hipHeight, 0],
      bondTo: ["frontLeftHipInsert"],
      rigidGroup: "hip"
    },
    {
      name: "backLeftLeftThighSocket",
      relativeTo: "backLeftHipInsert",
      position: [0,-hipHeight, 0],
      bondTo: ["backLeftHipInsert"],
      rigidGroup: "hip"
    },
    //right leg socket
    {
      name: "frontRightRightThighSocket",
      relativeTo: "frontRightHipInsert",
      position: [0,-hipHeight, 0],
      bondTo: ["frontRightHipInsert"],
      rigidGroup: "hip"
    },
    {
      name: "backRightRightThighSocket",
      relativeTo: "backRightHipInsert",
      position: [0,-hipHeight, 0],
      bondTo: ["backRightHipInsert"],
      rigidGroup: "hip"
    },
    //groin
    {
      name: "frontGroin",
      relativeTo: "frontRightRightThighSocket",
      position: [-bodyWidth/3,0,0],
      bondTo: ["frontRightRightThighSocket","frontLeftLeftThighSocket"],
      rigidGroup: "hip"
    },
    {
      name: "backGroin",
      relativeTo: "backRightRightThighSocket",
      position: [-bodyWidth/3,0,0],
      bondTo: ["backRightRightThighSocket","backLeftLeftThighSocket"],
      rigidGroup: "hip"
    },
    //left thigh
    {
      name: "frontLeftLeftThighInsert",
      relativeTo: "frontLeftLeftThighSocket",
      position: [0,0,0],
      rigidGroup: "leftThigh"
    },
    {
      name: "frontRightLeftThighInsert",
      relativeTo: "frontGroin",
      position: [0,0,0],
      rigidGroup: "leftThigh"
    },
    {
      name: "backRightLeftThighInsert",
      relativeTo: "backGroin",
      position: [0,0,0],
      rigidGroup: "leftThigh"
    },
    {
      name: "backLeftLeftThighInsert",
      relativeTo: "backLeftLeftThighSocket",
      position: [0,0,0],
      rigidGroup: "leftThigh"
    },
    {
      name: "frontLeftLeftKneeSocket",
      relativeTo: "frontLeftLeftThighInsert",
      position: [0.15*boneDiameterRatio,-thighLength,-0.15*boneDiameterRatio],
      bondTo: ["frontLeftLeftThighInsert"],
      rigidGroup: "leftThigh"
    },
    {
      name: "frontRightLeftKneeSocket",
      relativeTo: "frontRightLeftThighInsert",
      position: [-0.15*boneDiameterRatio,-thighLength,-0.15*boneDiameterRatio],
      bondTo: ["frontRightLeftThighInsert"],
      rigidGroup: "leftThigh"
    },
    {
      name: "backRightLeftKneeSocket",
      relativeTo: "backRightLeftThighInsert",
      position: [-0.15*boneDiameterRatio,-thighLength,0.15*boneDiameterRatio],
      bondTo: ["backRightLeftThighInsert"],
      rigidGroup: "leftThigh"
    },
    {
      name: "backLeftLeftKneeSocket",
      relativeTo: "backLeftLeftThighInsert",
      position: [0.15*boneDiameterRatio,-thighLength,0.15*boneDiameterRatio],
      bondTo: ["backLeftLeftThighInsert"],
      rigidGroup: "leftThigh"
    },
    //left shin
    {
      name: "frontLeftLeftKneeInsert",
      relativeTo: "frontLeftLeftKneeSocket",
      position: [0,0,0],
      rigidGroup: "leftShin"
    },
    {
      name: "frontRightLeftKneeInsert",
      relativeTo: "frontRightLeftKneeSocket",
      position: [0,0,0],
      rigidGroup: "leftShin"
    },
    {
      name: "backRightLeftKneeInsert",
      relativeTo: "backRightLeftKneeSocket",
      position: [0,0,0],
      rigidGroup: "leftShin"
    },
    {
      name: "backLeftLeftKneeInsert",
      relativeTo: "backLeftLeftKneeSocket",
      position: [0,0,0],
      rigidGroup: "leftShin"
    },
    {
      name: "frontLeftLeftAnkleSocket",
      relativeTo: "frontLeftLeftKneeInsert",
      position: [0,-shinLength,0],
      bondTo: ["frontLeftLeftKneeInsert"],
      rigidGroup: "leftShin"
    },
    {
      name: "frontRightLeftAnkleSocket",
      relativeTo: "frontRightLeftKneeInsert",
      position: [0,-shinLength,0],
      bondTo: ["frontRightLeftKneeInsert"],
      rigidGroup: "leftShin"
    },
    {
      name: "backRightLeftAnkleSocket",
      relativeTo: "backRightLeftKneeInsert",
      position: [0,-shinLength,0],
      bondTo: ["backRightLeftKneeInsert"],
      rigidGroup: "leftShin"
    },
    {
      name: "backLeftLeftAnkleSocket",
      relativeTo: "backLeftLeftKneeInsert",
      position: [0,-shinLength,0],
      bondTo: ["backLeftLeftKneeInsert"],
      rigidGroup: "leftShin"
    },
    //right thigh

  ];

    return body;
  }

  export default Human;