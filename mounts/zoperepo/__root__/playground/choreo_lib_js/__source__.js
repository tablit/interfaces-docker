// Settings
const FPS = 30
const SCENE_WIDTH = 640
const SCENE_HEIGHT = 480

const line_map = {
  0 : [1, 4],
  1 : [2],
  2 : [3],
  3 : [7],
  4 : [5],
  5 : [6],
  6 : [8],
  9 : [10],
  11: [12, 13, 23],
  12: [14, 24],
  13: [15],
  14: [16],
  15: [17, 19, 21],
  16: [18, 20, 22],
  17: [19],
  18: [20],
  23: [24, 25],
  24: [26],
  25: [27],
  26: [28],
  27: [29, 31],
  28: [30, 32],
}

// derived from
// https://developers.google.com/mediapipe/solutions/vision/hand_landmarker#models
// same as line_map, but for hands instead of body
const hand_map = {
    0 : [1, 5, 17],
    1 : [2],
    2 : [3],
    3 : [4],
    5 : [6, 9],
    6 : [7],
    7 : [8],
    9 : [10, 13],
    10: [11],
    11: [12],
    13: [14, 17],
    14: [15],
    15: [16],
    17: [18],
    18: [19],
    19: [20],
}

// basic function to find a joint by index from given frame
// use this as a template to create a function to return joints u desire to use
function find_by_bpindex(frame, bpindex, joint_type) {
    if (!LIVEMODE) {
      for (let joint_index in frame) {
        let joint = frame[joint_index]
        if ((joint.index == bpindex) && (joint.type == joint_type)) {
          return joint
        }
      }
    } else {
        return frame[bpindex]
    }
  //console.log("Warning! No matching joint found!")
}