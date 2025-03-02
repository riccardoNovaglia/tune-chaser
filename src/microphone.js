// Settings modal elements
const settingsButton = document.getElementById("settings-button");
const settingsModal = document.getElementById("settings-modal");
const closeButton = document.querySelector(".close-button");
const saveButton = document.getElementById("save-settings");
const errorDisplay = document.getElementById("error-display");

// Microphone selection
const microphoneSelect = document.getElementById("microphone-select");
const SELECTED_MICROPHONE_KEY = "selectedMicrophoneId";

// Initialize microphone list
async function initializeMicrophones() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    // Clear existing options except the first one
    while (microphoneSelect.options.length > 1) {
      microphoneSelect.remove(1);
    }

    // Add microphone options
    devices.forEach((device) => {
      if (device.kind === "audioinput") {
        const option = document.createElement("option");
        option.value = device.deviceId;
        option.text =
          device.label || `Microphone ${microphoneSelect.length + 1}`;
        microphoneSelect.appendChild(option);
      }
    });

    // Set previously selected microphone
    const selectedMicrophoneId = localStorage.getItem(SELECTED_MICROPHONE_KEY);
    if (selectedMicrophoneId) {
      microphoneSelect.value = selectedMicrophoneId;
    }
  } catch (error) {
    console.error("Error accessing media devices:", error);
  }
}

// Modal event listeners
settingsButton.addEventListener("click", () => {
  errorDisplay.textContent = ""; // Clear any previous error message
  initializeMicrophones(); // Refresh microphone list when opening settings
  settingsModal.style.display = "block";
});

closeButton.addEventListener("click", () => {
  settingsModal.style.display = "none";
});

saveButton.addEventListener("click", () => {
  updateSelectedMicrophone();
  settingsModal.style.display = "none";
});

// Close modal if clicking outside of it
window.addEventListener("click", (event) => {
  if (event.target === settingsModal) {
    settingsModal.style.display = "none";
  }
});

function updateSelectedMicrophone() {
  const selectedMicrophoneId = microphoneSelect.value;
  localStorage.setItem(SELECTED_MICROPHONE_KEY, selectedMicrophoneId);
}

function getMicrophoneId() {
  return localStorage.getItem(SELECTED_MICROPHONE_KEY);
}

function showMicrophoneSelectionError() {
  if (errorDisplay) {
    errorDisplay.textContent =
      "Please select a microphone before starting the session.";
  }
  settingsModal.style.display = "block";
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", initializeMicrophones);

export { getMicrophoneId, showMicrophoneSelectionError };
