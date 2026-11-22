import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Room, RoomEvent, Track, createLocalTracks } from "livekit-client";
import API_URL from "../api.js";
import "../styles/live-lesson-room.css";

const getSession = () => {
  for (const key of ["tutor", "learner", "admin"]) {
    try { const value = JSON.parse(localStorage.getItem(key) || "null"); if (value?.token) return { key, value }; } catch { /* ignore */ }
  }
  return { key: "", value: null };
};
const authHeaders = () => { const { value } = getSession(); return value?.token ? { Authorization: `Bearer ${value.token}` } : {}; };
const jsonHeaders = () => ({ "Content-Type": "application/json", ...authHeaders() });

export default function LiveLessonRoom({ lesson, onClose }) {
  const [room, setRoom] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [participants, setParticipants] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [activeDocument, setActiveDocument] = useState("");
  const [page, setPage] = useState(1);
  const [canLearnersDraw, setCanLearnersDraw] = useState(false);
  const canLearnersDrawRef = useRef(false);
  canLearnersDrawRef.current = canLearnersDraw;
  const [boardTool, setBoardTool] = useState("pen");
  const [boardColor, setBoardColor] = useState("#172554");
  const [boardWidth, setBoardWidth] = useState(3);
  const startPointRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [tab, setTab] = useState("board");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [raiseHand, setRaiseHand] = useState(false);
  const [raisedHands, setRaisedHands] = useState([]);
  const [attendanceSessionId, setAttendanceSessionId] = useState(lesson.attendanceSessionId || "");
  const [attendanceData, setAttendanceData] = useState(null);
  const [documentTool, setDocumentTool] = useState("pen");
  const [documentColor, setDocumentColor] = useState("#e11d48");
  const [documentWidth, setDocumentWidth] = useState(4);
  const documentCanvasRef = useRef(null);
  const pressureRef = useRef(1);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const recorderRef = useRef(null);
  const hasLeftRef = useRef(false);
  const recordedChunksRef = useRef([]);
  const screenStreamRef = useRef(null);
  const role = useMemo(() => {
    const { key, value } = getSession();
    const raw = String(value?.role || value?.user?.role || value?.accountType || key).toLowerCase();
    return key !== "learner" && /tutor|teacher|owner|admin|provider|centre/.test(raw) ? "tutor" : "learner";
  }, []);
  const isTutor = role === "tutor";

  const publish = useCallback((payload) => {
    if (!room?.localParticipant) return;
    room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(payload)), { reliable: true }).catch(() => {});
  }, [room]);

  const drawSegment = useCallback((from, to, color = "#172554", width = 3, target = "board") => {
    const canvas = target === "document" ? documentCanvasRef.current : canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(from.x * canvas.width, from.y * canvas.height); ctx.lineTo(to.x * canvas.width, to.y * canvas.height); ctx.stroke();
  }, []);

  useEffect(() => {
    let mounted = true; let activeRoom;
    const handlePageHide = () => { hasLeftRef.current = true; };
    window.addEventListener("pagehide", handlePageHide);
    (async () => {
      try {
        const response = await fetch(`${API_URL}/api/lessons/${lesson._id}/livekit-token`, { method: "POST", headers: jsonHeaders() });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not join the live lesson.");
        activeRoom = new Room({ adaptiveStream: true, dynacast: true });
        activeRoom.on(RoomEvent.ParticipantConnected, () => setParticipants([...activeRoom.remoteParticipants.values()]));
        activeRoom.on(RoomEvent.ParticipantDisconnected, () => setParticipants([...activeRoom.remoteParticipants.values()]));
        activeRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => setTracks(prev => [...prev.filter(t => t.sid !== track.sid), { sid: track.sid, track, participant, kind: track.kind }]));
        activeRoom.on(RoomEvent.TrackUnsubscribed, track => setTracks(prev => prev.filter(t => t.sid !== track.sid)));
        activeRoom.on(RoomEvent.LocalTrackPublished, (publication, participant) => { const track=publication.track; if(track) setTracks(prev=>[...prev.filter(t=>t.sid!==track.sid),{sid:track.sid,track,participant,kind:track.kind,local:true}]); });
        activeRoom.on(RoomEvent.LocalTrackUnpublished, publication => { if(publication.track) setTracks(prev=>prev.filter(t=>t.sid!==publication.track.sid)); if(publication.source===Track.Source.ScreenShare) setSharing(false); });
        activeRoom.on(RoomEvent.DataReceived, (payload, participant) => {
          try {
            const item = JSON.parse(new TextDecoder().decode(payload));
            const senderIsTutor = participant?.attributes?.role === "tutor";
            if (item.type === "chat") setMessages(prev => [...prev, { ...item, sender: participant?.name || "Participant", mine: false }]);
            if (item.type === "draw" && (senderIsTutor || canLearnersDrawRef.current)) drawSegment(item.from, item.to, item.color, item.width);
            if (item.type === "clear" && senderIsTutor) { const c = canvasRef.current; c?.getContext("2d")?.clearRect(0, 0, c.width, c.height); }
            if (item.type === "text" && (senderIsTutor || canLearnersDrawRef.current)) { const c=canvasRef.current; if(c){const ctx=c.getContext("2d");ctx.fillStyle=item.color||"#172554";ctx.font=`${item.size||24}px sans-serif`;ctx.fillText(item.text,item.x*c.width,item.y*c.height);} }
            if (item.type === "shape" && (senderIsTutor || canLearnersDrawRef.current)) { const c=canvasRef.current; if(c){const ctx=c.getContext("2d");ctx.strokeStyle=item.color||"#172554";ctx.lineWidth=item.width||3;ctx.beginPath();ctx.rect(item.from.x*c.width,item.from.y*c.height,(item.to.x-item.from.x)*c.width,(item.to.y-item.from.y)*c.height);ctx.stroke();} }
            if (item.type === "document" && senderIsTutor) { setActiveDocument(item.url); setPage(item.page || 1); documentCanvasRef.current?.getContext("2d")?.clearRect(0,0,documentCanvasRef.current.width,documentCanvasRef.current.height); }
            if (item.type === "page" && senderIsTutor) { setPage(item.page); documentCanvasRef.current?.getContext("2d")?.clearRect(0,0,documentCanvasRef.current.width,documentCanvasRef.current.height); }
            if (item.type === "permissions" && senderIsTutor) setCanLearnersDraw(Boolean(item.canLearnersDraw));
            if (item.type === "raise-hand" && senderIsTutor === false) setRaisedHands(prev => [...prev.filter(x => x.identity !== participant?.identity), { identity: participant?.identity, name: participant?.name || "Learner", raised: item.raised }].filter(x => x.raised));
            if (item.type === "document-annotation" && senderIsTutor) { if(item.color==="__erase__"){const c=documentCanvasRef.current,ctx=c?.getContext("2d");if(ctx){ctx.save();ctx.globalCompositeOperation="destination-out";ctx.lineWidth=item.width||12;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(item.from.x*c.width,item.from.y*c.height);ctx.lineTo(item.to.x*c.width,item.to.y*c.height);ctx.stroke();ctx.restore();}}else drawSegment(item.from,item.to,item.color,item.width,"document"); }
          } catch { /* ignore malformed packets */ }
        });
        await activeRoom.connect(data.serverUrl, data.token);
        if (!mounted) { activeRoom.disconnect(); return; }
        setAttendanceSessionId(data.attendanceSessionId || lesson.attendanceSessionId || "");
        setRoom(activeRoom); setConnected(true); setParticipants([...activeRoom.remoteParticipants.values()]);
        const localTracks = [];
        // Acquire/publish audio and video independently so a denied camera does not
        // prevent microphone use (and vice versa).
        for (const source of ["audio", "video"]) {
          try {
            const made = await createLocalTracks(source === "audio" ? { audio: true, video: false } : { audio: false, video: true });
            for (const track of made) {
              await activeRoom.localParticipant.publishTrack(track);
              localTracks.push(track);
            }
            if (source === "audio") setMicOn(true); else setCameraOn(true);
          } catch (mediaError) {
            if (source === "audio") setMicOn(false); else setCameraOn(false);
            setError(prev => [prev, `${source === "audio" ? "Microphone" : "Camera"} unavailable: ${mediaError.message || "permission or device error"}`].filter(Boolean).join(" · "));
          }
        }
        setTracks(localTracks.map(track => ({ sid: track.sid, track, participant: activeRoom.localParticipant, kind: track.kind, local: true })));
      } catch (e) { if (mounted) setError(e.message || "Unable to connect to LiveKit."); }
    })();
    return () => { mounted = false; window.removeEventListener("pagehide", handlePageHide); if (activeRoom) activeRoom.disconnect(); };
  }, [lesson._id]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { const rect = canvas.getBoundingClientRect(); const old = document.createElement("canvas"); old.width = canvas.width; old.height = canvas.height; old.getContext("2d").drawImage(canvas, 0, 0); canvas.width = Math.max(600, rect.width * 2); canvas.height = Math.max(360, rect.height * 2); canvas.getContext("2d").drawImage(old, 0, 0, canvas.width, canvas.height); };
    resize(); window.addEventListener("resize", resize); return () => window.removeEventListener("resize", resize);
  }, [connected, tab]);

  useEffect(() => {
    const canvas = documentCanvasRef.current;
    if (!canvas || !activeDocument) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const previous = document.createElement("canvas");
      previous.width = canvas.width; previous.height = canvas.height;
      previous.getContext("2d").drawImage(canvas, 0, 0);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.getContext("2d").drawImage(previous, 0, 0, canvas.width, canvas.height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [activeDocument, page, tab]);

  useEffect(() => {
    if (!isTutor || !connected) return;
    let active = true;
    const loadAttendance = async () => {
      try {
        const response = await fetch(`${API_URL}/api/attendance/sessions`, { headers: authHeaders() });
        if (!response.ok) return;
        const sessions = await response.json();
        const found = (Array.isArray(sessions) ? sessions : []).find(item =>
          (attendanceSessionId && String(item._id) === String(attendanceSessionId)) ||
          (!attendanceSessionId && item.title === lesson.title && String(item.classId?._id || item.classId) === String(lesson.classId?._id || lesson.classId))
        );
        if (active && found) { setAttendanceSessionId(found._id); setAttendanceData(found); }
      } catch { /* attendance is also available from the main Attendance page */ }
    };
    loadAttendance();
    const timer = setInterval(loadAttendance, 10000);
    return () => { active = false; clearInterval(timer); };
  }, [isTutor, connected, attendanceSessionId, lesson._id, lesson.title, lesson.classId]);

  useEffect(() => {
    tracks.forEach(({ track, sid, kind }) => {
      const el = document.querySelector(`[data-track-sid="${sid}"]`);
      if (el && track && kind === Track.Kind.Video) track.attach(el);
      if (el && track && kind === Track.Kind.Audio) track.attach(el);
    });
    return () => tracks.forEach(({ track }) => { try { track.detach(); } catch { /* noop */ } });
  }, [tracks, tab]);

  const leave = async () => {
    if (hasLeftRef.current) { onClose?.(); return; }
    hasLeftRef.current = true;
    room?.disconnect(); onClose?.();
  };
  const toggleMic = async () => { try { const next = !micOn; await room?.localParticipant.setMicrophoneEnabled(next); setMicOn(next); } catch (e) { setError(`Microphone control failed: ${e.message}`); } };
  const toggleCamera = async () => { try { const next = !cameraOn; await room?.localParticipant.setCameraEnabled(next); setCameraOn(next); } catch (e) { setError(`Camera control failed: ${e.message}`); } };
  const toggleShare = async () => { try { const next = !sharing; await room?.localParticipant.setScreenShareEnabled(next); setSharing(next); } catch (e) { setError(`Screen sharing failed: ${e.message}`); } };
  const sendChat = (e) => { e.preventDefault(); if (!message.trim()) return; const item = { type: "chat", text: message.trim().slice(0, 1000), at: new Date().toISOString() }; publish(item); setMessages(prev => [...prev, { ...item, sender: "You", mine: true }]); setMessage(""); };
  const pointerDown = (e) => { if (!isTutor && !canLearnersDraw) return; e.currentTarget.setPointerCapture?.(e.pointerId); pressureRef.current = e.pressure > 0 ? e.pressure : 1; const r=e.currentTarget.getBoundingClientRect(); const point={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}; if(boardTool==="text"){const value=window.prompt("Enter text or an equation to write on the board:");if(value){const ctx=canvasRef.current.getContext("2d");ctx.fillStyle=boardColor;ctx.font=`${Math.max(16,boardWidth*7)}px sans-serif`;ctx.fillText(value,point.x*canvasRef.current.width,point.y*canvasRef.current.height);publish({type:"text",text:value,x:point.x,y:point.y,color:boardColor,size:Math.max(16,boardWidth*7)});}return;} drawingRef.current=true;startPointRef.current=point;canvasRef.current.dataset.last=JSON.stringify(point); };
  const pointerMove = (e) => { if (!drawingRef.current || ["rectangle","line"].includes(boardTool)) return; pressureRef.current = e.pressure > 0 ? e.pressure : pressureRef.current; const r=e.currentTarget.getBoundingClientRect();const to={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};let from;try{from=JSON.parse(canvasRef.current.dataset.last||"{}");}catch{from=to;}const color=boardTool==="eraser"?"#ffffff":boardTool==="highlighter"?`${boardColor}66`:boardColor;const width=(boardTool==="highlighter"?Math.max(10,boardWidth*4):boardTool==="eraser"?Math.max(12,boardWidth*5):boardWidth)*(e.pointerType==="pen"?Math.max(.35,pressureRef.current):1);drawSegment(from,to,color,width);publish({type:"draw",from,to,color,width});canvasRef.current.dataset.last=JSON.stringify(to); };
  const pointerUp = (e) => { if(drawingRef.current && ["rectangle","line"].includes(boardTool) && e){const r=e.currentTarget.getBoundingClientRect();const to={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};const from=startPointRef.current;if(from){const c=canvasRef.current,ctx=c.getContext("2d");ctx.strokeStyle=boardColor;ctx.lineWidth=boardWidth;ctx.beginPath();if(boardTool==="rectangle")ctx.rect(from.x*c.width,from.y*c.height,(to.x-from.x)*c.width,(to.y-from.y)*c.height);else{ctx.moveTo(from.x*c.width,from.y*c.height);ctx.lineTo(to.x*c.width,to.y*c.height);}ctx.stroke();publish({type:boardTool==="rectangle"?"shape":"draw",from,to,color:boardColor,width:boardWidth});}}drawingRef.current=false; };
  const shareDocument = (e) => { e.preventDefault(); if (!documentUrl.trim()) return; setActiveDocument(documentUrl.trim()); setPage(1); publish({type:"document",url:documentUrl.trim(),page:1}); };
  const changePage = (next) => { const n=Math.max(1,next); setPage(n); const c=documentCanvasRef.current;c?.getContext("2d")?.clearRect(0,0,c.width,c.height); publish({type:"page",page:n}); };
  const clearBoard = () => { canvasRef.current?.getContext("2d")?.clearRect(0,0,canvasRef.current.width,canvasRef.current.height); publish({type:"clear"}); };
  const toggleDrawingPermission = () => { const next=!canLearnersDraw; setCanLearnersDraw(next); publish({type:"permissions",canLearnersDraw:next}); };
  const toggleRaiseHand = () => { const next = !raiseHand; setRaiseHand(next); publish({ type: "raise-hand", raised: next }); };
  const documentPointerDown = e => { if (!isTutor) return; e.currentTarget.setPointerCapture?.(e.pointerId); const r=e.currentTarget.getBoundingClientRect(); const p={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}; e.currentTarget.dataset.last=JSON.stringify(p); drawingRef.current=true; };
  const documentPointerMove = e => { if (!drawingRef.current || !isTutor) return; const r=e.currentTarget.getBoundingClientRect(); const to={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}; let from; try{from=JSON.parse(e.currentTarget.dataset.last||"{}");}catch{from=to;} const color=documentTool==="eraser"?"__erase__":documentTool==="highlighter"?`${documentColor}66`:documentColor; const width=(documentTool==="highlighter"?Math.max(12,documentWidth*3):documentWidth)*(e.pointerType==="pen"&&e.pressure>0?e.pressure:1); if(documentTool==="eraser"){const c=documentCanvasRef.current,ctx=c?.getContext("2d");if(ctx){ctx.save();ctx.globalCompositeOperation="destination-out";ctx.lineWidth=width;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(from.x*c.width,from.y*c.height);ctx.lineTo(to.x*c.width,to.y*c.height);ctx.stroke();ctx.restore();}}else drawSegment(from,to,color,width,"document"); publish({type:"document-annotation",from,to,color,width}); e.currentTarget.dataset.last=JSON.stringify(to); };
  const documentPointerUp = () => { drawingRef.current=false; };

  const startLocalRecording = async () => {
    let screen; let mic; let mixed;
    try {
      if (!isTutor) throw new Error("Only the tutor can record this lesson.");
      if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === "undefined") {
        throw new Error("This browser/device does not support local screen recording. Use a supported desktop browser such as current Chrome or Edge.");
      }
      screen = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 20 }, audio: true });
      try { mic = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { mic = new MediaStream(); }
      screenStreamRef.current = screen;
      mixed = new MediaStream([...screen.getVideoTracks(), ...screen.getAudioTracks(), ...mic.getAudioTracks()]);
      const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
      const mime = candidates.find(type => MediaRecorder.isTypeSupported?.(type));
      const recorder = mime ? new MediaRecorder(mixed, { mimeType: mime }) : new MediaRecorder(mixed);
      recordedChunksRef.current=[];
      recorder.ondataavailable = e => { if (e.data.size) recordedChunksRef.current.push(e.data); };
      recorder.onerror = e => setError(`Recording error: ${e.error?.message || "The browser stopped recording."}`);
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current,{type:recorder.mimeType || "video/webm"});
        const url=URL.createObjectURL(blob); setRecordingUrl(url);
        mixed.getTracks().forEach(t=>t.stop()); setRecording(false);
      };
      recorder.start(1000); recorderRef.current=recorder; setRecording(true);
      screen.getVideoTracks()[0]?.addEventListener("ended",()=>{ if(recorder.state!=="inactive") recorder.stop(); });
    } catch(e) {
      screen?.getTracks().forEach(t=>t.stop()); mic?.getTracks().forEach(t=>t.stop());
      setError(`Local recording could not start: ${e.message}`);
    }
  };
  const stopLocalRecording = () => { if(recorderRef.current && recorderRef.current.state!=="inactive") recorderRef.current.stop(); setRecording(false); };
  const downloadRecording = () => { if(!recordingUrl)return; const a=document.createElement("a");a.href=recordingUrl;a.download=`TutorHub-${(lesson.title||"lesson").replace(/[^a-z0-9-_]/gi,"-")}.webm`;a.click(); };

  return <div className="th-live-room">
    <header className="th-live-top"><div><span className="th-live-brand">TUTORHUB LIVE</span><strong>{lesson.title}</strong><small>{connected ? "Connected securely" : "Connecting…"}</small>{error && <small className="th-live-inline-error" role="status">{error}</small>}</div><div className="th-live-top-actions"><span className={connected?"th-live-dot":"th-live-dot off"}>{connected?"LIVE":"CONNECTING"}</span><button className="th-live-danger" onClick={leave}>Leave lesson</button></div></header>
    <div className={`th-live-workspace ${sidebarOpen?"with-sidebar":"sidebar-closed"}`}>
      <button className="th-live-sidebar-toggle" onClick={()=>setSidebarOpen(v=>!v)} aria-label="Toggle classroom tools">☰</button>
      {sidebarOpen && <aside className="th-live-featurebar" aria-label="Classroom sidebar">
        <div className="th-live-sidebar-heading">FEATURES</div>
        <nav className="th-live-feature-nav" aria-label="Classroom features">
          <button className={tab==="board"?"selected":""} onClick={()=>setTab("board")}>✎<span>Whiteboard</span></button>
          <button className={tab==="documents"?"selected":""} onClick={()=>setTab("documents")}>▤<span>Documents</span></button>
          {isTutor && <button className={tab==="attendance"?"selected":""} onClick={()=>setTab("attendance")}>◷<span>Attendance</span></button>}
          {isTutor && <button className={tab==="hands"?"selected":""} onClick={()=>setTab("hands")}>✋<span>Raised hands {raisedHands.length?`(${raisedHands.length})`:""}</span></button>}
        </nav>
        <section className="th-live-sidebar-section th-live-sidebar-people">
          <div className="th-live-sidebar-section-title">PEOPLE <span>{participants.length+1}</span></div>
          <div className="th-live-sidebar-people-list">
            <div className="th-live-sidebar-person"><span className="th-live-avatar">Y</span><span>You</span><small>{micOn?"Mic on":"Mic off"}</small></div>
            {participants.map(person=><div className="th-live-sidebar-person" key={person.identity}><span className="th-live-avatar">{(person.name||person.identity||"P").slice(0,1).toUpperCase()}</span><span>{person.name||person.identity}</span></div>)}
          </div>
        </section>
        <section className="th-live-sidebar-section th-live-sidebar-chat">
          <div className="th-live-sidebar-section-title">CLASS CHAT <span>{messages.length}</span></div>
          <div className="th-live-sidebar-chat-list">{messages.map((item,index)=><div key={index} className={item.mine?"th-live-chat mine":"th-live-chat"}><b>{item.sender}</b><p>{item.text}</p></div>)}{!messages.length&&<p className="th-live-chat-empty">Messages from your class will appear here.</p>}</div>
          <form className="th-live-chat-form" onSubmit={sendChat}><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Message the class…" aria-label="Message the class"/><button type="submit">Send</button></form>
        </section>
      </aside>}
      <main className="th-live-canvas-stage">
        <section className="th-live-board-area" style={{display:tab==="board"?"flex":"none"}}><div className="th-live-board-wrap"><canvas ref={canvasRef} className="th-live-canvas" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}/></div><div className="th-live-board-toolbar th-live-board-toolbar-bottom"><b>BOARD TOOLS</b><select value={boardTool} onChange={e=>setBoardTool(e.target.value)} aria-label="Board tool"><option value="pen">Pen</option><option value="highlighter">Highlighter</option><option value="eraser">Eraser</option><option value="text">Text / equation</option><option value="line">Line</option><option value="rectangle">Rectangle</option></select><input aria-label="Pen colour" type="color" value={boardColor} onChange={e=>setBoardColor(e.target.value)}/><input aria-label="Brush size" type="range" min="1" max="12" value={boardWidth} onChange={e=>setBoardWidth(Number(e.target.value))}/>{isTutor && <><button onClick={clearBoard}>Clear board</button><button onClick={toggleDrawingPermission}>{canLearnersDraw?"Disable learner writing":"Allow learner writing"}</button></>}<span>Mouse · touch · pressure-sensitive stylus</span></div></section>
        <section className="th-live-doc th-live-doc-full" style={{display:tab==="documents"?"flex":"none"}}>{isTutor && <form onSubmit={shareDocument}><input value={documentUrl} onChange={e=>setDocumentUrl(e.target.value)} placeholder="Paste a publicly accessible PDF URL"/><button type="submit">Present document</button></form>}{activeDocument ? <><div className="th-live-doc-nav"><strong>Presented document</strong><button onClick={()=>changePage(page-1)}>Previous page</button><span>Page {page}</span><button onClick={()=>changePage(page+1)}>Next page</button><a href={activeDocument} target="_blank" rel="noreferrer">Open / download</a></div><div className="th-live-document-stage"><iframe title="Shared lesson document" src={`${activeDocument.includes("#")?activeDocument.split("#")[0]:activeDocument}#page=${page}&toolbar=0`} /><canvas ref={documentCanvasRef} className="th-live-document-ink" onPointerDown={documentPointerDown} onPointerMove={documentPointerMove} onPointerUp={documentPointerUp} onPointerCancel={documentPointerUp}/></div><div className="th-live-board-toolbar"><b>Document annotations</b>{isTutor?<><select value={documentTool} onChange={e=>setDocumentTool(e.target.value)}><option value="pen">Pen</option><option value="highlighter">Highlighter</option><option value="eraser">Eraser</option></select><input type="color" aria-label="Document annotation colour" value={documentColor} onChange={e=>setDocumentColor(e.target.value)}/><input type="range" min="1" max="14" value={documentWidth} onChange={e=>setDocumentWidth(Number(e.target.value))} aria-label="Document pen size"/><span>Annotations sync to learners</span></>:<span>Follow the tutor's annotations</span>}</div></>:<div className="th-live-doc-empty">The tutor can present a publicly accessible PDF here. Learners will see the same document and annotations.</div>}</section>

        {tab==="attendance" && isTutor && <section className="th-live-panel"><h3>Live attendance</h3><p className="th-live-attendance-note">Updates automatically while this lesson is running.</p>{attendanceData?.entries?.length ? <div className="th-live-attendance-list">{attendanceData.entries.map(entry=><div className="th-live-attendance-row" key={entry._id || entry.learnerId?._id || entry.learnerId}><span>{entry.learnerId?.name ? `${entry.learnerId.name} ${entry.learnerId.surname || ""}` : "Enrolled learner"}</span><b>{entry.status || "Absent"}</b><small>{Math.floor((entry.totalSeconds || 0)/60)} min</small></div>)}</div> : <p>{attendanceSessionId ? "Attendance session created; waiting for learner activity." : "Attendance will appear once the LiveKit Cloud webhook receives the room events. Configure the webhook endpoint in LiveKit Cloud."}</p>}</section>}
        {tab==="hands" && isTutor && <section className="th-live-panel"><h3>Raised hands</h3>{raisedHands.length?raisedHands.map(p=><div className="th-live-person" key={p.identity}>✋ {p.name}</div>):<p>No learners have raised their hands.</p>}</section>}
      </main>
    </div>
    <div className="th-live-audio-tracks" aria-hidden="true">{tracks.filter(t=>t.kind===Track.Kind.Audio && !t.local).map(t=><audio key={t.sid} data-track-sid={t.sid} autoPlay />)}</div>
    <footer className="th-live-controls"><button onClick={toggleMic}>{micOn?"🎙 Mic on":"🔇 Mic off"}</button><button onClick={toggleCamera}>{cameraOn?"📷 Camera on":"Camera off"}</button><button onClick={toggleShare}>{sharing?"Stop sharing":"Share screen"}</button>{!isTutor && <button className={raiseHand?"raised":""} onClick={toggleRaiseHand}>{raiseHand?"✋ Lower hand":"✋ Raise hand"}</button>}{isTutor && (recording?<button className="recording" onClick={stopLocalRecording}>Stop recording</button>:<button onClick={startLocalRecording}>Record lesson</button>)}{recordingUrl&&isTutor&&<button onClick={downloadRecording}>Download recording</button>}</footer>
    {isTutor&&<p className="th-live-recording-note">Recording is saved locally on this device. Browser/device support and screen/audio permissions are required.</p>}
  </div>;
}
