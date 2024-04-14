// Base settings
const FPS = 30
var SCENE_WIDTH = 640
var SCENE_HEIGHT = 360

if (window.innerWidth < 640) {
    SCENE_WIDTH = 320
    SCENE_HEIGHT = 180
}

// Basic stick figure lines
// check blazepose model diagram for details
const LINE_MAP = {
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
const HAND_MAP = {
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

// Map joint names against indexes for named access
const JOINTS_BY_NAME = {
    "NOSE": 0,
    "LEFT_EYE_INNER": 1,
    "LEFT_EYE": 2,
    "LEFT_EYE_OUTER": 3,
    "RIGHT_EYE_INNER": 4,
    "RIGHT_EYE": 5,
    "RIGHT_EYE_OUTER": 6,
    "LEFT_EAR": 7,
    "RIGHT_EAR": 8,
    "MOUTH_LEFT": 9,
    "MOUTH_RIGHT": 10,
    "LEFT_SHOULDER": 11,
    "RIGHT_SHOULDER": 12,
    "LEFT_ELBOW": 13,
    "RIGHT_ELBOW": 14,
    "LEFT_WRIST": 15,
    "RIGHT_WRIST": 16,
    "LEFT_PINKY": 17,
    "RIGHT_PINKY": 18,
    "LEFT_INDEX": 19,
    "RIGHT_INDEX": 20,
    "LEFT_THUMB": 21,
    "RIGHT_THUMB": 22,
    "LEFT_HIP": 23,
    "RIGHT_HIP": 24,
    "LEFT_KNEE": 25,
    "RIGHT_KNEE": 26,
    "LEFT_ANKLE": 27,
    "RIGHT_ANKLE": 28,
    "LEFT_HEEL": 29,
    "RIGHT_HEEL": 30,
    "LEFT_FOOT_INDEX": 31,
    "RIGHT_FOOT_INDEX": 32,
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
    } else {  // in livemode our data does not have type as we only scan the body
        return frame[bpindex]
    }
}

function draw_stickfigure(p, data_chunk) {
    // loop to create stickman body from LINE_MAP
    for (let first_bpindex in LINE_MAP) {
      let point_list = LINE_MAP[first_bpindex]
      for (let pindex in point_list) {
        let second_bpindex = point_list[pindex]
        let first_point = find_by_bpindex(data_chunk, first_bpindex, "body")
        let second_point = find_by_bpindex(data_chunk, second_bpindex, "body")
  
        // make sure we've found useful data, skip if not found
        if (!first_point || !second_point) {
            continue
        }
  
        // make sure to multiply normalized coordinates to get correct coordinates
        let x1 = first_point.x * SCENE_WIDTH
        let x2 = second_point.x * SCENE_WIDTH
        let y1 = first_point.y * SCENE_HEIGHT
        let y2 = second_point.y * SCENE_HEIGHT
  
        p.line(x1, y1, x2, y2)
  
      }
    }    
}

function draw_stickfigure_multipose(p, data_chunk) {
    // loop to create stickman body from LINE_MAP
    for (let first_bpindex in LINE_MAP) {
      let point_list = LINE_MAP[first_bpindex]
      for (let pindex in point_list) {
        let second_bpindex = point_list[pindex]
        let first_point = data_chunk[first_bpindex]
        let second_point = data_chunk[second_bpindex]
  
        // make sure we've found useful data, skip if not found
        if (!first_point || !second_point) {
            continue
        }
  
        // make sure to multiply normalized coordinates to get correct coordinates
        let x1 = first_point.x * SCENE_WIDTH
        let x2 = second_point.x * SCENE_WIDTH
        let y1 = first_point.y * SCENE_HEIGHT
        let y2 = second_point.y * SCENE_HEIGHT
  
        p.line(x1, y1, x2, y2)
  
      }
    }    
}


// default renderer mode, can also be "svg" ( export mode ) or "webgl"
let p5_MODE = "p2d";

// Data source. Will contain array of frames with joints if in database
// mode, an array containing poses per frame ( the current one ) when in
// live mode.
let DATA;

// Indicator flag for live mode. LIVEMODE == true means that DATA
// contains live data as described above.
let LIVEMODE = false;