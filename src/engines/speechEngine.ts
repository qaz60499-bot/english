export interface SpeechSupport {
  synthesis: boolean;
  recording: boolean;
  recognition: boolean;
}

export type EnglishAccent = "en-US" | "en-GB" | "auto";

export function getSpeechSupport(): SpeechSupport {
  const win = typeof window === "undefined" ? undefined : (window as Window & {
    webkitSpeechRecognition?: unknown;
    SpeechRecognition?: unknown;
  });
  return {
    synthesis: typeof window !== "undefined" && "speechSynthesis" in window,
    recording: typeof navigator !== "undefined" && !!navigator.mediaDevices && "MediaRecorder" in window,
    recognition: !!win?.SpeechRecognition || !!win?.webkitSpeechRecognition
  };
}

export function resolveSpeechLang(accent: EnglishAccent = "auto") {
  if (accent !== "auto") return accent;
  if (typeof navigator === "undefined") return "en-US";
  const locale = `${navigator.language} ${(navigator.languages ?? []).join(" ")}`.toLowerCase();
  return /(^|[-_\s])(gb|uk|ie|au|nz|za|in)([-_\s]|$)/.test(locale) ? "en-GB" : "en-US";
}

export interface SpeechVoiceResolution {
  requestedLang: string;
  actualLang: string;
  voiceName?: string;
  exact: boolean;
  available: boolean;
}

export type SpeechPlaybackFailure =
  | "unsupported"
  | "empty-text"
  | "voices-unavailable"
  | "no-english-voice"
  | "cancelled"
  | "failed";

export interface SpeechPlaybackResult {
  played: boolean;
  reason?: SpeechPlaybackFailure;
  resolution?: SpeechVoiceResolution;
}

function normalizeVoiceLang(lang: string) {
  const normalized = lang.trim().replace(/_/g, "-");
  try {
    return Intl.getCanonicalLocales(normalized)[0] ?? normalized;
  } catch {
    return normalized;
  }
}

function isEnglishVoice(voice: SpeechSynthesisVoice) {
  const normalized = normalizeVoiceLang(voice.lang).toLowerCase();
  return normalized === "en" || normalized.startsWith("en-");
}

function resolveSpeechVoiceFromList(lang: string, voices: SpeechSynthesisVoice[]): SpeechVoiceResolution {
  const requestedLang = normalizeVoiceLang(lang || "en-US");
  const requestedKey = requestedLang.toLowerCase();
  const englishVoices = voices.filter(isEnglishVoice);
  const exactVoice = englishVoices.find(
    (voice) => normalizeVoiceLang(voice.lang).toLowerCase() === requestedKey
  );
  const voice = exactVoice ?? englishVoices[0];

  return {
    requestedLang,
    actualLang: voice ? normalizeVoiceLang(voice.lang) : requestedLang,
    voiceName: voice?.name,
    exact: Boolean(exactVoice),
    available: Boolean(voice)
  };
}

export function resolveSpeechVoice(lang = "en-US"): SpeechVoiceResolution | null {
  if (!getSpeechSupport().synthesis) return null;
  return resolveSpeechVoiceFromList(lang, window.speechSynthesis.getVoices());
}

export function describeSpeechVoice(lang = "en-US", providedResolution?: SpeechVoiceResolution) {
  const resolution = providedResolution ?? resolveSpeechVoice(lang);
  if (!resolution) return "当前浏览器不支持语音播放。";
  if (!resolution.available) return "当前设备未检测到英语语音，请在系统文字转语音设置中安装英语声音。";
  const requestedLabel = normalizeVoiceLang(lang).toLowerCase() === "en-gb" ? "英式英语" : "美式英语";
  if (resolution.exact) return `正在播放${requestedLabel}标准音。`;
  return `当前设备没有匹配的${requestedLabel}语音，已使用其他英语声音。`;
}

export function describeSpeechPlayback(result: SpeechPlaybackResult, lang = "en-US") {
  if (result.played && result.resolution) return describeSpeechVoice(lang, result.resolution);
  if (result.reason === "voices-unavailable") return "手机语音列表尚未加载，请再点一次播放，或检查系统文字转语音设置。";
  if (result.reason === "no-english-voice") return "手机没有可用的英语语音，请先在系统文字转语音设置中安装英语声音。";
  if (result.reason === "empty-text") return "没有可播放的英语内容。";
  if (result.reason === "failed") return "语音播放失败，请检查手机的文字转语音设置后重试。";
  return "当前浏览器不支持语音播放。";
}

let activeUtterance: SpeechSynthesisUtterance | null = null;
let speechRequestVersion = 0;

export function prepareSpeechText(text: string) {
  return text
    .replace(/\s*\/\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

function waitForSpeechVoices(synthesis: SpeechSynthesis, timeoutMs = 1200) {
  const currentVoices = synthesis.getVoices();
  if (currentVoices.length > 0) return Promise.resolve(currentVoices);

  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let settled = false;
    let pollTimer = 0;
    let timeoutTimer = 0;

    const supportsVoiceEvents = typeof synthesis.addEventListener === "function";

    const finish = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return;
      settled = true;
      if (supportsVoiceEvents) synthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      window.clearInterval(pollTimer);
      window.clearTimeout(timeoutTimer);
      resolve(voices);
    };

    const readVoices = () => {
      const voices = synthesis.getVoices();
      if (voices.length > 0) finish(voices);
    };

    const handleVoicesChanged = () => readVoices();
    if (supportsVoiceEvents) synthesis.addEventListener("voiceschanged", handleVoicesChanged);
    pollTimer = window.setInterval(readVoices, 100);
    timeoutTimer = window.setTimeout(() => finish(synthesis.getVoices()), timeoutMs);
    readVoices();
  });
}

export function cancelSpeech() {
  speechRequestVersion += 1;
  if (!getSpeechSupport().synthesis) return;
  activeUtterance = null;
  window.speechSynthesis.cancel();
}

export async function speak(
  text: string,
  options: { lang?: string; rate?: number } = {}
): Promise<SpeechPlaybackResult> {
  if (!getSpeechSupport().synthesis) return { played: false, reason: "unsupported" };
  const speechText = prepareSpeechText(text);
  if (!speechText) return { played: false, reason: "empty-text" };

  const synthesis = window.speechSynthesis;
  const requestVersion = speechRequestVersion + 1;
  speechRequestVersion = requestVersion;
  activeUtterance = null;
  synthesis.cancel();
  if (synthesis.paused) synthesis.resume();

  const voices = await waitForSpeechVoices(synthesis);
  if (requestVersion !== speechRequestVersion) return { played: false, reason: "cancelled" };
  if (voices.length === 0) return { played: false, reason: "voices-unavailable" };

  const requestedLang = normalizeVoiceLang(options.lang ?? "en-US");
  const resolution = resolveSpeechVoiceFromList(requestedLang, voices);
  if (!resolution.available || !resolution.voiceName) {
    return { played: false, reason: "no-english-voice", resolution };
  }

  const preferredVoice = voices.find(
    (voice) =>
      voice.name === resolution.voiceName &&
      normalizeVoiceLang(voice.lang).toLowerCase() === resolution.actualLang.toLowerCase()
  );
  if (!preferredVoice) return { played: false, reason: "no-english-voice", resolution };

  try {
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.voice = preferredVoice;
    utterance.lang = resolution.actualLang;
    utterance.rate = options.rate ?? 0.65;
    utterance.pitch = 1;
    utterance.volume = 1;

    const release = () => {
      if (activeUtterance === utterance) activeUtterance = null;
    };
    utterance.onend = release;
    utterance.onerror = release;
    activeUtterance = utterance;
    synthesis.speak(utterance);
    return { played: true, resolution };
  } catch {
    return { played: false, reason: "failed", resolution };
  }
}

let activeRecordingController: RecordingController | null = null;
let activeRecordingSuperseded: (() => void) | null = null;

export interface RecordingController {
  stop: () => Promise<Blob>;
  cancel: () => void;
  isActive: () => boolean;
}

export async function startRecording(onSuperseded?: () => void): Promise<RecordingController> {
  if (!getSpeechSupport().recording) {
    throw new Error("当前浏览器不支持录音。");
  }
  if (activeRecordingController) {
    const superseded = activeRecordingSuperseded;
    activeRecordingController.cancel();
    superseded?.();
  }
  activeRecordingController = null;
  activeRecordingSuperseded = null;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  let settled = false;

  const release = () => {
    stream.getTracks().forEach((track) => track.stop());
  };

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  recorder.start();

  const controller: RecordingController = {
    isActive: () => recorder.state !== "inactive" && !settled,
    cancel: () => {
      if (settled) return;
      settled = true;
      if (recorder.state !== "inactive") recorder.stop();
      release();
      if (activeRecordingController === controller) { activeRecordingController = null; activeRecordingSuperseded = null; }
    },
    stop: () =>
      new Promise<Blob>((resolve, reject) => {
        if (settled) {
          reject(new Error("录音已经结束。"));
          return;
        }
        settled = true;
        recorder.onerror = () => {
          release();
          if (activeRecordingController === controller) { activeRecordingController = null; activeRecordingSuperseded = null; }
          reject(new Error("录音失败，请检查麦克风权限。"));
        };
        recorder.onstop = () => {
          release();
          if (activeRecordingController === controller) { activeRecordingController = null; activeRecordingSuperseded = null; }
          resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
        };
        if (recorder.state === "inactive") {
          release();
          if (activeRecordingController === controller) { activeRecordingController = null; activeRecordingSuperseded = null; }
          resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
        } else {
          recorder.stop();
        }
      })
  };
  activeRecordingController = controller;
  activeRecordingSuperseded = onSuperseded ?? null;
  return controller;
}
