const mongoose = require("mongoose");



const tutorSchema = new mongoose.Schema({



    name: {

        type:String,

        required:true

    },



    surname: {

        type:String,

        required:true

    },



    email: {

        type:String,

        required:true,

        unique:true

    },





    username: {

        type:String,

        required:true,

        unique:true

    },





    password: {

        type:String,

        required:true

    },







    subjects: {

        type:String,

        required:true

    },








    // Tuition centre connection

    programId: {

        type:mongoose.Schema.Types.ObjectId,

        ref:"Program",

        default:null

    },







    // Owner manages tuition
    // Teacher only teaches

    role: {

        type:String,

        enum:[

            "owner",

            "teacher"

        ],

        default:"teacher"

    },








    // TutorHub admin approval

    status: {

        type:String,

        enum:[

            "Pending",

            "Approved",

            "Blocked"

        ],

        default:"Pending"

    },









    // Learners pay tutor directly

    bankName: {

        type:String,

        default:""

    },





    accountHolder: {

        type:String,

        default:""

    },





    accountNumber: {

        type:String,

        default:""

    },








    // TutorHub monthly subscription

    subscriptionStatus: {

        type:String,

        enum:[

            "Pending",

            "Paid",

            "Overdue"

        ],

        default:"Pending"

    },







    subscriptionDueDate: {

        type:Date,

        default:null

    },

// TutorHub subscription payment proof

tutorhubPaymentProof: {

    type: String,

    default: ""

},




    // Owner can block teaching access later

    accountStatus: {

        type:String,

        enum:[

            "Active",

            "Blocked"

        ],

        default:"Active"

    }




},{

    timestamps:true

});







module.exports = mongoose.model(

    "Tutor",

    tutorSchema

);