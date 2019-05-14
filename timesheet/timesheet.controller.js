const express = require('express');
const router = express.Router();
const timesheetService = require('./timesheet.service');
const authorize = require('_helpers/authorize');
const Role = require('_helpers/role');

// routes
router.post('/createTimesheet', createTimesheet); //authenticated user can access
router.get('/', authorize(Role.Admin), getAllTimesheet); //admin only
router.get('/current', getCurrentUserTimesheet); //logged in user
router.get('/filterByDates', getTimesheetByDates); //logged in user
router.get('/:id', getTimesheetById); //admin and authenticated users only
router.put('/:id', authorize(), updateTimesheet); //authenticated users only
router.delete('/:id', authorize(), _delete); //authenticated users only

module.exports = router;

function createTimesheet(req, res, next) {
    const currentUser = req.user;
    const id = req.body.userId;

    if (id !== currentUser.sub && currentUser.role !== Role.Admin) {
        return res.status(401).json({ data: 0, message: 'Unauthorized' });
    }
    timesheetService.create(req.body)
        .then(() => res.json({ data: 1, message: "Timesheet Details Saved Successfully" }))
        .catch(err => next(err));
}

function getAllTimesheet(req, res, next) {
    timesheetService.getAll()
        .then(timesheet => res.json({ timesheet }))
        .catch(err => next(err));
}

function getCurrentUserTimesheet(req, res, next) {
    timesheetService.getByUserId(req.user.sub)
        .then(timesheet => timesheet ? res.json({ timesheet }) : res.sendStatus(404))
        .catch(err => next(err));
}

function getTimesheetByDates(req, res, next) {
    const currentUser = req.user;
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;

    var id = req.user.sub;
    if (req.query.All === "true" && currentUser.role === Role.Admin) {
        id = '';
    }

    timesheetService.getTimesheetByDates(id, fromDate, toDate)
        .then(timesheet => timesheet ? res.json({ timesheet }) : res.sendStatus(404))
        .catch(err => next(err));
}

function getTimesheetById(req, res, next) {
    const currentUser = req.user;

    if (currentUser.role == Role.Admin) {
        timesheetService.getTimesheetById(req.params.id)
            .then(timesheet => timesheet ? res.json({ timesheet }) : res.sendStatus(404))
            .catch(err => next(err));
    } else {
        timesheetService.getTimesheetByIdAndUserId(req.params.id, currentUser.sub)
            .then(timesheet => timesheet ? res.json({ timesheet }) : res.sendStatus(404))
            .catch(err => next(err));
    }

}

function updateTimesheet(req, res, next) {
    const currentUser = req.user;
    const id = req.body.userId;

    // only allow admins and managers to access other user records
    if (id !== currentUser.sub && currentUser.role !== Role.Admin) {
        return res.status(401).json({ data: 0, message: 'Unauthorized' });
    }

    timesheetService.update(req.params.id, req.body)
        .then(() => res.json({ data: 1, message: "Timesheet Details updated Successfully" }))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    const currentUser = req.user;
    // only allow admins to access other user records
    if (currentUser.role !== Role.Admin) {
        timesheetService.findUserId(currentUser.sub, req.params.id)
            .then((timesheet) => {
                if (!isEmpty(timesheet)) {
                    timesheetService.delete(req.params.id)
                        .then(() => res.json({ data: 1, message: "Timesheet Details deleted Successfully" }))
                        .catch(err => next(err));
                } else {
                    return res.status(401).json({ data: 0, message: 'Unauthorized User' });
                }
            }).catch(err => next(err));
    } else {
        timesheetService.delete(req.params.id)
            .then(() => res.json({ data: 1, message: "Timesheet Details deleted Successfully" }))
            .catch(err => next(err));
    }

    function isEmpty(obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key))
                return false;
        }
        return true;
    }

}





