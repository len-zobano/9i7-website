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
      bondTo: ["head","backLeftShoulder","frontLeftShoulder"]
    }, {
      name: "frontRightShoulder",
      relativeTo: "head",
      position: [1,-1,bodyThickness/2],
      bondTo: ["head","backRightShoulder","frontLeftShoulder","backLeftShoulder"]
    },
    {
      name: "backLeftElbow",
      relativeTo: "backLeftShoulder",
      position: [-2,0,0],
      bondTo: ["backLeftShoulder","frontLeftShoulder"]
    }, {
      name: "frontLeftElbow",
      relativeTo: "frontLeftShoulder",
      position: [-2,0,0],
      bondTo: ["frontLeftShoulder", "backLeftElbow","backLeftShoulder"]
    },
    {
      name: "backRightElbow",
      relativeTo: "backRightShoulder",
      position: [2,0,0],
      bondTo: ["backRightShoulder","frontRightShoulder"]
    }, {
      name: "frontRightElbow",
      relativeTo: "frontRightShoulder",
      position: [2,0,0],
      bondTo: ["frontRightShoulder", "backRightElbow","backRightShoulder"]
    },
    {
      name: "leftHand",
      relativeTo: "frontLeftElbow",
      position: [-2, 0, 0],
      bondTo: ["frontLeftElbow", "backLeftElbow"]
    },
    {
      name: "rightHand",
      relativeTo: "frontRightElbow",
      position: [2, 0, 0],
      bondTo: ["frontRightElbow", "backRightElbow"]
    },
    {
      name: "leftHip",
      relativeTo: "frontLeftShoulder",
      position: [0,-4,0],
      bondTo: ["frontLeftShoulder","backLeftShoulder"]
    },
    {
      name: "rightHip",
      relativeTo: "frontRightShoulder",
      position: [0,-4,0],
      bondTo: ["frontRightShoulder","backRightShoulder","leftHip"]
    },
    {
      name: "nutsack",
      relativeTo: "leftHip",
      position: [1,0,bodyThickness/2],
      bondTo: ["leftHip","rightHip"]
    },
    {
      name: "outsideLeftKnee",
      relativeTo: "leftHip",
      position: [0,-2,0],
      bondTo: ["leftHip","nutsack"]
    },
    {
      name: "insideLeftKnee",
      relativeTo: "nutsack",
      position: [-0.25,-2, 0],
      bondTo: ["nutsack","leftHip","outsideLeftKnee"]
    },
    {
      name: "outsideRightKnee",
      relativeTo: "rightHip",
      position: [0,-2,0],
      bondTo: ["rightHip","nutsack"]
    },
    {
      name: "insideRightKnee",
      relativeTo: "nutsack",
      position: [0.25,-2, 0],
      bondTo: ["nutsack","rightHip","outsideRightKnee"]
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