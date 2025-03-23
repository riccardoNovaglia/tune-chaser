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
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
};

// Keep track of active instruments
let activeInstrument = null;

/**
 * Plays a note with the given frequency using Tone.js guitar sound
 * @param {number} frequency - The frequency to play
 * @param {string} noteName - The name of the note (optional)
 * @param {AudioContext} existingAudioContext - An existing audio context (optional, not used with Tone.js)
 * @param {number} duration - Duration in ms (default: 1000)
 * @param {Function} onComplete - Callback when note finishes playing (optional)
 * @returns {AudioContext} - The audio context used (for compatibility)
 */
function playNote(
  frequency,
  noteName,
  existingAudioContext,
  duration = 1000,
  onComplete = null,
) {
  // Stop any currently playing note
  stopNote();
  
  // Make sure Tone.js is started (needed due to autoplay policies)
  if (Tone.context.state !== 'running') {
    Tone.start();
  }
  
  // Create a more realistic guitar sound using multiple synths
  // Main guitar body sound
  const guitarBody = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 1.5,
    modulationIndex: 10,
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.8,
      release: 1.5
    },
    modulation: {
      type: "triangle"
    },
    modulationEnvelope: {
      attack: 0.5,
      decay: 0.01,
      sustain: 0.5,
      release: 0.5
    }
  });
  
  // String pluck sound
  const pluck = new Tone.PluckSynth({
    attackNoise: 2,
    dampening: 2000,
    resonance: 0.98,
    release: 2
  });
  
  // Effects chain for realism
  const compressor = new Tone.Compressor({
    threshold: -20,
    ratio: 4,
    attack: 0.005,
    release: 0.1
  }).toDestination();
  
  const reverb = new Tone.Reverb({
    decay: 3.0,
    wet: 0.3
  }).connect(compressor);
  
  const delay = new Tone.FeedbackDelay({
    delayTime: 0.15,
    feedback: 0.15,
    wet: 0.2
  }).connect(reverb);
  
  // EQ to shape the tone
  const eq = new Tone.EQ3({
    low: -3,
    mid: 2,
    high: -2,
    lowFrequency: 400,
    highFrequency: 2500
  }).connect(delay);
  
  // Connect everything
  guitarBody.connect(eq);
  pluck.connect(eq);
  
  // Store the active instruments for cleanup
  activeInstrument = {
    guitarBody,
    pluck,
    eq,
    delay,
    reverb,
    compressor
  };
  
  // Calculate a longer duration for more natural sound
  const playDuration = Math.max(duration / 1000, 2); // At least 2 seconds
  
  // Play both synths with slight timing differences for realism
  guitarBody.triggerAttackRelease(frequency, playDuration);
  
  // Slight delay for the pluck to simulate pick attack
  setTimeout(() => {
    pluck.triggerAttackRelease(frequency, 0.5);
  }, 10);
  
  // Update display if the element exists
  const noteDisplay = document.getElementById("note-display");
  if (noteDisplay) {
    noteDisplay.textContent = noteName
      ? `Playing ${noteName} (${frequency} Hz)`
      : `Playing ${frequency} Hz`;
  }

  // Store the frequency in local storage
  localStorage.setItem(LAST_PLAYED_NOTE_KEY, frequency);

  // Schedule cleanup
  if (duration > 0) {
    setTimeout(() => {
      stopNote(noteDisplay);
      if (onComplete) onComplete();
    }, duration);
  }

  return Tone.context;
}

/**
 * Stops the currently playing note
 * @param {HTMLElement} noteDisplay - Optional display element to update
 */
function stopNote(noteDisplay = null) {
  if (activeInstrument) {
    try {
      // Dispose all components
      if (activeInstrument.guitarBody) activeInstrument.guitarBody.dispose();
      if (activeInstrument.pluck) activeInstrument.pluck.dispose();
      if (activeInstrument.eq) activeInstrument.eq.dispose();
      if (activeInstrument.delay) activeInstrument.delay.dispose();
      if (activeInstrument.reverb) activeInstrument.reverb.dispose();
      if (activeInstrument.compressor) activeInstrument.compressor.dispose();
      
      activeInstrument = null;
    } catch (e) {
      console.warn("Error stopping instrument:", e);
    }
  }

  if (noteDisplay) {
    noteDisplay.textContent = "Note stopped";
  }
}

function getLastPlayedNoteFrequency() {
  return localStorage.getItem(LAST_PLAYED_NOTE_KEY);
}

// Helper function to convert frequency to closest note name
function frequencyToNoteName(frequency) {
  // A4 = 440Hz
  const A4 = 440;
  const A4_INDEX = 69; // MIDI note number for A4
  
  // Calculate MIDI note number
  const noteNumber = Math.round(12 * Math.log2(frequency / A4) + A4_INDEX);
  
  // Note names
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  
  // Calculate octave and note name
  const octave = Math.floor((noteNumber - 12) / 12);
  const noteName = noteNames[noteNumber % 12];
  
  return `${noteName}${octave}`;
}

export { playNote, stopNote, getLastPlayedNoteFrequency, NOTES };
