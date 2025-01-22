  function Human (bodyThickness) {
    return [{
      name: "head",
      anchor: true
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
  }

  export default Human;