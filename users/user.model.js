const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    username: { type: String, unique: true, required: [true, 'UserName is required'] },
    hash: { type: String, required: [true, 'Password is required'] },
    firstName: { type: String, required: [true, 'First Name is required'] },
    lastName: { type: String, required: [true, 'Last Name is required'] },
    role: { type: String, default: 'user' },
    preferWorkHrs: { type: Number },
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', schema);