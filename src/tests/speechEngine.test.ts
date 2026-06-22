import { afterEach, describe, expect, it, vi } from "vitest";
import { describeSpeechVoice, prepareSpeechText, resolveSpeechLang, speak } from "../engines/speechEngine";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("speech accent selection", () => {
  it("honors explicit American and British English preferences", () => {
    expect(resolveSpeechLang("en-US")).toBe("en-US");
    expect(resolveSpeechLang("en-GB")).toBe("en-GB");
  });

  it("turns visual pronunciation separators into natural pauses", () => {
    expect(prepareSpeechText("ship / sheep.  think / this")).toBe("ship, sheep. think, this");
  });

  it("does not expose raw mobile voice engine names in the interface", () => {
    vi.stubGlobal("speechSynthesis", {
      getVoices: () => [{ lang: "en-US", name: "Google US English Android TTS" }]
    });

    const description = describeSpeechVoice("en-US");
    expect(description).toBe("正在播放美式英语标准音。");
    expect(description).not.toContain("Google");
    expect(description).not.toContain("Android");
  });

  it("waits for mobile voices and pins playback to an English voice", async () => {
    let voices: SpeechSynthesisVoice[] = [];
    let voicesChanged: EventListener = () => undefined;
    const speakMock = vi.fn();
    const englishVoice = { lang: "en_US", name: "Mobile English" } as SpeechSynthesisVoice;

    class MockSpeechSynthesisUtterance {
      text: string;
      lang = "";
      rate = 1;
      voice: SpeechSynthesisVoice | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }

    vi.stubGlobal("SpeechSynthesisUtterance", MockSpeechSynthesisUtterance);
    vi.stubGlobal("speechSynthesis", {
      paused: false,
      cancel: vi.fn(),
      resume: vi.fn(),
      getVoices: () => voices,
      addEventListener: (type: string, listener: EventListener) => {
        if (type === "voiceschanged") voicesChanged = listener;
      },
      removeEventListener: vi.fn(),
      speak: speakMock
    });

    const playback = speak("ship / sheep", { lang: "en-US" });
    voices = [englishVoice];
    voicesChanged(new Event("voiceschanged"));
    const result = await playback;

    expect(result.played).toBe(true);
    expect(speakMock).toHaveBeenCalledTimes(1);
    const utterance = speakMock.mock.calls[0][0] as MockSpeechSynthesisUtterance;
    expect(utterance.text).toBe("ship, sheep");
    expect(utterance.voice).toBe(englishVoice);
    expect(utterance.lang).toBe("en-US");
  });

  it("does not let a non-English default voice read English text", async () => {
    const speakMock = vi.fn();
    vi.stubGlobal("speechSynthesis", {
      paused: false,
      cancel: vi.fn(),
      resume: vi.fn(),
      getVoices: () => [{ lang: "zh-CN", name: "Chinese default" }],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      speak: speakMock
    });

    const result = await speak("This ship is cheap.", { lang: "en-US" });

    expect(result).toMatchObject({ played: false, reason: "no-english-voice" });
    expect(speakMock).not.toHaveBeenCalled();
  });
});
