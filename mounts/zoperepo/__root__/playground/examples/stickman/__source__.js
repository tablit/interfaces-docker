/*

    p5js stickman example
    Base example on how to work with Playground
    
    Global variables:

    SCENE_WIDTH: 640
    SCENE_HEIGHT: 480

    DATA: Data source. Will contain array of frames with joints if in database
    mode, an array containing exactly one frame ( the current one ) when in
    live mode.

    LIVEMODE: Indicator flag for live mode. LIVEMODE == true means that DATA
    contains live data as described above.
    
    LINE_MAP: Defines joints which should be connected by lines to form a stick
    figure

    HAND_MAP: Define joints from hand pose scan which should be connected by
    lines to draw a hand

    find_by_bpindex: Function to fetch specific joints from current frame by
    index. Consumes Indexes defined in LINE_ and HAND_MAP and type of data to
    be fetched. In livemode we only have body data so type argument is ignored

*/

// make sure the following line remains unchanged!
sketch = function(p) {

  // basic loop index to loop over DATA in draw() method 
  var index = 0;

  p.setup = function() { 
    p.createCanvas(SCENE_WIDTH, SCENE_HEIGHT, p5_MODE)
    p.background('#212529')
    p.frameRate(FPS)
  }

  p.draw = function() {

    // reset canvas each frame - feel free to remove these two lines
    // for interesting results
    p.clear()
    p.background('#212529')
    p.stroke('white')

    // fetch current data chunk, which is either one frame from database record
    // OR the current frame scanned via webcam in LIVEMODE
    let data_chunk = DATA[index]

    // early exit data check
    if (!data_chunk) {
        index = 0
        return
    }

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

    // early exit in LIVEMODE, we have no hands and do not want to
    // increment index as we receive fresh data directly in LIVEMODE
    if (LIVEMODE) {
        index = 0
        return
    }

    // loop to create stickman left hand from HAND_MAP
    for (let first_bpindex in HAND_MAP) {
      let point_list = HAND_MAP[first_bpindex]
      for (let pindex in point_list) {
        let second_bpindex = point_list[pindex]
        let first_point = find_by_bpindex(data_chunk, first_bpindex, "left_hand")
        let second_point = find_by_bpindex(data_chunk, second_bpindex, "left_hand")
  
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

    // loop to create stickman right hand from HAND_MAP
    for (let first_bpindex in HAND_MAP) {
      let point_list = HAND_MAP[first_bpindex]
      for (let pindex in point_list) {
        let second_bpindex = point_list[pindex]
        let first_point = find_by_bpindex(data_chunk, first_bpindex, "right_hand")
        let second_point = find_by_bpindex(data_chunk, second_bpindex, "right_hand")
  
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

    // loop over DATA via index variable
    if (index == DATA.length - 1) {
      // no more DATA left, restart
      index = 0
    } else {
      // increment index for next run of draw() to create next frame
      index++
    }

  }

};

// make sure the following line remains unchanged!
stage = new p5(sketch, 'p5_stage')

