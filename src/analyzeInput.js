// Storage for recent frequency readings
const recentFrequencies = [];
const MAX_RECENT_FREQUENCIES = 5;

function analyzeInput({
  analyser,
  audioContext,
  targetFrequency,
  onMatchDetected,
  onFrequencyUpdate,
  onNoFrequencyDetected,
  onMatchProgress,
}) {
  analyser.fftSize = 4096; // Higher resolution for better accuracy
  analyser.smoothingTimeConstant = 0.2; // Less smoothing for responsive detection

  // Create frequency data buffer
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  // Get frequency data
  analyser.getByteFrequencyData(dataArray);

  // Get frequency range for analysis
  const frequencyRange = getFrequencyRange(
    analyser.fftSize,
    audioContext.sampleRate,
  );

  // Calculate amplitude in relevant range
  const amplitudeData = getAmplitudeData(dataArray, frequencyRange);

  // Minimum threshold for sound detection
  if (amplitudeData.averageAmplitude > 5) {
    // Detect the dominant frequency
    const frequencyData = detectFrequency(
      dataArray,
      frequencyRange,
      amplitudeData,
      analyser.fftSize,
      audioContext.sampleRate,
    );

    if (frequencyData.isValid) {
      const medianFrequency = getMedianFrequency(
        recentFrequencies,
        frequencyData.refinedFrequency,
      );

      // Update UI with current frequency
      onFrequencyUpdate(medianFrequency, amplitudeData.maxValue);

      const matchResult = checkNoteMatch(medianFrequency, targetFrequency);

      if (matchResult.isMatch) {
        onMatchDetected(matchResult);
      } else {
        onMatchProgress(matchResult);
      }
    }
  } else {
    onNoFrequencyDetected(amplitudeData.averageAmplitude);
  }
}

// Calculate the frequency range for musical notes
function getFrequencyRange(analyserFftSize, sampleRate) {
  // Focus on typical musical range (80Hz to 5kHz)
  const lowIndex = Math.floor((80 * analyserFftSize) / sampleRate);
  const highIndex = Math.floor((5000 * analyserFftSize) / sampleRate);
  return { lowIndex, highIndex };
}

// Calculate amplitude information from frequency data
function getAmplitudeData(dataArray, frequencyRange) {
  const { lowIndex, highIndex } = frequencyRange;
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
  frequencyRange,
  amplitudeData,
  analyserFftSize,
  sampleRate,
) {
  const { lowIndex, highIndex } = frequencyRange;
  const { maxIndex, maxValue } = amplitudeData;
  const baseFrequency = (maxIndex * sampleRate) / analyserFftSize;

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
    refinedFrequency = (interpolatedIndex * sampleRate) / analyserFftSize;

    isValid = !isNaN(refinedFrequency) && refinedFrequency > 0;
  }

  return { isValid, refinedFrequency, maxValue };
}

function getMedianFrequency(recentFrequencies, newFrequency) {
  if (recentFrequencies.length >= MAX_RECENT_FREQUENCIES) {
    recentFrequencies.shift(); // Remove oldest
  }
  recentFrequencies.push(newFrequency);

  const sortedFrequencies = [...recentFrequencies].sort((a, b) => a - b);
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

export { analyzeInput };
