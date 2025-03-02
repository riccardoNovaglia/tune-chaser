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

sessionManager.onStateChange = (state) => {
  stateDisplay.textContent = `State: ${state}`;
  updateState(state);
};
sessionManager.onNoteChange = (noteName, frequency) =>
  (noteDisplay.textContent = `Target Note: ${noteName} (${frequency.toFixed(2)} Hz)`);
sessionManager.onScoreChange = (score) =>
  (scoreDisplay.textContent = `Score: ${score}`);

let analysisIntervalId = null;

function startSession() {
  startSessionButton.disabled = true;
  stopSessionButton.disabled = false;
  resultDisplay.textContent = "";
  currentFrequencyDisplay.textContent = "Current frequency: -- Hz";

  const selectedMicrophoneId = getMicrophoneId();

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
}

function updateState(state) {
  // If we're in listening state, start the analysis
  if (state === SessionState.LISTENING) {
    startAnalysis();
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

// Function to update the tuning meter based on cents off
function updateTuningMeter(centsOff) {
  const needle = document.getElementById("tuning-needle");
  const centsDisplay = document.getElementById("cents-display");

  // Clamp the cents value to a reasonable range for display (-50 to +50 cents)
  const clampedCents = Math.max(-50, Math.min(50, centsOff));

  // Calculate position (50% is center, each 10 cents = 5% movement)
  const position = 50 + clampedCents * 0.5;

  // Update needle position
  needle.style.left = `${position}%`;

  // Update cents display
  centsDisplay.textContent = `${Math.abs(centsOff).toFixed(1)}¢`;

  // Change color based on how close to correct pitch
  if (Math.abs(centsOff) < 5) {
    needle.style.backgroundColor = "#00cc00"; // Very close - green
  } else if (Math.abs(centsOff) < 15) {
    needle.style.backgroundColor = "#66cc00"; // Close - yellow-green
  } else if (Math.abs(centsOff) < 25) {
    needle.style.backgroundColor = "#cccc00"; // Getting there - yellow
  } else {
    needle.style.backgroundColor = "#cc0000"; // Far off - red
  }
}

// Reset the tuning meter to center position
function resetTuningMeter() {
  const needle = document.getElementById("tuning-needle");
  const centsDisplay = document.getElementById("cents-display");

  if (needle && centsDisplay) {
    needle.style.left = "50%";
    needle.style.backgroundColor = "#333";
    centsDisplay.textContent = "0¢";
  }
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

  // Start continuous analysis
  analysisIntervalId = setInterval(() => {
    if (sessionManager.getCurrentState() === SessionState.LISTENING) {
      analyzeInput({
        analyser,
        audioContext,
        targetFrequency,
        onMatchDetected: () => {
          resultDisplay.textContent = "Success! Correct note detected.";
          sessionManager.handleNoteMatch();
        },
        onFrequencyUpdate: (frequency, amplitude) => {
          currentFrequencyDisplay.textContent = `Current frequency: ${frequency.toFixed(2)} Hz (Strength: ${amplitude.toFixed(1)})`;
        },
        onNoFrequencyDetected: (amplitude) => {
          currentFrequencyDisplay.textContent = `Current frequency: -- Hz (no sound detected, level: ${amplitude.toFixed(1)})`;
        },
        onMatchProgress: (matchResult) => {
          // Update the tuning meter
          updateTuningMeter(matchResult.centsOff);

          // Still show text result
          resultDisplay.textContent = `${matchResult.direction}`;
        },
      });
    } else {
      clearInterval(analysisIntervalId);
      analysisIntervalId = null;
    }
  }, 100);
}
