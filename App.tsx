
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Settings, 
  Video, 
  Play, 
  Pause, 
  RefreshCw, 
  FileText,
  AlertCircle,
  LayoutDashboard,
  Cpu,
  Camera,
  Upload,
  Menu,
  X
} from 'lucide-react';
import Dashboard from './components/Dashboard/Dashboard';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.src = "";
        setVideoUrl("camera-active");
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
      if (sourceType === 'video') videoRef.current.pause();
      setStatus(DetectionStatus.IDLE);
      engineRef.current.stop();
    } else {
      if (sourceType === 'video') videoRef.current.play();
      setStatus(DetectionStatus.PROCESSING);
      engineRef.current.start(videoRef.current, settings, (metrics) => {
        setCurrentMetrics(metrics);
        setMetricsHistory(prev => [...prev.slice(-100), metrics]);
      });
    }
  }, [status, settings, sourceType]);

  const resetSystem = () => {
    if (videoRef.current && sourceType === 'video') {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setStatus(DetectionStatus.IDLE);
    setMetricsHistory([]);
    setCurrentMetrics(null);
    engineRef.current?.stop();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pipeline', label: 'CV Pipeline', icon: Activity },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-slate-950">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <Cpu className="text-blue-500 w-5 h-5" />
          <h1 className="text-lg font-bold text-white">LaneVision</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar (Desktop) / Drawer (Mobile) */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 w-64 border-r border-slate-800 bg-slate-900 flex flex-col z-40 transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="hidden lg:flex p-6 border-b border-slate-800 items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Cpu className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-white">LaneVision Pro</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-16 lg:mt-0">
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => { setView(item.id as any); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === item.id ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
          <button 
            onClick={() => { setShowReport(true); setIsSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800"
          >
            <FileText size={18} />
            Session Report
          </button>
        </nav>

        {/* Tune Controls on Sidebar for Mobile/Desktop visibility */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4 text-slate-200">
            <Settings size={16} className="text-blue-500" />
            <h2 className="font-black text-[10px] uppercase tracking-widest">Logic Tuning</h2>
          </div>
          <ControlPanel settings={settings} onSettingsChange={setSettings} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Responsive Header Toolbar */}
        <header className="flex flex-col sm:flex-row border-b border-slate-800 bg-slate-900/50 p-4 lg:px-8 lg:h-20 gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex bg-slate-950/50 p-1 rounded-xl border border-white/5 flex-1 sm:flex-none">
              <button 
                onClick={() => setSourceType('video')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${sourceType === 'video' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
              >
                <Upload size={12} /> Video
              </button>
              <button 
                onClick={startCamera}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${sourceType === 'camera' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
              >
                <Camera size={12} /> Live
              </button>
            </div>
            
            {sourceType === 'video' && (
              <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer text-[10px] font-black uppercase border border-white/5">
                <Video size={12} />
                Load
                <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={toggleProcessing}
              disabled={!videoUrl}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                status === DetectionStatus.PROCESSING 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                  : 'bg-green-600 text-white disabled:opacity-30'
              }`}
            >
              {status === DetectionStatus.PROCESSING ? <Pause size={14} /> : <Play size={14} />}
              {status === DetectionStatus.PROCESSING ? 'Pause' : 'Start'}
            </button>
            <button onClick={resetSystem} className="p-2.5 text-slate-500 hover:text-white bg-slate-800/50 rounded-xl transition-all">
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {!videoUrl ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center shadow-2xl">
                {sourceType === 'video' ? <Video className="text-slate-700 w-8 h-8" /> : <Camera className="text-slate-700 w-8 h-8" />}
              </div>
              <div className="px-4">
                <h3 className="text-xl font-black text-slate-100 mb-2">Initialize Perception</h3>
                <p className="text-slate-500 text-xs font-medium max-w-xs mx-auto">
                  {sourceType === 'video' ? "Upload roadway footage to begin analysis." : "Enable your camera for real-time edge processing."}
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
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
            </div>
          )}
        </div>
      </main>

      {/* Report Modal */}
      {showReport && <SummaryReport history={metricsHistory} onClose={() => setShowReport(false)} />}
    </div>
  );
};

export default App;
