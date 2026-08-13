const express = require("express");

const router = express.Router();


const Payment = require("../models/Payment");
const multer = require("multer");
const path = require("path");
const Learner = require("../models/Learner");

const Program = require("../models/Program");


// Upload payment proof storage

const storage = multer.diskStorage({

    destination:function(req,file,cb){

        cb(null,"uploads/");

    },


    filename:function(req,file,cb){

        cb(

            null,

            Date.now()+path.extname(file.originalname)

        );

    }


});


const upload = multer({

    storage

});

// ==========================================
// GET ALL PAYMENTS
// ==========================================

router.get("/", async(req,res)=>{


    try{


        const payments = await Payment.find()

        .populate(

            "learnerId",

            "name surname grade"

        )

        .populate(

            "programId",

            "name"

        );



        res.json(payments);



    }catch(error){


        console.log(error);


        res.status(500).json({

            message:"Could not fetch payments"

        });


    }


});









// ==========================================
// GET PAYMENTS FOR ONE LEARNER
// ==========================================


router.get("/learner/:id", async(req,res)=>{


    try{


        const payments = await Payment.find({

            learnerId:req.params.id

        });



        res.json(payments);



    }catch(error){


        console.log(error);



        res.status(500).json({

            message:"Could not fetch learner payments"

        });


    }


});









// ==========================================
// APPROVE PAYMENT
// ==========================================


router.put("/:id/approve", async(req,res)=>{


    try{


        const payment = await Payment.findByIdAndUpdate(


            req.params.id,


            {

                status:"Paid"

            },


            {

                new:true

            }


        );



        if(!payment){


            return res.status(404).json({

                message:"Payment not found"

            });


        }



        res.json({


            message:"Payment approved ✅",


            payment


        });



    }catch(error){


        console.log(error);



        res.status(500).json({

            message:"Could not approve payment"

        });


    }


});









// ==========================================
// REJECT PAYMENT
// ==========================================


router.put("/:id/reject", async(req,res)=>{


    try{


        const payment = await Payment.findByIdAndUpdate(


            req.params.id,


            {

                status:"Rejected"

            },


            {

                new:true

            }


        );



        res.json({


            message:"Payment rejected",

            payment


        });



    }catch(error){


        console.log(error);



        res.status(500).json({

            message:"Could not reject payment"

        });


    }


});


// ==========================================
// GET PAYMENTS FOR OWNER TUITION CENTRE
// ==========================================

router.get("/owner/:ownerId", async(req,res)=>{


    try{


        const program = await Program.findOne({

            ownerId:req.params.ownerId

        });



        if(!program){


            return res.status(404).json({

                message:"Tuition centre not found"

            });


        }





        const payments = await Payment.find({

            programId:program._id

        })

        .populate(

            "learnerId",

            "name surname grade"

        )

        .populate(

            "programId",

            "name"

        );





        res.json(payments);





    }catch(error){


        console.log(error);



        res.status(500).json({

            message:"Could not fetch owner payments"

        });



    }


});
// ==========================================
// GET TUITION CENTRE PAYMENT DETAILS
// ==========================================

router.get("/program/:programId", async (req, res) => {

    try {

        const program = await Program.findById(
            req.params.programId
        ).select(
            "name bankName accountHolder accountNumber branchCode monthlyFee"
        );


        if (!program) {

            return res.status(404).json({

                message: "Tuition centre not found"

            });

        }


        res.json(program);


    } catch (error) {

        console.log(
            "Could not fetch tuition centre payment details:",
            error
        );


        res.status(500).json({

            message:
                "Could not fetch tuition centre payment details"

        });

    }

});
// ==========================================
// CREATE PAYMENT BY LEARNER
// ==========================================

router.post(

"/create",

upload.single("proof"),

async(req,res)=>{


    try{


        const {

            learnerId,

            programId,

            month,

            year,

            amount


        } = req.body;





        // prevent duplicate payment

        const existingPayment = await Payment.findOne({

            learnerId,

            month,

            year

        });





        if(existingPayment){


            return res.status(400).json({

                message:"Payment for this month already exists"

            });


        }






        const payment = new Payment({

            learnerId,

            programId,

            month,

            year,

            amount,

            proof:req.file ? req.file.filename : "",

            status:"Pending"

        });






        await payment.save();






        res.json({

            message:"Payment submitted successfully 🚀",

            payment

        });





    }catch(error){


        console.log(error);



        res.status(500).json({

            message:"Could not create payment"

        });



    }


});

module.exports = router;