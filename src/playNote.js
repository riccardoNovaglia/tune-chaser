const LAST_PLAYED_NOTE_KEY = 'lastPlayedNoteFrequency';

document.getElementById('start-note-button').addEventListener('click', playNote);

function playNote() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // Play a note (for simplicity, we'll use a fixed frequency)
    const oscillator = audioContext.createOscillator();
    const frequency = 440; // A4 note
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.start();
    document.getElementById('note-display').textContent = `Playing A4 (${frequency} Hz)`;

    // Store the frequency in local storage
    localStorage.setItem(LAST_PLAYED_NOTE_KEY, frequency);

    // Stop the oscillator after 1 second
    setTimeout(() => {
        oscillator.stop();
        document.getElementById('note-display').textContent = 'Note stopped';
    }, 1000);
}

function getLastPlayedNoteFrequency() {
    return localStorage.getItem(LAST_PLAYED_NOTE_KEY);
}

export { getLastPlayedNoteFrequency };
