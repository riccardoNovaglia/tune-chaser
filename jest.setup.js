// Mock the AudioContext and related APIs
global.AudioContext = class AudioContext {
  constructor() {
    this.sampleRate = 44100;
  }

  createAnalyser() {
    return {
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteFrequencyData: jest.fn(),
      connect: jest.fn(),
      smoothingTimeConstant: 0,
    };
  }

  createMediaStreamSource() {
    return {
      connect: jest.fn(),
    };
  }

  createOscillator() {
    return {
      frequency: { value: 0 },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      disconnect: jest.fn(),
    };
  }

  createGain() {
    return {
      gain: { value: 0 },
      connect: jest.fn(),
    };
  }

  close() {}
};

// Mock navigator.mediaDevices
global.navigator.mediaDevices = {
  enumerateDevices: jest.fn().mockResolvedValue([]),
  getUserMedia: jest.fn().mockResolvedValue({
    getTracks: () => [{ stop: jest.fn() }],
  }),
};

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.resetAllMocks();
