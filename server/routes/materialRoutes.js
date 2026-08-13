const express = require("express");

const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const Material = require("../models/Material");
const Class = require("../models/Class");


// ==============================
// MULTER STORAGE CONFIGURATION
// ==============================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, "uploads/materials");

    },

    filename: (req, file, cb) => {

        cb(

            null,

            Date.now() + "-" + file.originalname

        );

    }

});



const upload = multer({

    storage: storage,

    fileFilter: (req, file, cb) => {

        const allowedTypes = [

            "application/pdf",

            "application/msword",

            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

            "application/vnd.ms-powerpoint",

            "application/vnd.openxmlformats-officedocument.presentationml.presentation",

            "image/jpeg",

            "image/png"

        ];



        if (allowedTypes.includes(file.mimetype)) {

            cb(null, true);

        } else {

            cb(

                new Error("File type not allowed"),

                false

            );

        }

    }

});



// =====================================
// UPLOAD MATERIAL
// =====================================

router.post(

    "/upload",

    upload.single("file"),

    async (req, res) => {

        try {

            const {

                title,

                description,

                classId,

                uploadedBy

            } = req.body;



            if (!req.file) {

                return res.status(400).json({

                    message: "No file uploaded"

                });

            }



            // Create new material

            const material = new Material({

                title,

                description,

                file: `uploads/materials/${req.file.filename}`,

                classId,

                uploadedBy

            });



            await material.save();



            // Add material to classroom

            const classroom = await Class.findById(classId);

            if (!classroom) {

                return res.status(404).json({

                    message: "Classroom not found"

                });

            }



            classroom.materials.push({

            title: material.title,

            description: material.description,

            file: material.file,

            createdAt: material.createdAt

});

            await classroom.save();



            res.status(201).json({

                message: "Material uploaded successfully 🚀",

                material

            });

        } catch (error) {

            console.log(error);



            res.status(500).json({

                message: "Could not upload material"

            });

        }

    }

);


// =====================================
// DELETE MATERIAL
// =====================================

router.delete("/:id", async (req, res) => {

    try {

        const material = await Material.findById(
            req.params.id
        );


        if (!material) {

            return res.status(404).json({

                message: "Material not found"

            });

        }


        // =====================================
        // DELETE PHYSICAL FILE
        // =====================================

        if (material.file) {

            const filePath = path.join(
                __dirname,
                "..",
                material.file
            );


            if (fs.existsSync(filePath)) {

                fs.unlinkSync(filePath);

            }

        }


        // =====================================
        // REMOVE FROM MATERIAL COLLECTION
        // =====================================

        await Material.findByIdAndDelete(
            req.params.id
        );


        // =====================================
        // REMOVE FROM CLASSROOM
        // =====================================

        await Class.findByIdAndUpdate(

            material.classId,

            {
                $pull: {
                    materials: {
                        file: material.file
                    }
                }
            }

        );


        res.json({

            message: "Material deleted successfully 🗑️"

        });


    } catch (error) {

        console.log(
            "Delete material error:",
            error
        );


        res.status(500).json({

            message: "Could not delete material",

            error: error.message

        });

    }

});

module.exports = router;