let gif;
let nod;
let vibe;
let djembe;
let dW;
let dH;
let aniDict;
let next;
let cAni = 0;

let pTally = 0;
let cLevelCap = 3;


let cam;                // PhoneCamera instance
let faceMesh;           // ML5 FaceMesh model
let faces = [];         // Detected faces
let showVideo = true;   // Toggle video display

// Face tracking points
let leftEarIndex = 234;    // Left ear keypoint
let rightEarIndex = 454;   // Right ear keypoint
let noseIndex = 1;         // Nose bridge

let leftEarData = null;
let rightEarData = null;
let noseData = null;

// Gaze position
let gazeX = 0;
let gazeY = 0;
// tunables
let SMOOTHING_FACTOR = 0.4;
let GAZE_RANGE_X = 1.5;
let GAZE_RANGE_Y = 2.5;

let lastNoseY = 0;
let nodThreshold = 20; // pixels moved down to trigger nod
let nodCooldown = 0;
let beatInterval = 2000; // 1 second in milliseconds
let lastBeatTime = 0;
let nodOnBeat = false;
let beatSpeed = 700;
let difficulty = 200;

// sound variables (renamed so they don't collide with animation vars)
let s_hit1, s_hit2, s_roll1, s_roll2, s_grouphit;

let noHitList = [0,2,4,6,8,11, 12,13];

function preload(){
    focused = loadAnimation("gif/0001.png", "gif/0062.png");
    hit1 = loadAnimation("gif/0063.png", "gif/0084.png"); // animation
    trans1 = loadAnimation("gif/0084.png", "gif/0111.png");
    hit2 = loadAnimation("gif/0116.png", "gif/0141.png"); // animation
    trans2 = loadAnimation("gif/0145.png", "gif/0169.png");
    hit3 = loadAnimation("gif/0178.png", "gif/0200.png"); // animation
    trans3 = loadAnimation("gif/0203.png", "gif/0228.png");
    hit4 = loadAnimation("gif/0234.png", "gif/0254.png");// animation
    trans4 = loadAnimation("gif/0254.png", "gif/0380.png");
    hit5 = loadAnimation("gif/0405.png", "gif/0415.png");// animation
    hit6 = loadAnimation("gif/0430.png", "gif/0454.png");// animation
    climax = loadAnimation("gif/0455.png", "gif/0578.png");// animation
    cooldown = loadAnimation("gif/0611.png", "gif/0759.png");// animation

    aniList = ["focused", 'hit1', 'trans1', 'hit2', 'trans2', 'hit3', 'trans3', 'hit4', 'trans4', 'hit5', 'hit6', 'climax', 'cooldown'];
    console.log('made it here!');

    // load sounds into distinct variables (do NOT reuse hit1/hit2)
    s_hit1 = loadSound("sound/hit1.wav");
    console.log('sound1 loaded');
    s_hit2 = loadSound("sound/hit2.wav");
    s_roll1 = loadSound("sound/roll1.wav");
    s_roll2 = loadSound("sound/roll2.wav");
    s_grouphit = loadSound("sound/grouphit.wav");
    console.log('All sounds loaded yeah?');

    dW = windowWidth;
    dH = windowHeight;
}


function setup() 
{


	createCanvas(dW, dH);
    lockGestures();
    cam = createPhoneCamera('user', true, 'fitHeight');
    enableCameraTap();

cam.onReady(() => {
    // Configure ML5 FaceMesh AFTER camera is ready
    let options = {
      maxFaces: 1,           // Only detect 1 face
      refineLandmarks: false, // Faster without refinement
      flipHorizontal: false  // Don't flip in ML5 - cam.mapKeypoint() handles mirroring
    };
    
    // Create FaceMesh model and start detection when ready
    faceMesh = ml5.faceMesh(options, () => {
      faceMesh.detectStart(cam.videoElement, gotFaces);
    });
  });




    djembe = createSprite(dW/2, dH/2, dW, dH);
    djembe.addAnimation('focused', focused);
    djembe.addAnimation('hit1', hit1);
    djembe.addAnimation('trans1', trans1);
    djembe.addAnimation('hit2', hit2);
    djembe.addAnimation('trans2', trans2);
    djembe.addAnimation('hit3', hit3);
    djembe.addAnimation('trans3', trans3);
    djembe.addAnimation('hit4', hit4);
    djembe.addAnimation('trans4', trans4);
    djembe.addAnimation('hit5', hit5);
    djembe.addAnimation('hit6', hit6);
    djembe.addAnimation('climax', climax);
    djembe.addAnimation('cooldown', cooldown);
    djembe.changeAnimation('focused');
    djembe.animation.stop();
    djembe.animation.looping = false;
    cAni = 0;
    next = true;

   
}

function draw()
{
    background(0);
    // if (next){

    //     progressionHandler();
        
    // }

    djembe.draw();
    // Default gaze position (center)
    let targetX = width / 2;
    let targetY = height / 2;

    // Process face data if detected
  if (faces.length > 0) {
    leftEarData = getKeypoint(leftEarIndex, 0);
    rightEarData = getKeypoint(rightEarIndex, 0);
    noseData = getKeypoint(noseIndex, 0);

    if (leftEarData && rightEarData && noseData) {
      calculateGaze();
      detectNod(noseData.y);
      targetX = gazeX;
      targetY = gazeY;
      
      // Draw tracking points
      push();
      noStroke();
      fill(255, 0, 0, 150);
      circle(leftEarData.x, leftEarData.y, 15);
      circle(rightEarData.x, rightEarData.y, 15);
      fill(0, 255, 0, 150);
      circle(noseData.x, noseData.y, 18);
      pop();
    }
  }
}

function progressionHandler() {
   console.log('we handling it');
        if (pTally < cLevelCap){
            console.log('count up!!');
           pTally += 1;
         
        } else {
            if (aniList.length === cAni) {
                cAni = 0
            } else {
            cAni +=1;
            }
            pTally = 0;
        djembe.changeAnimation(aniList[cAni]);
        djembe.animation.looping = false;
        }
        
    
}

function calculateGaze() {
  // Get raw 3D keypoints
  let leftEarRaw = faces[0].keypoints[leftEarIndex];
  let rightEarRaw = faces[0].keypoints[rightEarIndex];
  let noseRaw = faces[0].keypoints[noseIndex];
  
  // Calculate face width
  let faceWidth = abs(leftEarRaw.x - rightEarRaw.x);
  
  // Calculate center point between ears
  let earCenterX = (leftEarRaw.x + rightEarRaw.x) / 2;
  let earCenterY = (leftEarRaw.y + rightEarRaw.y) / 2;
  
  // Calculate nose offset from ear center
  let noseOffsetX = noseRaw.x - earCenterX;
  let noseOffsetY = noseRaw.y - earCenterY;
  
  // Normalize offsets by face width
  let normalizedOffsetX = noseOffsetX / faceWidth;
  let normalizedOffsetY = noseOffsetY / faceWidth;
  
  // Apply smoothing
  let smoothedX = lerp(gazeX, width / 2 - (normalizedOffsetX * width * GAZE_RANGE_X), 1 - SMOOTHING_FACTOR);
  let smoothedY = lerp(gazeY, height / 2 + (normalizedOffsetY * height * GAZE_RANGE_Y), 1 - SMOOTHING_FACTOR);
  
  // Set gaze position
  gazeX = constrain(smoothedX, 0, width);
  gazeY = constrain(smoothedY, 0, height);
}

function gotFaces(results) {
  faces = results;
//   if (faces.length > 0) {
//     console.log('Face detected! Keypoints:', faces[0].keypoints.length);
//   }
}

function getKeypoint(index, faceNumber = 0) {
  if (!faces || faces.length === 0) return null;
  if (faceNumber >= faces.length) return null;
  if (!faces[faceNumber].keypoints) return null;
  if (index >= faces[faceNumber].keypoints.length) return null;
  
  let keypoint = faces[faceNumber].keypoints[index];
  let mapped = cam.mapKeypoint(keypoint);
  
  return mapped;
}

function setNext(){
    next = true;
}

function avoidDat(num){
   for (x in noHitList){
    if (num === noHitList[x])
    {
        return true;
    } 
   }
   return false;
}

function makeSound(s){
    if (s === "hit"){
   if (cAni < 5){
            s_hit1.play();
        } else if (cAni < 7){
            s_hit2.play();
        } else {
            s_grouphit.play();
        } } else if (cAni < 9){
            s_roll1.play();
        } else {
            s_roll2.play();
        }

}
// Add this new function
function detectNod(currentNoseY) {
//console.log('checking_nods');

  let currentTime = millis();
  let timeSinceBeat = currentTime - lastBeatTime;
  
  // Check if nod occurred (nose moved down by threshold)
  if (currentNoseY - lastNoseY > nodThreshold && nodCooldown <= 0) {

    nodOnBeat = (abs(timeSinceBeat) < beatSpeed +200 && abs(timeSinceBeat) > beatSpeed - difficulty); // Within 200ms of beat
    console.log('Nod detected! On beat: ' + nodOnBeat + ". delay was:" + timeSinceBeat);
    nodCooldown = 300; // Prevent multiple detections

    lastBeatTime = currentTime;
    if (!djembe.animation.playing){
        if (avoidDat(cAni)) {
            if (cAni < aniList.length){
            cAni +=1;
            makeSound("roll");
            } else {
            cAni = 0;
            }
            
            djembe.changeAnimation(aniList[cAni]);
            djembe.animation.looping = false;
            return
         }
         
        
        djembe.animation.play(0);
         makeSound("hit");
        if (nodOnBeat) {
         progressionHandler();
        }
  } else {
        if(avoidDat(cAni)){
            console.log("avoiding doing anything");
            return
        } else {
            makeSound("hit");
            djembe.animation.play(0);
            if (nodOnBeat) {
         progressionHandler();
        }
             console.log('animation wasnt playing, but wasnt a trans, so we hitting');
        }
    }
}

  
  // Cooldown timer
  if (nodCooldown > 0) {
    nodCooldown -= deltaTime;
  }
  
  lastNoseY = currentNoseY;
}

