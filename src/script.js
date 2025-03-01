document.getElementById('start-button').addEventListener('click', startTuneChaser);

function startTuneChaser() {
    // Request access to the microphone
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const microphone = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            microphone.connect(analyser);
            analyser.fftSize = 2048;
            const bufferLength = analyser.fftSize;
            const dataArray = new Uint8Array(bufferLength);

            // Play a note (for simplicity, we'll use a fixed frequency)
            const oscillator = audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
            oscillator.connect(audioContext.destination);
            oscillator.start();
            document.getElementById('note-display').textContent = 'Playing A4 (440 Hz)';

            // Listen to the microphone input and compare it to the played note
            function analyzeInput() {
                analyser.getByteTimeDomainData(dataArray);
                // ...code to analyze the input and compare it to the played note...
                requestAnimationFrame(analyzeInput);
            }

            analyzeInput();
        })
        .catch(err => {
            console.error('Error accessing the microphone', err);
        });
}
