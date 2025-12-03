import React from 'react';
import { 
  Play, 
  Save, 
  Smartphone, 
  Monitor, 
  Undo2, 
  Redo2, 
  Trash2,
  Share2,
  Code
} from 'lucide-react';
import { DeviceMode } from '../types';

interface TopBarProps {
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  onClear: () => void;
  elementCount: number;
}

const TopBar: React.FC<TopBarProps> = ({ deviceMode, setDeviceMode, onClear, elementCount }) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-50">
      {/* Left: Logo & Title */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
            <Code size={18} />
          </div>
          <span className="font-semibold text-slate-800 tracking-tight">Studio<span className="text-indigo-600">Flow</span></span>
        </div>
        
        {/* Undo/Redo (Visual only for demo) */}
        <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
        <div className="flex items-center space-x-1 hidden md:flex">
          <button className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors" title="Undo">
            <Undo2 size={16} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-not-allowed" title="Redo">
            <Redo2 size={16} />
          </button>
        </div>
      </div>

      {/* Center: Device Toggles */}
      <div className="absolute left-1/2 transform -translate-x-1/2 bg-slate-100 p-1 rounded-lg flex items-center">
        <button
          onClick={() => setDeviceMode('desktop')}
          className={`px-3 py-1.5 rounded-md flex items-center space-x-2 text-sm font-medium transition-all ${
            deviceMode === 'desktop' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Monitor size={16} />
          <span>Desktop</span>
        </button>
        <button
          onClick={() => setDeviceMode('mobile')}
          className={`px-3 py-1.5 rounded-md flex items-center space-x-2 text-sm font-medium transition-all ${
            deviceMode === 'mobile' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Smartphone size={16} />
          <span>Mobile</span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-3">
         <button 
          onClick={onClear}
          disabled={elementCount === 0}
          className={`flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
             elementCount === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'
          }`}
        >
          <Trash2 size={16} />
          <span>Clear</span>
        </button>
        <button className="flex items-center space-x-1.5 px-3 py-1.5 text-slate-700 text-sm font-medium hover:bg-slate-100 rounded-md transition-colors">
          <Save size={16} />
          <span>Save</span>
        </button>
        <button className="flex items-center space-x-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm transition-all transform active:scale-95">
          <Play size={16} fill="currentColor" />
          <span>Preview</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
