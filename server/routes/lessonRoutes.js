const express = require("express");
const router = express.Router();

const Lesson = require("../models/Lesson");


// ==========================================
// CREATE A LESSON
// ==========================================

router.post("/create", async (req, res) => {

    try {

        const {
            classId,
            tutorId,
            title,
            description,
            date,
            time
        } = req.body;


        // Generate a unique Jitsi room name
        const roomName =
            "TutorHub-" +
            Date.now() +
            "-" +
            Math.random().toString(36).substring(2, 8);


        const lesson = new Lesson({

            classId,

            tutorId,

            title,

            description,

            date,

            time,

            // Jitsi link/room generated automatically
            jitsiRoom: roomName,

            status: "Upcoming"

        });


        await lesson.save();


        res.status(201).json({

            message: "Lesson created successfully",

            lesson

        });


    } catch (error) {

        console.error("Create lesson error:", error);

        res.status(500).json({

            message: "Failed to create lesson",

            error: error.message

        });

    }

});


// ==========================================
// GET LESSONS FOR A CLASS
// ==========================================

router.get("/class/:classId", async (req, res) => {

    try {

        const lessons = await Lesson.find({

            classId: req.params.classId

        })
        .populate("tutorId", "name surname")
        .sort({ date: 1, time: 1 });


        res.json(lessons);


    } catch (error) {

        console.error("Get lessons error:", error);

        res.status(500).json({

            message: "Failed to get lessons",

            error: error.message

        });

    }

});


// ==========================================
// ADD / UPDATE YOUTUBE RECORDING
// ==========================================

router.put("/:id/recording", async (req, res) => {

    try {

        const { recordingLink } = req.body;


        const lesson = await Lesson.findByIdAndUpdate(

            req.params.id,

            {
                recordingLink: recordingLink,

                status: "Completed"
            },

            {
                new: true
            }

        );


        if (!lesson) {

            return res.status(404).json({

                message: "Lesson not found"

            });

        }


        res.json({

            message: "Recording added successfully",

            lesson

        });


    } catch (error) {

        console.error("Add recording error:", error);

        res.status(500).json({

            message: "Failed to add recording",

            error: error.message

        });

    }

});
// ==========================================
// DELETE LESSON
// ==========================================

router.delete("/:id", async (req, res) => {

    try {

        const lesson = await Lesson.findByIdAndDelete(
            req.params.id
        );

        if (!lesson) {

            return res.status(404).json({

                message: "Lesson not found"

            });

        }

        res.json({

            message: "Lesson deleted successfully"

        });

    } catch (error) {

        console.error("Delete lesson error:", error);

        res.status(500).json({

            message: "Failed to delete lesson",

            error: error.message

        });

    }

});

module.exports = router;