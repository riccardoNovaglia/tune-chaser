import { SplendidGrandPiano } from "https://unpkg.com/smplr/dist/index.mjs";
const context = new AudioContext(); // create the audio context
const piano = new SplendidGrandPiano(context); // create and load the instrument

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

async function playNote(frequency, noteName, duration = 1, onComplete = null) {
  try {
    context.resume(); // enable audio context after a user interaction

    piano.start({
      note: noteName,
      velocity: 80,
      duration,
      onEnded: () => {
        noteDisplay.textContent = "Note stopped";
        onComplete && onComplete();
      },
    });

    // Update display if it exists
    const noteDisplay = document.getElementById("note-display");
    if (noteDisplay) {
      noteDisplay.textContent = `Playing ${noteName || frequency.toFixed(2) + " Hz"}`;
    }
  } catch (error) {
    console.error("Error playing note:", error);
    return null;
  }
}

export { playNote, NOTES };
