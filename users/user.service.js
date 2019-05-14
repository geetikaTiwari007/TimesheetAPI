const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const User = db.User;

module.exports = {
    authenticate,
    changePassword,
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    lookupUser,
    updateUserPatch,
    findByUserName
};

async function authenticate({ username, password }) {
    const user = await User.findOne({ username });
    if (user && bcrypt.compareSync(password, user.hash)) {
        const { hash, ...userWithoutHash } = user.toObject();
        const token = jwt.sign({ sub: user.id, role: user.role }, config.secret, { expiresIn: '2h' });
        return {
            ...userWithoutHash,
            token
        };
    }
}

async function changePassword(id, params) {
    const user = await User.findOne({ _id: id });
    if (user && bcrypt.compareSync(params.oldPassword, user.hash)) {
        params.password = params.newPassword;
        delete params.oldPassword;
        delete params.newPassword;
        updateUserPatch(id, params);
    } else {
        throw 'Old Username is not correct';
    }

}

async function getAll() {
    return await User.find().sort({updatedDate: -1}).select('-hash');
}

async function getById(id) {
    return await User.findById(id);
}

async function create(userParam) {
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

async function update(id, userParam) {
    const user = await User.findById(id);

    // validate
    if (!user) throw 'User not found';
    if (user.username !== userParam.username && await User.findOne({ username: userParam.username })) {
        throw 'Username "' + userParam.username + '" is already taken';
    }

    // hash password if it was entered
    if (userParam.password && userParam.password != '') {
        userParam.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // copy userParam properties to user
    Object.assign(user, userParam);

    await user.save();
}

async function _delete(id) {
    await User.findByIdAndRemove(id);
}

async function lookupUser(id) {
    return await User.find({ username: { $regex: new RegExp(id), $options: 'i' } }).select('-hash');
}

async function findByUserName(name) {
    return await User.find({ username: name}).select('-hash');
}


async function updateUserPatch(id, userParam) {
    const user = await User.findById(id);

    // validate
    if (!user) throw 'User not found';

    // hash password if it was entered
    if (userParam.password) {
        userParam.hash = bcrypt.hashSync(userParam.password, 10);
    }
    //var id = userParam.id;
    if (userParam._id) {
        delete userParam._id;
    }

    if (userParam.id) {
        delete userParam.id;
    }

    await User.updateOne({ _id: id }, { $set: userParam });
}



