export type SpeakHooks = {
  onend?: () => void;
  onerror?: () => void;
};

let current: SpeechSynthesisUtterance | null = null;

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, rate: number, hooks?: SpeakHooks) {
  stopSpeaking();
  if (!canSpeak()) {
    hooks?.onerror?.();
    return;
  }
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    hooks?.onend?.();
    return;
  }
  const utter = new SpeechSynthesisUtterance(trimmed.slice(0, 24000));
  utter.rate = rate;
  utter.onend = () => {
    current = null;
    hooks?.onend?.();
  };
  utter.onerror = () => {
    current = null;
    hooks?.onerror?.();
  };
  current = utter;
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  current = null;
}

export function pauseSpeaking() {
  if (!canSpeak()) return;
  window.speechSynthesis.pause();
}

export function resumeSpeaking() {
  if (!canSpeak()) return;
  window.speechSynthesis.resume();
}

export function isPaused(): boolean {
  return canSpeak() && window.speechSynthesis.paused;
}

export function isSpeaking(): boolean {
  return canSpeak() && (window.speechSynthesis.speaking || window.speechSynthesis.pending);
}
