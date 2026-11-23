"use client";
import { useEffect,useState } from "react";
type Task={id:string;title:string;status:string;dueAt:string|null};
export function ProjectTaskManager({projectId}:{projectId:string}){
 const [tasks,setTasks]=useState<Task[]>([]);const [title,setTitle]=useState("");const [error,setError]=useState("");
 async function load(){const r=await fetch(`/api/admin/projects/${projectId}/tasks/list`);if(r.ok){const d=await r.json();setTasks(d.tasks);}}
 useEffect(()=>{void load();},[projectId]);
 async function add(e:React.FormEvent){e.preventDefault();setError("");const r=await fetch(`/api/admin/projects/${projectId}/tasks`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title})});const d=await r.json();if(!r.ok){setError(d.error||"Could not add task.");return;}setTitle("");await load();}
 async function update(id:string,status:string){const r=await fetch(`/api/admin/tasks/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});if(!r.ok){setError("Could not update task.");return;}await load();}
 return <div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tasks</p>{tasks.map(t=><div key={t.id} className="mt-3 flex items-center justify-between gap-3 text-sm"><span>{t.title}</span><select aria-label={`Status for ${t.title}`} value={t.status} onChange={e=>update(t.id,e.target.value)} className="input w-36"><option>TODO</option><option>IN_PROGRESS</option><option>BLOCKED</option><option>DONE</option></select></div>)}<form onSubmit={add} className="mt-4 flex gap-2"><input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Add a task…" required minLength={2}/><button className="btn-secondary">Add</button></form>{error&&<p className="mt-2 text-xs text-rose-300">{error}</p>}</div>;
}
