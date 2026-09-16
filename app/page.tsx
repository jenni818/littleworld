"use client";

import { useEffect, useRef, useState } from "react";

type Story = { type:string; emoji:string; title:string; teaser:string; sourceName:string; sourceUrl:string };
type Episode = { dateLabel:string; title:string; route:string; stories:Story[]; question:string; fullScript:string };

const allInterests = ["Animals","Space","Ocean","Nature","Science","Dinosaurs","Vehicles","Art","Technology"];
const fmt = (n:number) => `${Math.floor(n/60)}:${Math.floor(n%60).toString().padStart(2,"0")}`;

export default function Home(){
  const [screen,setScreen]=useState<"welcome"|"setup"|"today">("welcome");
  const [name,setName]=useState("Chloe"), [age,setAge]=useState(4);
  const [city,setCity]=useState("Singapore"), [country,setCountry]=useState("Singapore");
  const [interests,setInterests]=useState(["Animals","Space","Science","Nature"]);
  const [episode,setEpisode]=useState<Episode|null>(null);
  const [loading,setLoading]=useState(false), [audioLoading,setAudioLoading]=useState(false);
  const [error,setError]=useState(""), [audioUrl,setAudioUrl]=useState("");
  const [playing,setPlaying]=useState(false), [current,setCurrent]=useState(0), [duration,setDuration]=useState(0);
  const audioRef=useRef<HTMLAudioElement|null>(null);

  useEffect(()=>()=>{ if(audioUrl) URL.revokeObjectURL(audioUrl) },[audioUrl]);
  const toggleInterest=(x:string)=>setInterests(v=>v.includes(x)?v.filter(i=>i!==x):[...v,x]);

  async function generateEpisode(){
    setLoading(true); setAudioLoading(false); setError(""); setEpisode(null);
    if(audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(""); setCurrent(0); setDuration(0);
    try{
      const r=await fetch("/api/episode",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,age,city,country,interests})});
      const data=await r.json();
      if(!r.ok) throw new Error(data.error||"Could not create today's episode.");
      setEpisode(data); setLoading(false); setAudioLoading(true);
      const s=await fetch("/api/speech",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:data.fullScript})});
      if(!s.ok){ const e=await s.json().catch(()=>({})); throw new Error(e.error||"Audio generation failed."); }
      const blob=await s.blob(); setAudioUrl(URL.createObjectURL(blob)); setAudioLoading(false);
    }catch(e){ setError(e instanceof Error?e.message:"Something went wrong."); setLoading(false); setAudioLoading(false); }
  }

  async function togglePlay(){
    const a=audioRef.current; if(!a||!audioUrl)return;
    if(a.paused) await a.play(); else a.pause();
  }

  if(screen==="welcome") return <main className="shell">
    <div className="brand">Little World</div>
    <section className="hero"><div className="planet">✨</div><div className="kicker">A tiny daily adventure</div>
      <h1>Big world.<br/>Little ears.<br/>Made just for them.</h1>
      <p className="muted">Fresh real-world stories, gently explained as a short personalized audio show for curious little minds.</p>
    </section>
    <div className="stack"><button className="primary" onClick={()=>setScreen("setup")}>Create their Little World</button>
      <div className="card"><strong>Every episode has three stops</strong><p className="muted">🏡 Close to home &nbsp; 🌏 Our big world &nbsp; ✨ An amazing discovery</p></div>
    </div>
  </main>;

  if(screen==="setup") return <main className="shell">
    <div className="topline"><button className="chip" onClick={()=>setScreen("welcome")}>← Back</button><div className="brand">Little World</div></div>
    <div className="kicker">Meet your little explorer</div><h1>Who are we making this for?</h1>
    <div className="stack">
      <div className="field"><label>Child's first name or nickname</label><input value={name} onChange={e=>setName(e.target.value)}/></div>
      <div className="field"><label>Age</label><select value={age} onChange={e=>setAge(+e.target.value)}>{[3,4,5,6,7].map(x=><option key={x}>{x}</option>)}</select></div>
      <div className="field"><label>City</label><input value={city} onChange={e=>setCity(e.target.value)}/></div>
      <div className="field"><label>Country</label><input value={country} onChange={e=>setCountry(e.target.value)}/></div>
      <div className="field"><label>What makes {name||"them"} curious?</label><div className="chips">{allInterests.map(x=><button key={x} className={`chip ${interests.includes(x)?"active":""}`} onClick={()=>toggleInterest(x)}>{x}</button>)}</div></div>
      <button className="primary" disabled={!name.trim()} onClick={()=>setScreen("today")}>Create {name||"their"}'s Little World →</button>
    </div>
  </main>;

  return <main className="shell">
    <div className="topline"><div><div className="brand">Little World</div><div className="muted" style={{fontSize:13}}>Made for {name}, age {age}</div></div><button className="avatar" onClick={()=>setScreen("setup")}>👧</button></div>

    {!episode&&!loading&&<div className="stack">
      <div className="cover"><div className="kicker">Today's adventure</div><div className="cover-title">Where will we go today?</div><div className="route">🏡 → 🌏 → ✨</div></div>
      <div className="card"><h2>Good morning, {name}! ☀️</h2><p className="muted">We'll find fresh stories, check that they're suitable for age {age}, write your show, then create the audio.</p></div>
      <button className="primary" onClick={generateEpisode}>✨ Make today's Little World</button>
      {error&&<div className="error">{error}</div>}
    </div>}

    {loading&&<div className="stack">
      <div className="cover"><div className="kicker">Making today's show</div><div className="cover-title">Finding something wonderful…</div><div className="route">🌏 Fresh news → 🛡️ child-safe → ✍️ story</div></div>
      <div className="card"><div className="status"><div className="spinner"/>Searching and writing {name}'s episode. This can take a little while.</div></div>
    </div>}

    {episode&&<div className="stack">
      <div className="cover"><div className="kicker">{episode.dateLabel}</div><div className="cover-title">{episode.title}</div><div className="route">{episode.route}</div></div>
      <div className="card">
        <div className="playrow">
          <button className="play" onClick={togglePlay} disabled={!audioUrl}>{playing?"❚❚":"▶"}</button>
          <div className="progress"><input type="range" min="0" max={duration||1} value={current} onChange={e=>{const a=audioRef.current;if(a)a.currentTime=+e.target.value}}/>
            <div className="time"><span>{fmt(current)}</span><span>{audioLoading?"Creating audio…":duration?fmt(duration):"Ready soon"}</span></div>
          </div>
        </div>
        <audio ref={audioRef} src={audioUrl} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)}
          onTimeUpdate={e=>setCurrent(e.currentTarget.currentTime)} onLoadedMetadata={e=>setDuration(e.currentTarget.duration)}/>
        <div className="disclosure">Narration is AI-generated.</div>
      </div>
      {episode.stories.map((s,i)=><div className="card story" key={i}><div className="story-icon">{s.emoji}</div><div><div className="kicker">{i===0?"Close to home":i===1?"Our big world":"Amazing discovery"}</div><h3>{s.title}</h3><p>{s.teaser}</p></div></div>)}
      <div className="card question"><div className="kicker">💭 Question of the day</div><blockquote>{episode.question}</blockquote></div>
      <div className="card sources"><strong>For grown-ups · Sources</strong><div className="stack" style={{marginTop:10}}>{episode.stories.map((s,i)=><a key={i} href={s.sourceUrl} target="_blank" rel="noreferrer">{s.sourceName}: {s.title}</a>)}</div></div>
      {audioLoading&&<div className="status"><div className="spinner"/>Creating the narrated episode…</div>}
      {error&&<div className="error">{error}</div>}
      <button className="secondary" disabled={loading||audioLoading} onClick={generateEpisode}>↻ Make a new version</button>
    </div>}
  </main>;
}
