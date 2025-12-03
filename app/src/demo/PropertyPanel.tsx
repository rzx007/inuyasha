import React from 'react';
import { Settings, Palette, Layout, Trash, Link2, Type } from 'lucide-react';
import { CanvasElement, DataSource } from '../types';
import { COMPONENT_LIBRARY } from '../constants';

interface PropertyPanelProps {
  selectedElement: CanvasElement | null;
  dataSources: DataSource[];
  onUpdateProps: (props: Record<string, any>) => void;
  onUpdateBinding: (prop: string, binding: { sourceId: string; path: string } | null) => void;
  onDelete: () => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ 
  selectedElement, 
  dataSources, 
  onUpdateProps, 
  onUpdateBinding, 
  onDelete 
}) => {
  if (!selectedElement) {
    return (
      <aside className="w-80 bg-white border-l border-slate-200 flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
          <Settings size={32} />
        </div>
        <h3 className="text-slate-900 font-medium mb-1">No Selection</h3>
        <p className="text-sm text-slate-500">Select a component on the canvas to edit its properties.</p>
      </aside>
    );
  }

  const definition = COMPONENT_LIBRARY.find(c => c.type === selectedElement.type);
  const props = selectedElement.props;
  const bindings = selectedElement.bindings || {};

  const handleChange = (key: string, value: any) => {
    onUpdateProps({ ...props, [key]: value });
  };

  const handleBindingChange = (prop: string, sourceId: string, path: string) => {
    if (!sourceId) {
      onUpdateBinding(prop, null);
    } else {
      onUpdateBinding(prop, { sourceId, path });
    }
  };

  return (
    <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center space-x-2">
          {definition && <definition.icon size={18} className="text-indigo-600" />}
          <h2 className="font-semibold text-slate-800">{definition?.label || 'Component'}</h2>
        </div>
        <button 
          onClick={onDelete}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" 
          title="Delete Component"
        >
          <Trash size={16} />
        </button>
      </div>

      <div className="p-5 space-y-6">
        
        {/* Layout Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Layout size={12} />
            <span>Layout</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Width</label>
                <select 
                  className="w-full text-sm border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  value={props.width || 'auto'}
                  onChange={(e) => handleChange('width', e.target.value)}
                >
                  <option value="auto">Auto</option>
                  <option value="100%">Full</option>
                  <option value="50%">50%</option>
                  <option value="33%">33%</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Padding</label>
                <select 
                  className="w-full text-sm border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  value={props.padding || '0px'}
                  onChange={(e) => handleChange('padding', e.target.value)}
                >
                  <option value="0px">None</option>
                  <option value="8px">Small</option>
                  <option value="16px">Medium</option>
                  <option value="24px">Large</option>
                </select>
             </div>
          </div>
        </div>
        
        <hr className="border-slate-100" />

        {/* Style Section */}
        <div className="space-y-4">
           <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Palette size={12} />
            <span>Style</span>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Background Color</label>
            <div className="flex items-center space-x-2">
              <input 
                type="color" 
                value={props.backgroundColor || '#ffffff'}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                className="h-8 w-8 rounded overflow-hidden border border-slate-200 cursor-pointer"
              />
              <input 
                 type="text"
                 value={props.backgroundColor || '#ffffff'}
                 onChange={(e) => handleChange('backgroundColor', e.target.value)}
                 className="flex-1 text-sm border-slate-200 rounded-md font-mono text-slate-600"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Content Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Type size={12} />
            <span>Content</span>
          </div>

          {['text', 'button', 'card', 'section'].includes(selectedElement.type) && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {selectedElement.type === 'button' ? 'Label' : selectedElement.type === 'card' ? 'Title' : 'Text Content'}
              </label>
              <textarea
                rows={3}
                value={props.text || props.label || props.title || ''}
                onChange={(e) => {
                    if (props.text !== undefined) handleChange('text', e.target.value);
                    else if (props.label !== undefined) handleChange('label', e.target.value);
                    else if (props.title !== undefined) handleChange('title', e.target.value);
                }}
                className="w-full text-sm border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}

          {selectedElement.type === 'image' && (
             <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Image URL</label>
              <input
                type="text"
                value={props.src}
                onChange={(e) => handleChange('src', e.target.value)}
                className="w-full text-sm border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
             </div>
          )}

           {selectedElement.type === 'grid' && (
             <div>
               <label className="block text-xs font-medium text-slate-600 mb-1.5">Columns: {props.columns}</label>
               <input 
                 type="range" 
                 min="1" 
                 max="4" 
                 value={props.columns}
                 onChange={(e) => handleChange('columns', parseInt(e.target.value))}
                 className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
               />
             </div>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* Data Bindings Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Link2 size={12} />
            <span>Data Bindings</span>
          </div>
          
          <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
             <div className="mb-3">
               <label className="block text-xs font-medium text-slate-600 mb-1.5">Bindable Property</label>
               <select 
                 className="w-full text-xs border-slate-300 rounded focus:ring-indigo-500"
                 onChange={(e) => { /* Just for UI flow, state is handled per prop row below if needed */ }}
               >
                 {['items', 'text', 'title', 'label'].filter(k => props[k] !== undefined).map(k => (
                   <option key={k} value={k}>{k}</option>
                 ))}
               </select>
             </div>

             {/* Render active bindings or add new one interface */}
             {['items', 'text', 'title', 'label'].filter(k => props[k] !== undefined).map(propKey => {
               const binding = bindings[propKey];
               return (
                 <div key={propKey} className="mb-4 last:mb-0">
                   <div className="flex items-center justify-between mb-1">
                     <span className="text-xs font-semibold text-slate-700">{propKey}</span>
                     {binding && <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1 rounded">Bound</span>}
                   </div>
                   
                   <div className="space-y-2">
                     <select 
                        className="w-full text-xs border-slate-300 rounded bg-white"
                        value={binding?.sourceId || ''}
                        onChange={(e) => handleBindingChange(propKey, e.target.value, binding?.path || '')}
                     >
                       <option value="">Select Source...</option>
                       {dataSources.map(ds => (
                         <option key={ds.id} value={ds.id}>{ds.name}</option>
                       ))}
                     </select>
                     
                     {binding?.sourceId && (
                       <input 
                          type="text"
                          placeholder="Path (e.g. data.users)"
                          value={binding.path}
                          onChange={(e) => handleBindingChange(propKey, binding.sourceId, e.target.value)}
                          className="w-full text-xs border-slate-300 rounded px-2 py-1"
                       />
                     )}
                   </div>
                 </div>
               );
             })}
          </div>
        </div>

      </div>
    </aside>
  );
};

export default PropertyPanel;