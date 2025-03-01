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
    },
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const microphone = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      microphone.connect(analyser);

      analyzeInput(
        analyser,
        audioContext,
        analyzeButton,
        resultDisplay,
        currentFrequencyDisplay,
        targetFrequency,
      );
    })
    .catch((err) => {
      console.error("Error accessing the microphone", err);
      analyzeButton.textContent = "Start Analyzing";
      analyzeButton.disabled = false;
    });
}

function analyzeInput(
  analyser,
  audioContext,
  analyzeButton,
  resultDisplay,
  currentFrequencyDisplay,
  targetFrequency,
) {
  const startTime = audioContext.currentTime;
  let detectedCorrectNote = false;
  let frequencySum = 0;
  let frequencyCount = 0;
  let lastUpdateTime = 0;

  const bufferLength = analyser.fftSize;
  const dataArray = new Uint8Array(bufferLength);

  function analyze() {
    analyser.getByteTimeDomainData(dataArray);
    const frequency = getFrequencyFromData(dataArray, audioContext.sampleRate);

    frequencySum += frequency;
    frequencyCount++;

    const currentTime = audioContext.currentTime;
    // Update every 200 milliseconds
    if (currentTime - lastUpdateTime >= 0.2) {
      if (frequencyCount > 0) {
        const averageFrequency = frequencySum / frequencyCount;
        currentFrequencyDisplay.textContent = `Current frequency: ${averageFrequency.toFixed(2)} Hz`;

        if (Math.abs(averageFrequency - targetFrequency) < 5) {
          // Allow a small margin of error
          detectedCorrectNote = true;
        }

        frequencySum = 0;
        frequencyCount = 0;
      }
      lastUpdateTime = currentTime;
    }

    if (currentTime - startTime < 5) {
      requestAnimationFrame(analyze);
    } else {
      if (detectedCorrectNote) {
        resultDisplay.textContent = "Success! Correct note detected.";
      } else {
        resultDisplay.textContent = "Incorrect note. Try again.";
      }
      analyzeButton.textContent = "Start Analyzing";
      analyzeButton.disabled = false;
    }
  }

  analyze();
}

function getFrequencyFromData(dataArray, sampleRate) {
  // Implement a basic algorithm to estimate the frequency from the time domain data
  let maxIndex = 0;
  let maxValue = -Infinity;

  for (let i = 0; i < dataArray.length; i++) {
    if (dataArray[i] > maxValue) {
      maxValue = dataArray[i];
      maxIndex = i;
    }
  }

  const frequency = (maxIndex * sampleRate) / dataArray.length;
  return frequency;
}
