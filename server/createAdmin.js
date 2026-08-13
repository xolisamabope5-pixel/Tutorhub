require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Admin = require("./models/Admin");


async function createAdmin() {

    try {

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            "MongoDB connected."
        );


        const existingAdmin =
            await Admin.findOne();


        if (existingAdmin) {

            console.log(
                "Admin account already exists."
            );

            process.exit();

        }


        const passwordHash =
            await bcrypt.hash(
                "12345",
                12
            );


        const admin =
            new Admin({

                username: "admin",

                passwordHash

            });


        await admin.save();


        console.log(
            "Admin account created successfully 🚀"
        );

        console.log(
            "Username: admin"
        );

        console.log(
            "Password: 12345"
        );


        process.exit();


    } catch (error) {

        console.log(
            "Could not create admin:"
        );

        console.log(error);

        process.exit(1);

    }

}


createAdmin();