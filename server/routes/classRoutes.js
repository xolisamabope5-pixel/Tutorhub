
const express = require("express");
const router = express.Router();

const Class = require("../models/Class");
const Assignment = require("../models/Assignment");



// =====================================
// CREATE CLASS
// =====================================

router.post("/create", async (req, res) => {

    try {

        const newClass = new Class(req.body);

        await newClass.save();


        const createdClass = await Class.findById(newClass._id)

        .populate(
            "tutorId",
            "name surname subjects"
        )

        .populate(
            "learners",
            "name surname grade school username"
        );


        res.json({

            message: "Class created successfully 🚀",

            class: createdClass

        });


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message: "Could not create class",

            error: error.message

        });

    }

});



// =====================================
// GET ALL CLASSES
// =====================================

router.get("/", async (req, res) => {

    try {

        const classes = await Class.find()

        .populate(
            "tutorId",
            "name surname subjects"
        )

        .populate(
            "learners",
            "name surname grade school username"
        );


        res.json(classes);


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message: "Could not fetch classes",

            error: error.message

        });

    }

});



// =====================================
// GET CLASSES BY TUITION CENTRE AND GRADE
// =====================================

router.get("/program/:programId/:grade", async (req, res) => {

    try {

        const {
            programId,
            grade
        } = req.params;


        console.log("=================================");
        console.log("BROWSE CLASSES REQUEST");
        console.log("Program ID:", programId);
        console.log("Grade:", grade);
        console.log("=================================");


        const classes = await Class.find({

            programId: programId,

            grade: grade

        })

        .populate(
            "tutorId",
            "name surname subjects"
        )

        .populate(
            "learners",
            "name surname grade school username"
        );


        console.log(
            "Classes returned:",
            classes.map(item => ({

                id: item._id,

                className: item.className,

                subject: item.subject,

                grade: item.grade,

                programId: item.programId

            }))
        );


        res.json(classes);


    } catch (error) {

        console.log(
            "Could not fetch grade classes:",
            error
        );


        res.status(500).json({

            message: "Could not fetch grade classes",

            error: error.message

        });

    }

});



// =====================================
// GET CLASSES BY TUTOR
// =====================================

router.get("/tutor/:id", async (req, res) => {

    try {

        const classes = await Class.find({

            tutorId: req.params.id

        })

        .populate(
            "tutorId",
            "name surname subjects"
        )

        .populate(
            "learners",
            "name surname grade school username"
        );


        console.log(
            "Tutor Classes:",
            classes
        );


        res.json(classes);


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message: "Could not fetch tutor classes",

            error: error.message

        });

    }

});



// =====================================
// LEARNER JOINS CLASS
// =====================================

router.put("/:id/join", async (req, res) => {

    try {

        const {
            learnerId
        } = req.body;


        if (!learnerId) {

            return res.status(400).json({

                message: "Learner ID is missing"

            });

        }


        const updatedClass =
            await Class.findByIdAndUpdate(

                req.params.id,

                {

                    $addToSet: {

                        learners: learnerId

                    }

                },

                {

                    new: true

                }

            )

            .populate(
                "tutorId",
                "name surname subjects"
            )

            .populate(
                "learners",
                "name surname grade school username"
            );


        if (!updatedClass) {

            return res.status(404).json({

                message: "Class not found"

            });

        }


        res.json({

            message: "Joined class successfully 🚀",

            class: updatedClass

        });


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message: "Could not join class",

            error: error.message

        });

    }

});



// =====================================
// GET SINGLE CLASSROOM WITH ASSIGNMENTS
// =====================================

router.get("/:id", async (req, res) => {

    try {

        const classroom =
            await Class.findById(req.params.id)

            .populate(
                "tutorId",
                "name surname subjects"
            )

            .populate(
                "learners",
                "name surname grade school username"
            );


        if (!classroom) {

            return res.status(404).json({

                message: "Class not found"

            });

        }


        const assignments =
            await Assignment.find({

                classId: req.params.id

            })

            .sort({

                createdAt: -1

            });


        res.json({

            ...classroom.toObject(),

            assignments

        });


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message: "Could not fetch classroom",

            error: error.message

        });

    }

});



// =====================================
// DELETE CLASS
// =====================================

router.delete("/:id", async (req, res) => {

    try {

        const {
            tutorId
        } = req.body;


        // =====================================
        // MAKE SURE TUTOR ID WAS PROVIDED
        // =====================================

        if (!tutorId) {

            return res.status(400).json({

                message: "Tutor ID is missing"

            });

        }


        // =====================================
        // FIND THE CLASS
        // =====================================

        const classroom =
            await Class.findById(req.params.id);


        if (!classroom) {

            return res.status(404).json({

                message: "Class not found"

            });

        }


        // =====================================
        // MAKE SURE THIS TUTOR OWNS THE CLASS
        // =====================================

        if (
            classroom.tutorId.toString()
            !==
            tutorId.toString()
        ) {

            return res.status(403).json({

                message:
                    "You are not allowed to delete this class"

            });

        }


        // =====================================
        // DELETE CLASS
        // =====================================

        await Class.findByIdAndDelete(
            req.params.id
        );


        res.json({

            message:
                "Class deleted successfully 🗑️"

        });


    } catch (error) {

        console.log(
            "Delete class error:",
            error
        );


        res.status(500).json({

            message:
                "Could not delete class",

            error:
                error.message

        });

    }

});



// =====================================
// ADD ANNOUNCEMENT
// =====================================

router.put("/:id/announcement", async (req, res) => {

    try {

        const {
            title,
            message
        } = req.body;


        const updatedClass =
            await Class.findByIdAndUpdate(

                req.params.id,

                {

                    $push: {

                        announcements: {

                            title: title,

                            message: message

                        }

                    }

                },

                {

                    new: true

                }

            )

            .populate(
                "tutorId",
                "name surname subjects"
            )

            .populate(
                "learners",
                "name surname grade school username"
            );


        res.json({

            message: "Announcement added 🚀",

            class: updatedClass

        });


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message: "Could not add announcement"

        });

    }

});



// =====================================
// DELETE ANNOUNCEMENT
// =====================================

router.delete(
    "/:id/announcement/:announcementId",
    async (req, res) => {

        try {

            const updatedClass =
                await Class.findByIdAndUpdate(

                    req.params.id,

                    {

                        $pull: {

                            announcements: {

                                _id:
                                    req.params.announcementId

                            }

                        }

                    },

                    {

                        new: true

                    }

                )

                .populate(
                    "tutorId",
                    "name surname subjects"
                )

                .populate(
                    "learners",
                    "name surname grade school username"
                );


            if (!updatedClass) {

                return res.status(404).json({

                    message:
                        "Classroom not found"

                });

            }


            res.json({

                message:
                    "Announcement deleted successfully 🗑️",

                class:
                    updatedClass

            });


        } catch (error) {

            console.log(
                "Delete announcement error:",
                error
            );


            res.status(500).json({

                message:
                    "Could not delete announcement",

                error:
                    error.message

            });

        }

    }
);


module.exports = router;

