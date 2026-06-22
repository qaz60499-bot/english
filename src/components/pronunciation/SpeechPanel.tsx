import { Mic, Play, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cancelSpeech, describeSpeechPlayback, getSpeechSupport, resolveSpeechLang, resolveSpeechVoice, speak, startRecording, type RecordingController } from "../../engines/speechEngine";
import { useLearningStore } from "../../stores/useLearningStore";

interface SpeechPanelProps {
  text: string;
  onPlayback?: () => void;
  onRecordingReady?: (ready: boolean) => void;
  onRecordingFallback?: () => void;
}

export function SpeechPanel({ text, onPlayback, onRecordingReady, onRecordingFallback }: SpeechPanelProps) {
  const support = useMemo(() => getSpeechSupport(), []);
  const accent = useLearningStore((state) => state.preferences?.accent ?? "auto");
  const [rate, setRate] = useState(0.85);
  const [recording, setRecording] = useState<RecordingController | null>(null);
  const recordingRef = useRef<RecordingController | null>(null);
  const mountedRef = useRef(true);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [message, setMessage] = useState("");
  const [, setVoiceRevision] = useState(0);
  const lang = resolveSpeechLang(accent);
  const voiceResolution = typeof window === "undefined" ? null : resolveSpeechVoice(lang);

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  useEffect(() => {
    if (!support.synthesis) return;
    const synthesis = window.speechSynthesis;
    const refreshVoiceState = () => setVoiceRevision((value) => value + 1);
    synthesis.getVoices();
    if (typeof synthesis.addEventListener !== "function") return;
    synthesis.addEventListener("voiceschanged", refreshVoiceState);
    return () => synthesis.removeEventListener("voiceschanged", refreshVoiceState);
  }, [support.synthesis]);

  useEffect(() => () => {
    mountedRef.current = false;
    recordingRef.current?.cancel();
    recordingRef.current = null;
    cancelSpeech();
  }, []);

  useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  async function playReference() {
    setMessage("正在准备英语语音…");
    const result = await speak(text, { rate, lang });
    if (result.reason === "cancelled") return;
    setMessage(describeSpeechPlayback(result, lang));
    if (result.played) onPlayback?.();
  }

  async function toggleRecording() {
    if (recording) {
      try {
        const blob = await recording.stop();
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
        setRecording(null);
        setMessage("录音已保存在当前页面，可回听；默认不会上传。");
        onRecordingReady?.(true);
      } catch (error) {
        setRecording(null);
        setMessage(error instanceof Error ? error.message : "无法结束录音。");
      }
      return;
    }
    try {
      setMessage("麦克风只用于本地录音回听，不上传。离开页面会自动停止录音。");
      onRecordingReady?.(false);
      const controller = await startRecording(() => {
        if (!mountedRef.current) return;
        recordingRef.current = null;
        setRecording(null);
        setMessage("另一处录音已开始，本处麦克风已自动释放。");
        onRecordingReady?.(false);
      });
      if (!mountedRef.current) {
        controller.cancel();
        return;
      }
      recordingRef.current = controller;
      setRecording(controller);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "无法开启录音。";
      setMessage(`${detail} 已切换为口头跟读模式，你仍可继续完成练习。`);
      onRecordingFallback?.();
    }
  }

  return (
    <section className="panel speech-panel" aria-label="语音控制">
      <div className="toolbar">
        <button className="button" type="button" onClick={() => void playReference()}>
          <Play size={18} aria-hidden="true" />
          播放
        </button>
        <label className="field speech-rate">
          速度
          <select value={rate} onChange={(event) => setRate(Number(event.target.value))}>
            <option value={0.65}>0.65 拆音</option>
            <option value={0.8}>0.8 跟读</option>
            <option value={1}>1.0 常速</option>
          </select>
        </label>
        <span className="badge">
          {!support.synthesis
            ? "不支持语音"
            : voiceResolution?.available === false
              ? "等待英语声音"
              : voiceResolution?.exact === false
                ? "备用英语声音"
                : lang === "en-GB"
                  ? "英式口音"
                  : "美式口音"}
        </span>
        <button className="button secondary" type="button" onClick={toggleRecording} disabled={!support.recording}>
          {recording ? <Square size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
          {recording ? "停止录音" : support.recording ? "录音回听" : "设备不支持录音"}
        </button>
      </div>
      <p className="speech-message" aria-live="polite">{message || (support.recognition ? "此浏览器支持语音能力；当前以标准音、录音回听和自评为主。" : "语音识别不可用时，仍可播放、慢速、录音和自检。")}</p>
      {audioUrl && <audio controls src={audioUrl} aria-label="本地录音回听" />}
    </section>
  );
}
