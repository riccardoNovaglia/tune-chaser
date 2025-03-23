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
const sessionToggleButton = document.getElementById("session-toggle-button");
const skipNoteButton = document.getElementById("skip-note-button");
const playAgainButton = document.getElementById("play-again-button");
const noteDisplay = document.getElementById("note-display");
const instructionDisplay = document.getElementById("instruction-display");
const resultDisplay = document.getElementById("result-display");
const scoreDisplay = document.getElementById("score-display");

// Event listeners
sessionToggleButton.addEventListener("click", toggleSession);
skipNoteButton.addEventListener("click", skipCurrentNote);
playAgainButton.addEventListener("click", playCurrentNoteAgain);

sessionManager.onStateChange = (state) => {
  updateState(state);
};
sessionManager.onNoteChange = (noteName, frequency) =>
  (noteDisplay.textContent = `Target Note: ${noteName} (${frequency.toFixed(2)} Hz)`);
sessionManager.onScoreChange = (score) => {
  scoreDisplay.textContent = `Score: ${score}`;
  if (score > 0 && scoreDisplay.classList.contains('hidden')) {
    scoreDisplay.classList.remove('hidden');
  }
};

let analysisIntervalId = null;
let noiseGateTimeoutId = null;
const NOISE_GATE_THRESHOLD = 5; // Adjust as needed
const NOISE_GATE_DELAY = 1000; // 1 second delay

function toggleSession() {
  if (sessionManager.isSessionActive()) {
    stopSession();
    sessionToggleButton.textContent = "Start Session";
    sessionToggleButton.classList.remove("active");
    sessionToggleButton.classList.add("session-toggle");
    skipNoteButton.classList.add("hidden");
    playAgainButton.classList.add("hidden");
  } else {
    startSession();
    sessionToggleButton.textContent = "Stop Session";
    sessionToggleButton.classList.remove("session-toggle");
    sessionToggleButton.classList.add("active");
    skipNoteButton.classList.remove("hidden");
    playAgainButton.classList.remove("hidden");
  }
}

function skipCurrentNote() {
  resultDisplay.textContent = "Skipped note";
  resetTuningMeter();
  resetCurrentFrequencyDisplay();
  
  // Clear any ongoing analysis
  if (analysisIntervalId) {
    clearInterval(analysisIntervalId);
    analysisIntervalId = null;
  }
  clearTimeout(noiseGateTimeoutId);
  
  sessionManager.skipCurrentNote();
}

function startSession() {
  const selectedMicrophoneId = getMicrophoneId();

  if (!selectedMicrophoneId) {
    showMicrophoneSelectionError();
    return;
  }

  resultDisplay.textContent = "";
  resetCurrentFrequencyDisplay();
  clearTimeout(noiseGateTimeoutId); // Clear any existing noise gate timeout
  sessionManager.startSession(selectedMicrophoneId);
  
  // Reset score display to hidden when starting a new session
  if (sessionManager.getScore() === 0) {
    scoreDisplay.classList.add('hidden');
  }
}

function stopSession() {
  sessionManager.stopSession();

  // Clear any ongoing analysis
  if (analysisIntervalId) {
    clearInterval(analysisIntervalId);
    analysisIntervalId = null;
  }
  clearTimeout(noiseGateTimeoutId); // Clear any existing noise gate timeout
  
  // Hide the buttons
  skipNoteButton.classList.add("hidden");
  playAgainButton.classList.add("hidden");
}

function playCurrentNoteAgain() {
  // Clear any ongoing analysis
  if (analysisIntervalId) {
    clearInterval(analysisIntervalId);
    analysisIntervalId = null;
  }
  clearTimeout(noiseGateTimeoutId);
  
  // Reset displays
  resultDisplay.textContent = "";
  resetTuningMeter();
  resetCurrentFrequencyDisplay();
  
  // Play the current note again
  sessionManager.playCurrentNoteAgain();
}

function updateState(state) {
  // Update instruction based on state
  switch (state) {
    case SessionState.PLAYING_REFERENCE:
      instructionDisplay.textContent = "Listen to the reference note";
      break;
    case SessionState.LISTENING:
      instructionDisplay.textContent = "Now play the same note";
      break;
    case SessionState.SUCCESS_FEEDBACK:
      instructionDisplay.textContent = "Great job!";
      break;
    default:
      instructionDisplay.textContent = "";
  }

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
