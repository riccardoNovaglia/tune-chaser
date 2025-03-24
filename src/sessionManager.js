import { playNote, NOTES } from "./playNote.js";

// Session states
const SessionState = {
  IDLE: "idle",
  PLAYING_REFERENCE: "playing_reference",
  LISTENING: "listening",
  SUCCESS_FEEDBACK: "success_feedback",
};

// Configuration
const CONFIG = {
  notePlayDuration: 1, // s
  listenDuration: 3000, // ms
  successFeedbackDuration: 1000, // ms
};

class SessionManager {
  constructor() {
    this.state = SessionState.IDLE;
    this.currentNote = null;
    this.currentNoteName = null;
    this.audioContext = null;
    this.analyser = null;
    this.stream = null;
    this.sessionActive = false;
    this.score = 0;
    this.selectedMicrophoneId = null;

    // Callbacks
    this.onStateChange = null;
    this.onNoteChange = null;
    this.onScoreChange = null;
  }

  startSession(selectedMicrophoneId) {
    if (this.sessionActive) return;

    this.selectedMicrophoneId = selectedMicrophoneId;
    this.sessionActive = true;
    this.score = 0;
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    if (this.onStateChange) this.onStateChange(SessionState.IDLE);
    if (this.onScoreChange) this.onScoreChange(this.score);

    this.selectNextNote();
    this.setupMicrophoneAndAnalysis();
  }

  stopSession() {
    if (!this.sessionActive) return;

    this.sessionActive = false;
    this.state = SessionState.IDLE;

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.onStateChange) this.onStateChange(SessionState.IDLE);
  }

  selectNextNote() {
    if (!this.sessionActive) return;

    // Get random note
    const noteNames = Object.keys(NOTES);
    const randomIndex = Math.floor(Math.random() * noteNames.length);
    this.currentNoteName = noteNames[randomIndex];
    this.currentNote = NOTES[this.currentNoteName];

    if (this.onNoteChange)
      this.onNoteChange(this.currentNoteName, this.currentNote);

    this.playReferenceNote();
  }

  playReferenceNote() {
    if (!this.sessionActive) return;

    this.state = SessionState.PLAYING_REFERENCE;
    if (this.onStateChange) this.onStateChange(this.state);

    // Use the playNote function from playNote.js with a callback
    playNote(
      this.currentNote,
      this.currentNoteName,
      CONFIG.notePlayDuration,
      () => this.startListening(), // Callback when note finishes
    );
  }

  startListening() {
    if (!this.sessionActive) return;

    this.state = SessionState.LISTENING;
    if (this.onStateChange) this.onStateChange(this.state);

    // Start microphone and analysis here
    this.setupMicrophoneAndAnalysis();
  }

  handleNoteMatch() {
    if (!this.sessionActive || this.state !== SessionState.LISTENING) return;

    this.state = SessionState.SUCCESS_FEEDBACK;
    if (this.onStateChange) this.onStateChange(this.state);

    // Increment score
    this.score++;
    if (this.onScoreChange) this.onScoreChange(this.score);

    // Wait a moment before next note
    setTimeout(() => {
      if (this.sessionActive) {
        this.selectNextNote();
      }
    }, CONFIG.successFeedbackDuration);
  }

  skipCurrentNote() {
    if (!this.sessionActive) return;

    // Don't increment score when skipping
    this.selectNextNote();
  }

  playCurrentNoteAgain() {
    if (!this.sessionActive) return;

    // Play the current note again
    this.playReferenceNote();
  }

  async setupMicrophoneAndAnalysis() {
    try {
      const constraints = {
        audio: {
          deviceId: { exact: this.selectedMicrophoneId },
          noiseSuppression: false,
          echoCancellation: false,
          autoGainControl: false,
        },
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      const microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      microphone.connect(this.analyser);

      // The actual analysis will be handled by the listen.js module
    } catch (err) {
      console.error("Error accessing the microphone", err);
      this.stopSession();
    }
  }

  getAnalyser() {
    return this.analyser;
  }

  getAudioContext() {
    return this.audioContext;
  }

  getCurrentNote() {
    return this.currentNote;
  }

  getCurrentState() {
    return this.state;
  }

  isSessionActive() {
    return this.sessionActive;
  }

  getScore() {
    return this.score;
  }
}

// Create a singleton instance
const sessionManager = new SessionManager();

export { sessionManager, SessionState, NOTES };
