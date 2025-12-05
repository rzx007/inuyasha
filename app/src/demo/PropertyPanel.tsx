import React, { useState } from 'react';
import * as Icons from './Icons';
import { PropertyGroup, PropertyItem, SelectedComponentState } from '../types';

interface PropertiesPanelProps {
  selectedComponent: SelectedComponentState | null;
}

// Sub-components for Form Inputs

interface LabelProps {
  children: React.ReactNode;
  tooltip?: string;
}
const Label: React.FC<LabelProps> = ({ children, tooltip }) => (
  <div className="flex items-center justify-between mb-1.5">
    <label className="text-xs font-medium text-slate-500">{children}</label>
    {tooltip && <Icons.MoreHorizontal size={12} className="text-slate-300 cursor-help" />}
  </div>
);

interface InputTextProps {
  value: string;
  onChange: (v: string) => void;
}
const InputText: React.FC<InputTextProps> = ({ value, onChange }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
  />
);

interface InputSelectProps {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}
const InputSelect: React.FC<InputSelectProps> = ({ value, options, onChange }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 appearance-none focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    <Icons.ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
  </div>
);

interface InputSwitchProps {
  value: boolean;
  onChange: (v: boolean) => void;
}
const InputSwitch: React.FC<InputSwitchProps> = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
      value ? 'bg-primary-600' : 'bg-slate-200'
    }`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
        value ? 'translate-x-4.5' : 'translate-x-1'
      }`}
      style={{ transform: value ? 'translateX(18px)' : 'translateX(2px)' }}
    />
  </button>
);

interface InputColorProps {
  value: string;
  onChange: (v: string) => void;
}
const InputColor: React.FC<InputColorProps> = ({ value, onChange }) => (
  <div className="flex items-center gap-2 border border-slate-200 rounded-md p-1 bg-white focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500">
    <div className="w-6 h-6 rounded border border-slate-200 shadow-sm" style={{ backgroundColor: value }} />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 min-w-0 bg-transparent border-none text-sm text-slate-700 focus:ring-0 p-0"
    />
    <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="opacity-0 absolute w-0 h-0"
        id="color-picker-trigger"
    />
    <label htmlFor="color-picker-trigger" className="cursor-pointer p-1 hover:bg-slate-100 rounded">
        <Icons.Sparkles size={14} className="text-slate-400" />
    </label>
  </div>
);

interface CodeEditorProps {
  value: string;
}
const CodeEditor: React.FC<CodeEditorProps> = ({ value }) => (
  <div className="relative group">
    <textarea
      value={value}
      readOnly
      className="w-full h-32 p-3 bg-slate-900 text-slate-300 rounded-md text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary-500 border border-slate-800"
    />
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
         <button className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-white"><Icons.Copy size={12}/></button>
    </div>
  </div>
);

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}
const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-4 bg-white hover:bg-slate-50 transition-colors"
      >
        <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">{title}</span>
        {isOpen ? <Icons.ChevronDown size={14} className="text-slate-400" /> : <Icons.ChevronRight size={14} className="text-slate-400" />}
      </button>
      {isOpen && <div className="p-4 pt-0 space-y-4">{children}</div>}
    </div>
  );
};

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedComponent }) => {
  const [activeTab, setActiveTab] = useState<'props' | 'events' | 'animate'>('props');

  if (!selectedComponent) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col items-center justify-center text-slate-400 h-full shrink-0">
        <Icons.MousePointer2 size={48} className="mb-4 text-slate-200" />
        <p className="text-sm font-medium">Select a component to edit</p>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-primary-600 px-2 py-0.5 bg-primary-50 rounded-full border border-primary-100">
            {selectedComponent.type}
          </span>
          <div className="flex gap-2 text-slate-400">
            <button className="hover:text-slate-600"><Icons.Copy size={14} /></button>
            <button className="hover:text-red-500"><Icons.Trash2 size={14} /></button>
          </div>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 truncate">{selectedComponent.name}</h2>
        <p className="text-xs text-slate-400 mt-1">ID: {selectedComponent.id}</p>
      </div>

      {/* Tabs */}
      <div className="flex px-2 pt-2 border-b border-slate-200 bg-slate-50/50">
        {['props', 'events', 'animate'].map((tab) => (
            <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 pb-2 text-xs font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                ? 'text-primary-600 border-primary-600'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
            >
            {tab === 'props' ? 'Properties' : tab}
            </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'props' && (
          <div className="bg-white">
            {selectedComponent.properties.map((group, groupIdx) => (
              <AccordionItem key={groupIdx} title={group.title}>
                {group.items.map((item) => (
                  <div key={item.id} className="space-y-1">
                    {item.type !== 'switch' && <Label>{item.label}</Label>}
                    
                    {item.type === 'switch' && (
                        <div className="flex items-center justify-between py-1">
                            <Label>{item.label}</Label>
                            <InputSwitch value={item.value} onChange={() => {}} />
                        </div>
                    )}

                    {item.type === 'text' && <InputText value={item.value} onChange={() => {}} />}
                    
                    {item.type === 'select' && (
                      <InputSelect value={item.value} options={item.options || []} onChange={() => {}} />
                    )}
                    
                    {item.type === 'color' && <InputColor value={item.value} onChange={() => {}} />}

                    {item.type === 'code' && <CodeEditor value={item.value} />}

                    {item.description && <p className="text-[10px] text-slate-400 mt-1">{item.description}</p>}
                  </div>
                ))}
              </AccordionItem>
            ))}
          </div>
        )}
        
        {activeTab !== 'props' && (
            <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-3">
                    <Icons.Sparkles className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-500">Advanced AI configurations coming soon for {activeTab}.</p>
            </div>
        )}
      </div>

       {/* Footer Actions */}
       <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button className="w-full py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-2">
            <Icons.Sparkles size={14} className="text-indigo-500" />
            AI Assist
          </button>
       </div>
    </div>
  );
};

export default PropertiesPanel;