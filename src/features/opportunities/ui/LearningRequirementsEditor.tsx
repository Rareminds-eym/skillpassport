import { useEffect,useId,useRef,useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { apiGet } from '@/shared/api/apiClient';
import { Command,CommandInput,CommandList,CommandEmpty,CommandItem } from '@/shared/ui/Command';
import { Check,ChevronDown,Plus,Trash2,RefreshCw,GraduationCap } from 'lucide-react';

export interface LearningRequirement {levelId:string;fingerprint:string;capabilityName:string;title:string;levelNumber:number;version:number;mandatory:boolean}
type CatalogLevel=Omit<LearningRequirement,'mandatory'> & {capabilityId:string};
type PickerOption={id:string;label:string;badge?:string;detail?:string;disabled?:boolean;keywords?:string[]};

export function LearningRequirementsEditor({value,onChange,disabled=false,onPendingChange}:{value:LearningRequirement[];onChange:(rows:LearningRequirement[])=>void;disabled?:boolean;onPendingChange?:(pending:boolean)=>void}){
 const [levels,setLevels]=useState<CatalogLevel[]>([]),[selectedCapabilities,setSelectedCapabilities]=useState<string[]>([]),[draftLevels,setDraftLevels]=useState<Record<string,string>>({}),[draftMandatory,setDraftMandatory]=useState<Record<string,boolean>>({}),[error,setError]=useState(''),[loading,setLoading]=useState(true),[refresh,setRefresh]=useState(0);
 const added=new Set(value.map(r=>r.levelId));
 const capabilities=[...new Map(levels.map(l=>[l.capabilityId,l.capabilityName])).entries()];
 const atLimit=value.length>=20;
 const allAdded=levels.length>0&&levels.every(l=>added.has(l.levelId));
 const drafts=selectedCapabilities.map(id=>levels.find(l=>l.capabilityId===id&&l.levelId===draftLevels[id]&&!added.has(l.levelId)));
 const canAdd=drafts.length>0&&drafts.every(Boolean)&&value.length+drafts.length<=20;
 const clearDrafts=()=>{setSelectedCapabilities([]);setDraftLevels({});setDraftMandatory({});};
 const toggleCapability=(id:string)=>{
  setSelectedCapabilities(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);
  setDraftLevels(current=>{const next={...current};delete next[id];return next;});
  setDraftMandatory(current=>{const next={...current};delete next[id];return next;});
 };
 useEffect(()=>{onPendingChange?.(selectedCapabilities.length>0);},[selectedCapabilities.length,onPendingChange]);
 useEffect(()=>{let current=true;setLoading(true);setError('');
  apiGet<any>('/learning/catalog').then(r=>{if(current)setLevels(r.data?.levels||[]);}).catch(e=>{if(current)setError(e.message||'Learning catalog is unavailable.');}).finally(()=>{if(current)setLoading(false);});
  return()=>{current=false;};
 },[refresh]);
 return <section aria-label="Learning requirements" className="min-w-0 max-w-full space-y-3 rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
  <div className="flex items-start gap-3">
   <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><GraduationCap size={17} aria-hidden="true"/></span>
   <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold leading-5 text-slate-900">Learning requirements</h3><p className="mt-0.5 text-xs leading-5 text-slate-500">Choose the capabilities and levels candidates should meet.</p></div>
   <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium leading-5 text-slate-500">Optional</span>
  </div>
  {error&&<p role="alert" className="text-xs text-red-700">{error} <button type="button" className="underline" onClick={()=>setRefresh(v=>v+1)}>Retry</button></p>}
  <LearningPicker label="Capabilities" searchLabel="Search capabilities" placeholder={loading?'Loading capabilities…':atLimit?'20 learning levels selected':error?'Learning catalog unavailable':!levels.length?'No published learning levels available':allAdded?'All available levels added':'Select one or more capabilities'}
   disabled={disabled||loading||atLimit||allAdded||!levels.length} selected="" multiple selectedIds={selectedCapabilities}
   options={capabilities.map(([id,label])=>{const exhausted=levels.filter(l=>l.capabilityId===id).every(l=>added.has(l.levelId));const full=!selectedCapabilities.includes(id)&&value.length+selectedCapabilities.length>=20;return {id,label,disabled:exhausted||full,detail:exhausted?'All levels added':full?'20-requirement limit reached':undefined};})}
   onSelect={toggleCapability}/>
  {selectedCapabilities.length>0&&<div>
   <div className="mb-1 flex items-center justify-between gap-3"><p role="status" className="text-xs leading-5 text-slate-500">Choose a level for each selected capability.</p><button type="button" disabled={disabled} onClick={clearDrafts} className="shrink-0 text-xs font-medium text-slate-600 underline underline-offset-4 disabled:opacity-50">Clear selection</button></div>
   {selectedCapabilities.map(id=>{const name=capabilities.find(([key])=>key===id)?.[1]||'Unavailable capability';const choices=levels.filter(l=>l.capabilityId===id).sort((a,b)=>a.levelNumber-b.levelNumber);const selection=choices.find(l=>l.levelId===draftLevels[id]&&!added.has(l.levelId));return <div role="group" aria-label={`Requirement for ${name}`} key={id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b border-slate-100 py-2.5 sm:grid-cols-[minmax(0,1fr)_10rem_auto_2rem]">
    <p className="col-start-1 row-start-1 break-words text-sm font-medium leading-5 text-slate-800">{name}</p>
    <div className="col-start-1 row-start-2 min-w-0 sm:col-start-2 sm:row-start-1">
     <LearningPicker label="Level" hideLabel accessibleLabel={`Level for ${name}`} searchLabel={`Search levels for ${name}`} placeholder="Select level" disabled={disabled||loading||!choices.length} selected={selection?.levelId||''}
      options={choices.map(l=>({id:l.levelId,label:l.title,badge:`L${l.levelNumber}`,keywords:[`Level ${l.levelNumber}`,`L${l.levelNumber}`],disabled:added.has(l.levelId),detail:added.has(l.levelId)?'Already added':undefined}))}
      onSelect={levelId=>setDraftLevels(current=>({...current,[id]:levelId}))}/>
    </div>
    <label className="requisition-check col-start-2 row-start-2 flex min-h-11 items-center gap-2 text-xs text-slate-600 sm:col-start-3 sm:row-start-1 sm:min-h-10"><input type="checkbox" disabled={disabled} checked={draftMandatory[id]!==false} onChange={e=>setDraftMandatory(current=>({...current,[id]:e.target.checked}))}/>Required</label>
    <button type="button" disabled={disabled} aria-label={`Remove selection ${name}`} title="Remove selected capability" onClick={()=>toggleCapability(id)} className="col-start-2 row-start-1 inline-flex h-11 w-11 items-center justify-center justify-self-end rounded text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 sm:col-start-4 sm:h-8 sm:w-8"><Trash2 size={15}/></button>
   </div>;})}
  </div>}
  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
   <details className="min-w-0 flex-1 text-xs text-slate-500"><summary className="w-fit cursor-pointer rounded-sm underline decoration-slate-300 underline-offset-4">How eligibility works</summary><p className="mt-2 max-w-lg text-sm leading-5">Required levels must be met before applying. Preferred levels improve the match. Equivalent evidence needs approval: an institutional reviewer for affiliated candidates, or AI evaluation for independent candidates.</p></details>
   <button type="button" disabled={disabled||loading||!canAdd} aria-label="Add selected requirements"
    className="inline-flex min-h-11 sm:min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
    onClick={()=>{if(canAdd){const rows=drafts.map(l=>{const {levelId,fingerprint,capabilityName,title,levelNumber,version}=l!;return {levelId,fingerprint,capabilityName,title,levelNumber,version,mandatory:draftMandatory[l!.capabilityId]!==false};});onChange([...value,...rows]);clearDrafts();}}}><Plus size={15} aria-hidden="true"/>{selectedCapabilities.length>1?`Add ${selectedCapabilities.length} requirements`:'Add requirement'}</button>
  </div>
  {value.length>0&&<p className="text-xs font-medium leading-5 text-slate-600">Added requirements · {value.length}/20</p>}
  {value.map((r,i)=>{const current=levels.find(l=>l.levelId===r.levelId);const stale=current&&current.fingerprint!==r.fingerprint;
   return <div key={r.levelId} className="flex flex-wrap items-center gap-2 border-b border-slate-100 py-2.5">
    <div className="min-w-0 basis-full sm:basis-0 sm:flex-1"><p className="break-words text-sm font-medium leading-5 text-slate-900">{r.capabilityName} · Level {r.levelNumber}</p><p className="break-words text-xs leading-5 text-slate-500">{r.title}</p>
     {stale&&<button type="button" disabled={disabled} className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700 underline" onClick={()=>onChange(value.map((v,n)=>n===i?{...v,fingerprint:current.fingerprint,version:current.version,title:current.title,capabilityName:current.capabilityName,levelNumber:current.levelNumber}:v))}><RefreshCw size={12}/>Use updated published content</button>}
    </div>
    <label className="requisition-check flex min-h-11 shrink-0 items-center gap-2 text-xs text-slate-600 sm:min-h-10"><input type="checkbox" disabled={disabled} checked={r.mandatory} onChange={e=>onChange(value.map((v,n)=>n===i?{...v,mandatory:e.target.checked}:v))}/>Required</label>
    <button type="button" disabled={disabled} aria-label={`Remove ${r.capabilityName} level ${r.levelNumber}`} title="Remove learning requirement" className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600 sm:ml-0 sm:h-8 sm:w-8" onClick={()=>onChange(value.filter((_,n)=>n!==i))}><Trash2 size={15}/></button>
   </div>;
  })}
  {!value.length&&<p className="text-xs leading-5 text-slate-500">No learning restrictions added. Candidates can apply under your usual requirements.</p>}
 </section>;
}

function LearningPicker({label,accessibleLabel=label,searchLabel,placeholder,disabled,selected,options,onSelect,multiple=false,selectedIds=[],hideLabel=false}:{label:string;accessibleLabel?:string;searchLabel:string;placeholder:string;disabled:boolean;selected:string;options:PickerOption[];onSelect:(id:string)=>void;multiple?:boolean;selectedIds?:string[];hideLabel?:boolean}){
 const [open,setOpen]=useState(false),[search,setSearch]=useState(''),[side,setSide]=useState<'top'|'bottom'>('bottom');
 const id=useId(),triggerRef=useRef<HTMLButtonElement>(null);
 const container=triggerRef.current?.closest<HTMLElement>('[role="dialog"]')??undefined;
 const pickerOpen=open&&!disabled;
 const selection=options.find(option=>option.id===selected);
 const close=()=>{setOpen(false);setSearch('');};
 return <div className={`min-w-0 ${hideLabel?'':'space-y-1'}`}>
  <label htmlFor={id} className={hideLabel?'sr-only':'block text-xs font-medium text-slate-700'}>{label}</label>
  <Popover.Root open={pickerOpen} onOpenChange={next=>{
   if(next){const trigger=triggerRef.current?.getBoundingClientRect(),boundary=container?.getBoundingClientRect();if(trigger){const above=trigger.top-(boundary?.top??0),below=(boundary?.bottom??window.innerHeight)-trigger.bottom;setSide(below<300&&above>below?'top':'bottom');}setOpen(true);}else close();
  }}>
   <Popover.Trigger asChild><button id={id} ref={triggerRef} type="button" aria-label={accessibleLabel} aria-description={selection?.label} title={selection?.label} aria-expanded={pickerOpen} disabled={disabled}
    className="requisition-field flex min-h-11 sm:min-h-10 w-full min-w-0 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm leading-5 transition-[border-color,box-shadow] hover:border-slate-400 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400">
    <span className={`min-w-0 flex-1 break-words ${selection||selectedIds.length?'text-slate-800':disabled?'text-slate-400':'text-slate-500'}`}>{multiple&&selectedIds.length?`${selectedIds.length} ${selectedIds.length===1?'capability':'capabilities'} selected`:selection?(selection.badge?selection.badge.replace(/^L/,'Level '):selection.label):placeholder}</span>
    <ChevronDown size={15} className={`mt-0.5 shrink-0 text-slate-400 transition-transform ${pickerOpen?'rotate-180':''}`} aria-hidden="true"/>
   </button></Popover.Trigger>
   <Popover.Portal container={container}>
    <Popover.Content aria-label={`Choose ${accessibleLabel.toLowerCase()}`} align="start" side={side} sideOffset={6} collisionPadding={12} collisionBoundary={container}
     onEscapeKeyDown={event=>{event.preventDefault();close();}}
     onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}}}
     className="z-[60] w-[var(--radix-popover-trigger-width)] min-w-[min(320px,var(--radix-popover-content-available-width))] max-w-[var(--radix-popover-content-available-width)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl outline-none"
     style={{height:`min(${multiple?280:320}px, var(--radix-popover-content-available-height))`}}>
     <Command label={searchLabel} className="[&>div:first-of-type]:shrink-0" filter={(_value,query,keywords)=>query.trim().toLowerCase().split(/\s+/).every(term=>(keywords||[]).join(' ').toLowerCase().includes(term))?1:0}>
      <CommandInput autoFocus value={search} onValueChange={setSearch} placeholder={multiple?'Search capabilities…':'Search level number or title…'}
       wrapperClassName="learning-level-search m-2 mb-1 min-w-0 shrink-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 transition-[border-color,box-shadow]"
       className="learning-level-search-input min-w-0 rounded-none border-0 p-0 text-sm leading-6"/>
      <CommandList className="min-h-0 max-h-none flex-1 overscroll-contain" aria-label={multiple?'Published capabilities':'Published levels'}>
       <CommandEmpty>No matches. Try another search.</CommandEmpty>
       {options.map(option=><CommandItem key={option.id} value={option.id} keywords={[option.label,...(option.keywords||[])]} disabled={option.disabled}
        aria-description={multiple?`${selectedIds.includes(option.id)?'Selected. Activate to remove.':'Not selected. Activate to select.'}`:undefined}
        onSelect={()=>{onSelect(option.id);if(!multiple)close();}} className="items-start gap-2.5 py-2.5 text-sm data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-900">
        {option.badge&&<span className="mt-0.5 shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-semibold text-slate-600">{option.badge}</span>}
        <span className="min-w-0 flex-1 break-words leading-5">{option.label}{option.detail&&<span className="block text-xs text-slate-500">{option.detail}</span>}</span>
        <Check size={15} aria-hidden="true" className={`mt-0.5 shrink-0 text-blue-600 ${(multiple?selectedIds.includes(option.id):selected===option.id)?'visible':'invisible'}`}/>
       </CommandItem>)}
      </CommandList>
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-3 py-2"><p role={multiple?'status':undefined} className="text-xs leading-4 text-slate-500">{multiple?`${selectedIds.length} selected`:'Choose a level for this capability.'}</p>{multiple&&<button type="button" onClick={close} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800">Done</button>}</div>
     </Command>
    </Popover.Content>
   </Popover.Portal>
  </Popover.Root>
 </div>;
}
