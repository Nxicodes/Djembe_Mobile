// Constructor options
gazeDetector = new GazeDetector({
  gazeXThreshold: 0.15,      // X sensitivity (0.1-0.3, lower = more sensitive)
  smoothingFactor: 0.4,      // Smoothing (0-1, higher = smoother but slower)
  gazeRangeX: 1.5,           // Horizontal gaze range (1.0-3.0)
  gazeRangeY: 2.5,           // Vertical gaze range (1.0-4.0)
  showVideo: true,           // Show camera feed
  mirror: true               // Mirror for natural interaction
});

// Or adjust dynamically
gazeDetector.setXThreshold(0.12);
azeDetector.setSmoothingFactor(0.6);
gazeDetector.setGazeRange(2.0, 3.0);