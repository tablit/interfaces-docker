// https://openprocessing.org/sketch/1789074 by Sam Darlow
var fontSize = 70
var scaleRate = 5
var message = 'Interfaces'
var inpactRange = 15;
var canvas;
var textData = [];
var dotsCordinate = [];
var particles =[];
var myFont;

sketch = function(p) {

    var index = 0;

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.r = 2;
            this.originalX = x;
            this.originalY = y;
            this.color = Math.floor(Math.random()*360);
            this.density = Math.random() * 30 + 10;
        }
    
        draw() {
            p.fill(this.color);
            p.circle(this.x, this.y, this.r * 2);
        }
    
        update(poses) {

            let distanceToOrigin = Math.sqrt(
                (this.originalX - this.x) ** 2 + (this.originalY - this.y) ** 2
            );

            let forced = false;
            for (let pose of poses) {
                for (let joint of pose) {
                    let distanceToJoint = Math.sqrt(
                        (this.x - (joint.x * SCENE_WIDTH)) ** 2 +
                        (this.y - (joint.y * SCENE_HEIGHT)) ** 2    
                    )
                    if (distanceToJoint < inpactRange) {
                        let repulsionAngle = Math.atan2(
                            this.y - (joint.y * SCENE_HEIGHT),
                            this.x - (joint.x * SCENE_WIDTH)
                        );
                        let repulsionForce = (
                            (inpactRange - distanceToJoint) / inpactRange *
                            this.density
                        );
                        this.x += Math.cos(repulsionAngle) * repulsionForce;
                        this.y += Math.sin(repulsionAngle) * repulsionForce;
                        forced = true;
                    }
                }
            }

            if (!forced) {
                let attractionAngle = Math.atan2(
                    this.originalY - this.y,
                    this.originalX - this.x
                );
                let attractionForce = Math.abs(distanceToOrigin) / this.density;
                this.x += Math.cos(attractionAngle) * attractionForce;
                this.y += Math.sin(attractionAngle) * attractionForce;                
            }

        }
    }

    getTextData = function(message) {
        const data = [];
        p.text(message, 0, 25);    // draw once and get data
        for(let y = 0; y < p.textAscent(message); y++){
            let row = [];
            for(let x = 0; x < p.textWidth(message); x++){
                row.push(canvas.get(x, y))    // get data, [r, g, b, a]
            }
            data.push(row);
        }
        return data;
    }

    getCordinates = function() {
        const cordinate = []
        for (let y = 0; y < textData.length; y++) {
            let row = []
            for (let x = 0; x < textData[0].length; x++) {
                // the data equals [0, 0, 0, 255] or [255, 255,255, 255].
                // So pick up red value and judge
                let red = textData[y][x][0];
                // if < 128, regard the pixel as 'black'(1);
                if (red < 128) {
                    row.push(1);
                }else{
                    row.push(0);
                }
            }
            dotsCordinate.push(row);
        }
        return cordinate
    }

    createParticles = function(scaleRate, marginX, marginY) {
        const particles = [];
        for (let y = 0; y < dotsCordinate.length; y++) {
            for(let x = 0; x < dotsCordinate[0].length; x++){
                if(dotsCordinate[y][x] === 1){
                    let particle = new Particle(
                        x * scaleRate + marginX,
                        y * scaleRate + marginY
                    );
                    particles.push(particle)
                }
            }
        }
        return particles
    }

    p.preload = function() {
        myFont = p.loadFont('/lib/assets/fonts/Disclaimer-Plain.otf');
    }

    p.setup = function() {
        p.frameRate(FPS);
        canvas = p.createCanvas(SCENE_WIDTH, SCENE_HEIGHT);
        p.colorMode(p.RGB)
        p.noStroke();
        p.background("#EAD5E1");
        p.fill("#273E55");
        p.textSize(fontSize);
        p.textAlign(p.LEFT, p.CENTER);
    	p.textFont(myFont);
        textData = getTextData(message);
        dotCordinate = getCordinates();
        particles = createParticles(scaleRate, 50, 0);
    }
    p.draw = function() {
        p.background('#212529');
        let data_chunk = DATA[index];

        // early exit data check
        if (!data_chunk) {
            index = 0
            return
        }

        particles.forEach(p => {
            if (!LIVEMODE) {
                p.update([data_chunk]);
            } else {
                p.update(DATA);
            }
            p.draw()
        })

        if (!LIVEMODE) {
            // loop over DATA via index variable
            if (index == DATA.length - 1) {
              // no more DATA left, restart
              index = 0
            } else {
              // increment index for next run of draw() to create next frame
              index++
            }            
        }

    }
}

// make sure the following line remains unchanged!
stage = new p5(sketch, 'p5_stage')