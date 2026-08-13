const express = require("express");
const router = express.Router();

const Assignment = require("../models/Assignment");



// =================================
// CREATE ASSIGNMENT
// =================================

router.post("/create", async (req, res) => {

    try {


        const {

            classId,

            tutorId,

            title,

            description,

            dueDate,

            totalMarks,

            attachment,

            questions

        } = req.body;




        const assignment = new Assignment({

            classId,

            tutorId,

            title,

            description,

            dueDate,

            totalMarks,

            attachment,

            questions

        });




        await assignment.save();




        res.status(201).json({

            message:"Assignment created successfully",

            assignment

        });



    } catch(error){


        res.status(500).json({

            message:error.message

        });


    }


});







// =================================
// GET ASSIGNMENTS FOR CLASS
// =================================


router.get("/class/:id", async(req,res)=>{


    try{


        const assignments = await Assignment.find({

            classId:req.params.id

        }).sort({

            createdAt:-1

        });



        res.json(assignments);



    }catch(error){


        res.status(500).json({

            message:error.message

        });


    }


});



// GET SINGLE ASSIGNMENT

router.get("/:id", async(req,res)=>{

    try{

        const assignment = await Assignment.findById(
            req.params.id
        );


        if(!assignment){

            return res.status(404).json({

                message:"Assignment not found"

            });

        }


        res.json(assignment);



    }catch(error){


        res.status(500).json({

            message:error.message

        });


    }


});


// =================================
// DELETE ASSIGNMENT
// =================================

router.delete("/:id", async (req, res) => {

    try {

        const assignment =
            await Assignment.findById(
                req.params.id
            );


        if (!assignment) {

            return res.status(404).json({

                message: "Assignment not found"

            });

        }


        await Assignment.findByIdAndDelete(
            req.params.id
        );


        res.json({

            message:
                "Assignment deleted successfully 🗑️"

        });


    } catch (error) {

        console.log(
            "Delete assignment error:",
            error
        );


        res.status(500).json({

            message:
                "Could not delete assignment",

            error: error.message

        });

    }

});
module.exports = router;