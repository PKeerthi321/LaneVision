
import React from 'react';
import { CVEngine } from '../services/cvEngine';
import { Eye, Box, Sliders } from 'lucide-react';

interface PipelineVisualizerProps {
  engine: CVEngine | null;
}

const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({ engine }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">CV Pipeline Architecture</h2>
          <p className="text-sm text-slate-400">Visualization of the real-time frame processing sequence.</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-2 h-2 rounded-full bg-blue-500" /> Linear Step
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Matrix Transform
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PipelineStep 
          id="grayscale-canvas" 
          title="1. Grayscale Conversion" 
          description="Color reduction to single luminance channel for edge optimization."
          icon={<Eye size={16} />}
        />
        <PipelineStep 
          id="canny-canvas" 
          title="2. Canny Edge Detection" 
          description="Multi-stage algorithm detecting high gradients in image intensity."
          icon={<Box size={16} />}
        />
        <PipelineStep 
          id="roi-canvas" 
          title="3. ROI Masking" 
          description="Isolation of the lower trapezoidal region to ignore peripheral noise."
          icon={<Sliders size={16} />}
        />
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6">Algorithm Logic: Hough Transform</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-blue-400 font-bold">ρ</div>
            <h4 className="text-slate-200 font-semibold text-sm">Polar Parameterization</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lines are represented as distance (ρ) and angle (θ) from origin to prevent infinite slopes.
            </p>
          </div>
          <div className="space-y-3">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-indigo-400 font-bold">H</div>
            <h4 className="text-slate-200 font-semibold text-sm">Accumulator Voting</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every edge point votes in parameter space. Peaks in the accumulator represent probable lane lines.
            </p>
          </div>
          <div className="space-y-3">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-emerald-400 font-bold">Σ</div>
            <h4 className="text-slate-200 font-semibold text-sm">Spatial Regression</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detected line segments are clustered and averaged to produce unified left and right boundaries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PipelineStepProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const PipelineStep: React.FC<PipelineStepProps> = ({ id, title, description, icon }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-blue-500/50 transition-all">
    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
        {icon}
        {title}
      </div>
      <div className="text-[10px] font-mono text-slate-500">FP32</div>
    </div>
    <div className="aspect-video bg-black relative">
      <canvas id={id} className="w-full h-full object-contain" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="px-3 py-1 bg-blue-600 rounded text-[10px] font-bold text-white shadow-xl">LIVE BUFFER</div>
      </div>
    </div>
    <div className="p-4 bg-slate-900/50">
      <p className="text-xs text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

export default PipelineVisualizer;
