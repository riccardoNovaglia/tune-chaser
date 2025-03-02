import { getMicrophoneId, showMicrophoneSelectionError } from "./microphone.js";
import { analyzeInput } from "./analyzeInput.js";
import { sessionManager, SessionState } from "./sessionManager.js";
import {
  updateTuningMeter,
  resetTuningMeter,
  updateCurrentFrequencyDisplay,
  resetCurrentFrequencyDisplay,
} from "./tuningMeter.js";

// UI Elements
const startSessionButton = document.getElementById("start-session-button");
const stopSessionButton = document.getElementById("stop-session-button");
const noteDisplay = document.getElementById("note-display");
const stateDisplay = document.getElementById("state-display");
const resultDisplay = document.getElementById("result-display");
const scoreDisplay = document.getElementById("score-display");

// Event listeners
startSessionButton.addEventListener("click", startSession);
stopSessionButton.addEventListener("click", stopSession);

sessionManager.onStateChange = (state) => {
  stateDisplay.textContent = `State: ${state}`;
  updateState(state);
};
sessionManager.onNoteChange = (noteName, frequency) =>
  (noteDisplay.textContent = `Target Note: ${noteName} (${frequency.toFixed(2)} Hz)`);
sessionManager.onScoreChange = (score) =>
  (scoreDisplay.textContent = `Score: ${score}`);

let analysisIntervalId = null;
let noiseGateTimeoutId = null;
const NOISE_GATE_THRESHOLD = 5; // Adjust as needed
const NOISE_GATE_DELAY = 1000; // 1 second delay

function startSession() {
  const selectedMicrophoneId = getMicrophoneId();

  if (!selectedMicrophoneId) {
    showMicrophoneSelectionError();
    return;
  }

  startSessionButton.disabled = true;
  stopSessionButton.disabled = false;
  resultDisplay.textContent = "";
  resetCurrentFrequencyDisplay();
  clearTimeout(noiseGateTimeoutId); // Clear any existing noise gate timeout
  sessionManager.startSession(selectedMicrophoneId);
}

function stopSession() {
  startSessionButton.disabled = false;
  stopSessionButton.disabled = true;

  sessionManager.stopSession();

  // Clear any ongoing analysis
  if (analysisIntervalId) {
    clearInterval(analysisIntervalId);
    analysisIntervalId = null;
  }
  clearTimeout(noiseGateTimeoutId); // Clear any existing noise gate timeout
}

function updateState(state) {
  // If we're in listening state, start the analysis
  if (state === SessionState.LISTENING) {
    noiseGateTimeoutId = setTimeout(startAnalysis, NOISE_GATE_DELAY);
  } else if (analysisIntervalId) {
    // Stop analysis if we're not in listening state
    clearInterval(analysisIntervalId);
    analysisIntervalId = null;
  }

  // Reset tuning meter when not in listening state
  if (state !== SessionState.LISTENING) {
    resetTuningMeter();
  }
}

function startAnalysis() {
  const analyser = sessionManager.getAnalyser();
  const audioContext = sessionManager.getAudioContext();
  const targetFrequency = sessionManager.getCurrentNote();

  if (!analyser || !audioContext || !targetFrequency) {
    console.error("Missing required components for analysis", {
      analyser,
      audioContext,
      targetFrequency,
    });
    return;
  }

  // Start continuous analysis
  analysisIntervalId = setInterval(() => {
    analyzeInput({
      analyser,
      audioContext,
      targetFrequency,
      noiseGateThreshold: NOISE_GATE_THRESHOLD,
      onMatchDetected: () => {
        resultDisplay.textContent = "Success! Correct note detected.";
        sessionManager.handleNoteMatch();
      },
      onFrequencyUpdate: (frequency, amplitude) => {
        updateCurrentFrequencyDisplay(frequency, amplitude);
      },
      onNoFrequencyDetected: (amplitude) => {
        updateCurrentFrequencyDisplay(null, amplitude);
      },
      onMatchProgress: (matchResult) => {
        // Update the tuning meter
        updateTuningMeter(matchResult.centsOff);

        // Still show text result
        resultDisplay.textContent = `${matchResult.direction}`;
      },
    });
  }, 100);
}
