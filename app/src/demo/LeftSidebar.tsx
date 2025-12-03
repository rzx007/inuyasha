import React, { useState } from 'react';
import { Layers, Database, Search, Plus, Play, CheckCircle, AlertCircle, Save, X } from 'lucide-react';
import { COMPONENT_LIBRARY } from '../constants';
import { ComponentCategory, DataSource } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface LeftSidebarProps {
  dataSources: DataSource[];
  onAddDataSource: (source: DataSource) => void;
  onUpdateDataSourceData: (id: string, data: any) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ dataSources, onAddDataSource, onUpdateDataSourceData }) => {
  const [activeTab, setActiveTab] = useState<'components' | 'data'>('components');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data Source Form State
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('https://jsonplaceholder.typicode.com/users');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('application/react-dnd-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleTestApi = async () => {
    if (!newSourceUrl) return;
    setTestStatus('loading');
    setTestResult(null);
    try {
      const response = await fetch(newSourceUrl);
      const data = await response.json();
      setTestResult(data);
      setTestStatus('success');
    } catch (error) {
      setTestResult({ error: 'Failed to fetch' });
      setTestStatus('error');
    }
  };

  const handleSaveSource = () => {
    if (!newSourceName || !newSourceUrl) return;
    const newSource: DataSource = {
      id: uuidv4(),
      name: newSourceName,
      url: newSourceUrl,
      method: 'GET',
      data: testResult
    };
    onAddDataSource(newSource);
    // Reset Form
    setIsAddingSource(false);
    setNewSourceName('');
    setTestResult(null);
    setTestStatus('idle');
  };

  const categories = Object.values(ComponentCategory);
  
  const filteredComponents = COMPONENT_LIBRARY.filter(c => 
    c.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-sm">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('components')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'components'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers size={16} />
          <span>Components</span>
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'data'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database size={16} />
          <span>Sources</span>
        </button>
      </div>

      {activeTab === 'components' ? (
        <>
          {/* Search */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Component List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {categories.map((category) => {
              const categoryComponents = filteredComponents.filter(c => c.category === category);
              
              if (categoryComponents.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryComponents.map((component) => (
                      <div
                        key={component.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, component.type)}
                        className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-400 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
                      >
                        <div className="p-2 bg-slate-50 text-slate-600 rounded-md group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors mb-2">
                          <component.icon size={20} />
                        </div>
                        <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 text-center">
                          {component.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col h-full">
           {/* Add New Source Button */}
           {!isAddingSource && (
             <div className="p-4 border-b border-slate-200 bg-white">
               <button 
                onClick={() => setIsAddingSource(true)}
                className="w-full flex items-center justify-center space-x-2 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md text-sm font-medium transition-colors border border-indigo-200"
               >
                 <Plus size={16} />
                 <span>Add Data Source</span>
               </button>
             </div>
           )}

           {/* Add Source Form */}
           {isAddingSource && (
             <div className="p-4 bg-white border-b border-slate-200 shadow-sm animate-in slide-in-from-top-2 duration-200">
               <div className="flex items-center justify-between mb-3">
                 <h3 className="text-sm font-semibold text-slate-800">New API Source</h3>
                 <button onClick={() => setIsAddingSource(false)} className="text-slate-400 hover:text-slate-600">
                   <X size={16} />
                 </button>
               </div>
               
               <div className="space-y-3">
                 <div>
                   <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                   <input 
                    type="text" 
                    placeholder="e.g. Users API"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:border-indigo-500 focus:outline-none"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-slate-600 mb-1">Endpoint URL</label>
                   <div className="flex space-x-1">
                     <select className="text-xs border border-slate-300 rounded bg-slate-50 px-1">
                       <option>GET</option>
                     </select>
                     <input 
                      type="text" 
                      placeholder="https://api..."
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded focus:border-indigo-500 focus:outline-none"
                     />
                   </div>
                 </div>

                 {/* Test Actions */}
                 <div className="flex items-center space-x-2 pt-2">
                   <button 
                    onClick={handleTestApi}
                    disabled={testStatus === 'loading'}
                    className="flex-1 flex items-center justify-center space-x-1 py-1.5 bg-slate-800 text-white rounded hover:bg-slate-900 text-xs font-medium disabled:opacity-50"
                   >
                     {testStatus === 'loading' ? <span className="animate-spin">...</span> : <Play size={12} />}
                     <span>Test Request</span>
                   </button>
                   <button 
                     onClick={handleSaveSource}
                     disabled={!testResult || !newSourceName}
                     className="flex-1 flex items-center justify-center space-x-1 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     <Save size={12} />
                     <span>Save Source</span>
                   </button>
                 </div>

                 {/* Test Result */}
                 {testResult && (
                    <div className="mt-3">
                      <div className="flex items-center space-x-1 mb-1">
                        {testStatus === 'success' ? (
                          <CheckCircle size={12} className="text-green-500" />
                        ) : (
                          <AlertCircle size={12} className="text-red-500" />
                        )}
                        <span className="text-xs font-medium text-slate-600">Response Preview</span>
                      </div>
                      <div className="bg-slate-900 rounded p-2 overflow-hidden">
                        <pre className="text-[10px] text-green-400 font-mono overflow-auto max-h-32">
                          {JSON.stringify(testResult, null, 2)}
                        </pre>
                      </div>
                    </div>
                 )}
               </div>
             </div>
           )}

           {/* Source List */}
           <div className="p-4 space-y-3">
              {dataSources.length === 0 && !isAddingSource && (
                <div className="text-center py-8 text-slate-400">
                  <Database size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No data sources yet.</p>
                </div>
              )}
              
              {dataSources.map(source => (
                <div key={source.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="font-medium text-sm text-slate-800">{source.name}</span>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">GET</span>
                  </div>
                  <div className="text-xs text-slate-500 truncate mb-2 font-mono" title={source.url}>
                    {source.url}
                  </div>
                  <div className="flex justify-end">
                    <button 
                      className="text-xs text-indigo-600 hover:underline flex items-center space-x-1"
                      onClick={() => {
                        // Re-fetch data
                        fetch(source.url)
                          .then(res => res.json())
                          .then(data => onUpdateDataSourceData(source.id, data))
                          .catch(console.error);
                      }}
                    >
                      <Play size={10} />
                      <span>Run</span>
                    </button>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </aside>
  );
};

export default LeftSidebar;
