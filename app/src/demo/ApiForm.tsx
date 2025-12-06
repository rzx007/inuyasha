import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as Icons from '../Icons';
import { ApiDefinition } from '../../types';
import { clsx } from 'clsx';
import { nanoid } from 'nanoid';
import { VariablePicker } from '../VariablePicker';

// --- Helper Components ---

const InputWithVar = ({ value, onChange, placeholder, className, autoFocus }: { value: string, onChange: (v: string) => void, placeholder?: string, className?: string, autoFocus?: boolean }) => {
    const [showPicker, setShowPicker] = useState(false);
    const pickerBtnRef = useRef<HTMLButtonElement>(null);

    const handleInsert = (v: string) => {
        onChange(value ? `${value}${v}` : v);
        setShowPicker(false);
    };

    return (
        <div className="relative flex items-center w-full group h-full">
            <input 
                className={clsx("w-full h-full outline-none bg-transparent placeholder:text-slate-400", className)}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
            />
            <button 
                type="button"
                ref={pickerBtnRef}
                onClick={() => setShowPicker(!showPicker)}
                className="text-slate-400 group-hover:text-indigo-500 p-1.5 rounded-md hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100 mr-1"
                title="Insert Variable"
            >
                <Icons.Braces size={16} />
            </button>
            {showPicker && <VariablePicker onSelect={handleInsert} onClose={() => setShowPicker(false)} targetRef={pickerBtnRef} />}
        </div>
    );
};

const KeyValueEditor = ({ items, onChange }: { items: { id: string, key: string, value: string }[], onChange: (items: any[]) => void }) => {
    const add = () => onChange([...items, { id: nanoid(), key: '', value: '' }]);
    const remove = (id: string) => onChange(items.filter(i => i.id !== id));
    const update = (id: string, field: 'key' | 'value', v: string) => {
        onChange(items.map(i => i.id === id ? { ...i, [field]: v } : i));
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto min-h-0 border border-slate-200 rounded-lg bg-white shadow-sm">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_1fr_40px] border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                    <div className="px-3 py-2.5 border-r border-slate-200">Key</div>
                    <div className="px-3 py-2.5 border-r border-slate-200">Value</div>
                    <div className="px-3 py-2.5 text-center"></div>
                </div>
                
                {/* Table Body */}
                <div className="divide-y divide-slate-100">
                    {items.map(item => (
                        <div key={item.id} className="grid grid-cols-[1fr_1fr_40px] group hover:bg-slate-50 transition-colors">
                            <div className="border-r border-slate-100 relative">
                                <input 
                                    className="w-full px-3 py-2.5 text-xs bg-transparent outline-none text-slate-700 placeholder:text-slate-300 font-mono font-medium"
                                    placeholder="Key" 
                                    value={item.key} 
                                    onChange={e => update(item.id, 'key', e.target.value)} 
                                />
                            </div>
                            <div className="border-r border-slate-100 relative">
                                <InputWithVar 
                                    value={item.value} 
                                    onChange={v => update(item.id, 'value', v)} 
                                    placeholder="Value" 
                                    className="px-3 py-2.5 text-xs font-mono text-indigo-600 font-medium"
                                />
                            </div>
                            <div className="flex items-center justify-center">
                                <button type="button" onClick={() => remove(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                    <Icons.Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="p-12 text-center text-xs text-slate-400 italic flex flex-col items-center gap-2">
                            <Icons.List size={24} className="opacity-20" />
                            <span>No parameters defined</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="pt-4">
                 <button type="button" onClick={add} className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all bg-white shadow-sm w-fit">
                    <Icons.Plus size={14} /> Add Parameter
                </button>
            </div>
        </div>
    );
};

const BodyEditor = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
    const [showPicker, setShowPicker] = useState(false);
    const pickerBtnRef = useRef<HTMLButtonElement>(null);

    const handleInsert = (v: string) => {
        onChange(value + v);
        setShowPicker(false);
    };

    return (
        <div className="relative h-full flex flex-col border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <div className="flex justify-between items-center bg-slate-50 border-b border-slate-200 px-3 py-2">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Raw JSON Payload</span>
                 <button 
                    type="button"
                    ref={pickerBtnRef}
                    onClick={() => setShowPicker(!showPicker)} 
                    className="text-[10px] text-indigo-600 flex items-center gap-1.5 hover:bg-indigo-50 px-2 py-1 rounded transition-colors font-medium border border-transparent hover:border-indigo-100"
                 >
                    <Icons.Braces size={12} /> Insert Variable
                 </button>
            </div>
            <textarea 
                className="flex-1 w-full text-xs font-mono p-4 bg-white text-slate-700 outline-none resize-none leading-relaxed"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
                spellCheck={false}
            />
             {showPicker && <VariablePicker onSelect={handleInsert} onClose={() => setShowPicker(false)} targetRef={pickerBtnRef} />}
        </div>
    );
};

// --- Response Viewer Component ---

const ResponseViewer = ({ response, loading, time }: { response: any, loading: boolean, time: number }) => {
    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-medium">Sending Request...</span>
            </div>
        );
    }

    if (!response) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                <Icons.Send size={32} className="opacity-20" />
                <span className="text-xs">Enter URL and click Send to see response</span>
            </div>
        );
    }

    const isError = response.status >= 400;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-4">
                    <span className={clsx("text-xs font-bold px-2 py-0.5 rounded", isError ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700")}>
                        {response.status} {response.statusText}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                        {time} ms
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                        {JSON.stringify(response.data).length} B
                    </span>
                </div>
                <div className="flex gap-2">
                     <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Body</span>
                </div>
            </div>
            <div className="flex-1 overflow-auto bg-white p-4 relative">
                <pre className="font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-all">
                    {JSON.stringify(response.data, null, 2)}
                </pre>
            </div>
        </div>
    );
};


export const ApiForm = ({ api, onSave, onCancel }: { api?: ApiDefinition, onSave: (a: Partial<ApiDefinition>) => void, onCancel: () => void }) => {
    const [name, setName] = useState(api?.name || '');
    const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>(api?.method || 'GET');
    const [url, setUrl] = useState(api?.url || '');
    const [params, setParams] = useState(api?.params || []);
    const [headers, setHeaders] = useState(api?.headers || []);
    const [body, setBody] = useState(api?.body || '');
    const [tab, setTab] = useState<'params' | 'headers' | 'body'>('params');

    // Execution State
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [responseTime, setResponseTime] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, method, url, params, headers, body });
    };

    const handleSend = async () => {
        if (!url) return;
        setLoading(true);
        setResponse(null);
        const startTime = Date.now();

        try {
            // Simple Variable Substitution (Mock)
            let finalUrl = url;
            // params.forEach(p => {
            //     if (p.key) finalUrl += `${finalUrl.includes('?') ? '&' : '?'}${p.key}=${encodeURIComponent(p.value)}`;
            // });
            // Actually, we should check if params are already in URL or need appending.
            // For this demo, let's assume user builds query params in the table.
            
            if (params.length > 0) {
                 const queryString = params
                    .filter(p => p.key)
                    .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
                    .join('&');
                 if (queryString) {
                     finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
                 }
            }

            // Substitute common vars for demo
            finalUrl = finalUrl.replace('{{user.email}}', 'alex@example.com').replace('{{token}}', 'mock_token_123');

            const finalBody = body ? body.replace('{{user.email}}', 'alex@example.com') : undefined;

            // Attempt Fetch (or mock if it fails/is example.com)
            let res;
            if (finalUrl.includes('api.example.com')) {
                // MOCK RESPONSE
                await new Promise(r => setTimeout(r, 600));
                res = {
                    status: 200,
                    statusText: 'OK',
                    data: method === 'GET' 
                        ? { results: [{ id: 1, name: "Item A" }, { id: 2, name: "Item B" }], meta: { page: 1, total: 20 } }
                        : { success: true, id: "created_123", message: "Resource processed successfully" }
                };
            } else {
                 // REAL FETCH
                 const headersObj: Record<string, string> = {};
                 headers.forEach(h => { if(h.key) headersObj[h.key] = h.value; });
                 
                 const fetchRes = await fetch(finalUrl, {
                     method,
                     headers: headersObj,
                     body: ['GET', 'HEAD'].includes(method) ? undefined : finalBody
                 });
                 
                 const data = await fetchRes.json().catch(() => ({ error: "Could not parse JSON" }));
                 res = {
                     status: fetchRes.status,
                     statusText: fetchRes.statusText,
                     data: data
                 };
            }
            
            setResponse(res);
        } catch (error: any) {
            setResponse({
                status: 0,
                statusText: 'Network Error',
                data: { error: error.message, hint: "Check CORS settings or URL validity." }
            });
        } finally {
            setResponseTime(Date.now() - startTime);
            setLoading(false);
        }
    };

    // Method Color Logic
    const getMethodColor = (m: string) => {
        switch(m) {
            case 'GET': return 'text-blue-600 bg-blue-50';
            case 'POST': return 'text-emerald-600 bg-emerald-50';
            case 'PUT': return 'text-amber-600 bg-amber-50';
            case 'DELETE': return 'text-red-600 bg-red-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />

            {/* Modal Content */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col relative z-10 overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
                
                {/* Header (Actions) */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                    <div className="flex items-center gap-3">
                         <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                            <Icons.Globe size={20} />
                         </div>
                         <div>
                             <h2 className="text-sm font-bold text-slate-900">{api ? 'Edit Request' : 'New Request'}</h2>
                             <p className="text-[10px] text-slate-500 font-medium">Configure API Endpoint & Parameters</p>
                         </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                         <button type="button" onClick={handleSubmit} className="px-4 py-2 text-indigo-600 bg-indigo-50 border border-indigo-100 text-xs font-bold rounded-lg hover:bg-indigo-100 hover:border-indigo-200 transition-all flex items-center gap-2">
                            <Icons.Save size={14} /> Save Request
                         </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-50/30">
                    
                    {/* Left Panel: Configuration */}
                    <div className="flex-1 flex flex-col p-6 overflow-hidden border-r border-slate-200 min-w-[50%]">
                        {/* Top Section: Name & URL Bar */}
                        <div className="space-y-5 mb-6 shrink-0">
                            {/* Name Input */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Request Name</label>
                                <div className="relative group">
                                    <input 
                                        className="w-full text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none border border-slate-200 rounded-lg px-3 py-2.5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-white hover:border-slate-300 shadow-sm"
                                        placeholder="e.g. Get User Profile"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                    <Icons.Type size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-indigo-400 transition-colors" />
                                </div>
                            </div>

                            {/* URL Bar & Send Button */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Endpoint URL</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 flex h-11 rounded-lg border border-slate-300 overflow-hidden focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all shadow-sm bg-white hover:border-slate-400">
                                        <div className="relative border-r border-slate-200 shrink-0">
                                            <select 
                                                value={method} 
                                                onChange={e => setMethod(e.target.value as any)}
                                                className={clsx(
                                                    "h-full pl-4 pr-9 appearance-none outline-none text-xs font-bold bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors tracking-wide",
                                                    getMethodColor(method)
                                                )}
                                            >
                                                <option value="GET">GET</option>
                                                <option value="POST">POST</option>
                                                <option value="PUT">PUT</option>
                                                <option value="DELETE">DEL</option>
                                            </select>
                                            <Icons.ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                                        </div>
                                        <div className="flex-1 bg-white">
                                            <InputWithVar 
                                                value={url} 
                                                onChange={setUrl} 
                                                placeholder="https://api.example.com/v1/resource" 
                                                className="px-4 text-sm font-mono text-slate-700 placeholder:text-slate-300"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={handleSend}
                                        disabled={loading}
                                        className="h-11 px-6 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 hover:shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2"
                                    >
                                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Icons.Send size={16} />}
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex flex-col flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="border-b border-slate-100 flex gap-1 px-4 pt-3 bg-slate-50/50">
                                {[
                                    { id: 'params', label: 'Params', count: params.length }, 
                                    { id: 'headers', label: 'Headers', count: headers.length }, 
                                    { id: 'body', label: 'Body', count: body.length > 5 ? 1 : 0 }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTab(t.id as any)}
                                        className={clsx(
                                            "px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t border-x border-transparent translate-y-[1px]",
                                            tab === t.id 
                                                ? "text-indigo-600 bg-white border-slate-200 border-b-white shadow-[0_-2px_6px_rgba(0,0,0,0.02)]" 
                                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                        )}
                                    >
                                        {t.label}
                                        {t.count > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-white"></span>}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content Area */}
                            <div className="flex-1 overflow-hidden relative p-4 bg-white">
                                {tab === 'params' && (
                                    <div className="h-full animate-in fade-in duration-200 flex flex-col">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="text-[11px] font-medium text-slate-500">Query Parameters</div>
                                            <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">Automated encoding</span>
                                        </div>
                                        <KeyValueEditor items={params || []} onChange={setParams} />
                                    </div>
                                )}
                                {tab === 'headers' && (
                                    <div className="h-full animate-in fade-in duration-200 flex flex-col">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="text-[11px] font-medium text-slate-500">Request Headers</div>
                                        </div>
                                        <KeyValueEditor items={headers || []} onChange={setHeaders} />
                                    </div>
                                )}
                                {tab === 'body' && (
                                    <div className="h-full animate-in fade-in duration-200 flex flex-col">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="text-[11px] font-medium text-slate-500">Request Body (JSON)</div>
                                            <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">application/json</span>
                                        </div>
                                        <div className="flex-1 min-h-0">
                                            <BodyEditor value={body || ''} onChange={setBody} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Response */}
                    <div className="flex-1 flex flex-col bg-white border-l border-slate-200 overflow-hidden min-h-[400px] lg:min-h-0">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Response</span>
                        </div>
                        <div className="flex-1 relative">
                            <ResponseViewer response={response} loading={loading} time={responseTime} />
                        </div>
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};