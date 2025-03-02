import { sessionManager, SessionState } from "./sessionManager";

// Mock the playNote module
jest.mock("./playNote", () => ({
  playNote: jest.fn((freq, name, ctx, duration, callback) => {
    // Simulate the callback after a short delay
    setTimeout(callback, 10);
  }),
  stopNote: jest.fn(),
  NOTES: {
    A4: 440,
    B4: 493.88,
    C4: 261.63,
  },
}));

describe("SessionManager", () => {
  beforeEach(() => {
    // Reset the session manager before each test
    sessionManager.stopSession();
    sessionManager.onStateChange = jest.fn();
    sessionManager.onNoteChange = jest.fn();
    sessionManager.onScoreChange = jest.fn();

    // Reset mocks
  });

  test("should initialize in IDLE state", () => {
    expect(sessionManager.state).toBe(SessionState.IDLE);
    expect(sessionManager.sessionActive).toBe(false);
  });

  test("should change state when starting a session", async () => {
    sessionManager.startSession("mock-device-id");

    expect(sessionManager.sessionActive).toBe(true);
    expect(sessionManager.onStateChange).toHaveBeenCalledWith(
      SessionState.IDLE,
    );
    expect(sessionManager.onScoreChange).toHaveBeenCalledWith(0);
  });

  test("should increment score when note matches", () => {
    sessionManager.sessionActive = true;
    sessionManager.state = SessionState.LISTENING;
    sessionManager.score = 0;

    sessionManager.handleNoteMatch();

    expect(sessionManager.score).toBe(1);
    expect(sessionManager.onScoreChange).toHaveBeenCalledWith(1);
    expect(sessionManager.state).toBe(SessionState.SUCCESS_FEEDBACK);
  });
});
