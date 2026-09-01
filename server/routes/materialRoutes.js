
const express = require("express");

const router = express.Router();

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { v2: cloudinary } = require("cloudinary");

const Material = require("../models/Material");
const Class = require("../models/Class");


// =====================================================
// CLOUDINARY CONFIGURATION
// =====================================================

cloudinary.config({

    cloud_name:
        process.env.CLOUDINARY_CLOUD_NAME,

    api_key:
        process.env.CLOUDINARY_API_KEY,

    api_secret:
        process.env.CLOUDINARY_API_SECRET

});


// =====================================================
// CLOUDINARY STORAGE
// =====================================================

const storage =
    new CloudinaryStorage({

        cloudinary,

        params: {

            folder:
                "tutorhub/materials",

            resource_type:
                "auto",

            allowed_formats: [

                "pdf",

                "doc",

                "docx",

                "ppt",

                "pptx",

                "jpg",

                "jpeg",

                "png"

            ]

        }

    });


// =====================================================
// MULTER
// =====================================================

const upload =
    multer({

        storage

    });


// =====================================================
// UPLOAD MATERIAL
// =====================================================

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


            // =================================================
            // CHECK FILE
            // =================================================

            if (!req.file) {

                return res.status(400).json({

                    message:
                        "No file uploaded"

                });

            }


            // =================================================
            // CHECK CLASSROOM
            // =================================================

            const classroom =
                await Class.findById(classId);


            if (!classroom) {

                // Delete uploaded Cloudinary file
                // if classroom does not exist

                if (req.file.filename) {

                    try {

                        await cloudinary.uploader.destroy(

                            req.file.filename,

                            {
                                resource_type:
                                    req.file.resource_type ||
                                    "image"
                            }

                        );

                    } catch (deleteError) {

                        console.log(
                            "Cloudinary cleanup error:",
                            deleteError
                        );

                    }

                }


                return res.status(404).json({

                    message:
                        "Classroom not found"

                });

            }


            // =================================================
            // CREATE MATERIAL
            // =================================================

            const material =
                new Material({

                    title,

                    description,

                    // Cloudinary URL
                    file:
                        req.file.path,

                    classId,

                    uploadedBy

                });


            await material.save();


            // =================================================
            // ADD MATERIAL TO CLASSROOM
            // =================================================

            classroom.materials.push({

                title:
                    material.title,

                description:
                    material.description,

                file:
                    material.file,

                createdAt:
                    material.createdAt

            });


            await classroom.save();


            // =================================================
            // SUCCESS
            // =================================================

            res.status(201).json({

                message:
                    "Material uploaded successfully 🚀",

                material

            });

        } catch (error) {

            console.log(
                "Material upload error:",
                error
            );


            // =================================================
            // CLEANUP CLOUDINARY FILE IF DATABASE SAVE FAILS
            // =================================================

            if (req.file?.filename) {

                try {

                    await cloudinary.uploader.destroy(

                        req.file.filename,

                        {
                            resource_type:
                                req.file.resource_type ||
                                "image"
                        }

                    );

                } catch (cleanupError) {

                    console.log(
                        "Cloudinary cleanup error:",
                        cleanupError
                    );

                }

            }


            res.status(500).json({

                message:
                    "Could not upload material",

                error:
                    error.message

            });

        }

    }

);


// =====================================================
// DELETE MATERIAL
// =====================================================

router.delete(

    "/:id",

    async (req, res) => {

        try {

            // =================================================
            // FIND MATERIAL
            // =================================================

            const material =
                await Material.findById(
                    req.params.id
                );


            if (!material) {

                return res.status(404).json({

                    message:
                        "Material not found"

                });

            }


            // =================================================
            // DELETE FROM CLOUDINARY
            // =================================================

            if (material.file) {

                try {

                    const cloudinaryUrl =
                        material.file;


                    // Extract public ID from Cloudinary URL
                    //
                    // Example:
                    // https://res.cloudinary.com/demo/
                    // raw/upload/v123/tutorhub/materials/file.pdf
                    //
                    // We remove the extension because
                    // Cloudinary destroy expects the public ID.

                    const uploadMarker =
                        "/upload/";


                    const uploadIndex =
                        cloudinaryUrl.indexOf(
                            uploadMarker
                        );


                    if (uploadIndex !== -1) {

                        let publicId =
                            cloudinaryUrl.substring(

                                uploadIndex +
                                uploadMarker.length

                            );


                        // Remove version
                        if (
                            publicId.startsWith("v") &&
                            publicId.includes("/")
                        ) {

                            publicId =
                                publicId.substring(
                                    publicId.indexOf("/") + 1
                                );

                        }


                        // Remove file extension
                        publicId =
                            publicId.replace(
                                /\.[^/.]+$/,
                                ""
                            );


                        await cloudinary.uploader.destroy(

                            publicId,

                            {

                                resource_type:
                                    material.file.includes(
                                        "/raw/upload/"
                                    )
                                        ? "raw"
                                        : "image"

                            }

                        );

                    }

                } catch (cloudinaryError) {

                    console.log(

                        "Cloudinary delete error:",

                        cloudinaryError

                    );

                }

            }


            // =================================================
            // DELETE FROM MATERIAL COLLECTION
            // =================================================

            await Material.findByIdAndDelete(

                req.params.id

            );


            // =================================================
            // REMOVE FROM CLASSROOM
            // =================================================

            await Class.findByIdAndUpdate(

                material.classId,

                {

                    $pull: {

                        materials: {

                            file:
                                material.file

                        }

                    }

                }

            );


            // =================================================
            // SUCCESS
            // =================================================

            res.json({

                message:
                    "Material deleted successfully 🗑️"

            });

        } catch (error) {

            console.log(

                "Delete material error:",

                error

            );


            res.status(500).json({

                message:
                    "Could not delete material",

                error:
                    error.message

            });

        }

    }

);


module.exports = router;

