const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");


// =====================================================
// ADMIN LOGIN
// =====================================================

router.post("/login", async (req, res) => {

    try {

        const {
            username,
            password
        } = req.body;


        // =============================================
        // VALIDATION
        // =============================================

        if (
            !username ||
            !password
        ) {

            return res.status(400).json({

                message:
                    "Username and password are required."

            });

        }


        // =============================================
        // FIND ADMIN
        // =============================================

        const admin =
            await Admin.findOne({

                username:
                    username.trim()

            });


        if (!admin) {

            return res.status(401).json({

                message:
                    "Invalid username or password."

            });

        }


        // =============================================
        // CHECK PASSWORD
        // =============================================

        const passwordCorrect =
            await bcrypt.compare(

                password,

                admin.passwordHash

            );


        if (!passwordCorrect) {

            return res.status(401).json({

                message:
                    "Invalid username or password."

            });

        }


        // =============================================
        // LOGIN SUCCESS
        // =============================================

        res.json({

            message:
                "Login successful.",

            username:
                admin.username

        });


    } catch (error) {

        console.log(
            "Admin login error:",
            error
        );


        res.status(500).json({

            message:
                "Could not login."

        });

    }

});



// =====================================================
// CHANGE ADMIN LOGIN
// =====================================================

router.put("/change-login", async (req, res) => {

    try {

        const {
            currentPassword,
            newUsername,
            newPassword
        } = req.body;


        // =============================================
        // VALIDATION
        // =============================================

        if (
            !currentPassword ||
            !newUsername ||
            !newPassword
        ) {

            return res.status(400).json({

                message:
                    "All fields are required."

            });

        }


        if (
            newPassword.length < 5
        ) {

            return res.status(400).json({

                message:
                    "New password must be at least 5 characters."

            });

        }


        // =============================================
        // GET ADMIN
        // =============================================

        const admin =
            await Admin.findOne();


        if (!admin) {

            return res.status(404).json({

                message:
                    "Admin account not found."

            });

        }


        // =============================================
        // CHECK CURRENT PASSWORD
        // =============================================

        const passwordCorrect =
            await bcrypt.compare(

                currentPassword,

                admin.passwordHash

            );


        if (!passwordCorrect) {

            return res.status(401).json({

                message:
                    "Current password is incorrect."

            });

        }


        // =============================================
        // CHECK NEW USERNAME
        // =============================================

        const cleanedUsername =
            newUsername.trim();


        if (!cleanedUsername) {

            return res.status(400).json({

                message:
                    "New username cannot be empty."

            });

        }


        const existingAdmin =
            await Admin.findOne({

                username:
                    cleanedUsername,

                _id: {
                    $ne:
                        admin._id
                }

            });


        if (existingAdmin) {

            return res.status(409).json({

                message:
                    "That username is already being used."

            });

        }


        // =============================================
        // HASH NEW PASSWORD
        // =============================================

        const newPasswordHash =
            await bcrypt.hash(

                newPassword,

                10

            );


        // =============================================
        // UPDATE ADMIN
        // =============================================

        admin.username =
            cleanedUsername;

        admin.passwordHash =
            newPasswordHash;


        await admin.save();


        // =============================================
        // RESPONSE
        // =============================================

        res.json({

            message:
                "Admin login changed successfully 🚀",

            username:
                admin.username

        });


    } catch (error) {

        console.log(
            "Change admin login error:",
            error
        );


        res.status(500).json({

            message:
                "Could not change admin login."

        });

    }

});


module.exports = router;