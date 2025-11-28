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

let cam;                // PhoneCamera instance
let faceMesh;           // ML5 FaceMesh model
let faces = [];         // Detected faces
let showVideo = true;   // Toggle video display

// Face tracking points
let leftEarIndex = 234; 
let rightEarIndex = 454;
let noseIndex = 1;        

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
let nodThreshold = 20;
let nodCooldown = 0;
let beatInterval = 2000;
let lastBeatTime = 0;
let nodOnBeat = false;
let beatSpeed = 700;
let difficulty = 200;

// sound variables 
let s_hit1, s_hit2, s_roll1, s_roll2, s_grouphit;

let noHitList = [0,2,4,6,8,11, 12,13];

// Flag to ensure camera/ML5 is initialized only once
let isInitialized = false; 


// =======================================================
// === START AUDIO AND CAMERA ON FIRST USER TOUCH ===
// =======================================================

function touchStarted() {
    // Only initialize the camera/ML5 once
    if (!isInitialized) {
        // Unlock the p5.js audio context on the first touch for mobile compatibility
        userStartAudio(); 
        
        initCameraAndML5();
        isInitialized = true;
        
        // Prevent default browser behavior like scrolling
        return false; 
    }
}

function initCameraAndML5() {
    // Start the camera and request permissions
    cam = createPhoneCamera('user', true, 'fitHeight');
    enableCameraTap();

    // Set up ML5 only after the camera is ready
    cam.onReady(() => {
        let options = {
            maxFaces: 1,
            // 💡 NEW: Reduced resolution for mobile performance
            inputResolution: 256, 
            refineLandmarks: false,
            flipHorizontal: false
        };
        
        faceMesh = ml5.faceMesh(options, () => {
            faceMesh.detectStart(cam.videoElement, gotFaces);
        });
    });
}

// =======================================================


function preload(){
    focused = loadAnimation("gif/0001.jpg", "gif/0062.jpg");
    hit1 = loadAnimation("gif/0063.jpg", "gif/0084.jpg"); // animation
    trans1 = loadAnimation("gif/0084.jpg", "gif/0111.jpg");
    hit2 = loadAnimation("gif/0116.jpg", "gif/0141.jpg"); // animation
    trans2 = loadAnimation("gif/0145.jpg", "gif/0169.jpg");
    hit3 = loadAnimation("gif/0178.jpg", "gif/0200.jpg"); // animation
    trans3 = loadAnimation("gif/0203.jpg", "gif/0228.jpg");
    hit4 = loadAnimation("gif/0234.jpg", "gif/0254.jpg");// animation
    trans4 = loadAnimation("gif/0254.jpg", "gif/0380.jpg");
    hit5 = loadAnimation("gif/0405.jpg", "gif/0415.jpg");// animation
    hit6 = loadAnimation("gif/0430.jpg", "gif/0454.jpg");// animation
    climax = loadAnimation("gif/0455.jpg", "gif/0578.jpg");// animation
    cooldown = loadAnimation("gif/0611.jpg", "gif/0759.jpg");// animation

    aniList = ["focused", 'hit1', 'trans1', 'hit2', 'trans2', 'hit3', 'trans3', 'hit4', 'trans4', 'hit5', 'hit6', 'climax', 'cooldown'];
    console.log('made it here!');

    // load sounds into distinct variables
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
    
    // Removed: createPhoneCamera and enableCameraTap initialization 

    djembe = createSprite(dW/2, dH/2, dW, dH);
    djembe.addAnimation('focused', focused);
    djembe.addAnimation('hit1', hit1);
    djembe.addAnimation('trans1', trans1);
    djembe.addAnimation('hit2', hit2);
    djembe.addAnimation('trans2', trans2);
    djembe.addAnimation('hit3', hit3);
    d