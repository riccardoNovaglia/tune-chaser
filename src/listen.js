import { getMicrophoneId } from "./microphone.js";
import { getLastPlayedNoteFrequency } from "./playNote.js";
import { analyzeInput } from "./analyzeInput.js";

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
