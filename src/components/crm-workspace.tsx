"use client";

import { useEffect, useState } from "react";

type Lead = { id:string; name:string; email:string|null; company:string|null; stage:string; source:string; estimatedValueCents:number|null; currency:string; nextFollowUpAt:string|null; customerId:string|null; updatedAt:string };
type Task = { id:string; title:string; status:string; priority:string; dueAt:string|null; customerId:string|null; leadId:string|null };
type Note = { id:string; body:string; customerId:string|null; leadId:string|null; createdAt:string };
type Communication = { id:string; channel:string; direction:string; subject:string|null; summary:string; customerId:string|null; leadId:string|null; occurredAt:string };
type Workflow = { id:string; name:string; trigger:string; action:string; enabled:boolean; createdAt:string };
type WorkflowRun = { id:string; workflowId:string; dedupeKey:string; status:string; error:string|null; startedAt:string; finishedAt:string|null };
type Inquiry = { id:string; name:string; email:string; company:string|null; service:string; createdAt:string };
type Data = { leads:Lead[]; tasks:Task[]; notes:Note[]; communications:Communication[]; workflows:Workflow[]; workflowRuns:WorkflowRun[]; inquiries:Inquiry[] };
const blank:Data = { leads:[],tasks:[],notes:[],communications:[],workflows:[],workflowRuns:[],inquiries:[] };

export function CrmWorkspace() {
  const [data,setData] = useState<Data>(blank);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  const [leadName,setLeadName] = useState("");
  const [leadEmail,setLeadEmail] = useState("");
  const [leadCompany,setLeadCompany] = useState("");
  const [leadSource,setLeadSource] = useState("OTHER");
  const [taskTitle,setTaskTitle] = useState("");
  const [taskDue,setTaskDue] = useState("");
  const [noteBody,setNoteBody] = useState("");
  const [noteTarget,setNoteTarget] = useState("");
  const [commSummary,setCommSummary] = useState("");
  const [commTarget,setCommTarget] = useState("");
  const [commChannel,setCommChannel] = useState("EMAIL");
  const [workflowName,setWorkflowName] = useState("");
  const [workflowTrigger,setWorkflowTrigger] = useState("INQUIRY_CREATED");

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/crm",{cache:"no-store"});
      if(!response.ok) throw new Error("Could not load CRM records.");
      setData(await response.json());
      setError("");
    } catch(e) { setError(e instanceof Error ? e.message : "CRM request failed."); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ void refresh(); },[]);

  async function send(payload:Record<string,unknown>) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/crm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const result = await response.json();
      if(!response.ok) throw new Error(result.error || "Could not save CRM record.");
      await refresh();
      return true;
    } catch(e) { setError(e instanceof Error ? e.message : "CRM request failed."); return false; }
    finally { setBusy(false); }
  }
  async function update(type:"lead"|"task",id:string,value:string) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/crm",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(type==="lead"?{type,id,stage:value}:{type,id,status:value})});
      const result = await response.json();
      if(!response.ok) throw new Error(result.error || "Could not update record.");
      await refresh();
    } catch(e) { setError(e instanceof Error ? e.message : "CRM update failed."); }
    finally { setBusy(false); }
  }
  async function convertLeadToProject(leadId:string) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/conversions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"lead-to-project",leadId})});
      const result = await response.json();
      if(!response.ok) throw new Error(result.error || "Could not convert this lead.");
      await refresh();
    } catch(e) { setError(e instanceof Error ? e.message : "Lead conversion failed."); }
    finally { setBusy(false); }
  }
  const field="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white";
  const button="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
  const select="rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-xs text-white";
  const customerOptions = data.leads.filter(l=>l.customerId);
  return <div className="space-y-6">
    {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="card p-5">
        <h2 className="font-semibold">Create a lead</h2>
        <p className="mt-1 text-xs text-slate-400">Capture a prospect and move it through the pipeline.</p>
        <form className="mt-4 space-y-3" onSubmit={async e=>{e.preventDefault();if(await send({type:"lead",name:leadName,email:leadEmail,company:leadCompany,source:leadSource})){setLeadName("");setLeadEmail("");setLeadCompany("");}}}>
          <input className={field} placeholder="Lead name *" value={leadName} onChange={e=>setLeadName(e.target.value)} required minLength={2} maxLength={120}/>
          <input className={field} placeholder="Email" type="email" value={leadEmail} onChange={e=>setLeadEmail(e.target.value)}/>
          <input className={field} placeholder="Company" value={leadCompany} onChange={e=>setLeadCompany(e.target.value)}/>
          <select className={field} value={leadSource} onChange={e=>setLeadSource(e.target.value)}><option value="OTHER">Other source</option><option value="WEBSITE">Website</option><option value="REFERRAL">Referral</option><option value="SOCIAL">Social</option><option value="CAMPAIGN">Campaign</option></select>
          <button className={button} disabled={busy}>Add lead</button>
        </form>
      </section>
      <section className="card p-5">
        <h2 className="font-semibold">Create follow-up task</h2>
        <p className="mt-1 text-xs text-slate-400">Add a task to the shared CRM queue.</p>
        <form className="mt-4 space-y-3" onSubmit={async e=>{e.preventDefault();if(await send({type:"task",title:taskTitle,dueAt:taskDue?new Date(taskDue).toISOString():undefined})){setTaskTitle("");setTaskDue("");}}}>
          <input className={field} placeholder="Task title *" value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} required minLength={2} maxLength={160}/>
          <label className="block text-xs text-slate-400">Due date and time<input className={field+" mt-1"} type="datetime-local" value={taskDue} onChange={e=>setTaskDue(e.target.value)}/></label>
          <button className={button} disabled={busy}>Create task</button>
        </form>
      </section>
      <section className="card p-5">
        <h2 className="font-semibold">Log a communication</h2>
        <p className="mt-1 text-xs text-slate-400">Record a call, email, meeting or message against a lead.</p>
        <form className="mt-4 space-y-3" onSubmit={async e=>{e.preventDefault();if(await send({type:"communication",channel:commChannel,summary:commSummary,leadId:commTarget})){setCommSummary("");}}}>
          <select className={field} value={commTarget} onChange={e=>setCommTarget(e.target.value)} required><option value="">Choose a lead</option>{data.leads.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select>
          <select className={field} value={commChannel} onChange={e=>setCommChannel(e.target.value)}><option value="EMAIL">Email</option><option value="PHONE">Phone</option><option value="MEETING">Meeting</option><option value="SMS">SMS</option><option value="OTHER">Other</option></select>
          <textarea className={field} placeholder="Brief interaction summary *" value={commSummary} onChange={e=>setCommSummary(e.target.value)} required minLength={2} maxLength={3000}/>
          <button className={button} disabled={busy || !commTarget}>Log interaction</button>
        </form>
      </section>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card p-5">
        <h2 className="font-semibold">Add a lead note</h2>
        <p className="mt-1 text-xs text-slate-400">Keep useful context attached to a prospect.</p>
        <form className="mt-4 space-y-3" onSubmit={async e=>{e.preventDefault();if(await send({type:"note",body:noteBody,leadId:noteTarget})){setNoteBody("");}}}>
          <select className={field} value={noteTarget} onChange={e=>setNoteTarget(e.target.value)} required><option value="">Choose a lead</option>{data.leads.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select>
          <textarea className={field} placeholder="Internal note *" value={noteBody} onChange={e=>setNoteBody(e.target.value)} required minLength={2} maxLength={5000}/>
          <button className={button} disabled={busy || !noteTarget}>Save note</button>
        </form>
      </section>
</div>

    <section className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Workflow automation</h2><p className="mt-1 text-xs text-slate-400">Create rules for incoming inquiries and overdue follow-up tasks.</p></div><span className="text-xs text-slate-500">{data.workflows.filter(w=>w.enabled).length} active</span></div>
      <form className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={async e=>{e.preventDefault();const action=workflowTrigger==="INQUIRY_CREATED"?"CREATE_LEAD_FROM_INQUIRY":"EMAIL_OWNER";if(await send({type:"workflow",name:workflowName,trigger:workflowTrigger,action})){setWorkflowName("");}}}>
        <input className={field} placeholder="Workflow name *" value={workflowName} onChange={e=>setWorkflowName(e.target.value)} required minLength={3} maxLength={100}/>
        <select className={field} value={workflowTrigger} onChange={e=>setWorkflowTrigger(e.target.value)}><option value="INQUIRY_CREATED">When a new inquiry arrives</option><option value="TASK_OVERDUE">When a CRM task is overdue</option></select>
        <button className={button} disabled={busy}>Create workflow</button>
      </form>
      <p className="mt-2 text-xs text-slate-500">Inquiry rule: automatically creates a website lead. Overdue rule: emails OWNER_EMAIL when the scheduled job runs.</p>
      <div className="mt-4 divide-y divide-white/10">{data.workflows.length===0?<p className="py-3 text-sm text-slate-400">No workflows configured.</p>:data.workflows.map(w=><div key={w.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">{w.name}</p><p className="text-xs text-slate-400">{w.trigger==="INQUIRY_CREATED"?"New inquiry → create lead":"Overdue task → email owner"}</p></div><button type="button" className="btn-secondary text-xs" disabled={busy} onClick={async()=>{setBusy(true);try{const r=await fetch("/api/admin/crm",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"workflow",id:w.id,enabled:!w.enabled})});if(!r.ok)throw new Error("Could not update workflow.");await refresh();}catch(e){setError(e instanceof Error?e.message:"Workflow update failed.");}finally{setBusy(false);}}}>{w.enabled?"Disable":"Enable"}</button></div>)}</div>
      <div className="mt-4 border-t border-white/10 pt-4"><h3 className="text-sm font-semibold">Recent workflow runs</h3>{data.workflowRuns.length===0?<p className="mt-2 text-xs text-slate-500">No executions recorded yet.</p>:<div className="mt-2 space-y-2">{data.workflowRuns.slice(0,8).map(run=><div key={run.id} className="flex flex-wrap justify-between gap-2 text-xs"><span className="text-slate-300">{run.dedupeKey}</span><span className={run.status==="FAILED"?"text-rose-300":"text-slate-400"}>{run.status} · {new Date(run.startedAt).toLocaleString()}</span></div>)}</div>}</div>
    </section>
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Sales pipeline</h2><p className="mt-1 text-xs text-slate-400">Change a lead's stage as the opportunity progresses.</p></div><span className="text-xs text-slate-500">{data.leads.length} leads</span></div>
      {loading?<p className="mt-4 text-sm text-slate-400">Loading CRM…</p>:data.leads.length===0?<p className="mt-4 text-sm text-slate-400">No leads yet. Create the first one above.</p>:<div className="mt-4 divide-y divide-white/10">{data.leads.map(lead=><div key={lead.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">{lead.name}</p><p className="text-xs text-slate-400">{[lead.company,lead.email,lead.source].filter(Boolean).join(" · ")}</p></div><div className="flex items-center gap-2"><button type="button" className="btn-secondary px-3 py-1.5 text-xs" disabled={busy} title="Create a client project from this lead" onClick={()=>void convertLeadToProject(lead.id)}>→ Project</button><select aria-label={`Stage for ${lead.name}`} className={select} value={lead.stage} disabled={busy} onChange={e=>void update("lead",lead.id,e.target.value)}>{["NEW","CONTACTED","QUALIFIED","PROPOSAL","WON","LOST"].map(v=><option key={v}>{v}</option>)}</select></div></div>)}</div>}
    </section>

    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card p-5"><h2 className="font-semibold">Follow-up queue</h2><div className="mt-3 space-y-3">{data.tasks.length===0?<p className="text-sm text-slate-400">No tasks recorded.</p>:data.tasks.map(task=><div key={task.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3"><div><p className="text-sm font-medium">{task.title}</p><p className="text-xs text-slate-400">{task.priority} {task.dueAt?`· Due ${new Date(task.dueAt).toLocaleString()}`:"· No due date"}</p></div><select className={select} value={task.status} disabled={busy} onChange={e=>void update("task",task.id,e.target.value)}>{["OPEN","IN_PROGRESS","COMPLETED","CANCELLED"].map(v=><option key={v}>{v}</option>)}</select></div>)}</div></section>
      <section className="card p-5"><h2 className="font-semibold">Recent communication history</h2><div className="mt-3 space-y-3">{data.communications.length===0?<p className="text-sm text-slate-400">No communications logged yet.</p>:data.communications.slice(0,12).map(c=><div key={c.id} className="border-b border-white/10 pb-3"><p className="text-sm font-medium">{c.channel} · {c.direction}</p><p className="mt-1 text-sm text-slate-300">{c.summary}</p><p className="mt-1 text-xs text-slate-500">{new Date(c.occurredAt).toLocaleString()}</p></div>)}</div></section>
    </div>
  </div>;
}
