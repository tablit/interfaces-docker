/*

    p5js stickman example

    Specialized ( a little ) for Dance Challenge #TogetherWeDance
    Use simple stickman example for other records from database!

*/

// make sure the following line remains unchanged!
sketch = function(p) {

  // basic loop index to loop over DATA in draw() method 
  var index = 0;

  p.setup = function() { 
    p.createCanvas(SCENE_WIDTH, SCENE_HEIGHT, p5_MODE)
    p.background('#212529')
    p.frameRate(30)
  }

  p.draw = function() {

    // reset canvas each frame - feel free to remove these two lines
    // for interesting results
    p.clear()
    p.background('#212529')
    p.stroke('white')

    // fetch current data chunk, describing poses in one frame
    let data_chunk = DATA[index]

    // early exit data check
    if (!data_chunk) {
        index = 0
        return
    }

    // as this is a super modern scan we do not need to distinguish between
    // live and db mode anymore as we can have multiple poses in db now, too!
    for (let pose of data_chunk) {
        draw_stickfigure_multipose(p, pose)
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

