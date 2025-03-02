/**
 * Updates the tuning meter based on cents off
 * @param {number} centsOff - The cents off from the target note
 */
export function updateTuningMeter(centsOff) {
  const needle = document.getElementById("tuning-needle");
  const centsDisplay = document.getElementById("cents-display");

  // Clamp the cents value to a reasonable range for display (-50 to +50 cents)
  const clampedCents = Math.max(-50, Math.min(50, centsOff));

  // Calculate position (50% is center, each 10 cents = 5% movement)
  const position = 50 + clampedCents * 0.5;

  // Update needle position
  needle.style.left = `${position}%`;

  // Update cents display
  centsDisplay.textContent = `${Math.abs(centsOff).toFixed(1)}¢`;

  // Change color based on how close to correct pitch
  if (Math.abs(centsOff) < 5) {
    needle.style.backgroundColor = "#00cc00"; // Very close - green
  } else if (Math.abs(centsOff) < 15) {
    needle.style.backgroundColor = "#66cc00"; // Close - yellow-green
  } else if (Math.abs(centsOff) < 25) {
    needle.style.backgroundColor = "#cccc00"; // Getting there - yellow
  } else {
    needle.style.backgroundColor = "#cc0000"; // Far off - red
  }
}

/**
 * Resets the tuning meter to the center position
 */
export function resetTuningMeter() {
  const needle = document.getElementById("tuning-needle");
  const centsDisplay = document.getElementById("cents-display");

  if (needle && centsDisplay) {
    needle.style.left = "50%";
    needle.style.backgroundColor = "#333";
    centsDisplay.textContent = "0¢";
  }
}
