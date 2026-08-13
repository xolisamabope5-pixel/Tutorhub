const mongoose = require("mongoose");


const classSchema = new mongoose.Schema({


    tutorId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Tutor",

        required: true

    },
    programId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Program",

        required:true

    },


    grade: {

        type:String,

        required:true

    },


    className: {

        type: String,

        required: true

    },



    subject: {

        type: String,

        required: true

    },



    description: {

        type: String

    },



    learners: [

        {

            type: mongoose.Schema.Types.ObjectId,

            ref: "Learner"

        }

    ],




    announcements: [

        {

            title: {

                type: String,

                required: true

            },


            message: {

                type: String,

                required: true

            },


            createdAt: {

                type: Date,

                default: Date.now

            }

        }

    ],






    materials: [

        {

            title: {

                type: String,

                required: true

            },


            description: {

                type: String

            },


            file: {

                type: String

            },


            createdAt: {

                type: Date,

                default: Date.now

            }

        }

    ],






    assignments: [

        {

            title: {

                type: String,

                required: true

            },


            description: {

                type: String

            },


            dueDate: {

                type: Date

            },


            createdAt: {

                type: Date,

                default: Date.now

            }

        }

    ],







    lessons: [

        {

            title: {

                type: String,

                required: true

            },


            date: {

                type: Date

            },


            link: {

                type: String

            },


            recording: {

                type: String

            },


            createdAt: {

                type: Date,

                default: Date.now

            }

        }

    ]



},


{

    timestamps:true

});



module.exports = mongoose.model(

    "Class",

    classSchema

);