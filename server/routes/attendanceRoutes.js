const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const Class = require('../models/Class');
const AttendanceSession = require('../models/AttendanceSession');
const Learner = require('../models/learner');

const auth = [authenticate];
const idEq = (a,b) => String(a) === String(b);
async function canManageClass(user, cls) {
  if (user.role === 'teacher' || user.role === 'owner') return idEq(cls.tutorId, user.id);
  return false;
}
function durationSeconds(entry, now = Date.now()) {
  return (entry.periods || []).reduce((sum,p) => sum + Math.max(0, ((p.leftAt ? new Date(p.leftAt).getTime() : now) - new Date(p.joinedAt).getTime()) / 1000), 0);
}
function classify(entry, session) {
  if (entry.manualStatus) return entry.manualStatus;
  const mins = entry.totalSeconds / 60;
  const expected = Math.max(1, Number(session.scheduledDurationMinutes || 60));
  const threshold = expected * (Number(session.thresholdPercent || 75) / 100);
  if (!mins) return 'Absent';
  if (mins >= threshold) {
    const first = entry.periods?.[0]?.joinedAt;
    const late = first && new Date(first).getTime() - new Date(session.scheduledStart).getTime() > 5 * 60000;
    return late ? 'Late' : 'Present';
  }
  return mins > 0 ? (mins < expected * .5 ? 'Left early' : 'Partial') : 'Absent';
}
router.get('/classes', ...auth, async (req,res)=>{
 try {
  let query={};
  if(req.user.role==='teacher') query={tutorId:req.user.id};
  else if(req.user.role==='owner') query={tutorId:req.user.id};
  else return res.status(403).json({message:'Attendance is available to tutors and tuition-centre owners only.'});
  const classes=await Class.find(query).select('_id className subject grade learners tutorId').sort({className:1}).lean();
  res.json(classes);
 }catch(e){console.error(e);res.status(500).json({message:'Could not load classes.'});}
});

router.get('/sessions', ...auth, async (req,res) => {
  try {
    let classes;
    if (req.user.role === 'teacher' || req.user.role === 'owner') classes = await Class.find({ tutorId: req.user.id }).select('_id');
    else return res.status(403).json({message:'Attendance is available to tutors and tuition-centre owners only.'});
    const ids = classes.map(c=>c._id);
    const sessions = await AttendanceSession.find({ classId: { $in: ids } }).populate('classId','className subject grade').populate('entries.learnerId','name surname').sort({createdAt:-1}).limit(150).lean();
    res.json(sessions.map(s=>({...s, entries:(s.entries||[]).map(e=>({...e,totalSeconds:s.status==='Live'?durationSeconds(e):e.totalSeconds,status:classify({...e,totalSeconds:s.status==='Live'?durationSeconds(e):e.totalSeconds},s)}))})));
  } catch(e) { console.error(e); res.status(500).json({message:'Could not load attendance.'}); }
});
router.post('/sessions', ...auth, authorizeRoles('teacher','owner'), async (req,res)=>{
  try {
    const {classId,title,scheduledStart,scheduledDurationMinutes,thresholdPercent}=req.body;
    if (!mongoose.isValidObjectId(classId)) return res.status(400).json({message:'A valid classroom is required.'});
    const cls=await Class.findById(classId);
    if(!cls) return res.status(404).json({message:'Classroom not found.'});
    if(!await canManageClass(req.user,cls)) return res.status(403).json({message:'You cannot start attendance for this classroom.'});
    const session=await AttendanceSession.create({classId:cls._id,tutorId:req.user.id,title:title||'Live lesson',scheduledStart:scheduledStart||new Date(),scheduledDurationMinutes:Math.max(1,Number(scheduledDurationMinutes)||60),thresholdPercent:Math.min(100,Math.max(1,Number(thresholdPercent)||75)),entries:[]});
    res.status(201).json(session);
  } catch(e){console.error(e);res.status(500).json({message:'Could not start attendance session.'});}
});
router.post('/sessions/:id/join', ...auth, authorizeRoles('learner'), async(req,res)=>{
 try{
  const session=await AttendanceSession.findById(req.params.id); if(!session||session.status!=='Live') return res.status(404).json({message:'Live lesson not found.'});
  const learner=await Learner.findById(req.user.id); if(!learner) return res.status(404).json({message:'Learner account not found.'});
  const cls=await Class.findById(session.classId); if(!cls||!(cls.learners||[]).some(id=>idEq(id,learner._id))) return res.status(403).json({message:'You are not enrolled in this classroom.'});
  let entry=session.entries.find(e=>idEq(e.learnerId,learner._id)); if(!entry){session.entries.push({learnerId:learner._id,periods:[{joinedAt:new Date()}]});} else {const last=entry.periods[entry.periods.length-1]; if(!last||last.leftAt) entry.periods.push({joinedAt:new Date()});}
  await session.save(); res.json({message:'Attendance join recorded.',sessionId:session._id});
 }catch(e){console.error(e);res.status(500).json({message:'Could not record attendance join.'});}
});
router.post('/sessions/:id/leave', ...auth, authorizeRoles('learner'), async(req,res)=>{
 try{const session=await AttendanceSession.findById(req.params.id);if(!session)return res.status(404).json({message:'Lesson not found.'});const entry=session.entries.find(e=>idEq(e.learnerId,req.user.id));if(entry){const last=entry.periods[entry.periods.length-1];if(last&&!last.leftAt)last.leftAt=new Date();entry.totalSeconds=durationSeconds(entry);entry.status=classify(entry,session);}await session.save();res.json({message:'Attendance leave recorded.'});}
 catch(e){console.error(e);res.status(500).json({message:'Could not record attendance leave.'});}
});
router.post('/sessions/:id/end', ...auth, authorizeRoles('teacher','owner'), async(req,res)=>{
 try{const session=await AttendanceSession.findById(req.params.id);if(!session)return res.status(404).json({message:'Lesson not found.'});const cls=await Class.findById(session.classId);if(!cls||!await canManageClass(req.user,cls))return res.status(403).json({message:'Not authorised.'});const now=new Date();for(const e of session.entries){const last=e.periods[e.periods.length-1];if(last&&!last.leftAt)last.leftAt=now;e.totalSeconds=durationSeconds(e,now);e.status=classify(e,session);}session.status='Ended';session.endedAt=now;await session.save();res.json(session);}
 catch(e){console.error(e);res.status(500).json({message:'Could not end lesson attendance.'});}
});
router.patch('/sessions/:sessionId/learners/:learnerId', ...auth, authorizeRoles('teacher','owner'), async(req,res)=>{
 try{const s=await AttendanceSession.findById(req.params.sessionId);if(!s)return res.status(404).json({message:'Session not found.'});const c=await Class.findById(s.classId);if(!c||!await canManageClass(req.user,c))return res.status(403).json({message:'Not authorised.'});const e=s.entries.find(x=>idEq(x.learnerId,req.params.learnerId));if(!e)return res.status(404).json({message:'Attendance entry not found.'});const allowed=['Present','Late','Partial','Absent','Left early'];if(!allowed.includes(req.body.status))return res.status(400).json({message:'Invalid attendance status.'});e.manualStatus=req.body.status;e.correctionNote=String(req.body.note||'').slice(0,500);e.status=req.body.status;await s.save();res.json({message:'Attendance corrected.',entry:e});}
 catch(e){console.error(e);res.status(500).json({message:'Could not correct attendance.'});}
});
module.exports=router;
