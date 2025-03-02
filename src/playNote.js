const LAST_PLAYED_NOTE_KEY = "lastPlayedNoteFrequency";

// Note frequencies (A4 = 440Hz and others)
const NOTES = {
  E2: 82.41,
  A2: 110.0,
  D3: 146.83,
  G3: 196.0,
  B3: 246.94,
  E4: 329.63,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
};

// Keep track of active oscillator
let activeOscillator = null;

/**
 * Plays a note with the given frequency
 * @param {number} frequency - The frequency to play
 * @param {string} noteName - The name of the note (optional)
 * @param {AudioContext} existingAudioContext - An existing audio context (optional)
 * @param {number} duration - Duration in ms (default: 1000)
 * @param {Function} onComplete - Callback when note finishes playing (optional)
 * @returns {AudioContext} - The audio context used
 */
function playNote(
  frequency,
  noteName,
  existingAudioContext,
  duration = 1000,
  onComplete = null,
) {
  // Stop any currently playing note
  if (activeOscillator) {
    stopNote();
  }

  const audioContext =
    existingAudioContext ||
    new (window.AudioContext || window.webkitAudioContext)();

  activeOscillator = audioContext.createOscillator();
  activeOscillator.type = "sine";
  activeOscillator.frequency.setValueAtTime(
    frequency,
    audioContext.currentTime,
  );
  activeOscillator.connect(audioContext.destination);
  activeOscillator.start();

  // Update display if the element exists
  const noteDisplay = document.getElementById("note-display");
  if (noteDisplay) {
    noteDisplay.textContent = noteName
      ? `Playing ${noteName} (${frequency} Hz)`
      : `Playing ${frequency} Hz`;
  }

  // Store the frequency in local storage
  localStorage.setItem(LAST_PLAYED_NOTE_KEY, frequency);

  // Stop the oscillator after the specified duration
  if (duration > 0) {
    setTimeout(() => {
      stopNote(noteDisplay);
      if (onComplete) onComplete();
    }, duration);
  }

  return audioContext;
}

/**
 * Stops the currently playing note
 * @param {HTMLElement} noteDisplay - Optional display element to update
 */
function stopNote(noteDisplay = null) {
  if (activeOscillator) {
    try {
      activeOscillator.stop();
      activeOscillator.disconnect();
    } catch (e) {
      console.warn("Error stopping oscillator:", e);
    }
    activeOscillator = null;
  }

  if (noteDisplay) {
    noteDisplay.textContent = "Note stopped";
  }
}

function getLastPlayedNoteFrequency() {
  return localStorage.getItem(LAST_PLAYED_NOTE_KEY);
}

export { playNote, stopNote, getLastPlayedNoteFrequency, NOTES };
