require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");


// =====================================================
// ROUTES
// =====================================================

const lessonRoutes =
    require("./routes/lessonRoutes");

const learnerRoutes =
    require("./routes/learnerRoutes");

const tutorRoutes =
    require("./routes/tutorRoutes");

const classRoutes =
    require("./routes/classRoutes");

const tutorPaymentRoutes =
    require("./routes/tutorPaymentRoutes");

const programRoutes =
    require("./routes/programRoutes");

const adminRoutes =
    require("./routes/adminRoutes");

const paymentRoutes =
    require("./routes/paymentRoutes");

const reportRoutes =
    require("./routes/reportRoutes");

const assignmentRoutes =
    require("./routes/assignmentRoutes");

const submissionRoutes =
    require("./routes/submissionRoutes");

const platformSettingsRoutes =
    require("./routes/platformSettingsRoutes");

const ownerPaymentRoutes =
    require("./routes/ownerPaymentRoutes");

const adminAuthRoutes =
    require("./routes/adminAuthRoutes");


// =====================================================
// APP
// =====================================================

const app =
    express();


// =====================================================
// SECURITY CHECK
// =====================================================

if (!process.env.JWT_SECRET) {

    console.error(
        "❌ JWT_SECRET is missing from .env"
    );

    process.exit(1);

}


// =====================================================
// MONGODB
// =====================================================

mongoose.connect(
    process.env.MONGO_URI
)
.then(() => {

    console.log(
        "MongoDB connected successfully 🚀"
    );

})
.catch((error) => {

    console.log(
        "MongoDB connection failed:"
    );

    console.log(error);

});


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
    cors()
);

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended:
            true
    })
);


// =====================================================
// UPLOADS
// =====================================================

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);


// =====================================================
// ADMIN AUTH
// =====================================================

app.use(
    "/api/admin-auth",
    adminAuthRoutes
);


// =====================================================
// LEARNER
// =====================================================

app.use(
    "/api/learners",
    learnerRoutes
);


// =====================================================
// TUTOR
// =====================================================

app.use(
    "/api/tutors",
    tutorRoutes
);


// =====================================================
// REPORTS
// =====================================================

app.use(
    "/api/reports",
    reportRoutes
);


// =====================================================
// CLASSES
// =====================================================

app.use(
    "/api/classes",
    classRoutes
);


// =====================================================
// ADMIN
// =====================================================

app.use(
    "/api/admin",
    adminRoutes
);


// =====================================================
// PAYMENTS
// =====================================================

app.use(
    "/api/payments",
    paymentRoutes
);


// =====================================================
// PLATFORM SETTINGS
// =====================================================

app.use(
    "/api/platform-settings",
    platformSettingsRoutes
);


// =====================================================
// TUTOR PAYMENTS
// =====================================================

app.use(
    "/api/tutor-payments",
    tutorPaymentRoutes
);


// =====================================================
// PROGRAMS
// =====================================================

app.use(
    "/api/programs",
    programRoutes
);


// =====================================================
// LESSONS
// =====================================================

app.use(
    "/api/lessons",
    lessonRoutes
);


// =====================================================
// MATERIALS
// =====================================================

app.use(
    "/api/materials",
    require("./routes/materialRoutes")
);


// =====================================================
// OWNER PAYMENTS
// =====================================================

app.use(
    "/api/owner-payments",
    ownerPaymentRoutes
);


// =====================================================
// ASSIGNMENTS
// =====================================================

app.use(
    "/api/assignments",
    assignmentRoutes
);


// =====================================================
// SUBMISSIONS
// =====================================================

app.use(
    "/api/submissions",
    submissionRoutes
);


// =====================================================
// TEST ROUTE
// =====================================================

app.get(
    "/",
    (req, res) => {

        res.send(
            "TutorHub Backend is running 🚀"
        );

    }
);


// =====================================================
// SERVER
// =====================================================

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);