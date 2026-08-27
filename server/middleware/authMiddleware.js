const jwt = require("jsonwebtoken");


// =====================================================
// VERIFY JWT TOKEN
// =====================================================

const authenticate = (req, res, next) => {

    try {

        const authHeader =
            req.headers.authorization;


        // =============================================
        // CHECK AUTHORIZATION HEADER
        // =============================================

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({

                message:
                    "Authentication required."

            });

        }


        const token =
            authHeader.split(" ")[1];


        if (!token) {

            return res.status(401).json({

                message:
                    "Authentication token missing."

            });

        }


        // =============================================
        // VERIFY JWT
        // =============================================

        const decoded =
            jwt.verify(

                token,

                process.env.JWT_SECRET

            );


        // =============================================
        // STORE AUTHENTICATED USER
        // =============================================

        req.user =
            decoded;


        next();


    } catch (error) {

        console.log(
            "Authentication error:",
            error.message
        );


        return res.status(401).json({

            message:
                "Invalid or expired authentication token."

        });

    }

};


// =====================================================
// ROLE CHECK
// =====================================================

const authorizeRoles = (...roles) => {

    return (req, res, next) => {

        if (
            !req.user ||
            !roles.includes(req.user.role)
        ) {

            return res.status(403).json({

                message:
                    "You do not have permission to perform this action."

            });

        }


        next();

    };

};


// =====================================================
// ADMIN ONLY
// =====================================================

const requireAdmin = (
    req,
    res,
    next
) => {

    if (
        !req.user ||
        req.user.role !== "admin"
    ) {

        return res.status(403).json({

            message:
                "Admin access required."

        });

    }


    next();

};


// =====================================================
// TUTOR / OWNER ONLY
// =====================================================

const requireTutor = (
    req,
    res,
    next
) => {

    if (
        !req.user ||
        (
            req.user.role !== "teacher" &&
            req.user.role !== "owner"
        )
    ) {

        return res.status(403).json({

            message:
                "Tutor access required."

        });

    }


    next();

};


// =====================================================
// LEARNER ONLY
// =====================================================

const requireLearner = (
    req,
    res,
    next
) => {

    if (
        !req.user ||
        req.user.role !== "learner"
    ) {

        return res.status(403).json({

            message:
                "Learner access required."

        });

    }


    next();

};


// =====================================================
// CHECK USER OWNS RESOURCE
// =====================================================

const authorizeSelf = (
    req,
    res,
    next
) => {

    if (!req.user) {

        return res.status(401).json({

            message:
                "Authentication required."

        });

    }


    // Admin can access everything

    if (
        req.user.role === "admin"
    ) {

        return next();

    }


    // User can only access their own ID

    if (
        String(req.user.id) !==
        String(req.params.id)
    ) {

        return res.status(403).json({

            message:
                "You are not allowed to access this account."

        });

    }


    next();

};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    authenticate,

    verifyToken: authenticate,

    authorizeRoles,

    authorizeSelf,

    requireAdmin,

    requireTutor,

    requireLearner

};