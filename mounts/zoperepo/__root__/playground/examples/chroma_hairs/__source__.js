// https://openprocessing.org/sketch/1198049 by Spencer Eastcott

var margin = 50;
var stepX;
var stepY;
var cols = 10;
var rows = 10;
var hairLength = 0.03;
var maxHairLength = 40;
var scale_factor = 200;
var gradientLength;
var radiusOffset;

sketch = function(p) {

    let index = 0;
    
    hair = function(x, y, joint) {
        var a = p.atan2(
            (joint.x * SCENE_WIDTH) - x,
            (joint.y * SCENE_HEIGHT) - y
        ) + p.PI;
        var d = scale_factor / p.pow(
            p.dist(
                (joint.x * SCENE_WIDTH),
                (joint.y * SCENE_HEIGHT), x, y
            ) * hairLength,
            2
        );
        var D = p.dist(
            (joint.x * SCENE_WIDTH),
            (joint.y * SCENE_HEIGHT),
            x,
            y
        ) + radiusOffset;

        var g = p.sin(D * (p.TWO_PI / gradientLength)) * 255 / 2 + (255 / 2);
        var r = p.sin(D * (p.TWO_PI / gradientLength) + p.TWO_PI / 3) * 255 / 2 + (255 / 2);
        var b = p.sin(D * (p.TWO_PI / gradientLength) + (p.TWO_PI / 3) * 2) * 255 / 2 + (255 / 2);
        
        if (d > maxHairLength) {
            d = maxHairLength;
        }
        
        p.strokeWeight(4);
        p.stroke(r, g, b);
        p.line(x, y, (p.sin(a) * d) + x, (p.cos(a) * d) + y);        
    }

    p.setup = function() {
        p.createCanvas(SCENE_WIDTH, SCENE_HEIGHT, p5_MODE);
        p.frameRate(FPS);
        var distance = [cols * rows];
        var angle = [cols * rows];
        stepX = (p.width - (2 * margin)) / (rows - 1);
        stepY = (p.height - (2 * margin)) / (cols - 1);
        gradientLength = p.width;
        radiusOffset = -p.width / 10;
    }

    p.draw = function() {
        p.background('#212529');

        if (!DATA) {
            return
        }

        if (!LIVEMODE) {
            let data_chunk = DATA[index];
            for (let joint of data_chunk) {
                for (var x = margin; x < p.width - margin + 1; x += stepX) {
                    for (var y = margin; y < p.height - margin + 1; y += stepY) {
                        hair(x, y, joint);
                    }
                }
            }
            if (index < DATA.length - 1) {
                index++
            } else {
                index = 0
            }            
        } else {
            for (let pose of DATA) {
                for (let joint of pose) {
                    for (var x = margin; x < p.width - margin + 1; x += stepX) {
                        for (var y = margin; y < p.height - margin + 1; y += stepY) {
                            hair(x, y, joint);
                        }
                    }
                }
            }
        }

    }
    
}

// make sure the following line remains unchanged!
stage = new p5(sketch, 'p5_stage')