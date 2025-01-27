  function Cube (bodyThickness) {
    return [{
        name: "backUpperLeft",
        rigidGroup: "cube"
    }, {
        name: "backUpperRight",
        bondTo: ["backUpperLeft"],
        relativeTo: "backUpperLeft",
        position: [1, 0, 0],
        rigidGroup: "cube"
    },{
        name: "backLowerRight",
        bondTo: ["backUpperRight"],
        relativeTo: "backUpperRight",
        position: [0, -1, 0],
        rigidGroup: "cube"
    },{
        name: "backLowerLeft",
        bondTo: ["backLowerRight","backUpperLeft"],
        relativeTo: "backLowerRight",
        position: [-1, 0, 0],
        rigidGroup: "cube"
    },{
        name: "frontLowerLeft",
        bondTo: ["backLowerLeft"],
        relativeTo: "backLowerLeft",
        position: [0, 0, 1],
        rigidGroup: "cube"
    },{
        name: "frontUpperLeft",
        bondTo: ["frontLowerLeft","backUpperLeft"],
        relativeTo: "frontLowerLeft",
        position: [0, 1, 0],
        rigidGroup: "cube"
    },{
        name: "frontUpperRight",
        bondTo: ["frontUpperLeft","backUpperRight"],
        relativeTo: "frontUpperLeft",
        position: [1, 0, 0],
        rigidGroup: "cube"
    },{
        name: "frontLowerRight",
        bondTo: ["frontUpperRight","backLowerRight","frontLowerLeft"],
        relativeTo: "frontUpperRight",
        position: [0, -1, 0],
        rigidGroup: "cube"
    }];
  }

  export default Cube;