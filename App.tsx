
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Settings, 
  Video, 
  Download, 
  Play, 
  Pause, 
  RefreshCw, 
  FileText,
  AlertCircle,
  LayoutDashboard,
  Cpu,
  Camera,
  Upload
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import PipelineVisualizer from './components/PipelineVisualizer';
import ControlPanel from './components/ControlPanel';
import SummaryReport from './components/SummaryReport';
import { CVEngine } from './services/cvEngine';
import { FrameMetrics, PipelineSettings, DetectionStatus } from './types';

const DEFAULT_SETTINGS: PipelineSettings = {
  cannyLow: 50,
  cannyHigh: 150,
  blurRadius: 5,
  roiHeight: 45,
  roiWidth: 10
};

const App: React.FC = () => {
  const [status, setStatus] = useState<DetectionStatus>(DetectionStatus.IDLE);
  const [metricsHistory, setMetricsHistory] = useState<FrameMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<FrameMetrics | null>(null);
  const [settings, setSettings] = useState<PipelineSettings>(DEFAULT_SETTINGS);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'video' | 'camera'>('video');
  const [showReport, setShowReport] = useState(false);
  const [view, setView] = useState<'dashboard' | 'pipeline'>('dashboard');

  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<CVEngine | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    engineRef.current = new CVEngine();
    return () => {
      engineRef.current?.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSourceType('video');
      setVideoFile(file);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl(URL.createObjectURL(file));
      setStatus(DetectionStatus.IDLE);
      setMetricsHistory([]);
      setCurrentMetrics(null);
      
      // Stop camera if it was running
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 1280, height: 720 } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.src = ""; // Clear file URL if any
        setVideoUrl("camera-active"); // Flag to show viewport
      }
      setSourceType('camera');
      setVideoFile(null);
      setStatus(DetectionStatus.IDLE);
      setMetricsHistory([]);
      setCurrentMetrics(null);
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const toggleProcessing = useCallback(() => {
    if (!videoRef.current || !engineRef.current) return;

    if (status === DetectionStatus.PROCESSING) {
      if (sourceType === 'video') {
        videoRef.current.pause();
      }
      setStatus(DetectionStatus.IDLE);
      engineRef.current.stop();
    } else {
      if (sourceType === 'video') {
        videoRef.current.play();
      }
      setStatus(DetectionStatus.PROCESSING);
      engineRef.current.start(videoRef.current, settings, (metrics) => {
        setCurrentMetrics(metrics);
        setMetricsHistory(prev => [...prev.slice(-100), metrics]);
      });
    }
  }, [status, settings, sourceType]);

  const resetSystem = () => {
    if (videoRef.current) {
      if (sourceType === 'video') {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
    setStatus(DetectionStatus.IDLE);
    setMetricsHistory([]);
    setCurrentMetrics(null);
    engineRef.current?.stop();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Cpu className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            LaneVision Pro
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${view === 'dashboard' ? 'bg-blue-600/10 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button 
            onClick={() => setView('pipeline')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${view === 'pipeline' ? 'bg-blue-600/10 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Activity size={18} />
            CV Pipeline
          </button>
          <button 
            onClick={() => setShowReport(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800"
          >
            <FileText size={18} />
            Session Report
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 p-3 rounded-lg flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${status === DetectionStatus.PROCESSING ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
              {status}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Toolbar */}
        <header className="h-20 border-b border-slate-800 bg-slate-900/50 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-950/50 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setSourceType('video')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sourceType === 'video' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Upload size={14} /> Video Upload
              </button>
              <button 
                onClick={startCamera}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sourceType === 'camera' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Camera size={14} /> Live Cam
              </button>
            </div>
            
            {sourceType === 'video' && (
              <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors text-xs font-bold border border-white/5">
                <Video size={14} />
                Load File
                <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
            
            {videoFile && sourceType === 'video' && (
              <span className="text-[10px] text-slate-500 font-mono italic max-w-[150px] truncate">
                {videoFile.name}
              </span>
            )}
            {sourceType === 'camera' && (
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                Live Feed
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleProcessing}
              disabled={!videoUrl}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                status === DetectionStatus.PROCESSING 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                  : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 shadow-[0_0_20px_rgba(22,163,74,0.3)]'
              }`}
            >
              {status === DetectionStatus.PROCESSING ? <Pause size={16} /> : <Play size={16} />}
              {status === DetectionStatus.PROCESSING ? 'Pause Analysis' : 'Start Perception'}
            </button>
            <button 
              onClick={resetSystem}
              className="p-2.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-white/5"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </header>

        {/* View Port */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {!videoUrl ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 bg-slate-900/50 border border-slate-800 rounded-3xl flex items-center justify-center shadow-inner group">
                {sourceType === 'video' ? (
                  <Video className="text-slate-700 w-10 h-10 group-hover:text-blue-500 transition-colors" />
                ) : (
                  <Camera className="text-slate-700 w-10 h-10 group-hover:text-blue-500 transition-colors" />
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-100 tracking-tight">Perception Target Required</h3>
                <p className="text-slate-500 max-w-sm mx-auto text-sm font-medium leading-relaxed">
                  {sourceType === 'video' 
                    ? "Upload an academic road driving dataset (.mp4, .mov) to begin lane fidelity analysis."
                    : "Activate your local optical sensor for real-time edge processing and maneuver feasibility."}
                </p>
              </div>
              {sourceType === 'camera' && (
                <button 
                  onClick={startCamera}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-600/30 transition-all"
                >
                  Enable Sensor
                </button>
              )}
            </div>
          ) : (
            <>
              {view === 'dashboard' ? (
                <Dashboard 
                  videoRef={videoRef} 
                  videoUrl={sourceType === 'video' ? (videoUrl || "") : ""}
                  currentMetrics={currentMetrics}
                  metricsHistory={metricsHistory}
                />
              ) : (
                <PipelineVisualizer engine={engineRef.current} />
              )}
            </>
          )}
        </div>
      </main>

      {/* Right Sidebar: Controls */}
      <aside className="w-80 border-l border-slate-800 bg-slate-900/50 p-6 flex flex-col overflow-y-auto">
        <div className="flex items-center gap-2 mb-6 text-slate-200">
          <Settings size={18} className="text-blue-500" />
          <h2 className="font-black text-sm uppercase tracking-widest">Logic Tuning</h2>
        </div>
        <ControlPanel settings={settings} onSettingsChange={setSettings} />
        
        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-[2rem]">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <AlertCircle size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Engine Info</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              Detection optimized for {sourceType === 'video' ? '720p footage' : 'Live sensor feed'}. 
              Processing uses Typed Array histograms for real-time performance.
            </p>
          </div>
        </div>
      </aside>

      {/* Report Modal Overlay */}
      {showReport && (
        <SummaryReport 
          history={metricsHistory} 
          onClose={() => setShowReport(false)} 
        />
      )}
    </div>
  );
};

export default App;
