const config = require('../config.json');
const db = require('./dbTest');
const User = db.User;
const Timesheet = db.Timesheet;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = {
    cleanDefaultUser,
    findByUserName,
    getTokenofLoggedInUser,
    createUser,
    getOtherTimesheetId
};


async function cleanDefaultUser(id) {
    await User.findByIdAndRemove(id);
}

async function findByUserName(name) {
    return await User.findOne({ "username": name }, { _id: 1 });
}

async function getTokenofLoggedInUser({ username, password }) {
    const user = await User.findOne({ username });
    if (user && bcrypt.compareSync(password, user.hash)) {
        //const { hash, ...userWithoutHash } = user.toObject();
        const token = jwt.sign({ sub: user.id, role: user.role }, config.secret, { expiresIn: '1h' });
        const id = user.id;
        return {
            //...userWithoutHash,
            token,
            id
        };
    }
}

async function createUser(userParam) {
    // validate
    if (await User.findOne({ username: userParam.username })) {
        throw 'Username "' + userParam.username + '" is already taken';
    }

    const user = new User(userParam);
    user.createdBy = userParam.username;
    user.updatedBy = userParam.username;
    // hash password
    if (userParam.password) {
        user.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // save user
    await user.save();
}

async function getOtherTimesheetId(id) {
    return await Timesheet.findOne({ userId: { $ne: id } }, { _id: 1, taskName: 1, totalTime: 1, dateWorked: 1, notes: 1, createdBy: 1, updatedBy: 1 });
}




