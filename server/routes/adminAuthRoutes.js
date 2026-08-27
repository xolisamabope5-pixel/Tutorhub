const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");


// =====================================================
// CREATE ADMIN JWT
// =====================================================

const createAdminToken = (admin) => {

    return jwt.sign(
        {
            id: admin._id.toString(),
            username: admin.username,
            role: "admin"
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );

};


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
        // CREATE JWT TOKEN
        // =============================================

        const token =
            createAdminToken(admin);


        // =============================================
        // LOGIN SUCCESS
        // =============================================

        res.json({

            message:
                "Login successful.",

            token,

            admin: {

                id:
                    admin._id,

                username:
                    admin.username,

                role:
                    "admin"

            }

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
// PROTECTED
// Only authenticated Admin can change Admin credentials.
// =====================================================

router.put(
    "/change-login",
    authenticate,
    authorizeRoles("admin"),
    async (req, res) => {

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
            // GET AUTHENTICATED ADMIN
            // =============================================
            // We use the ID from the verified JWT.
            // We do NOT trust an ID supplied by the frontend.

            const admin =
                await Admin.findById(
                    req.user.id
                );


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
            // CLEAN NEW USERNAME
            // =============================================

            const cleanedUsername =
                newUsername.trim();


            if (!cleanedUsername) {

                return res.status(400).json({

                    message:
                        "New username cannot be empty."

                });

            }


            // =============================================
            // CHECK NEW USERNAME
            // =============================================

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
            // CREATE NEW TOKEN
            // =============================================
            // The username inside the old token may now
            // be outdated, so issue a fresh token.

            const newToken =
                createAdminToken(admin);


            // =============================================
            // RESPONSE
            // =============================================

            res.json({

                message:
                    "Admin login changed successfully 🚀",

                username:
                    admin.username,

                token:
                    newToken

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

    }
);


module.exports = router;