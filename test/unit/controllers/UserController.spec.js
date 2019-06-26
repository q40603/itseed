// Here is were we init our 'sails' environment and application

var supertest = require('supertest');
var agent;

require('../../bootstrap');

describe('The UserController', function () {

  it('login with no user and pwd', function (done) {
    agent = supertest.agent(sails.hooks.http.app);
   //  console.log(agent);
    agent
      .post('/login')
      .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
      .send({})
      .expect(200)
      .end(function (err, result) {
       //  console.log(result);
        if (err) {
          done(err);
        } else {
          result.text.should.equal('使用者不存在');
          done();
        }
      });
 });

  it('login with null user', function (done) {
    agent = supertest.agent(sails.hooks.http.app);
    agent
      .post('/login')
      .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
      .send({"email": null, "pwd": "123456"})
      .expect(200)
      .end(function (err, result) {
       //  console.log(result);
        if (err) {
          done(err);
        } else {
          result.text.should.equal('使用者不存在');
          done();
        }
      });
 });

 it('login with correct user but null pwd', function (done) {
  agent = supertest.agent(sails.hooks.http.app);
 //  console.log(agent);
  agent
    .post('/login')
    .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
    .send({"email": "q40603@gmail.com", "pwd": null})
    .expect(200)
    .end(function (err, result) {
     //  console.log(result);
      if (err) {
        done(err);
      } else {
        result.text.should.equal('密碼錯誤');
        done();
      }
    });
}); 

 it('login with long user_name and pwd', function (done) {
  agent = supertest.agent(sails.hooks.http.app);
 //  console.log(agent);
  agent
    .post('/login')
    .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
    .send({
      "redirect": "undefined" , 
      "email": "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", 
      "pwd": "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    })
    .expect(200)
    .end(function (err, result) {
      if (err) {
        done(err);
      } else {
        result.text.should.equal('使用者不存在');
        done();
      }
    });
});

  it('login with wrong pwd', function (done) {
    agent = supertest.agent(sails.hooks.http.app);
    agent
      .post('/login')
      .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
      .send({"redirect": "undefined" , "email": "q40603@gmail.com", "pwd": "123456"})
      .expect(200)
      .end(function (err, result) {
        if (err) {
          done(err);
        } else {
          result.text.should.equal('密碼錯誤');
          done();
        }
      });
 });

 it('should login but redirect to NULL url', function (done) {
  agent = supertest.agent(sails.hooks.http.app);
  agent
    .post('/login')
    .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
    .send({"redirect": null , "email": "q40603@gmail.com", "pwd": "12345678"})
    .expect(302)
    .end(function (err, result) {
      if (err) {
        done(err);
      } else {
        result.body.should.be.an('object');
        result.header.location.should.equal('/disc');
        done();
      }
    });
});

it('should login', function (done) {
   agent = supertest.agent(sails.hooks.http.app);
   agent
     .post('/login')
     .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
     .send({"redirect": "undefined" , "email": "q40603@gmail.com", "pwd": "12345678"})
     .expect(302)
     .end(function (err, result) {
       if (err) {
         done(err);
       } else {
         result.body.should.be.an('object');
         result.header.location.should.equal('/disc');
         done();
       }
     });
});

it('should get disc page', function (done) {

 //  console.log(agent);
  agent
    .get('/disc')
    .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
    .set('Connection', 'keep-alive')
    .expect(200)
    .end(function (err, result) {
      if (err) {
        done(err);
      } else {
        // console.log(result.res.headers["content-length"].equal('35697'));
        // result.res.headers["content-length"].should.equal('35697')
        result.type.should.equal('text/html');
        done();
      }
    });
});

it('should get profile page', function (done) {

  //  console.log(agent);
   agent
     .get('/profile')
     .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
     .set('Connection', 'keep-alive')
     .expect(302)
     .end(function (err, result) {
       if (err) {
         done(err);
       } else {
         // console.log(result.res.headers["content-length"].equal('35697'));
         // result.res.headers["content-length"].should.equal('35697')
         result.type.should.equal('text/html');
         done();
       }
     });
 });

 it('should fill the profile', function (done) {
  agent = supertest.agent(sails.hooks.http.app);
  agent
    .post('/editProfile')
    .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
    .send({"phone": "0916156208"})
    .expect(302)
    .end(function (err, result) {
      if (err) {
        done(err);
      } else {
        result.body.should.be.an('object');
        result.header.location.should.equal('/profile');
        done();
      }
    });
});


it('should get form page', function (done) {

  //  console.log(agent);
   agent
     .get('/form')
     .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
     .set('Connection', 'keep-alive')
     .expect(302)
     .end(function (err, result) {
       if (err) {
         done(err);
       } else {
         // console.log(result.res.headers["content-length"].equal('35697'));
         // result.res.headers["content-length"].should.equal('35697')
         result.type.should.equal('text/html');
         done();
       }
     });
 });

it('should get file page', function (done) {

  //  console.log(agent);
   agent
     .get('/files')
     .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
     .set('Connection', 'keep-alive')
     .expect(302)
     .end(function (err, result) {
       if (err) {
         done(err);
       } else {
         // console.log(result.res.headers["content-length"].equal('35697'));
         // result.res.headers["content-length"].should.equal('35697')
         result.type.should.equal('text/html');
         done();
       }
     });
 });

// it('a file', function(done) {
//   agent
//       .post('/uploadPhoto')
//       .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
//       .set("Content-Type", "multipart/form-data; boundary=----WebKitFormBoundarya5vfka5Utjlbcih9")
//       .field('fieldName', 'photo')
//       .attach('image', './test/diploma.jpg')
//       .expect(200)
//       .end(function(err, res) {
//         if (err) {
//           done(err);
//         } else {
//           // console.log(result.res.headers["content-length"].equal('35697'));
//           // result.res.headers["content-length"].should.equal('35697')
//           // result.type.should.equal('text/html');
//           done();
//         }
//       });
// });


// it('should get posts with comments', function (done) {
//    var agent = supertest.agent(sails.hooks.http.app);
//    agent
//      .get('/post/getPostsWithComments')
//      .set('Accept', 'application/json')
//      .expect('Content-Type', /json/)
//      .expect(200)
//      .end(function (err, result) {
//        if (err) {
//          done(err);
//        } else {
//          result.body.should.be.an('array');
//          result.body.should.have.length(1);
//          done();
//        }
//      });
// });

// it('should delete post created', function (done) {
//    var agent = supertest.agent(sails.hooks.http.app);
//    agent
//      .delete('/post/' + createdPostId)
//      .set('Accept', 'application/json')
//      .expect('Content-Type', /json/)
//      .expect(200)
//      .end(function (err, result) {
//        if (err) {
//          returndone(err);
//        } else {
//          returndone(null, result.text);
//        }
//      });
// });

});