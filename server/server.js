require("dotenv").config();
const lessonRoutes = require("./routes/lessonRoutes");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const learnerRoutes = require("./routes/learnerRoutes");
const tutorRoutes = require("./routes/tutorRoutes");
const classRoutes = require("./routes/classRoutes");
const path = require("path");
const app = express();
const tutorPaymentRoutes =
    require("./routes/tutorPaymentRoutes");
const programRoutes = require("./routes/programRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reportRoutes = require("./routes/reportRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const platformSettingsRoutes = require("./routes/platformSettingsRoutes");
const ownerPaymentRoutes = require("./routes/ownerPaymentRoutes");
const adminAuthRoutes =
    require("./routes/adminAuthRoutes");
// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully 🚀");
  })
  .catch((error) => {
    console.log("MongoDB connection failed:");
    console.log(error);
  });


// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.urlencoded({ extended:true }));

app.use(
    "/api/admin-auth",
    adminAuthRoutes
);
// Learner Routes
app.use("/api/learners", learnerRoutes);


// Tutor Routes
app.use("/api/tutors", tutorRoutes);


app.use("/api/reports", reportRoutes);


// Class Routes
app.use("/api/classes", classRoutes);


app.use("/api/admin", adminRoutes);


app.use("/api/payments", paymentRoutes);
app.use(
    "/api/platform-settings",
    platformSettingsRoutes
);
app.use(
    "/api/tutor-payments",
    tutorPaymentRoutes
);
app.use("/api/programs", programRoutes);
app.use("/api/lessons", lessonRoutes);

app.use("/api/materials", require("./routes/materialRoutes"));

app.use(
    "/api/owner-payments",
    ownerPaymentRoutes
);
// Assignment Routes
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("TutorHub Backend is running 🚀");
});


// Server port
const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});