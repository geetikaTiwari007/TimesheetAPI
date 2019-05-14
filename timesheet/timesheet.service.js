const db = require('_helpers/db');
const Timesheet = db.Timesheet;
const User = db.User;

module.exports = {
	create,
	getAll,
	getByUserId,
	getTimesheetByDates,
	update,
	delete: _delete,
	findUserId,
	getTimesheetById,
	getTimesheetByIdAndUserId,
	deleteByUserId

};

async function create(userTaskParam) {
	if (await User.findOne({ _id: userTaskParam.userId })) {
		const timesheet = new Timesheet(userTaskParam);

		// save user's timesheet details
		await timesheet.save();

	}
}

async function getAll() {
	return await Timesheet.aggregate([
		{ 	$sort : { 
			"updatedDate": -1 
			} 
		},
		{
			$lookup: {
				from: "users",
				localField: "userId",
				foreignField: "_id",
				as: "user_details"
			}
		},
		{
			$project: {
				"user_details.hash": 0
			}
		}
		
	]);
}

async function getByUserId(id) {
	return await Timesheet.find({ userId: id });
}

async function getTimesheetById(id) {
	return await Timesheet.findOne({ _id: id }, { _id: 1, taskName: 1, totalTime: 1, dateWorked: 1, notes: 1, createdBy: 1, updatedBy: 1 });
}

async function getTimesheetByIdAndUserId(id, userId) {
	return await Timesheet.findOne({ userId: userId, _id: id }, { _id: 0, __v: 0, createdDate: 0, updatedDate: 0 });
}


async function getTimesheetByDates(id, fromDate, toDate) {
	var fromDate = new Date(fromDate).toISOString();
	var toDate = new Date(toDate).toISOString();
	if (id !== '') {
		return await Timesheet.find({ userId: id, dateWorked: { $gte: fromDate, $lte: toDate } });
	} else {
		return await Timesheet.aggregate([
			{
				$match: {
					dateWorked: {
						$gte: new Date(fromDate),
						$lte: new Date(toDate)
					}
				}
			},
			{
				$lookup: {
					from: "users",
					localField: "userId",
					foreignField: "_id",
					as: "user_details"
				}
			},
			{
				$project: {
					"user_details.hash": 0
				}
			}
		]);

	}
}

async function update(id, timesheetParam) {
	const timesheet = await Timesheet.findById(id);

	// validate
	if (!timesheet) throw 'Timesheet Item not found';

	// copy timesheet properties to timesheet
	Object.assign(timesheet, timesheetParam);

	await timesheet.save();
}

async function _delete(id) {
	await Timesheet.findByIdAndRemove(id);
}

async function deleteByUserId(userid) {
	await Timesheet.deleteMany({userId : userid});
}

async function findUserId(userId, id) {
	return await Timesheet.find({ userId: userId, _id: id }, { _id: 1 });
}

