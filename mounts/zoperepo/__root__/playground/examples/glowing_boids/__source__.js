// https://openprocessing.org/sketch/2208826 by 李秋霖
// "The Nature of Code" authored by D. Shiffman has been referred for the
// coding of the flocking part.

// flocking settings
var Pa = 1;  // alignment
var Pc = 2;  // cohesion
var Ps = 2;  // separation
var Pj = 3;  // joints, aka body parts


sketch = function(p) {

    class Boid {
        constructor(x, y) {
            this.pos = p.createVector(x, y);
            this.vel = p.createVector(p.random(-5, 5), p.random(-5, 5));
            this.acc = p.createVector(0, 0);
            this.maxforce = 0.05;
            this.maxspeed = 5;
            this.alignRange = p.random(0, 100);
            this.separateRange = p.random(0, 100);
            this.cohesiveRange = p.random(0, 100);
            this.jointsRange = 100;
            this.img;
        }

        update() {
            this.vel.add(this.acc);
            this.vel.limit(this.maxspeed);
            this.pos.add(this.vel);
            this.acc.mult(0);
        }

        display() {
            p.image(this.img, this.pos.x, this.pos.y);
        }
        
        wallThrough() {
            if (this.pos.x > p.width) {
                this.pos.x = 0;
            }
            if (this.pos.x < 0) {
                this.pos.x = p.width;
            }
            if (this.pos.y > p.height) {
                this.pos.y = 0;
            }
            if (this.pos.y < 0) {
                this.pos.y = p.height;
            }
        }

        createParticleImage() {
        
            let side = 200;
            let center = side / 2;
            
            this.img = p.createImage(side, side);
            
            let num = p.pow(10, 1.8);
    
            let Cr = p.map(this.alignRange, 0, 100, 100, 255);
            let Cg = p.map(this.cohesiveRange, 0, 100, 100, 255);
            let Cb = p.map(this.separateRange, 0, 100, 100, 255);
            
            this.img.loadPixels();
            for (let y = 0; y < side; y++) {
                for (let x = 0; x < side; x++) {
                    let d = (p.sq(center - x) + p.sq(center - y))/num;
                    let col = p.color(Cr/d, Cg/d, Cb/d);
                    this.img.set(x, y, col);
                }
            }
            this.img.updatePixels();
            return this.img;
        }
        
        applyForce(force) {
            this.acc.add(force);
        }
        
        align(boids) {
            let sum = p.createVector(0, 0);
            let count = 0;
            for (let other of boids) {
                let d = p5.Vector.dist(this.pos, other.pos);
                if (d > 0 && d < this.alignRange) {
                    sum.add(other.vel);
                    count++;
                }
            }
            if (count > 0) {
                sum.div(count);
                sum.normalize();
                sum.mult(this.maxspeed);
                let steer = p5.Vector.sub(sum, this.vel);
                steer.limit(this.maxforce);
                return steer;
            } else {
                return p.createVector(0, 0);
            }
        }
        
        separate(boids) {
            let sum = p.createVector(0, 0);
            let count = 0;
            for (let other of boids) {
                let d = p5.Vector.dist(this.pos, other.pos);
                if (d > 0 && d < this.separateRange) {
                    let diff = p5.Vector.sub(this.pos, other.pos);
                    diff.normalize();
                    diff.div(d);
                    sum.add(diff);
                    count++;
                }
            }
            if (count > 0) {
                sum.div(count);
                sum.normalize();
                sum.mult(this.maxspeed);
                let steer = p5.Vector.sub(sum, this.vel);
                steer.limit(this.maxforce);
                return steer;
            } else {
                return p.createVector(0, 0);
            }
        }

        separate_joints(joints) {
            let sum = p.createVector(0, 0);
            let count = 0;
            for (let other of joints) {
                let joint_pos = p.createVector(
                    other.x * SCENE_WIDTH,
                    other.y * SCENE_HEIGHT
                )
                let d = p5.Vector.dist(this.pos, joint_pos);
                if (d > 0 && d < this.jointsRange) {
                    let diff = p5.Vector.sub(this.pos, joint_pos);
                    diff.normalize();
                    diff.div(d);
                    sum.add(diff);
                    count++;
                }
            }
            if (count > 0) {
                sum.div(count);
                sum.normalize();
                sum.mult(this.maxspeed);
                let steer = p5.Vector.sub(sum, this.vel);
                steer.limit(this.maxforce);
                return steer;
            } else {
                return p.createVector(0, 0);
            }            
        }
        
        cohesive(boids) {
            let sum = p.createVector(0, 0);
            let count = 0;
            for (let other of boids) {
                let d = p5.Vector.dist(this.pos, other.pos);
                if (d > 0 && d < this.cohesiveRange) {
                    sum.add(other.pos);
                    count++;
                }
            }
            if (count > 0) {
                sum.div(count);
                sum.sub(this.pos)
                sum.normalize();
                sum.mult(this.maxspeed);
                let steer = p5.Vector.sub(sum, this.vel);
                steer.limit(this.maxforce);
                return steer;
            } else {
                return p.createVector(0, 0);
            }
        }
        
        flocking(boids, poses) {
            let sep = this.separate(boids);
            let ali = this.align(boids);
            let coh = this.cohesive(boids);
            
            sep.mult(Ps);
            ali.mult(Pa);
            coh.mult(Pc);
            
            this.applyForce(sep);
            this.applyForce(ali);
            this.applyForce(coh);

            for (let pose of poses) {
                let sepj = this.separate_joints(pose);
                sepj.mult(Pj);
                this.applyForce(sepj)
            }

        }
    }
    
    class Boids {
        constructor() {
            this.boids = [];
        }

        run(poses) {
            if (this.boids.length > 0) {
                for (let boid of this.boids) {
                    boid.flocking(this.boids, poses);
                    boid.update();
                    boid.wallThrough();
                    boid.display();
                }
            }
        }

        addBoid(x, y) {
            this.boids.push(new Boid(x, y));
            this.boids[this.boids.length - 1].createParticleImage();
        }

        reset() {
            this.boids = [];
        }
    }

    let flock = new Boids();
    let index = 0;

    p.setup = function() {
        p.createCanvas(SCENE_WIDTH, SCENE_HEIGHT);
        p.blendMode(p.ADD);
        p.imageMode(p.CENTER);
        p.frameRate(FPS);
        p.background(0);
        // add 100 boids on random coordinates inside of the scene
		for (let i = 0; i < 100; i++) {
			flock.addBoid(
			    p.random(0, SCENE_WIDTH),
			    p.random(0, SCENE_HEIGHT)
			);
		}
    }

    p.draw = function() {
        p.clear();
        p.background('#212529');

        let data_chunk = DATA[index];

        // early exit data check
        if (!data_chunk) {
            index = 0
            return
        }

        p.stroke('white')
        draw_stickfigure(p, data_chunk)

        if(!LIVEMODE) {
            flock.run([data_chunk]);
            if (index == DATA.length - 1) {
                index = 0
            } else {
                index++
            }
        } else {
            flock.run(DATA);
        }

    }

}

stage = new p5(sketch, 'p5_stage')