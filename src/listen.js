import { getMicrophoneId } from "./microphone.js";
import { getLastPlayedNoteFrequency } from "./playNote.js";

document
  .getElementById("start-analyze-button")
  .addEventListener("click", startAnalyzingInput);

function startAnalyzingInput() {
  const analyzeButton = document.getElementById("start-analyze-button");
  const resultDisplay = document.getElementById("result-display");
  const currentFrequencyDisplay = document.getElementById(
    "current-frequency-display",
  );

  analyzeButton.textContent = "Analyzing...";
  analyzeButton.disabled = true;
  resultDisplay.textContent = "";
  currentFrequencyDisplay.textContent = "Current frequency: -- Hz";

  const selectedMicrophoneId = getMicrophoneId();
  const targetFrequency = getLastPlayedNoteFrequency();

  const constraints = {
    audio: {
      deviceId: selectedMicrophoneId
        ? { exact: selectedMicrophoneId }
        : undefined,
      noiseSuppression: false,
      echoCancellation: false,
      autoGainControl: true, // TODO: this might be better as false, check
    },
  };

  const onMatchDetected = () => {
    resultDisplay.textContent = "Success! Correct note detected.";
    analyzeButton.textContent = "Start Analyzing";
    analyzeButton.disabled = false;
  };

  const onFrequencyUpdate = (frequency, amplitude) => {
    currentFrequencyDisplay.textContent = `Current frequency: ${frequency.toFixed(2)} Hz (Strength: ${amplitude})`;
  };

  const onNoFrequencyDetected = (amplitude) => {
    currentFrequencyDisplay.textContent = `Current frequency: -- Hz (no sound detected, level: ${amplitude.toFixed(1)})`;
  };

  const onMatchProgress = (matchResult) => {
    resultDisplay.textContent = `Off by ${Math.abs(matchResult.centsOff).toFixed(1)} cents (${matchResult.direction})`;
  };

  const onAnalysisComplete = (success) => {
    if (success) {
      resultDisplay.textContent = "Success! Correct note detected.";
    } else {
      resultDisplay.textContent = "Time's up. Try again.";
    }
    analyzeButton.textContent = "Start Analyzing";
    analyzeButton.disabled = false;
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const microphone = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      microphone.connect(analyser);

      analyzeInput({
        analyser,
        audioContext,
        targetFrequency,
        onMatchDetected,
        onFrequencyUpdate,
        onNoFrequencyDetected,
        onMatchProgress,
        onAnalysisComplete,
      });
    })
    .catch((err) => {
      console.error("Error accessing the microphone", err);
      analyzeButton.textContent = "Start Analyzing";
      analyzeButton.disabled = false;
    });
}

function analyzeInput({
  analyser,
  audioContext,
  targetFrequency,
  onMatchDetected,
  onFrequencyUpdate,
  onNoFrequencyDetected,
  onMatchProgress,
  onAnalysisComplete,
}) {
  const startTime = audioContext.currentTime;
  let detectedCorrectNote = false;

  setupAnalyser(analyser);

  // Storage for recent frequency readings
  const recentFrequencies = [];
  const MAX_RECENT_FREQUENCIES = 5;

  // Create frequency data buffer
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function analyze() {
    analyser.getByteFrequencyData(dataArray);

    // Get frequency range for analysis
    const { lowIndex, highIndex } = getFrequencyRange(analyser, audioContext);

    // Calculate amplitude in relevant range
    const amplitudeData = getAmplitudeData(dataArray, lowIndex, highIndex);

    // Minimum threshold for sound detection
    if (amplitudeData.averageAmplitude > 5) {
      // Detect the dominant frequency
      const frequencyData = detectFrequency(
        dataArray,
        lowIndex,
        highIndex,
        analyser,
        audioContext,
      );

      if (frequencyData.isValid) {
        // Track recent frequencies for stability
        updateRecentFrequencies(
          recentFrequencies,
          frequencyData.refinedFrequency,
          MAX_RECENT_FREQUENCIES,
        );

        const medianFrequency = calculateMedianFrequency(recentFrequencies);

        // Update UI with current frequency
        onFrequencyUpdate(medianFrequency, amplitudeData.maxValue);

        const matchResult = checkNoteMatch(medianFrequency, targetFrequency);

        if (matchResult.isMatch) {
          onMatchDetected(matchResult);
          detectedCorrectNote = true;
          return;
        } else {
          onMatchProgress(matchResult);
        }
      }
    } else {
      onNoFrequencyDetected(amplitudeData.averageAmplitude);
    }

    // Continue analysis or finish if time is up
    const currentTime = audioContext.currentTime;
    if (currentTime - startTime < 10) {
      requestAnimationFrame(analyze);
    } else {
      onAnalysisComplete(detectedCorrectNote);
    }
  }

  requestAnimationFrame(analyze);
}

// Set up the audio analyzer with optimal settings
function setupAnalyser(analyser) {
  analyser.fftSize = 4096; // Higher resolution for better accuracy
  analyser.smoothingTimeConstant = 0.2; // Less smoothing for responsive detection
}

// Calculate the frequency range for musical notes
function getFrequencyRange(analyser, audioContext) {
  // Focus on typical musical range (80Hz to 5kHz)
  const lowIndex = Math.floor(
    (80 * analyser.fftSize) / audioContext.sampleRate,
  );
  const highIndex = Math.floor(
    (5000 * analyser.fftSize) / audioContext.sampleRate,
  );
  return { lowIndex, highIndex };
}

// Calculate amplitude information from frequency data
function getAmplitudeData(dataArray, lowIndex, highIndex) {
  let sum = 0;
  let maxIndex = lowIndex;
  let maxValue = dataArray[lowIndex];

  for (let i = lowIndex; i <= highIndex; i++) {
    sum += dataArray[i];
    if (dataArray[i] > maxValue) {
      maxValue = dataArray[i];
      maxIndex = i;
    }
  }

  const averageAmplitude = sum / (highIndex - lowIndex + 1);
  return { averageAmplitude, maxIndex, maxValue };
}

// Detect the primary frequency from FFT data
function detectFrequency(
  dataArray,
  lowIndex,
  highIndex,
  analyser,
  audioContext,
) {
  const { maxIndex, maxValue } = getAmplitudeData(
    dataArray,
    lowIndex,
    highIndex,
  );
  const baseFrequency = (maxIndex * audioContext.sampleRate) / analyser.fftSize;

  let refinedFrequency = baseFrequency;
  let isValid = false;

  // Use interpolation to refine the frequency beyond bin resolution
  if (maxIndex > lowIndex && maxIndex < highIndex) {
    const prevValue = dataArray[maxIndex - 1];
    const nextValue = dataArray[maxIndex + 1];

    // Quadratic interpolation
    const delta =
      (0.5 * (prevValue - nextValue)) / (prevValue - 2 * maxValue + nextValue);
    const interpolatedIndex = maxIndex + delta;
    refinedFrequency =
      (interpolatedIndex * audioContext.sampleRate) / analyser.fftSize;

    isValid = !isNaN(refinedFrequency) && refinedFrequency > 0;
  }

  return { isValid, refinedFrequency, maxValue };
}

// Add a new frequency to the history array
function updateRecentFrequencies(recentFrequencies, newFrequency, maxSize) {
  if (recentFrequencies.length >= maxSize) {
    recentFrequencies.shift(); // Remove oldest
  }
  recentFrequencies.push(newFrequency);
}

// Get median frequency (more stable than mean)
function calculateMedianFrequency(frequencies) {
  const sortedFrequencies = [...frequencies].sort((a, b) => a - b);
  return sortedFrequencies[Math.floor(sortedFrequencies.length / 2)];
}

// Check if detected note matches the target note
function checkNoteMatch(detectedFrequency, targetFrequency) {
  // Calculate difference in cents (musical unit)
  const centsOff = 1200 * Math.log2(detectedFrequency / targetFrequency);
  const centsThreshold = 25; // Quarter tone threshold
  const isMatch = Math.abs(centsOff) < centsThreshold;
  const direction = centsOff > 0 ? "too high" : "too low";

  return { isMatch, centsOff, direction };
}
