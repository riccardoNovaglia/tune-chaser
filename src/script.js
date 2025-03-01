document.getElementById('start-note-button').addEventListener('click', playNote);
document.getElementById('start-analyze-button').addEventListener('click', startAnalyzingInput);
document.getElementById('microphone-select').addEventListener('change', updateSelectedMicrophone);

let selectedMicrophoneId = null;

navigator.mediaDevices.enumerateDevices().then(devices => {
    const micSelect = document.getElementById('microphone-select');
    devices.forEach(device => {
        if (device.kind === 'audioinput') {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Microphone ${micSelect.length + 1}`;
            micSelect.appendChild(option);
        }
    });
});

function updateSelectedMicrophone(event) {
    selectedMicrophoneId = event.target.value;
}

function playNote() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // Play a note (for simplicity, we'll use a fixed frequency)
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    oscillator.connect(audioContext.destination);
    oscillator.start();
    document.getElementById('note-display').textContent = 'Playing A4 (440 Hz)';

    // Stop the oscillator after 1 second
    setTimeout(() => {
        oscillator.stop();
        document.getElementById('note-display').textContent = 'Note stopped';
    }, 1000);
}

function startAnalyzingInput() {
    const constraints = { audio: { deviceId: selectedMicrophoneId ? { exact: selectedMicrophoneId } : undefined } };
    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const microphone = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            microphone.connect(analyser);
            analyser.fftSize = 2048;
            const bufferLength = analyser.fftSize;
            const dataArray = new Uint8Array(bufferLength);

            analyzeInput(analyser, dataArray);
        })
        .catch(err => {
            console.error('Error accessing the microphone', err);
        });
}

function analyzeInput(analyser, dataArray) {
    function analyze() {
        analyser.getByteTimeDomainData(dataArray);
        // ...code to analyze the input and compare it to the played note...
        requestAnimationFrame(analyze);
    }

    analyze();
}
