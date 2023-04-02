const mongoose = require('mongoose');
    
const Schema = mongoose.Schema;
const accessSchema = new Schema({
    id : {
        required : true,
        type : String
    }, 
    time : {
        required : true, 
        type : String,
    }
})


module.exports = mongoose.model('access', accessSchema)