document.getElementById('microphone-select').addEventListener('change', updateSelectedMicrophone);

const SELECTED_MICROPHONE_KEY = 'selectedMicrophoneId';

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

    const selectedMicrophoneId = localStorage.getItem(SELECTED_MICROPHONE_KEY);
    if (selectedMicrophoneId) {
        micSelect.value = selectedMicrophoneId;
    }
});

function updateSelectedMicrophone(event) {
    const selectedMicrophoneId = event.target.value;
    localStorage.setItem(SELECTED_MICROPHONE_KEY, selectedMicrophoneId);
}

function getMicrophoneId() {
    return localStorage.getItem(SELECTED_MICROPHONE_KEY);
}

export { getMicrophoneId };
