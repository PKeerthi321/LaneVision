
import React from 'react';
import { PipelineSettings } from '../types';

interface ControlPanelProps {
  settings: PipelineSettings;
  onSettingsChange: (settings: PipelineSettings) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ settings, onSettingsChange }) => {
  const handleChange = (key: keyof PipelineSettings, value: number) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      <ControlSlider 
        label="Canny High Threshold" 
        value={settings.cannyHigh} 
        min={50} 
        max={255} 
        onChange={(v) => handleChange('cannyHigh', v)} 
      />
      <ControlSlider 
        label="Canny Low Threshold" 
        value={settings.cannyLow} 
        min={0} 
        max={100} 
        onChange={(v) => handleChange('cannyLow', v)} 
      />
      <ControlSlider 
        label="Gaussian Blur" 
        value={settings.blurRadius} 
        min={1} 
        max={15} 
        step={2}
        onChange={(v) => handleChange('blurRadius', v)} 
      />
      
      <div className="pt-4 border-t border-slate-800 space-y-6">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Region of Interest</h3>
        <ControlSlider 
          label="Horizon Height %" 
          value={settings.roiHeight} 
          min={30} 
          max={70} 
          onChange={(v) => handleChange('roiHeight', v)} 
        />
        <ControlSlider 
          label="Top Width %" 
          value={settings.roiWidth} 
          min={0} 
          max={40} 
          onChange={(v) => handleChange('roiWidth', v)} 
        />
      </div>

      <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-800">
        <h4 className="text-xs font-bold text-slate-300 mb-2">Preset Profiles</h4>
        <div className="grid grid-cols-2 gap-2">
          <button 
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 font-bold transition-colors"
            onClick={() => onSettingsChange({ ...settings, cannyHigh: 150, blurRadius: 5 })}
          >
            Daylight
          </button>
          <button 
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 font-bold transition-colors"
            onClick={() => onSettingsChange({ ...settings, cannyHigh: 80, blurRadius: 7 })}
          >
            Rainy/Night
          </button>
        </div>
      </div>
    </div>
  );
};

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

const ControlSlider: React.FC<ControlSliderProps> = ({ label, value, min, max, step = 1, onChange }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-xs text-slate-400 font-medium">{label}</label>
      <span className="text-xs font-mono text-blue-400 font-bold">{value}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step}
      value={value} 
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
    />
  </div>
);

export default ControlPanel;
