document.getElementById('start-note-button').addEventListener('click', playNote);
document.getElementById('start-analyze-button').addEventListener('click', startAnalyzingInput);
document.getElementById('microphone-select').addEventListener('change', updateSelectedMicrophone);

let selectedMicrophoneId = null;
let targetFrequency = 440; // A4 note frequency

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
    const analyzeButton = document.getElementById('start-analyze-button');
    const resultDisplay = document.getElementById('result-display');
    analyzeButton.textContent = 'Analyzing...';
    analyzeButton.disabled = true;
    resultDisplay.textContent = '';

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

            analyzeInput(analyser, dataArray, audioContext, analyzeButton, resultDisplay);
        })
        .catch(err => {
            console.error('Error accessing the microphone', err);
            analyzeButton.textContent = 'Start Analyzing';
            analyzeButton.disabled = false;
        });
}

function analyzeInput(analyser, dataArray, audioContext, analyzeButton, resultDisplay) {
    const startTime = audioContext.currentTime;
    let detectedCorrectNote = false;

    function analyze() {
        analyser.getByteTimeDomainData(dataArray);
        const frequency = getFrequencyFromData(dataArray, audioContext.sampleRate);

        if (Math.abs(frequency - targetFrequency) < 5) { // Allow a small margin of error
            detectedCorrectNote = true;
        }

        if (audioContext.currentTime - startTime < 5) {
            requestAnimationFrame(analyze);
        } else {
            if (detectedCorrectNote) {
                resultDisplay.textContent = 'Success! Correct note detected.';
            } else {
                resultDisplay.textContent = 'Incorrect note. Try again.';
            }
            analyzeButton.textContent = 'Start Analyzing';
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

    const frequency = maxIndex * sampleRate / dataArray.length;
    return frequency;
}
