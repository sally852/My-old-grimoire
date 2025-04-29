const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const usertSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

usertSchema.plugin(uniqueValidator); 

module.exports = mongoose.model('user' , usertSchema)
