import React, { useState } from 'react';
import * as Icons from '../Icons';
import { ComponentData, ApiDefinition } from '../../types';
import { useEditorStore } from '../../store';
import { clsx } from 'clsx';
import { ApiForm } from './ApiForm';

const TestResult = ({ result, onClose }: { result: any, onClose: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-8">
        <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-[500px] max-h-[80vh] flex flex-col pointer-events-auto animate-in zoom-in-95 fade-in duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50 rounded-t-lg">
                <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> API Response
                </span>
                <button onClick={onClose}><Icons.Plus size={18} className="rotate-45 text-slate-400 hover:text-slate-600"/></button>
            </div>
            <div className="p-0 overflow-hidden flex-1 flex flex-col">
                <div className="bg-slate-900 flex-1 overflow-auto p-4">
                     <pre className="font-mono text-xs text-emerald-400 leading-relaxed">{JSON.stringify(result, null, 2)}</pre>
                </div>
            </div>
        </div>
    </div>
);

export const DataSourcePanel = () => {
    const components = useEditorStore(state => state.components);
    const selectComponent = useEditorStore(state => state.selectComponent);
    const apis = useEditorStore(state => state.apis);
    const addApi = useEditorStore(state => state.addApi);
    const updateApi = useEditorStore(state => state.updateApi);
    const deleteApi = useEditorStore(state => state.deleteApi);

    const [isEditing, setIsEditing] = useState<string | null>(null); // 'new' or ID
    const [testResult, setTestResult] = useState<any>(null);

    // 1. Scan for Variables (Inputs)
    const variables = (Object.values(components) as ComponentData[]).filter(c => 
        ['Input', 'Checkbox'].includes(c.type)
    ).map(c => {
        const name = c.properties.flatMap(p => p.items).find(i => i.id === 'name')?.value || 'unknown';
        return { id: c.id, name, type: c.type, componentName: c.name };
    });

    const systemVars = ['user.name', 'user.email', 'system.date'];

    const handleRunTest = async (api: ApiDefinition) => {
        // Simulating Fetch with Request Details
        const requestPreview = {
            url: api.url,
            method: api.method,
            headers: api.headers?.reduce((acc, h) => ({...acc, [h.key]: h.value}), {}),
            params: api.params?.reduce((acc, p) => ({...acc, [p.key]: p.value}), {}),
            body: api.body ? JSON.parse(api.body || '{}') : undefined
        };

        const mockResponse = {
            status: 200,
            statusText: "OK",
            data: api.method === 'GET' 
                ? { results: [{ id: 1, name: "Item A" }, { id: 2, name: "Item B" }], meta: { page: 1 } }
                : { success: true, message: "Resource created", id: "new_123" },
            _debug_request: requestPreview // For user to see what was sent
        };
        
        // Simulate network delay
        setTimeout(() => setTestResult(mockResponse), 800);
    };

    return (
        <div className="relative h-full flex flex-col">
            {/* Editing Overlay */}
            {isEditing && (
                <ApiForm 
                    api={apis.find(a => a.id === isEditing) || (isEditing === 'new' ? undefined : undefined)}
                    onSave={(a) => { 
                        if (isEditing === 'new') addApi(a as any);
                        else updateApi(isEditing, a);
                        setIsEditing(null); 
                    }} 
                    onCancel={() => setIsEditing(null)} 
                />
            )}

            {testResult && <TestResult result={testResult} onClose={() => setTestResult(null)} />}

            <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                {/* Variables Section */}
                <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Icons.Braces size={12} /> Page Variables
                    </h3>
                    <div className="space-y-2">
                        {variables.length === 0 && <div className="text-xs text-slate-400 italic px-2">No inputs defined yet.</div>}
                        {variables.map(v => (
                            <div 
                                key={v.id} 
                                onClick={() => selectComponent(v.id)}
                                className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-md hover:border-primary-300 hover:bg-white hover:shadow-sm cursor-pointer transition-all group"
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Icons.TextCursor size={14} className="text-slate-400 group-hover:text-primary-500" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-mono font-medium text-slate-700 truncate text-ellipsis">{`{{${v.name}}}`}</span>
                                        <span className="text-[10px] text-slate-400 truncate">Source: {v.componentName}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* API Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Icons.Globe size={12} /> API Integrations
                        </h3>
                        <button onClick={() => setIsEditing('new')} className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors">
                            <Icons.Plus size={14} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {apis.length === 0 && <div className="text-xs text-slate-400 italic px-2">No APIs defined.</div>}
                        
                        {apis.map(api => (
                            <div 
                                key={api.id}
                                className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group relative"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={clsx(
                                            "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide",
                                            api.method === 'GET' && "bg-blue-50 text-blue-600",
                                            api.method === 'POST' && "bg-purple-50 text-purple-600",
                                            api.method === 'PUT' && "bg-orange-50 text-orange-600",
                                            api.method === 'DELETE' && "bg-red-50 text-red-600"
                                        )}>
                                            {api.method}
                                        </span>
                                        <span className="text-sm font-medium text-slate-800">{api.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleRunTest(api)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded transition-colors" title="Test API">
                                            <Icons.Play size={14} fill="currentColor" />
                                        </button>
                                        <button onClick={() => setIsEditing(api.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                                            <Icons.Settings size={14} />
                                        </button>
                                        <button onClick={() => deleteApi(api.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                                            <Icons.Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pl-1">
                                    <Icons.Link size={12} className="text-slate-300 shrink-0" />
                                    <span className="text-xs font-mono text-slate-500 truncate w-full leading-none" title={api.url}>{api.url}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Vars */}
                <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Icons.Server size={12} /> System Globals
                    </h3>
                    <div className="space-y-1">
                        {systemVars.map(v => (
                            <div key={v} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50">
                                <Icons.Database size={12} className="text-slate-300" />
                                <span className="text-xs font-mono text-slate-500">{`{{${v}}}`}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};