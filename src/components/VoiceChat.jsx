import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, FileText, CheckCircle2, Bot, User, Sparkles, Loader2, Radio, Zap } from 'lucide-react';
import { resolveAudioUrl } from '../services/api';

export default function VoiceChat({
  session,
  isVoiceMode,
  onSendTurn,
  onOpenDocumentUploader,
  onCompleteSession,
  isProcessingTurn,
  documentsCount,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [autoTalkMode, setAutoTalkMode] = useState(true); // Hands-free continuous call mode
  const [turnHistory, setTurnHistory] = useState([]);
  const [statusMessage, setStatusMessage] = useState('Idle');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(new Audio());
  const chatBottomRef = useRef(null);
  const autoTalkRef = useRef(autoTalkMode);
  const isRecordingRef = useRef(isRecording);

  // Keep refs in sync for event listeners
  useEffect(() => {
    autoTalkRef.current = autoTalkMode;
  }, [autoTalkMode]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Audio Playback Listener setup
  useEffect(() => {
    const audioEl = audioPlayerRef.current;

    const handleEnded = () => {
      setIsPlayingAudio(false);
      setStatusMessage('Finished speaking');

      // Auto-start listening in Auto-Talk mode if session is in progress and user wasn't already recording
      if (autoTalkRef.current && isVoiceMode && !isRecordingRef.current) {
        setStatusMessage('Auto-listening...');
        setTimeout(() => {
          startRecording();
        }, 500);
      }
    };

    audioEl.addEventListener('ended', handleEnded);
    return () => {
      audioEl.removeEventListener('ended', handleEnded);
    };
  }, [isVoiceMode]);

  // Initialize turn history ONLY when session_id changes (new session initialized)
  useEffect(() => {
    if (session?.session_id) {
      const initialGreeting = isVoiceMode ? session.greeting_text : session.greeting_message;
      setTurnHistory([
        {
          id: `turn-0-${session.session_id}`,
          sender: 'ai',
          text: initialGreeting || 'Welcome to AI Patient Onboarding. How can I assist you today?',
          audioUrl: session.audio_url || null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // Auto-play initial greeting audio if available
      if (session.audio_url) {
        playAudio(session.audio_url);
      }
    }
  }, [session?.session_id]);

  // Scroll chat to bottom on updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turnHistory, isProcessingTurn, isPlayingAudio, isRecording]);

  // Handle Audio Recording Start
  const startRecording = async () => {
    if (isRecordingRef.current) return;
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
        await processTurn(audioBlob, null);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setStatusMessage('Listening for your response...');

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone access unavailable or denied:', err);
      setStatusMessage('Microphone access unavailable');
    }
  };

  // Handle Audio Recording Stop
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      setStatusMessage('Processing speech turn...');
    }
  };

  // Submit Turn (Voice Blob or Text Fallback)
  const processTurn = async (audioBlob = null, textFallback = null) => {
    const userMessageText = textFallback || (audioBlob ? '🎤 Recorded Audio Response' : '');
    if (!userMessageText && !audioBlob) return;

    // Add user turn to state
    const userTurn = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userMessageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTurnHistory((prev) => [...prev, userTurn]);
    setTextInput('');

    try {
      const response = await onSendTurn({ audioBlob, textFallback: userMessageText });

      if (response && response.success) {
        const aiResponseText = response.ai_text || response.message || 'I have recorded your response.';
        const aiTurn = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiResponseText,
          patientTranscript: response.patient_transcript,
          audioUrl: response.audio_url || null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setTurnHistory((prev) => [...prev, aiTurn]);

        if (response.audio_url) {
          playAudio(response.audio_url);
        } else if (autoTalkRef.current && !response.completed) {
          // If no audio returned, auto-start mic for next turn
          setTimeout(() => startRecording(), 800);
        }
      }
    } catch (err) {
      console.error('Error submitting turn:', err);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessingTurn) return;
    processTurn(null, textInput.trim());
  };

  // Audio Playback Handler
  const playAudio = (audioUrl) => {
    const fullUrl = resolveAudioUrl(audioUrl);
    if (!fullUrl) return;

    try {
      setStatusMessage('AI Speaking...');
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = fullUrl;
      audioPlayerRef.current.play().catch((e) => console.warn('Audio play autoplay blocked:', e));
      setIsPlayingAudio(true);
    } catch (e) {
      console.error('Audio playback failed:', e);
    }
  };

  const stopAudio = () => {
    audioPlayerRef.current.pause();
    setIsPlayingAudio(false);
    setStatusMessage('Audio paused');
  };

  return (
    <div className="max-w-5xl mx-auto my-6 px-4">
      <div className="glass-card rounded-2xl border border-slate-800 shadow-2xl flex flex-col h-[720px] relative overflow-hidden">
        
        {/* Chat Header Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-500 flex items-center justify-center text-slate-950 font-bold">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-slate-100">
                  {session?.patient?.name || 'Patient'} Onboarding Assistant
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {session?.language || 'en-IN'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Specialty: <span className="text-cyan-400 font-semibold">{session?.category?.name || 'General'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Auto-Talk Continuous Mode Toggle */}
            {isVoiceMode && (
              <button
                onClick={() => setAutoTalkMode(!autoTalkMode)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  autoTalkMode
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Continuous hands-free conversation (Auto-listen when AI stops talking)"
              >
                <Zap className={`h-3.5 w-3.5 ${autoTalkMode ? 'text-emerald-400 animate-pulse' : ''}`} />
                <span>Hands-Free Auto-Talk: {autoTalkMode ? 'ON' : 'OFF'}</span>
              </button>
            )}

            {/* Document Uploader Trigger */}
            <button
              onClick={onOpenDocumentUploader}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition-all"
            >
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
              <span>Prescription OCR</span>
              {documentsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 font-mono text-[10px]">
                  {documentsCount}
                </span>
              )}
            </button>

            {/* Complete & Confirm Session Button */}
            <button
              onClick={() => onCompleteSession(false)}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Review & Submit EHR</span>
            </button>
          </div>
        </div>

        {/* Dynamic Voice Activity Bar */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-900 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            {isPlayingAudio ? (
              <div className="flex items-center space-x-2 text-cyan-400">
                <Volume2 className="h-4 w-4 animate-bounce" />
                <span className="font-semibold">AI Assistant Speaking...</span>
              </div>
            ) : isRecording ? (
              <div className="flex items-center space-x-2 text-rose-400">
                <Radio className="h-4 w-4 animate-pulse" />
                <span className="font-semibold">Microphone Active — Speak Now ({recordingTime}s)</span>
              </div>
            ) : isProcessingTurn ? (
              <div className="flex items-center space-x-2 text-indigo-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-semibold">Analyzing Symptoms & Synthesizing Reply...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>Ready for turn</span>
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Session: <span className="text-cyan-300">{session?.session_id}</span>
          </div>
        </div>

        {/* Chat Turn History Message List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {turnHistory.map((turn) => {
            const isAI = turn.sender === 'ai';
            return (
              <div
                key={turn.id}
                className={`flex items-start space-x-3 ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                {isAI && (
                  <div className="h-8 w-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed shadow-lg ${
                    isAI
                      ? 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                      : 'bg-gradient-to-r from-cyan-600 to-sky-600 text-slate-950 font-medium rounded-tr-none'
                  }`}
                >
                  {turn.patientTranscript && (
                    <div className="mb-2 text-xs italic text-cyan-400 bg-slate-950/60 p-2 rounded-lg border border-cyan-500/20">
                      <span className="font-bold">Recognized Patient Speech:</span> "{turn.patientTranscript}"
                    </div>
                  )}

                  <p>{turn.text}</p>

                  <div className="mt-2 flex items-center justify-between text-[10px] opacity-75">
                    <span>{turn.timestamp}</span>

                    {/* Audio Playback Button for AI Responses */}
                    {isAI && turn.audioUrl && (
                      <button
                        onClick={() => (isPlayingAudio ? stopAudio() : playAudio(turn.audioUrl))}
                        className="ml-2 px-2 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 flex items-center space-x-1 transition-all"
                      >
                        {isPlayingAudio ? (
                          <>
                            <VolumeX className="h-3 w-3 text-rose-400" />
                            <span>Pause Audio</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3 w-3 text-cyan-400" />
                            <span>Replay Audio</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {!isAI && (
                  <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center text-slate-950 font-bold shrink-0 mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Turn Processing Loader */}
          {isProcessingTurn && (
            <div className="flex items-center space-x-3 text-slate-400 text-xs py-2 px-4 bg-slate-900/50 rounded-xl w-max border border-slate-800">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
              <span>AI is generating response & synthesizing speech audio...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar / Speech Control Controls */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 space-y-3">
          
          {/* Voice Microphone Recorder Controls */}
          {isVoiceMode && (
            <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessingTurn || isPlayingAudio}
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-xl ${
                    isRecording
                      ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-rose-500/50 ring-4 ring-rose-500/30'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/30'
                  }`}
                >
                  {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </button>

                <div>
                  <div className="text-xs font-bold text-slate-200">
                    {isRecording
                      ? `Recording Speech... (${recordingTime}s)`
                      : autoTalkMode
                      ? 'Hands-Free Auto-Talk Active (Mic opens when AI stops talking)'
                      : 'Tap Microphone to Speak'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isRecording
                      ? 'Tap again or wait to stop and auto-submit turn'
                      : 'Sarvam AI multi-model Indic speech recognition'}
                  </div>
                </div>
              </div>

              {/* Animated Waveform Bars when Recording */}
              {isRecording && (
                <div className="flex items-center space-x-1 px-4">
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                  <div className="wave-bar" />
                </div>
              )}
            </div>
          )}

          {/* Text Input Fallback Form */}
          <form onSubmit={handleTextSubmit} className="flex items-center space-x-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={isProcessingTurn || isRecording}
              placeholder={
                isVoiceMode
                  ? 'Or type your symptoms here (Text Fallback)...'
                  : 'Type your message or answer here...'
              }
              className="flex-1 glass-input px-4 py-3 rounded-xl text-sm"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessingTurn || isRecording}
              className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-sm flex items-center space-x-1.5 transition-all"
            >
              <span>Send</span>
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
