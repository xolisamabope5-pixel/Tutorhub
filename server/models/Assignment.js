const mongoose = require("mongoose");


const assignmentSchema = new mongoose.Schema({


    classId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Class",

        required: true

    },


    tutorId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Tutor",

        required: true

    },


    title: {

        type: String,

        required: true

    },


    description: {

        type: String

    },


    dueDate: {

        type: Date,

        required: true

    },


    totalMarks: {

        type: Number,

        required: true

    },


    attachment: {

        type: String

    },


    questions: [

        {

            questionText: {

                type:String,

                required:true

            },


            marks: {

                type:Number,

                required:true

            }

        }

    ]



},


{

    timestamps:true

});



module.exports = mongoose.model(

    "Assignment",

    assignmentSchema

);