const express = require("express");
const router = express.Router();

const Program = require("../models/Program");
const Tutor = require("../models/Tutor");
const Learner = require("../models/Learner");
const Payment = require("../models/Payment");


// ==========================================
// OWNER REPORTS
// ==========================================

router.get("/owner/:id", async(req,res)=>{

    try{


        const program = await Program.findOne({

            ownerId:req.params.id

        });


        if(!program){

            return res.status(404).json({

                message:"Tuition centre not found"

            });

        }



        const tutors = await Tutor.find({

            programId:program._id

        });



        const learners = await Learner.find({

            programId:program._id

        });



        const payments = await Payment.find({

            programId:program._id

        })
        .populate(

            "learnerId",

            "name surname grade"

        );





        const paidPayments = payments.filter(

            payment => payment.status === "Paid"

        );



        const pendingPayments = payments.filter(

            payment => payment.status === "Pending"

        );





        const revenue = paidPayments.reduce(

            (total,payment)=> total + payment.amount,

            0

        );





        res.json({

            program,

            totalTeachers:tutors.length,

            totalLearners:learners.length,

            paidPayments:paidPayments.length,

            pendingPayments:pendingPayments.length,

            revenue,

            payments


        });



    }catch(error){


        console.log(error);


        res.status(500).json({

            message:"Could not generate reports"

        });


    }


});



module.exports = router;