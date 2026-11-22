const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const Tutor = require('../models/Tutor');
const Program = require('../models/Program');
const Learner = require('../models/learner');
const Payment = require('../models/Payment');

router.use(authenticate, authorizeRoles('owner'));

async function resolveWorkspace(userId) {
  const owner = await Tutor.findById(userId).select('name surname businessName role programId status accountStatus');
  if (!owner || owner.role !== 'owner') return { error: 'Provider account not found', status: 404 };
  const program = await Program.findOne({ ownerId: owner._id });
  if (!program) return { error: 'Provider workspace not found', status: 404 };
  if (owner.accountStatus === 'Blocked' || program.status === 'Blocked') return { error: 'This provider workspace is blocked', status: 403 };
  return { owner, program };
}

// A provider sees only its own centre/private-tutor workspace.
router.get('/dashboard', async (req, res) => {
  try {
    const workspace = await resolveWorkspace(req.user.id);
    if (workspace.error) return res.status(workspace.status).json({ message: workspace.error });
    const { owner, program } = workspace;
    const [tutors, learners] = await Promise.all([
      Tutor.find({ programId: program._id }).select('name surname subjects role status accountStatus'),
      Learner.find({ programId: program._id }).select('name surname grade email subjects tuitionOption status paymentStatus accountStatus paymentProof programId tutorId').populate('tutorId', 'name surname')
    ]);
    res.json({ owner, program, tutors, learners, providerType: program.providerType || 'tuition-centre' });
  } catch (error) {
    console.error('Provider dashboard error:', error);
    res.status(500).json({ message: 'Could not load provider workspace' });
  }
});

// Approve/reject only an application belonging to the authenticated provider.
router.patch('/learners/:id/status', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid learner ID' });
    const nextStatus = req.body.status;
    if (!['Approved', 'Rejected'].includes(nextStatus)) return res.status(400).json({ message: 'Status must be Approved or Rejected' });
    const workspace = await resolveWorkspace(req.user.id);
    if (workspace.error) return res.status(workspace.status).json({ message: workspace.error });
    const learner = await Learner.findOne({ _id: req.params.id, programId: workspace.program._id });
    if (!learner) return res.status(404).json({ message: 'Application not found in your provider workspace' });
    if (learner.status !== 'Pending') return res.status(409).json({ message: 'This application has already been reviewed' });

    learner.status = nextStatus;
    await learner.save();

    // Preserve the existing first-payment workflow when an application is approved.
    if (nextStatus === 'Approved') {
      const existingPayment = await Payment.findOne({ learnerId: learner._id });
      if (!existingPayment) {
        const now = new Date();
        await Payment.create({
          learnerId: learner._id,
          programId: workspace.program._id,
          month: now.toLocaleString('default', { month: 'long' }),
          year: now.getFullYear(),
          amount: workspace.program.monthlyFee,
          proof: learner.paymentProof,
          status: 'Paid'
        });
      }
    }
    res.json({ message: `Learner application ${nextStatus.toLowerCase()}`, learner });
  } catch (error) {
    console.error('Provider application review error:', error);
    res.status(500).json({ message: 'Could not update application status' });
  }
});

module.exports = router;
