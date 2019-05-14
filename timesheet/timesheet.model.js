const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'User' },
	taskName: { type: String, required: [true, 'Task Name is required'] },
	dateWorked: { type: Date, default: Date.now },
	totalTime: { type: Schema.Types.Number },
	notes: { type: Array, default: [] },
	createdDate: { type: Date, default: Date.now },
	updatedDate: { type: Date, default: Date.now },
	createdBy: { type: String, required: true },
	updatedBy: { type: String, required: true }
}, { timestamps: false });

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Timesheet', schema);