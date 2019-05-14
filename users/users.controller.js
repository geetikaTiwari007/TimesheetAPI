const express = require('express');
const router = express.Router();
const userService = require('./user.service');
const timesheetService = require('../timesheet/timesheet.service');
const authorize = require('_helpers/authorize');
const Role = require('_helpers/role');

// routes
router.post('/authenticate', authenticate); //all can access
router.put('/changePassword/:id', authorize(), changePassword); //authenticated users only
router.post('/register', register); //all can access
router.get('/', authorize([Role.Admin, Role.Manager]), getAll); //admin and manager only
router.get('/current', getCurrent); //logged in user
router.get('/lookupUser/:text', authorize([Role.Admin, Role.Manager]), lookupUser); //logged in user
router.get('/findByUserName/:username', authorize([Role.Admin, Role.Manager]), findByUserName); //logged in user
router.get('/:id', authorize([Role.Admin, Role.Manager]), getById); //admin and manager
router.put('/:id', authorize(), update); //authenticated users only
router.patch('/:id', authorize(), updateUserPatch); //authenticated users only
router.delete('/:id', authorize([Role.Admin, Role.Manager]), _delete); //admin and manager


module.exports = router;

function authenticate(req, res, next) {
    userService.authenticate(req.body)
        .then(user => user ? res.json({ data: 1, result: user }) : res.status(400).json({ data: 0, message: 'Username or password is incorrect' }))
        .catch(err => next(err));
}

function register(req, res, next) {
    userService.create(req.body)
        .then(() => res.json({ data: 1, message: "User registered Successfully" }))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    userService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    userService.getById(req.user.sub)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    userService.getById(req.params.id)
        .then(user => user ? res.json({ user }) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    const currentUser = req.user;
    const id = req.params.id;
    // only allow admins and managers to access other user records
    if (id !== currentUser.sub && (currentUser.role !== Role.Admin && currentUser.role !== Role.Manager)) {
        return res.status(401).json({ data: 0, message: 'Unauthorized' });
    }
    userService.update(req.params.id, req.body)
        .then(() => res.json({ data: 1, message: "User Details updated Successfully" }))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    timesheetService.getByUserId(req.params.id)
    .then((data)=>{
        if(data){
            timesheetService.deleteByUserId(req.params.id)
            .then(()=>{
               
            }).catch(err => next(err));
        }
    }).catch(err => next(err));

    userService.delete(req.params.id)
    .then(() => res.json({ data: 1, message: "User Details deleted Successfully" }))
    .catch(err => next(err));
}

function lookupUser(req, res, next) {
    if (req.params.text != '') {
        userService.lookupUser(req.params.id)
            .then(user => user ? res.json(user) : res.sendStatus(404))
            .catch(err => next(err));
    } else {
        getAll();
    }

}

function findByUserName(req, res, next) {
    if (req.params.username != '') {
        userService.findByUserName(req.params.username)
            .then(user => user ? res.json(user) : res.sendStatus(404))
            .catch(err => next(err));
    } 

}

function updateUserPatch(req, res, next) {
    const currentUser = req.user;
    const id = req.params.id;
    // only allow admins and managers to access other user records
    if (id !== currentUser.sub && (currentUser.role !== Role.Admin && currentUser.role !== Role.Manager)) {
        return res.status(401).json({ data: 0, message: 'Unauthorized' });
    }
    userService.updateUserPatch(req.params.id, req.body)
        .then(() => res.json({ data: 1, message: "User Details updated Successfully" }))
        .catch(err => next(err));
}

function changePassword(req, res, next) {
    const currentUser = req.user;
    const id = req.params.id;
    if (id !== currentUser.sub) {
        return res.status(401).json({ data: 0, message: 'Unauthorized' });
    }

    userService.changePassword(id, req.body)
        .then(() => res.json({ data: 1, message: "Password changed Successfully" }))
        .catch(err => next(err));
}

