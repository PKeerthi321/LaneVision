
import React, { useRef, useEffect } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { ShieldCheck, Zap, Layers, MapPin, Navigation, ArrowLeftRight, AlertCircle, CheckCircle2, Info, Activity } from 'lucide-react';
import { FrameMetrics, FeasibilityStatus } from '../types';

interface DashboardProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoUrl: string;
  currentMetrics: FrameMetrics | null;
  metricsHistory: FrameMetrics[];
}

const Dashboard: React.FC<DashboardProps> = ({ videoRef, videoUrl, currentMetrics, metricsHistory }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const syncSize = () => {
      if (videoRef.current && canvasRef.current) {
        canvasRef.current.width = videoRef.current.clientWidth;
        canvasRef.current.height = videoRef.current.clientHeight;
      }
    };
    window.addEventListener('resize', syncSize);
    syncSize();
    return () => window.removeEventListener('resize', syncSize);
  }, [videoRef]);

  const confidenceColor = currentMetrics 
    ? currentMetrics.confidence > 70 ? 'text-green-400' : currentMetrics.confidence > 40 ? 'text-amber-400' : 'text-red-400'
    : 'text-slate-500';

  const formatCurvature = (val: number) => {
    if (val >= 4500) return 'Straight';
    return `${Math.round(val)}m`;
  };

  const getFeasibilityDetails = (status: FeasibilityStatus | undefined) => {
    switch(status) {
      case 'CRITICAL':
        return { label: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500/10', icon: <AlertCircle size={28} /> };
      case 'CAUTION':
        return { label: 'CAUTION', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: <AlertCircle size={28} /> };
      case 'CLEAR':
        return { label: 'CLEAR', color: 'text-green-400', bg: 'bg-green-400/10', icon: <CheckCircle2 size={28} /> };
      default:
        return { label: 'INIT...', color: 'text-slate-500', bg: 'bg-slate-800/20', icon: <Activity size={28} /> };
    }
  };

  const leftShift = getFeasibilityDetails(currentMetrics?.leftShiftFeasibility);
  const rightShift = getFeasibilityDetails(currentMetrics?.rightShiftFeasibility);

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
          <video 
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover opacity-70"
            loop
            muted
            playsInline
          />
          <canvas 
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            id="lane-overlay-canvas"
          />
          
          <div className="absolute top-6 left-6 flex gap-3">
            <div className="px-4 py-2 bg-slate-950/80 backdrop-blur-xl rounded-xl text-[10px] font-black text-white uppercase tracking-[0.2em] border border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,1)]" />
              CV STREAM ACTIVE
            </div>
          </div>

          <div className="absolute top-6 right-6 flex gap-2">
             <HUDMetric label="L-RADIUS" value={formatCurvature(currentMetrics?.leftCurvature || 0)} />
             <HUDMetric label="R-RADIUS" value={formatCurvature(currentMetrics?.rightCurvature || 0)} />
          </div>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 bg-slate-950/90 backdrop-blur-2xl px-12 py-6 rounded-[2rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 opacity-60">Confidence</span>
              <span className={`text-3xl font-mono font-black tracking-tighter ${confidenceColor}`}>
                {Math.round(currentMetrics?.confidence || 0)}%
              </span>
            </div>
            <div className="w-px h-14 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 opacity-60">Fidelity</span>
              <span className="text-3xl font-mono font-black tracking-tighter text-blue-400">
                {Math.round(currentMetrics?.edgeClarity || 0)}%
              </span>
            </div>
            <div className="w-px h-14 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 opacity-60">System State</span>
              <span className={`text-sm font-black ${currentMetrics?.leftLaneDetected && currentMetrics?.rightLaneDetected ? 'text-green-400' : 'text-amber-500'}`}>
                {currentMetrics?.leftLaneDetected && currentMetrics?.rightLaneDetected ? 'STABLE LOCK' : 'REACQUIRING'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 h-72 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
               <ShieldCheck size={20} className="text-blue-500" />
               <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Temporal Fidelity Stream</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Dynamic Buffer [N=100]</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricsHistory}>
                <defs>
                  <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="timestamp" hide />
                <YAxis domain={[0, 100]} stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickCount={5} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }}
                  itemStyle={{ color: '#3b82f6', fontSize: '12px', fontWeight: '900' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="confidence" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorConf)" 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 space-y-6">
        {/* Maneuver Decision Center */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-1000 rotate-45">
            <ArrowLeftRight size={280} />
          </div>
          
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/30">
              <ArrowLeftRight size={26} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-100 tracking-tighter">Maneuver Decision Center</h3>
              <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em] mt-0.5">Automated Feasibility Engine</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className={`border border-slate-800/50 p-8 rounded-[2rem] transition-all duration-500 flex items-center justify-between group/card hover:bg-slate-800/30 ${leftShift.bg}`}>
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest opacity-60">Left Maneuver</div>
                <div className={`text-4xl font-black tracking-tighter ${leftShift.color}`}>{leftShift.label}</div>
              </div>
              <div className={`${leftShift.color} drop-shadow-[0_0_12px_currentColor]`}>{leftShift.icon}</div>
            </div>

            <div className={`border border-slate-800/50 p-8 rounded-[2rem] transition-all duration-500 flex items-center justify-between group/card hover:bg-slate-800/30 ${rightShift.bg}`}>
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest opacity-60">Right Maneuver</div>
                <div className={`text-4xl font-black tracking-tighter ${rightShift.color}`}>{rightShift.label}</div>
              </div>
              <div className={`${rightShift.color} drop-shadow-[0_0_12px_currentColor]`}>{rightShift.icon}</div>
            </div>
          </div>

          <div className="mt-10 p-6 bg-slate-950/50 rounded-2xl flex items-start gap-5 border border-white/5 shadow-inner">
            <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              Autonomous shift feasibility is calculated via real-time line cluster strength (threshold: 3% density) and geometry radius verification.
            </p>
          </div>
        </div>

        {/* Health Matrix */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 shadow-xl space-y-7">
          <div className="flex items-center gap-3 px-1 mb-2">
             <Activity size={18} className="text-blue-500" />
             <span className="text-[11px] font-black text-slate-200 uppercase tracking-widest">Environment Matrix</span>
          </div>
          <MetricRow icon={<Navigation size={16} />} label="Path Geometry" value={Math.min(100, (currentMetrics?.leftCurvature || 0) / 45)} displayVal={formatCurvature((currentMetrics?.leftCurvature || 0 + (currentMetrics?.rightCurvature || 0)) / 2)} color="text-indigo-400" />
          <MetricRow icon={<Zap size={16} />} label="Line Fidelity" value={currentMetrics?.edgeClarity || 0} color="text-emerald-400" />
          <MetricRow icon={<Layers size={16} />} label="Temporal Stability" value={currentMetrics?.continuityScore || 0} color="text-blue-400" />
          <MetricRow icon={<MapPin size={16} />} label="Ambient Robustness" value={currentMetrics?.lightingScore || 0} color="text-amber-400" />
        </div>

        {/* System State Summary */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] flex items-center justify-between group hover:border-blue-500/40 transition-all shadow-lg">
           <div>
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Pipeline Mode</span>
              <div className="text-lg font-black text-slate-200">HISTOGRAM_SC_V3</div>
           </div>
           <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-xl text-green-400 text-xs font-black border border-green-500/20">
              <CheckCircle2 size={14} /> ACTIVE
           </div>
        </div>
      </div>
    </div>
  );
};

const HUDMetric = ({ label, value }: { label: string, value: string }) => (
  <div className="bg-slate-950/80 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 flex flex-col items-end shadow-2xl">
    <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1 opacity-60">{label}</span>
    <span className="text-sm font-mono text-blue-400 font-black tracking-tighter">{value}</span>
  </div>
);

interface MetricRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  displayVal?: string;
  color: string;
}

const MetricRow: React.FC<MetricRowProps> = ({ icon, label, value, displayVal, color }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2.5 text-slate-400 text-xs font-bold">
        {icon}
        {label}
      </div>
      <span className={`text-xs font-black font-mono ${color}`}>{displayVal || `${Math.round(value)}%`}</span>
    </div>
    <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
      <div className={`h-full bg-current ${color} transition-all duration-1000 ease-out shadow-[0_0_8px_currentColor]`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

export default Dashboard;
