process.env.NODE_ENV = 'test';

const commonHelp = require('./commonHelp');
let mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = 'http://localhost:4000';
let should = chai.should();
let expect = chai.expect;

chai.use(chaiHttp);

let login_details = {
  'username': 'adinathJain',
  'password': 'Admin123'
}

let register_details = {
  'username': 'adinathJain',
  'password': 'Admin123',
  'firstName': 'Adinath',
  'lastName': 'Jain',
  'role': 'admin',
  'preferWorkHrs': 8,
  "createdDate": "04-05-2019",
  "updatedDate": "04-05-2019",
  "createdBy": "test",
  "updatedBy": "test"
};

let crud_user_details = {
  'username': 'abhinandan',
  'password': 'Admin123',
  'firstName': 'Abhinandan',
  'lastName': 'Jain',
  'role': 'user',
  'preferWorkHrs': 8,
  "createdDate": "04-05-2019",
  "updatedDate": "04-05-2019",
  "createdBy": "test",
  "updatedBy": "test"
};

let crud_user_updatedetails = {
  'preferWorkHrs': 10,
  "updatedBy": "test"
};

let timesheet_details = {
  "_id": ObjectId("55153a8014829a865bbf700d"),
  "taskName": "Testing Mocha Chai Test Case",
  "dateWorked": "12-05-2019",
  "totalTime": 8,
  "notes": ["Writing the testcases", "Testing the output"],
  "createdBy": "test",
  "createdDate": "12-05-2019",
  "updatedBy": "test",
  "updatedDate": "12-05-2019"
};

let update_timesheet_details = {
  "totalTime": 10,
  "updatedBy": "test"
};

//Delete Test user function
async function deleteUser(username) {
  // Reset user mode before each test
  await commonHelp.findByUserName(username)
    .then((users) => {
      if (users && users._id) {
        commonHelp.cleanDefaultUser(users._id);
      }

    }).catch(err => { console.log(err); });
}

// Get Token function
async function getTokenofLoggedInUser(loginDetails) {
  // Reset user mode before each test
  return await commonHelp.getTokenofLoggedInUser(loginDetails)

}
/**
* Test the following and scope is:
* - Create an account, login with details, and check if token comes and get the personal details of logged in user
*/

describe('Create Account, Login and Check Token', () => {
  before(async () => {
    //delete dummy if present to check registration
    await deleteUser(login_details.username);
    await deleteUser('padam');//for e2e testing in UI
  })

  describe('Register User', () => {
    it('it should Register, Login, and check token', (done) => {
      chai.request(server)
        .post('/users/register')
        .send(register_details) // this is like sending $http.post or this.http.post in Angular
        .end((err, res) => {
          if (err) {
            console.log(err);
            done();
          }
          res.should.have.status(200);
          // the property, res.body.data, we expect it to be 1.
          expect(res.body.data.should.eq(1));

          //follow up with login user
          chai.request(server)
            .post('/users/authenticate')
            .send(login_details)
            .end((err, res) => {
              if (err) {
                console.log(err);
                done();
              }
              res.should.have.status(200);
              expect(res.body.data.should.eq(1));
              res.body.result.should.have.property('token');
              chai.request(server)
                .get('/users/current')
                // we set the auth header with our token
                .set('Authorization', 'Bearer ' + res.body.result.token)
                .end((err, res) => {
                  if (err) {
                    console.log(err);
                    done();
                  }
                  res.should.have.status(200);
                  expect(res.body.username.should.eq(login_details.username));
                  res.body.should.be.an('object');
                  done(); // Don't forget the done callback to indicate we're done!
                })
            })
        })
    })
    it('Should not allow register with same name', (done) => {
      chai.request(server)
        .post('/users/register')
        .send(register_details)
        .end((err, res) => {
          if (err) {
            console.log(err);
            done();
          }
          res.should.have.status(400);
          done();
        })
    })
  })
})

/**
* Test the following and scope is:
* - CRUD operations in user only by Admin and userManager
*/
describe("CRUD Operations of User", () => {
  let token = '';
  let id = '';
  before(async () => {

    await deleteUser(crud_user_details.username);
    // get token
    token = await getTokenofLoggedInUser(login_details);

  })

  it('Admin/UserManager should add User', (done) => {
    chai.request(server)
      .post('/users/register')
      .send(crud_user_details)
      .end((err, res) => {
        if (err) {
          console.log(err);
          done();
        }
        res.should.have.status(200);
        // the property, res.body.data, we expect it to be 1.
        expect(res.body.data.should.eq(1));

        done();
      })
  })

  it('Admin/UserManager should fetch added User', (done) => {
    chai.request(server)
      .get('/users/findByUserName/' + crud_user_details.username)
      .set('Authorization', 'Bearer ' + token.token)
      .end((err, res) => {
        if (err) {
          console.log(err);
          done();
        }
        res.should.have.status(200);
        expect(res.body[0].username.should.eq(crud_user_details.username));
        id = res.body[0]._id;
        done();
      })
  })

  it('Admin/UserManager should update User', (done) => {
    chai.request(server)
      .put('/users/' + id)
      .set('Authorization', 'Bearer ' + token.token)
      .send(crud_user_updatedetails)
      .end((err, res) => {
        if (err) {
          console.log(err);
          done();
        }
        res.should.have.status(200);
        expect(res.body.data.should.eq(1));
        chai.request(server)
          .get('/users/' + id)
          .set('Authorization', 'Bearer ' + token.token)
          .end((err, res) => {
            if (err) {
              console.log(err);
              done();
            }
            res.should.have.status(200);
            expect(res.body.user.preferWorkHrs.should.eq(10));
          })
        done();
      })
  })

  it('Admin/UserManager should delete User', (done) => {
    chai.request(server)
      .delete('/users/' + id)
      .set('Authorization', 'Bearer ' + token.token)
      .end((err, res) => {
        if (err) {
          console.log(err);
          done();
        }
        res.should.have.status(200);
        expect(res.body.data.should.eq(1));
        chai.request(server)
          .get('/users/' + id)
          .set('Authorization', 'Bearer ' + token.token)
          .end((err, res) => {
            if (err) {
              console.log(err);
              done();
            }
            res.should.have.status(404);
          })
        done();
      })
  })
})

/**
* Test the following and scope is:
* - Authorization check - user should not able to update and delete the other user
*/
describe("Role Access testing of User", () => {
  let token = '';
  let id = '';
  before(async () => {
    await commonHelp.findByUserName(login_details.username)
      .then((users) => {
        id = users._id;
      }).catch(err => { console.log(err); });

    //create dummy user with role user
    await commonHelp.createUser(crud_user_details);

    // get token
    token = await getTokenofLoggedInUser(crud_user_details);
  })

  it('User should not able to fetch other User', (done) => {
    chai.request(server)
      .get('/users/findByUserName/' + login_details.username)
      .set('Authorization', 'Bearer ' + token.token)
      .end((err, res) => {
        if (err) {
          console.log(err);
          done();
        }
        res.should.have.status(401);
        done();
      })
  })

  it('User should not able to update other User', (done) => {
    chai.request(server)
      .put('/users/' + id)
      .set('Authorization', 'Bearer ' + token.token)
      .send(login_details)
      .end((err, res) => {
        if (err) {
          console.log(err);
          done();
        }
        res.should.have.status(401);
        done();
      })
  })

  it('User should not able to delete other User', (done) => {
    chai.request(server)
      .delete('/users/' + id)
      .set('Authorization', 'Bearer ' + token.token)
      .end((err, res) => {
        if (err) {
          console.log(err);
          done();
        }
        res.should.have.status(401);
        done();
      })
  })

  it('Authorised User should able to change password', (done) => {
    chai.request(server)
      .put('/users/changePassword/' + token.id)
      .set('Authorization', 'Bearer ' + token.token)
      .send({ "oldPassword": "Admin123", "newPassword": "admin123" })
      .end((err, res) => {
        if (err) {
          console.log(err);
          done();
        }
        res.should.have.status(200);
        expect(res.body.message.should.eq("Password changed Successfully"));
        //localStorage.remove
        done();
      })
  })
})


/**
* Test the following and scope is:
* - CRUD operation of Timesheet by authorised users only
*/
describe("CRUD operation of Timesheet by authorised users only", () => {
  let newtoken = '';
  let id = '';
  let timesheetId = '';
  let otherTimesheetdet = '';
  before(async () => {
    // get token
    newtoken = await getTokenofLoggedInUser(crud_user_details);
    timesheet_details.userId = newtoken.id;
    update_timesheet_details.userId = newtoken.id;
    otherTimesheetdet = await commonHelp.getOtherTimesheetId(newtoken.id);
  })

  it('Authorised User should add Timesheet', (done) => {
    chai.request(server)
      .post('/timesheet/createTimesheet/')
      .set('Authorization', 'Bearer ' + newtoken.token)
      .send(timesheet_details)
      .end((err, res) => {
        if (err) {
          console.log(err);
          done();
        }
        res.should.have.status(200);
        // the property, res.body.data, we expect it to be 1.
        expect(res.body.data.should.eq(1));

        done();
      })
  })

  it('Authorised User should update Timesheet', (done) => {
    chai.request(server)
      .put('/timesheet/' + "55153a8014829a865bbf700d")
      .set('Authorization', 'Bearer ' + newtoken.token)
      .send(update_timesheet_details)
      .end((err, res) => {
        if (err) {
          console.log(err);
          done();
        }
        res.should.have.status(200);
        expect(res.body.data.should.eq(1));
        chai.request(server)
          .get('/timesheet/' + "55153a8014829a865bbf700d")
          .set('Authorization', 'Bearer ' + newtoken.token)
          .end((err, res) => {
            if (err) {
              console.log(err);
              done();
            }
            res.should.have.status(200);
            expect(res.body.timesheet.totalTime.should.eq(10));
          })
        done();
      })
  })

  it('Authorised User should fetch Timesheet', (done) => {
    chai.request(server)
      .get('/timesheet/' + "55153a8014829a865bbf700d")
      .set('Authorization', 'Bearer ' + newtoken.token)
      .end((err, res) => {
        if (err) {
          console.log(err);
          done();
        }
        res.should.have.status(200);
      })
    done();
  })

  it('Authorised User should delete Timesheet', (done) => {
    chai.request(server)
      .delete('/timesheet/' + "55153a8014829a865bbf700d")
      .set('Authorization', 'Bearer ' + newtoken.token)
      .end((err, res) => {
        if (err) {
          console.log(err);
          done();
        }
        res.should.have.status(200);
        expect(res.body.data.should.eq(1));
        done();
      })
  })

  it('Role : user cannot access other(s) Timesheet', (done) => {
    chai.request(server)
      .get('/timesheet/' + otherTimesheetdet._id)
      .set('Authorization', 'Bearer ' + newtoken.token)
      .end((err, res) => {
        if (err) {
          console.log(err);
          done();
        }
        res.should.have.status(404);
        done();
      })
  })

  it('Role : user cannot create other(s) Timesheet', (done) => {
    timesheet_details.userId = otherTimesheetdet._id;
    chai.request(server)
      .post('/timesheet/createTimesheet/')
      .set('Authorization', 'Bearer ' + newtoken.token)
      .send(timesheet_details)
      .end((err, res) => {
        if (err) {
          console.log(err);
          done();
        }
        res.should.have.status(401);
        done();
      })
  })

  it('Role : user cannot update other(s) Timesheet', (done) => {
    chai.request(server)
      .put('/timesheet/' + otherTimesheetdet._id)
      .set('Authorization', 'Bearer ' + newtoken.token)
      .send({ "totalTime": 10 })
      .end((err, res) => {
        if (err) {
          console.log(err);
          done();
        }
        res.should.have.status(401);
        done();
      })
  })

  it('Role : user cannot delete other(s) Timesheet', (done) => {
    chai.request(server)
      .delete('/timesheet/' + otherTimesheetdet._id)
      .set('Authorization', 'Bearer ' + newtoken.token)
      .end((err, res) => {
        if (err) {
          console.log(err);
          done();
        }
        res.should.have.status(401);
        done();
      })
  })
})