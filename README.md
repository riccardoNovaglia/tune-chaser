
# Tune Chaser

Tune Chaser is a web-based audio analysis application designed to help users match musical notes or pitches. It analyzes audio input from a microphone and compares it to target frequencies, providing real-time feedback on how close the match is.

## Features

- **Audio Input Analysis**: Captures audio from the user's microphone and analyzes the frequency content.
- **Frequency Detection**: Detects the dominant frequency in the audio input.
- **Note Matching**: Compares the detected frequency with a target frequency and provides feedback on how close the match is.
- **Real-time Feedback**: Displays the current detected frequency and amplitude.
- **Microphone Selection**: Allows users to select which microphone to use, and this preference is saved in localStorage.
- **Note Playback**: Plays reference notes and remembers the last played note.
- **Continuous Practice Mode**: Allows users to practice continuously by playing notes automatically and listening for matches.

## How to Use

1. **Start a Session**: Click the "Start Session" button to begin.
2. **Play Notes**: The app will play a random note. Try to match the note with your instrument or voice.
3. **Real-time Feedback**: The app provides real-time feedback on how close you are to matching the target note.
4. **Success**: When the correct note is detected, the app shows a success message and plays a new note.
5. **Stop Session**: Click the "Stop Session" button to end the practice session.

## Deployment

The application is deployed and can be accessed at: [Tune Chaser](https://riccardonovaglia.github.io/tune-chaser/src/)

## Technical Details

- **Web Audio API**: Used for capturing and analyzing audio input.
- **FFT Analysis**: Converts time-domain audio data to frequency domain using Fast Fourier Transform (FFT).
- **LocalStorage**: Persists user preferences such as selected microphone and last played note.
- **Median Filter**: Implements a median filter for frequency stability.
- **Focused Frequency Range**: Analyzes frequencies in the range of 80Hz to 5kHz, covering typical musical notes.

## Development

### Prerequisites

- Node.js and npm installed

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/riccardonovaglia/tune-chaser.git
   ```
2. Navigate to the project directory:
   ```bash
   cd tune-chaser
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

1. Start a local server:
   ```bash
   npm start
   ```
2. Open your browser and navigate to:
   ```bash
   http://localhost:3000/src/
   ```

### Contributing

Contributions are welcome! Please open an issue or submit a pull request.

### License

This project is licensed under the GPLv3 License.
