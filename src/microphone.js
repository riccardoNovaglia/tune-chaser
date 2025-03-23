// Settings modal elements
const settingsButton = document.getElementById("settings-button");
const settingsModal = document.getElementById("settings-modal");
const closeButton = document.querySelector(".close-button");
const saveButton = document.getElementById("save-settings");
const errorDisplay = document.getElementById("error-display");

// Microphone selection
const microphoneSelect = document.getElementById("microphone-select");
const SELECTED_MICROPHONE_KEY = "selectedMicrophoneId";
let hasMicrophonePermission = false;

// Initialize microphone list
async function initializeMicrophones() {
  try {
    // Check if we already have permission
    const permissionStatus = await navigator.permissions
      .query({ name: "microphone" })
      .catch(() => ({ state: "prompt" })); // Fallback for unsupported browsers

    hasMicrophonePermission = permissionStatus.state === "granted";

    if (hasMicrophonePermission) {
      await populateMicrophoneList();
    } else {
      // Request permission immediately
      try {
        // Requesting an audio stream will trigger the permission prompt
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        // Once we have the stream, we can stop it
        stream.getTracks().forEach((track) => track.stop());

        // Now we have permission, populate the list
        hasMicrophonePermission = true;
        await populateMicrophoneList();
      } catch (error) {
        console.error("Permission request failed:", error);
        errorDisplay.textContent =
          "Could not access microphone: " + error.message;
        microphoneSelect.disabled = true;
      }
    }
  } catch (error) {
    console.error("Error accessing media devices:", error);
    errorDisplay.textContent = "Error accessing microphones: " + error.message;
  }
}

async function populateMicrophoneList() {
  try {
    // Get device list
    const devices = await navigator.mediaDevices.enumerateDevices();

    // Clear existing options except the first one
    while (microphoneSelect.options.length > 1) {
      microphoneSelect.remove(1);
    }

    // Count audio input devices
    const audioInputs = devices.filter(
      (device) => device.kind === "audioinput",
    );

    if (audioInputs.length === 0) {
      errorDisplay.textContent = "No microphone devices detected";
      return;
    }

    // Add microphone options
    audioInputs.forEach((device) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.text = device.label || `Microphone ${microphoneSelect.length + 1}`;
      microphoneSelect.appendChild(option);
    });

    // Enable the select
    microphoneSelect.disabled = false;

    // Set previously selected microphone if it exists in the list
    const selectedMicrophoneId = localStorage.getItem(SELECTED_MICROPHONE_KEY);
    if (selectedMicrophoneId) {
      // Check if the saved ID exists in the current list
      const exists = Array.from(microphoneSelect.options).some(
        (option) => option.value === selectedMicrophoneId,
      );

      if (exists) {
        microphoneSelect.value = selectedMicrophoneId;
      } else if (audioInputs.length > 0) {
        // Select first available if saved one isn't available
        microphoneSelect.selectedIndex = 1;
        updateSelectedMicrophone();
      }
    } else if (audioInputs.length > 0) {
      // No previously selected mic, select the first one
      microphoneSelect.selectedIndex = 1;
      updateSelectedMicrophone();
    }

    errorDisplay.textContent = "";
  } catch (error) {
    console.error("Error populating microphone list:", error);
    errorDisplay.textContent = "Error loading microphones: " + error.message;
  }
}

// Modal event listeners
settingsButton.addEventListener("click", () => {
  errorDisplay.textContent = ""; // Clear any previous error message
  initializeMicrophones(); // Request permission and refresh microphone list when opening settings
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
  // For iOS, just return null/empty to use default device
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return "";
  }
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
