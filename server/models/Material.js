const mongoose = require("mongoose");


const MaterialSchema = new mongoose.Schema({

    title:{
        type:String,
        required:true
    },


    description:{
        type:String,
        required:true
    },


    file:{
        type:String,
        required:true
    },


    classId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Class",
        required:true
    },


    uploadedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Tutor",
        required:true
    },


    createdAt:{
        type:Date,
        default:Date.now
    }


});


module.exports = mongoose.model(
    "Material",
    MaterialSchema
);