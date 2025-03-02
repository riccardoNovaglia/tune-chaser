import { getMicrophoneId } from "./microphone.js";
import { analyzeInput } from "./analyzeInput.js";
import { sessionManager, SessionState } from "./sessionManager.js";

// UI Elements
const startSessionButton = document.getElementById("start-session-button");
const stopSessionButton = document.getElementById("stop-session-button");
const noteDisplay = document.getElementById("note-display");
const stateDisplay = document.getElementById("state-display");
const resultDisplay = document.getElementById("result-display");
const currentFrequencyDisplay = document.getElementById(
  "current-frequency-display",
);
const scoreDisplay = document.getElementById("score-display");

// Event listeners
startSessionButton.addEventListener("click", startSession);
stopSessionButton.addEventListener("click", stopSession);

// Set up session manager callbacks
sessionManager.onStateChange = updateStateDisplay;
sessionManager.onNoteChange = updateNoteDisplay;
sessionManager.onScoreChange = updateScoreDisplay;

// Analysis interval ID
let analysisIntervalId = null;

function startSession() {
  // Update UI
  startSessionButton.disabled = true;
  stopSessionButton.disabled = false;
  resultDisplay.textContent = "";
  currentFrequencyDisplay.textContent = "Current frequency: -- Hz";

  const selectedMicrophoneId = getMicrophoneId();

  // Start the session
  sessionManager.startSession(selectedMicrophoneId);
}

function stopSession() {
  // Update UI
  startSessionButton.disabled = false;
  stopSessionButton.disabled = true;

  // Stop the session
  sessionManager.stopSession();

  // Clear any ongoing analysis
  if (analysisIntervalId) {
    clearInterval(analysisIntervalId);
    analysisIntervalId = null;
  }
}

function updateStateDisplay(state) {
  stateDisplay.textContent = `State: ${state}`;

  // If we're in listening state, start the analysis
  if (state === SessionState.LISTENING) {
    startAnalysis();
  } else if (analysisIntervalId) {
    // Stop analysis if we're not in listening state
    clearInterval(analysisIntervalId);
    analysisIntervalId = null;
  }
}

function updateNoteDisplay(noteName, frequency) {
  noteDisplay.textContent = `Target Note: ${noteName} (${frequency.toFixed(2)} Hz)`;
}

function updateScoreDisplay(score) {
  scoreDisplay.textContent = `Score: ${score}`;
}

function startAnalysis() {
  if (
    !sessionManager.isSessionActive() ||
    sessionManager.getCurrentState() !== SessionState.LISTENING
  ) {
    return;
  }

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

  // Define callbacks for the analyzer
  const onMatchDetected = () => {
    resultDisplay.textContent = "Success! Correct note detected.";
    sessionManager.handleNoteMatch();
  };

  const onFrequencyUpdate = (frequency, amplitude) => {
    currentFrequencyDisplay.textContent = `Current frequency: ${frequency.toFixed(2)} Hz (Strength: ${amplitude.toFixed(1)})`;
  };

  const onNoFrequencyDetected = (amplitude) => {
    currentFrequencyDisplay.textContent = `Current frequency: -- Hz (no sound detected, level: ${amplitude.toFixed(1)})`;
  };

  const onMatchProgress = (matchResult) => {
    resultDisplay.textContent = `Off by ${Math.abs(matchResult.centsOff).toFixed(1)} cents (${matchResult.direction})`;
  };

  // We don't need the onAnalysisComplete callback for continuous mode
  const onAnalysisComplete = null;

  // Start continuous analysis
  analysisIntervalId = setInterval(() => {
    if (sessionManager.getCurrentState() === SessionState.LISTENING) {
      analyzeInput({
        analyser,
        audioContext,
        targetFrequency,
        onMatchDetected,
        onFrequencyUpdate,
        onNoFrequencyDetected,
        onMatchProgress,
        onAnalysisComplete,
        continuousMode: true, // Add this flag to indicate continuous mode
      });
    } else {
      clearInterval(analysisIntervalId);
      analysisIntervalId = null;
    }
  }, 100); // Run analysis every 100ms
}
