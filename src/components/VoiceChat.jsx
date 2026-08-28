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
          } else if (Date.now() - silenceStart > 1600) { // 1.6s continuous silence after speech
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

  // Audio Playback Handler with User Base64 fallback support
  const playAudio = (audioUrlOrBase64) => {
    let fullUrl = audioUrlOrBase64;
    if (!fullUrl) return;
    if (!fullUrl.startsWith('data:audio')) {
      fullUrl = resolveAudioUrl(fullUrl);
    }
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
      <div className="glass-card rounded-3xl border border-slate-200/90 shadow-2xl bg-white/95 flex flex-col h-[720px] relative overflow-hidden">
        
        {/* Chat Header Bar */}
        <div className="p-4 border-b border-slate-200/80 bg-white/90 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-cyan-500/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-slate-900">
                  {session?.patient?.name || 'Patient'} Onboarding Assistant
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-cyan-100 text-cyan-900 border border-cyan-200">
                  {session?.language || 'en-IN'}
                </span>
                {isCompleted && (
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Session Completed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Specialty: <span className="text-cyan-700 font-bold">{typeof session?.category === 'string' ? session.category : session?.category?.name || session?.category?.code || 'Cardiology'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle: Audio Only vs Full Transcript */}
            {!isCompleted && (
              <button
                onClick={() => setViewMode(viewMode === 'audio_only' ? 'transcript' : 'audio_only')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition-all shadow-sm"
                title="Toggle between Voice Call mode and Full Text Transcript"
              >
                {viewMode === 'audio_only' ? (
                  <>
                    <MessageSquare className="h-3.5 w-3.5 text-cyan-600" />
                    <span>Show Transcript</span>
                  </>
                ) : (
                  <>
                    <Volume className="h-3.5 w-3.5 text-cyan-600" />
                    <span>Audio Only View</span>
                  </>
                )}
              </button>
            )}

            {/* Auto-Talk Continuous Mode Toggle */}
            {isVoiceMode && !isCompleted && (
              <button
                onClick={() => setAutoTalkMode(!autoTalkMode)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center space-x-1.5 transition-all shadow-sm ${
                  autoTalkMode
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
                title="Continuous hands-free conversation (Auto-listen & auto-send on silence)"
              >
                <Zap className={`h-3.5 w-3.5 ${autoTalkMode ? 'text-emerald-600 animate-pulse' : ''}`} />
                <span>Hands-Free Auto-Talk: {autoTalkMode ? 'ON' : 'OFF'}</span>
              </button>
            )}

            {/* Document Uploader Trigger */}
            <button
              onClick={onOpenDocumentUploader}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <FileText className="h-3.5 w-3.5 text-cyan-600" />
              <span>Prescription OCR</span>
              {documentsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-cyan-600 text-white font-mono text-[10px]">
                  {documentsCount}
                </span>
              )}
            </button>

            {/* Complete & Confirm Session Button */}
            <button
              onClick={() => onCompleteSession(false)}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white text-xs font-extrabold flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Review & Submit EHR</span>
            </button>
          </div>
        </div>

        {/* Dynamic Voice Activity Bar */}
        <div className="px-4 py-2 bg-sky-50/80 border-b border-sky-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            {isCompleted ? (
              <div className="flex items-center space-x-2 text-emerald-800 font-extrabold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Onboarding Completed — Ready for EHR Submission</span>
              </div>
            ) : isPlayingAudio ? (
              <div className="flex items-center space-x-2 text-cyan-800 font-bold">
                <Volume2 className="h-4 w-4 text-cyan-600 animate-bounce" />
                <span>AI Assistant Speaking...</span>
              </div>
            ) : isRecording ? (
              <div className="flex items-center space-x-2 text-rose-700 font-bold">
                <Radio className="h-4 w-4 text-rose-600 animate-pulse" />
                <span>Microphone Active — Speak Now ({recordingTime}s)</span>
              </div>
            ) : isProcessingTurn ? (
              <div className="flex items-center space-x-2 text-indigo-800 font-bold">
                <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                <span>Analyzing Symptoms & Synthesizing Reply...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-slate-600 font-medium">
                <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
                <span>Ready for turn</span>
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-500 font-semibold">
            Session: <span className="text-cyan-900 font-bold">{session?.session_id}</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-center items-center bg-gradient-to-b from-slate-50/50 via-white to-sky-50/30">
          
          {/* VIEW A: Completed Session Screen (Shows ONLY Review Button) */}
          {isCompleted ? (
            <div className="my-auto text-center max-w-lg p-8 rounded-3xl bg-white border border-emerald-200 shadow-2xl space-y-6">
              <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">Patient Intake Completed</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  All clinical symptoms, medical history, and prescription findings have been gathered for <span className="text-cyan-800 font-bold">{session?.patient?.name}</span>.
                </p>
              </div>

              {/* Single Primary Action Button */}
              <div className="pt-4">
                <button
                  onClick={() => onCompleteSession(false)}
                  className="w-full py-4 px-6 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-95 cursor-pointer"
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
                      ? 'bg-gradient-to-tr from-cyan-400 via-sky-400 to-indigo-600 animate-pulse shadow-2xl shadow-cyan-500/40 scale-105'
                      : isRecording
                      ? 'bg-gradient-to-tr from-rose-500 via-pink-500 to-red-600 animate-pulse shadow-2xl shadow-rose-500/40 scale-105'
                      : isProcessingTurn
                      ? 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-sky-500 animate-spin shadow-2xl shadow-indigo-500/40'
                      : 'bg-white border-4 border-slate-200 shadow-xl'
                  }`}
                >
                  <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center shadow-inner">
                    {isPlayingAudio ? (
                      <Volume2 className="h-12 w-12 text-cyan-600 animate-bounce" />
                    ) : isRecording ? (
                      <Mic className="h-12 w-12 text-rose-500 animate-pulse" />
                    ) : isProcessingTurn ? (
                      <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                    ) : (
                      <Bot className="h-12 w-12 text-cyan-600" />
                    )}
                  </div>
                </div>

                {/* Animated Ripple Waves */}
                {(isPlayingAudio || isRecording) && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400/50 animate-ping" />
                    <div className="absolute -inset-4 rounded-full border border-cyan-400/30 animate-pulse" />
                  </>
                )}
              </div>

              {/* Status Header */}
              <div>
                <div className="text-xl font-extrabold text-slate-900">
                  {isPlayingAudio
                    ? 'AI Doctor Speaking...'
                    : isRecording
                    ? 'Listening to Patient...'
                    : isProcessingTurn
                    ? 'Thinking & Processing...'
                    : 'Voice Onboarding Call'}
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-md font-medium">
                  {isPlayingAudio
                    ? 'Listen to spoken instructions via audio output'
                    : isRecording
                    ? 'Speak your symptoms into microphone'
                    : 'Hands-free automated clinical intake session'}
                </p>
              </div>

              {/* Spoken AI Audio Controls */}
              {lastAiTurn && (
                <div className="w-full bg-white p-5 rounded-3xl border border-slate-200/90 shadow-lg space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-cyan-800 flex items-center space-x-1.5">
                      <Bot className="h-4 w-4 text-cyan-600" />
                      <span>Current AI Question:</span>
                    </span>
                    {lastAiTurn.audioUrl && (
                      <button
                        onClick={() => (isPlayingAudio ? stopAudio() : playAudio(lastAiTurn.audioUrl))}
                        className="px-3 py-1 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-900 font-bold text-[11px] flex items-center space-x-1 shadow-sm transition-all"
                      >
                        {isPlayingAudio ? <VolumeX className="h-3.5 w-3.5 text-rose-600" /> : <Volume2 className="h-3.5 w-3.5 text-cyan-600" />}
                        <span>{isPlayingAudio ? 'Pause Voice' : 'Replay Voice'}</span>
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-900 leading-relaxed font-semibold">"{lastAiTurn.text}"</p>
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
                      <div className="h-9 w-9 rounded-2xl bg-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-700 shrink-0 mt-1 shadow-sm">
                        <Bot className="h-5 w-5" />
                      </div>
                    )}

                    <div
                      className={`max-w-xl rounded-3xl p-4 text-sm leading-relaxed shadow-md ${
                        isAI
                          ? 'bg-white border border-slate-200/90 text-slate-900 rounded-tl-none'
                          : 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-medium rounded-tr-none shadow-cyan-500/20'
                      }`}
                    >
                      {turn.patientTranscript && (
                        <div className="mb-2 text-xs italic text-cyan-900 bg-cyan-50 p-2.5 rounded-xl border border-cyan-200 font-medium">
                          <span className="font-bold text-cyan-950">Recognized Patient Speech:</span> "{turn.patientTranscript}"
                        </div>
                      )}

                      <p className="font-medium">{turn.text}</p>

                      <div className="mt-2 flex items-center justify-between text-[10px] opacity-80 font-medium">
                        <span>{turn.timestamp}</span>

                        {/* Audio Playback Button for AI Responses */}
                        {isAI && turn.audioUrl && (
                          <button
                            onClick={() => (isPlayingAudio ? stopAudio() : playAudio(turn.audioUrl))}
                            className="ml-2 px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 border border-sky-200 text-sky-900 flex items-center space-x-1 transition-all font-bold"
                          >
                            {isPlayingAudio ? (
                              <>
                                <VolumeX className="h-3 w-3 text-rose-600" />
                                <span>Pause Audio</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-3 w-3 text-cyan-600" />
                                <span>Replay Audio</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {!isAI && (
                      <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0 mt-1 shadow-md">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isProcessingTurn && (
                <div className="flex items-center space-x-3 text-slate-600 text-xs py-2.5 px-4 bg-white rounded-2xl w-max border border-slate-200 shadow-sm font-semibold">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
                  <span>AI is generating response & synthesizing speech audio...</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          )}

        </div>

        {/* Input Bar / Controls (HIDDEN when Session is Completed) */}
        {!isCompleted && (
          <div className="p-4 border-t border-slate-200/90 bg-white space-y-3">
            
            {/* Voice Microphone Recorder Controls */}
            {isVoiceMode && (
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessingTurn || isPlayingAudio}
                    className={`h-12 w-12 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-xl cursor-pointer ${
                      isRecording
                        ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-rose-500/40 ring-4 ring-rose-500/20'
                        : 'bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/30'
                    }`}
                  >
                    {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </button>

                  <div>
                    <div className="text-xs font-extrabold text-slate-900">
                      {isRecording
                        ? `Recording Speech... (${recordingTime}s)`
                        : autoTalkMode
                        ? 'Auto-Silence VAD Active (Mic sends audio automatically when you pause)'
                        : 'Tap Microphone to Speak'}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
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
                className="flex-1 glass-input px-4 py-3 rounded-2xl text-sm font-medium"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || isProcessingTurn || isRecording}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-sm flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
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
