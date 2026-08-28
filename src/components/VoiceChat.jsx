import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, FileText, CheckCircle2, Bot, User, Sparkles, Loader2, Radio, Zap, Volume, MessageSquare } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState('audio_only'); // 'audio_only' or 'transcript'
  const [turnHistory, setTurnHistory] = useState([]);
  const [statusMessage, setStatusMessage] = useState('Idle');

  // Session completion check
  const isCompleted = Boolean(session?.completed || session?.stage === 'completed' || session?.stage === 'finished');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(new Audio());
  const chatBottomRef = useRef(null);

  // VAD & Silence Detection Refs
  const silenceAnimFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const autoTalkRef = useRef(autoTalkMode);
  const isRecordingRef = useRef(isRecording);
  const isCompletedRef = useRef(isCompleted);

  // Keep refs in sync for callbacks
  useEffect(() => {
    autoTalkRef.current = autoTalkMode;
  }, [autoTalkMode]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    isCompletedRef.current = isCompleted;
    if (isCompleted) {
      setAutoTalkMode(false);
      if (isRecordingRef.current) {
        stopRecording();
      }
    }
  }, [isCompleted]);

  // Clean up AudioContext & timers on unmount
  useEffect(() => {
    return () => {
      if (silenceAnimFrameRef.current) cancelAnimationFrame(silenceAnimFrameRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, []);

  // Audio Playback Listener setup
  useEffect(() => {
    const audioEl = audioPlayerRef.current;

    const handleEnded = () => {
      setIsPlayingAudio(false);
      setStatusMessage('Finished speaking');

      // Auto-start listening in Auto-Talk mode if session is in progress and not completed
      if (autoTalkRef.current && isVoiceMode && !isRecordingRef.current && !isCompletedRef.current) {
        setStatusMessage('Auto-listening...');
        setTimeout(() => {
          startRecording();
        }, 100);
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

  // Handle Audio Recording Start with Web Audio API Voice Activity Detection (VAD)
  const startRecording = async () => {
    if (isRecordingRef.current || isCompletedRef.current) return;
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Web Audio API VAD (Volume & Silence meter)
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let hasSpoken = false;
      let silenceStart = null;

      const detectVoiceActivity = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avgVolume = sum / bufferLength;

        // Speech detected (volume above threshold)
        if (avgVolume > 10) {
          hasSpoken = true;
          silenceStart = null;
        } else if (hasSpoken) {
          // Patient has spoken and volume dropped to silence
          if (!silenceStart) {
            silenceStart = Date.now();
          } else if (Date.now() - silenceStart > 400) { // 1.6s continuous silence after speech
            console.log('Silence detected after speech -> Auto-stopping and submitting recording');
            stopRecording();
            return;
          }
        }

        silenceAnimFrameRef.current = requestAnimationFrame(detectVoiceActivity);
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (silenceAnimFrameRef.current) cancelAnimationFrame(silenceAnimFrameRef.current);
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());

        await processTurn(audioBlob, null);
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingTime(0);
      setStatusMessage('Listening for your response...');

      detectVoiceActivity();

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          // Safeguard: auto-stop after 12 seconds if continuous speech
          if (prev >= 12) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Microphone access unavailable or denied:', err);
      setStatusMessage('Microphone access unavailable');
    }
  };

  // Handle Audio Recording Stop
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceAnimFrameRef.current) cancelAnimationFrame(silenceAnimFrameRef.current);
      setStatusMessage('Processing speech turn...');
    }
  };

  // Submit Turn (Voice Blob or Text Fallback)
  const processTurn = async (audioBlob = null, textFallback = null) => {
    if (isCompletedRef.current) return;
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

        if (response.completed) {
          setAutoTalkMode(false);
        }

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
    if (!textInput.trim() || isProcessingTurn || isCompleted) return;
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

  // Latest AI response for Voice-Only Call View
  const lastAiTurn = turnHistory.filter((t) => t.sender === 'ai').slice(-1)[0];
  const lastUserTurn = turnHistory.filter((t) => t.sender === 'user').slice(-1)[0];

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
                {isCompleted && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Session Completed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Specialty: <span className="text-cyan-400 font-semibold">{session?.category?.name || 'General'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle: Audio Only vs Full Transcript */}
            {!isCompleted && (
              <button
                onClick={() => setViewMode(viewMode === 'audio_only' ? 'transcript' : 'audio_only')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center space-x-1.5 transition-all"
                title="Toggle between Voice Call mode and Full Text Transcript"
              >
                {viewMode === 'audio_only' ? (
                  <>
                    <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Show Transcript</span>
                  </>
                ) : (
                  <>
                    <Volume className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Audio Only View</span>
                  </>
                )}
              </button>
            )}

            {/* Auto-Talk Continuous Mode Toggle */}
            {isVoiceMode && !isCompleted && (
              <button
                onClick={() => setAutoTalkMode(!autoTalkMode)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  autoTalkMode
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Continuous hands-free conversation (Auto-listen & auto-send on silence)"
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
            {isCompleted ? (
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Onboarding Completed — Ready for EHR Submission</span>
              </div>
            ) : isPlayingAudio ? (
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

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-center items-center">
          
          {/* VIEW A: Completed Session Screen (Shows ONLY Review Button) */}
          {isCompleted ? (
            <div className="my-auto text-center max-w-lg p-8 rounded-2xl bg-slate-900/80 border border-emerald-500/30 shadow-2xl space-y-6">
              <div className="h-20 w-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-100">Patient Intake Completed</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  All clinical symptoms, medical history, and prescription findings have been gathered for <span className="text-cyan-300 font-bold">{session?.patient?.name}</span>.
                </p>
              </div>

              {/* Single Primary Action Button */}
              <div className="pt-4">
                <button
                  onClick={() => onCompleteSession(false)}
                  className="w-full py-4 px-6 rounded-xl text-sm font-extrabold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-2xl shadow-emerald-500/30 flex items-center justify-center space-x-2 transition-all transform active:scale-95"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Review Clinical Report & Confirm EHR Submission</span>
                </button>
              </div>
            </div>
          ) : viewMode === 'audio_only' ? (
            /* VIEW B: Audio Only Call View (Pure Voice Interactive Orb) */
            <div className="my-auto flex flex-col items-center justify-center text-center max-w-xl space-y-8 py-4">
              
              {/* Interactive 3D Glowing Voice Orb Visualizer */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isPlayingAudio
                      ? 'bg-gradient-to-tr from-cyan-500 via-sky-400 to-indigo-500 animate-pulse shadow-2xl shadow-cyan-500/50 scale-105'
                      : isRecording
                      ? 'bg-gradient-to-tr from-rose-500 via-pink-500 to-red-500 animate-pulse shadow-2xl shadow-rose-500/50 scale-105'
                      : isProcessingTurn
                      ? 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-sky-500 animate-spin shadow-2xl shadow-indigo-500/50'
                      : 'bg-slate-900 border-2 border-slate-700 shadow-xl'
                  }`}
                >
                  <div className="w-32 h-32 rounded-full bg-slate-950/90 flex items-center justify-center">
                    {isPlayingAudio ? (
                      <Volume2 className="h-12 w-12 text-cyan-400 animate-bounce" />
                    ) : isRecording ? (
                      <Mic className="h-12 w-12 text-rose-400 animate-pulse" />
                    ) : isProcessingTurn ? (
                      <Loader2 className="h-12 w-12 text-indigo-400 animate-spin" />
                    ) : (
                      <Bot className="h-12 w-12 text-cyan-400" />
                    )}
                  </div>
                </div>

                {/* Animated Ripple Waves */}
                {(isPlayingAudio || isRecording) && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-ping" />
                    <div className="absolute -inset-4 rounded-full border border-cyan-400/20 animate-pulse" />
                  </>
                )}
              </div>

              {/* Status Header */}
              <div>
                <div className="text-lg font-extrabold text-slate-100">
                  {isPlayingAudio
                    ? 'AI Doctor Speaking...'
                    : isRecording
                    ? 'Listening to Patient...'
                    : isProcessingTurn
                    ? 'Thinking & Processing...'
                    : 'Voice Onboarding Call'}
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  {isPlayingAudio
                    ? 'Listen to spoken instructions via audio output'
                    : isRecording
                    ? 'Speak your symptoms into microphone'
                    : 'Hands-free automated clinical intake session'}
                </p>
              </div>

              {/* Spoken AI Audio Controls */}
              {lastAiTurn && (
                <div className="w-full bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-400 flex items-center space-x-1.5">
                      <Bot className="h-4 w-4" />
                      <span>Current AI Question:</span>
                    </span>
                    {lastAiTurn.audioUrl && (
                      <button
                        onClick={() => (isPlayingAudio ? stopAudio() : playAudio(lastAiTurn.audioUrl))}
                        className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-semibold text-[11px] flex items-center space-x-1"
                      >
                        {isPlayingAudio ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-cyan-400" />}
                        <span>{isPlayingAudio ? 'Pause Voice' : 'Replay Voice'}</span>
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">"{lastAiTurn.text}"</p>
                </div>
              )}
            </div>
          ) : (
            /* VIEW C: Full Detailed Text Transcript */
            <div className="w-full flex-1 overflow-y-auto space-y-4 pr-1">
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

              {isProcessingTurn && (
                <div className="flex items-center space-x-3 text-slate-400 text-xs py-2 px-4 bg-slate-900/50 rounded-xl w-max border border-slate-800">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                  <span>AI is generating response & synthesizing speech audio...</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          )}

        </div>

        {/* Input Bar / Controls (HIDDEN when Session is Completed) */}
        {!isCompleted && (
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
                        ? 'Auto-Silence VAD Active (Mic sends audio automatically when you pause)'
                        : 'Tap Microphone to Speak'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isRecording
                        ? 'Speak your symptoms — audio will auto-send after 1.6s of silence'
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
        )}

      </div>
    </div>
  );
}
