/**
 * UserController
 *
 * @描述 : 使用者相關
 * @文件 : See http://links.sailsjs.org/docs/controllers
 */

require('dotenv').config()
var md5 = require("MD5")
var fs = require("fs");
var nodemailer = require('nodemailer');
const readline = require('readline');
const {google} = require('googleapis');

const transporter = nodemailer.createTransport({
 service: 'gmail',
 auth: {
   user: 'itseed17th@gmail.com',
   pass: 'weareitseed17'
 }
});

const SCOPES = ['https://www.googleapis.com/auth/drive','https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';



function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client,arguments[2]);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function send_reg_success(newuser){
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Drive API.
        authorize(JSON.parse(content), update_reg_sheet, newuser);
    }); 
    // fs.readFile('credentials.json', (err, content) => {
    //     if (err) return console.log('Error loading client secret file:', err);
    //     // Authorize a client with credentials, then call the Google Drive API.
    //     authorize(JSON.parse(content), update_final_sheet, save_data);
    // });  
    var email_content = "";
    fs.readFile("views/emailTemplates/testEmail/email.html",(err, content) => {
        if (err) return console.log('Error loading email template:', err);
        // Authorize a client with credentials, then call the Google Drive API.
        email_content = content;
        var mailOptions = {
            from: 'itseed17th@gmail.com',
            to: newuser.email,
            subject: '資訊種子帳號註冊成功',
            html: '<p>親愛的' + String(newuser.name)+ '您好,</p><br>' + email_content
            };
        
            transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                console.log(error);
              } else {
               console.log('Email sent: ' + info.response +' 寄件的信箱為：'+ newuser.email);
              }
            });
    }); 
}

async function update_reg_sheet(auth, user) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.append({
    auth: auth,
    spreadsheetId: '19j2E63vnl6nyjF-ybV7xlXYjr3-QRcKoV-F5UZtK2ng',
    range: "'reg'!A:I", //Change Sheet1 if your worksheet's name is something else
    valueInputOption: "RAW",
    resource: {
      values: [[user.email, user.name]]
    }
  }, (err, response) => {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
  });
}

async function update_profile_sheet(auth, user) {

    const sheets = google.sheets({version: 'v4', auth});
  
    sheets.spreadsheets.values.append({
      auth: auth,
      spreadsheetId: '19j2E63vnl6nyjF-ybV7xlXYjr3-QRcKoV-F5UZtK2ng',
      range: "'profile'!A:J", //Change Sheet1 if your worksheet's name is something else
      valueInputOption: "RAW",
      resource: {
        values: [[
            user.name,
            user.phone,
            user.gender,
            user.grade,
            user.school,
            user.dept,
            user.reference,
            user.survey,
          ]]
      }
    }, (err, response) => {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
    });
  }

async function update_final_sheet(auth, user) {

  const sheets = google.sheets({version: 'v4', auth});

  sheets.spreadsheets.values.append({
    auth: auth,
    spreadsheetId: '19j2E63vnl6nyjF-ybV7xlXYjr3-QRcKoV-F5UZtK2ng',
    range: "'final'!A:Q", //Change Sheet1 if your worksheet's name is something else
    valueInputOption: "RAW",
    resource: {
      values: [[
          user.name,
          user.email,
          user.phone,
          user.disc,
          user.gender,
          user.grade,
          user.school,
          user.dept,
          user.reference,
          user.survey,
          user.Q1,
          user.Q2,
          user.Q3,
          user.Q4,
          user.Q5_1,
          user.Q5_2,
          user.Q6
        ]]
    }
  }, (err, response) => {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
  });
}



function registerAccount(res,newuser,callback){
	// 		 一般會員  email + pwd 		註冊
	// goolge登入會員  email + gIdToken 註冊

    //驗證是否重複註冊（信箱是否被使用過）
    //  一般會員     註冊 => 已經被 google登入註冊過 => 補上 password
    //  google登入  註冊 => 已經被 一般註冊註冊過    => 補上 gIdToken


    var value = {};
    User.findOne({ email: newuser.email }).exec(function (err, user) {
        if (err) { return res.end(JSON.stringify(err)); }
        if(user != undefined){
            // 補上 gIdToken
            if (!user.gIdToken && newuser.gIdToken){
                value.gIdToken = newuser.gIdToken;
                User.update({
                    id: user.id,
                },value).exec(function (err,data) {
                    if (err) { res.end(JSON.stringify(err)); }
                    User.findOne({id: user.id}).exec(function (err, updated_user) {
                        if (err) { res.end(JSON.stringify(err)); }
                        callback(updated_user);
                    });
                });
            }
            else  if (!user.pwd  && newuser.pwd ){
                // 補上 pwd
                value.pwd = newuser.pwd;
                User.update({
                    id: user.id,
                    isEmailAuth: 1
                }, {value}).exec(function (err, user) {
                    if (err) { res.end(JSON.stringify(err)); }
                    User.findOne({ id: user.id }).exec(function (err, updated_user) {
                        if (err) { res.end(JSON.stringify(err)); }
                        callback(updated_user);
                    });
                });
            }
        }
        else{

            SystemSetting.findOne({ name: "th" }).exec(function (err, itseed_th) {
                if (err) { return res.end(JSON.stringify(err)); }
                if (itseed_th != undefined) {
                    newuser.th = itseed_th.value;
                }
                User.create(newuser)
                .exec(function (err, user) {
                    if (err) { res.end(JSON.stringify(err)); }
                    //新增DISC
                    UserDISC.create({ user: user.id })
                    .exec(function (err, disc) {
                        if (err) { res.end(JSON.stringify(err)); }
                        //新增報名資料
                        UserFiles.create({ user: user.id })
                        .exec(function (err, files) {
                            if (err) { res.end(JSON.stringify(err)); }
                            //新增書審資料
                            User_Form.create({ user: user.id })
                            .exec(function (err, form) {
                              if (err) { res.end(JSON.stringify(err)); }
                              //連結table
                              User.update({
                                  id: user.id
                              }, {
                                  disc: disc.id,
                                  files: files.id,
                                  form: form.id
                              })
                              .exec(function (err, data) {
                                  if (err) { res.end(JSON.stringify(err)); }
                                  User.findOne({
                                      id: user.id
                                  }).exec(function (err, updated_user) {
                                      if (err) { res.end(JSON.stringify(err)); }
                                      callback(updated_user);
                                  });
                              });
                            });
                        });
                    });
                });
            });
        }
    });
}

 module.exports = {
    //移除blueprint內建的actions
    _config: {
        actions: false,
        rest: false,
        shortcuts: false
    },

    /*前台*/
    
    // email驗證
    rem: function (req, res) {
        // 新增使用者的帳號資料
        //console.log(req.query)
        var userregister ={
            mailmd5 : md5(req.query.email),
            email : req.query.email
        }
        emailV.findOne({
            mailmd5: md5(req.query.email)
        })
        .exec(function (err , emailvo) {
            if (err) {
                // console.log("資料庫查詢失敗")
                res.end(JSON.stringify(err));
            }else if(emailvo){               
                var link="http://"+req.get('host')+"/check-code?email="+userregister.email+"&token="+userregister.mailmd5;                
                var mail = {
                    from: '資訊種子',
                    subject: '資訊種子註冊信',
                    to: userregister.email,
                 };
                 res.render('emailTemplates/emailVerification/emailVerification.ejs', {
                    link:link
                }, function(err, html) {
                    if(err){
                        console.log('error in email template');    
                    } 
                    // console.log(html);
                    mail.html = html;
                    Mailer.sendWelcomeMail(mail);
                });
                return res.view("frontend/pages/rem" , { emailV:userregister });
            }else{
                // emalV無此帳戶
                emailV.create(userregister)
                .exec(function(err, emailV) {
                    if(err){
                        res.end(JSON.stringify(err));
                    }
                    else{
                        // console.log("新帳戶寄信")
                        var link="http://"+req.get('host')+"/check-code?email="+userregister.email+"&token="+userregister.mailmd5;
                        var mail = {
                          from: '資訊種子',
                          subject: '資訊種子註冊信',
                          to: userregister.email,
                        //   html: '<p>親愛的使用者您好,</p><br><a href="'+link+'">點擊驗證信箱</a></p><p>第十六屆資訊種子招生團隊敬上</p>'
                        };
                        res.render('emailTemplates/emailVerification/emailVerification.ejs', {
                            link:link
                        }, function(err, html) {
                            if(err){
                                console.log('error in email template');    
                            } 
                            console.log(html);
                            mail.html = html;
                            Mailer.sendWelcomeMail(mail);
                        });
                        return res.view("frontend/pages/rem" , { emailV:userregister });
                    }
                });
            }
        });
    },
    // email驗證檢查
    checkCode: function (req, res) {
        // console.log(req.protocol+":/"+req.get('host'));
        // console.log(req.query.token);
        // console.log(req.query.email);
        emailV.findOne({
            email: req.query.email
        })
        .exec(function (err , emailV) {
            if (err) {
                // console.log("資料庫錯誤");
                return res.end(JSON.stringify(err));
                
            }
            else if(emailV == null){
                // 沒有找到使用者
                // console.log("此帳戶尚未註冊");
                res.redirect("/");
            }
            else{
                // 有此帳戶
                User.findOne({
                    email: req.query.email
                }).exec(function (err , user) {
                    if (err) { 
                        res.end(JSON.stringify(err)); 
                    }
                    else if(user.isEmailAuth == 1){
                        // 已經認證過
                        return res.view("frontend/pages/remSucess", {
                            emailV:emailV,
                            status:'信箱已驗證過',
                            text:'請直接登入'
                        });
                    }
                    // 如果帳戶的token與帳戶的mailmd5相同
                    else if(emailV.mailmd5 ==req.query.token){
                        // 驗證成公
                            // 未認證過
                        User.update({
                            email: req.query.email
                        }, {
                            isEmailAuth: 1
                        }).exec(function (err, data) {
                            if (err) { 
                                res.end(JSON.stringify(err)); 
                            }else {
                                send_reg_success(data);
                                return res.view("frontend/pages/remSucess", {
                                    emailV:emailV,
                                    status:'驗證成功',
                                    text:'信箱已經驗證成功，您現在可以去填寫DISC'
                                }); 
                            }
                        });                  
                    }else{
                        // 驗證失敗
                        return res.view("frontend/pages/remSucess", {
                            emailV:emailV,
                            status:'驗證失敗',
                            text:'請重新驗證信箱'
                        });
                    }
                })
            }
        });
    },
    reset_pwd: function (req, res) {
        var randomstring = Math.random().toString(36).slice(-8);//亂數生成英數8字密碼
        var value = {
            pwd: md5(randomstring)//宣告將要被更新的值 md5為加密
        }
        User.findOne({
            email: req.body.email
        })//透過sql比對輸入信箱 req.body.email為頁面輸入的信箱
        .exec(function(err, user) {
            if(err){
                res.end(JSON.stringify(err));
            }
            else{
              req.session.name=user.name;//將名字設為session
              User.update({pwd: user.pwd}, value).exec(function (err, user) {//如果密碼更改成功，則寄信通知新密碼
                  if (err) { res.end(JSON.stringify(err)); }
                  else{
                      var mailOptions = {
                      from: 'itseed17th@gmail.com',
                      to: req.body.email,
                      subject: '【資訊種子第17屆】【忘記密碼】',
                    //   html:"<p>親愛的 "+req.session.name+" 您好</p><br><p>您的新密碼為："+randomstring+"</p><br><p>請記得登入並更改您的密碼</p><br><p>第十七屆資訊種子招生團隊敬上</p>"
                      };//每個信件寄出的密碼皆為8字亂數

                      transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                          console.log(error);
                        } else {
                        //  console.log('Email sent: ' + info.response +' 寄件的信箱為：'+ req.body.email);
                        }
                      });
                      res.redirect("/FPWpage");//成功則導入「寄件成功」之頁面 
                  }
              });
            }
        });
    },

    //登入頁
    loginPage: function (req, res) {
        let redirect = req.query.redirect;
        //判斷系統開放與否
        SystemSetting.findOne({
            name: "startDate"
        })
        .exec(function (err, strStartDate) {
            if (err) {
                return res.end(JSON.stringify(err));
            }
            else {
                if (strStartDate == undefined)
                    startDate = "";
                else {
                    startDate = (new Date(strStartDate.value)).getTime();
                }

                SystemSetting.findOne({
                    name: "endDate"
                })
                .exec(function (err, strEndDate) {
                    if (err) {
                        return res.end(JSON.stringify(err));
                    }
                    else {
                        if (strEndDate == undefined)
                            endDate = "";
                        else {
                            endDate = (new Date(strEndDate.value)).getTime();
                        }
                        var now = (new Date()).getTime();
                        if (startDate < now && now < endDate){
                            //系統開放
                            return res.view("frontend/pages/login",{
                                redirect: redirect
                            });
                        } else if (startDate == "" || endDate == ""){
                            //還沒設定
                            return res.view("frontend/pages/login", {
                                redirect: redirect
                            });
                        } else if ( now < startDate ){
                            return res.redirect('/regInfo?hint=true');
                        }
                        else{
                            //系統關閉
                            return res.redirect('/regInfo?system=close');
                        }
                    }
                });
            }
        });
    },
    //註冊
    register: function(req, res){
        //TODO: 系統開關
        var newuser = {
            email: req.body.email,
            pwd: md5(req.body.pwd),
            name: req.body.name
        };
        // console.log(newuser.name);
		registerAccount(res,newuser,function(user){
			// req.session.userid = user.id;
            // req.session.email = user.email;
            // req.session.pwd = user.pwd;
			// req.session.type =  user.type;
			// req.session.authorized = {
			// 	user: true
            // };
            res.redirect("/rem?email="+newuser.email);
            
        //註冊完寄送驗證信    
			// res.redirect("/rem");  
        });                
    },
    //檢查信箱是否已存在
    checkEmail: function (req, res) {
        User.findOne({
            email: req.body.email
        })
        .exec(function(err, user) {
            if(err){
                res.end(JSON.stringify(err));
            }
            else{
                //註冊 or 修改信箱
                if(req.body.pwd == undefined){
                    if(user == undefined){
                        if(String(req.body.method) == "reset_pwd"){
                           res.end("false");
                        }
                        // else{
                        //   console.log("shit");
                          res.end("true");
                        //}
                        
                    }
                    else{
                        if(req.body.method == "reset_pwd"){
                          res.end("true");
                        }                      
                        //修改信箱
                        if(req.session.email == req.body.email)
                            res.end("true");
                        else
                            res.end("false");
                    }   

                }
                //登入
                else{
                    if(user == undefined){
                        res.end("false");
                    }
                    else
                        res.end("true");
                }
            }
        });
    },
    //檢查密碼是否正確
    checkPwd: function (req, res) {
        User.findOne({
            email: req.body.email
        })
        .exec(function(err, user) {
            if(err){
                res.end(JSON.stringify(err));
            }
            else{
                if(user == undefined){
                    res.end("false");
                }
                else{
                    if(md5(req.body.pwd) != user.pwd){
                        res.end("false");
                    }
                    else
                        res.end("true");
                }
            }
        });
    },
    //登入
    login: function (req, res) {
        User.findOne({
            email: req.body.email
        })
        .exec(function(err, user) {
            if(err){
                res.end(JSON.stringify(err));
            }
            else{
                if(user == undefined){
                    return res.end("使用者不存在");
                }
                if(req.body.pwd == null || (md5(req.body.pwd) != user.pwd)){
                    return res.end("密碼錯誤");
                }
                if(user.isEmailAuth == 0){
                    res.redirect("/rem?email="+user.email);
                }
                else{
                    req.session.userid = user.id;
                    req.session.email = user.email;
                    req.session.pwd = req.body.pwd;
                    req.session.type =  user.type;
                    req.session.finished = user.finished;
                    req.session.authorized = {
                        user: true
                    }
                    //console.log(req.session);
                    if (req.body.redirect == null){
                        res.redirect("/disc" ) ;
                    }
                    else{
                        res.redirect(req.body.redirect!='undefined'? req.body.redirect: "/disc" ) ;
                    }
                    
                }

            }
        });
    },
    google_login: function (req, res) {
        const CLIENT_ID = process.env.googleLoginId;
        const OAuth2Client = require('google-auth-library').OAuth2Client;
        const client = new OAuth2Client(CLIENT_ID);
        //console.log(req.body)
        async function verify() {
          const ticket = await client.verifyIdToken({
              idToken: req.body.idtoken,
              audience: CLIENT_ID,
          });
			    const payload = ticket.getPayload();
			    const gIdToken = md5(payload.sub);
          User.findOne({
				    gIdToken: gIdToken
          }).exec(function (err, user) 
            {
              if (err) { return res.end(JSON.stringify(err)); }
              if (user == undefined) {
					      const newuser = {
					        email: payload.email,
                  gIdToken: gIdToken,
                  name: req.body.name,
                  isEmailAuth: 1
					      }
					      registerAccount(res, newuser, function (new_user) {
                  send_reg_success(new_user);
                  req.session.userid = new_user.id;
                  req.session.email = new_user.email;
                  req.session.gIdToken = new_user.gIdToken;
                  req.session.type = new_user.type;
                  req.session.finished = new_user.finished;
                  req.session.authorized = {
                      user: true
                  }
                  res.end(JSON.stringify({
                      redirect: req.body.redirect != 'undefined' ? req.body.redirect:"/disc"
                  }));
					      });
              }
              else{
                User.update(
                  {id: user.id},
                  {isEmailAuth: 1}
                ).exec(function (err, datas) {
                    if (err) { return res.end(JSON.stringify(err)); }
                  });
      			req.session.userid = user.id;
      			req.session.email = payload.email;
                req.session.gIdToken = gIdToken;
                req.session.type = user.type;
                req.session.finished = user.finished
                req.session.authorized = {
                    user: true
                }
      					res.end(JSON.stringify({
                  redirect: req.body.redirect != 'undefined' ? req.body.redirect : "/disc"
      					}));
				      }
            });  
        }
        verify().catch(console.error);   
    },
    //登出
    logout: function (req, res) {
        delete(req.session.userid);
        delete(req.session.email);
        delete(req.session.pwd);
        delete(req.session.type);
        delete(req.session.authorized);
        delete(req.session.finished);
        res.redirect("/");
    },
    //個人資料
    profile: function (req, res) {

        User.findOne({
            id: req.session.userid
        })
        .exec(function(err, user) {
            if(err){
                res.end(JSON.stringify(err));
            }
            else{
              School.query('SELECT distinct school FROM school' ,function(err, school) {
                if (err) {
                    return res.end(JSON.stringify(err));
                    console.log("error")
                }
                else{
                  School.query('SELECT distinct dept FROM school' ,function(err, dept) {
                    if (err) {
                        return res.end(JSON.stringify(err));
                        console.log("error")
                    }
                    else{
                      return res.view("frontend/pages/userProfile", {
                          user: user,
                          school : school,
                          dept : dept
                      });                                   
                    }
                  });    
                }
              });
            }
        });
    },

    uploadPhoto: function (req, res) {
    console.log(req.file("photo"));
      var value = {};
      req.file("photo").upload({ 
        dirname: sails.config.appPath+"/assets/files/"+req.session.userid
      }, function (err, uploadedFiles) {
          if (err){
            console.log("hihi");
              return res.end(JSON.stringify(err));
          }
          //有上傳檔案
          if (uploadedFiles.length > 0) {
              //圖片檔
            if (uploadedFiles[0].type.substring(0, 5) == "image") { 

              if (uploadedFiles[0].size > 2 * 1024 * 1024) {
                  return res.end("圖片大小須小於2MB");
              }
              
              var url = uploadedFiles[0].fd;
              var start = url.search("files") - 1;
              url = url.slice(start);
              url = url.replace(/\\/g, "/");
              value.photo = url;
              // value.finished = 1;
            }
            //非圖片檔
            else {
                fs.unlink(uploadedFiles[0].fd, function (err) {  
                    if (err) 
                        console.error(err) 
                });  
                return res.end("檔案格式錯誤");
            }      

            //取得舊照片位址
            User.findOne({
                id: req.session.userid
            })
            .exec(function (err, user) {
                if (err) {
                    res.end(JSON.stringify(err));
                }
                else {
                    var oldPhoto = user.photo;

                    User.update({id: user.id}, value)
                    .exec(function (err, datas) {
                        //console.log(datas[0])
                        if (err) {
                            
                            //刪除上傳檔案
                            fs.unlink(uploadedFiles[0].fd, function (err) {  
                                if (err) 
                                    console.error(err) 
                            });  
                            
                            res.end(JSON.stringify(err));
                        }
                        else {
                            //刪除舊檔案
                            if (oldPhoto != "/images/layout/logo.png") {
                                var imagePath = sails.config.appPath + "/assets" + oldPhoto;

                                fs.unlink(imagePath, function (err) {  
                                    if (err) 
                                        console.error(err) 
                                });  
                            }
                            // 複製到 public 讓使用者可以觀看
                            if (!fs.existsSync(sails.config.appPath + "/.tmp/public/files/" + req.session.userid)){
                                fs.mkdirSync(sails.config.appPath + "/.tmp/public/files/" + req.session.userid);
                            }
                            var source = fs.createReadStream(sails.config.appPath + "/assets" + datas[0].photo);
                            var desti = fs.createWriteStream(sails.config.appPath + "/.tmp/public" + datas[0].photo);
                            
                            source.pipe(desti);
                            source.on('end',function() {
                                source.close();
                                req.session.email = req.body.email;
                                req.session.pwd = req.body.pwd;
                                res.redirect("/profile");
                            });
                        }
                    });
                }
            });             
          }
          //沒上傳檔案
          else{
            req.session.email = req.body.email;
            req.session.pwd = req.body.pwd;
            res.redirect("/profile");
          }
      });      
    },

    //編輯個人資料
    editProfile: function (req, res) {   
        var t = 0;
        if (typeof req.body == "undefined"){
            res.redirect("/profile");
        }
        var value = {
            phone: req.body.phone,
            name: req.body.name,
            gender: req.body.gender,
            school: req.body.school,
            dept: req.body.dept,
            grade: req.body.grade,
            reference: req.body.reference,
            survey: Array.isArray(req.body.survey) ? req.body.survey.join(',') : req.body.survey
        };

        
        User.update({id: req.session.userid}, value)
        .exec(function (err, datas) {
            if (err) {
                res.end(JSON.stringify(err));
            }
            else {
                req.session.email = req.body.email;
                req.session.pwd = req.body.pwd;
                if (req.body.next == "下一步"){
                    fs.readFile('credentials.json', (err, content) => {
                        if (err) return console.log('Error loading client secret file:', err);
                        // Authorize a client with credentials, then call the Google Drive API.
                        authorize(JSON.parse(content), update_profile_sheet, value);
                    });  
                    res.redirect("/form");
                }
                else if(req.body.back == "上一步"){
                    res.redirect("/disc");
                }
                else{
                    res.redirect("/profile");
                }
                
            }     
        });
    },

    form: function (req, res){
        User_Form.findOne({
            user: req.session.userid
        })
        .exec(function(err, form_data){
            if(err){res.end(JSON.stringify(err));}
            return res.view("frontend/pages/userForm", {
                form_data: form_data,
            });                
        });
    },

    editForm: function (req, res){
        if (typeof req.body == "undefined"){
            res.redirect("/form");
        }
        var value = {
          Q1 : req.body.Q1,
          Q2 : req.body.Q2,
          Q3 : req.body.Q3,
          Q4 : req.body.Q4,
          Q5_1 : req.body.Q5_1,
          Q5_2 : req.body.Q5_2,
          Q6 : req.body.Q6
        };

        User_Form.update({user: req.session.userid}, value)
        .exec(function(err , user_form){
            if(err){res.end(JSON.stringify(err));}
            else if (req.body.next == "下一步"){
                res.redirect("/files");
            }
            else if(req.body.back == "上一步"){
                res.redirect("/profile");
            }
            else{
                res.redirect("/form");
            }
        });
    },

    auto_saveForm: function (req, res){
      //console.log(req.Qid);
      //console.log(req.body.Qid);
      var value = {
        [req.body.Qid] : req.body.text
      };

      //console.log(value);
      User_Form.update({user: req.session.userid}, value)
      .exec(function(err , user_form){
        if(err){res.end(JSON.stringify(err));}
        res.end("ok");
      });
      
    },

    //DISC
    disc: function (req, res) {
        UserDISC.findOne({
            user: req.session.userid
        }).exec(function(err, disc){
            if(err){res.end(JSON.stringify(err));}
            return res.view("frontend/pages/userDisc", {
                disc: disc,
            });            
        });
    },
    //編輯DISC
    editDisc: function (req, res) {
        var value = {};
        var a =[ 0 , 0 , 0 , 0];
        for(var i = 1; i <= 10; i++){
            for (var j = 1; j <5 ; j++){ //計算動物
                if(req.body["q" + i] == j)
                    a[j-1] += 1;
            }
            var animal = ['老虎','孔雀','無尾熊','貓頭鷹'];
            value["a1"] = a[0] ;
            value["a2"] = a[1] ;
            value["a3"] = a[2] ;
            value["a4"] = a[3] ;
            value["animal"] = animal[a.indexOf(Math.max(a[0],a[1],a[2],a[3]))] ; //算動物最大值
            
            if(req.body["q" + i] == undefined)
                return res.end("測驗未完成");
            value["q" + i] = req.body["q" + i];
        }
        value["finished"] = 1; //未用到
        // window.alert('填寫完成');

        UserDISC.update({user: req.session.userid}, value)
        .exec(function (err, datas) {
            if(err){
                res.end(JSON.stringify(err));
            }
            else{
                res.redirect("/disc");
            }
        });
    },

    confirm:function(req,res){
        var value ={};
        if (req.session.userid) {
            UserFiles.findOne({
                user: req.session.userid
            })
            .exec(function (err, files) {
                if (err) {
                    res.end(JSON.stringify(err));
                }
                else {
                    
                    if(files.finished==1){
                        files.confirm = 1;
                        value.confirm =1;
                    }
                    UserFiles.update({user: req.session.userid}, value)
                    .exec(function (err, final_files) {
                        if(err){
                            res.end(JSON.stringify(err));
                        }else{
                            User.update({id: req.session.userid},{finished : 1})
                            .exec(function (err, user_data){
                                if (err) res.end(JSON.stringify(err));
                                User_Form.findOne({
                                    user: req.session.userid
                                })
                                .exec(function(err, user_form){
                                    if (err) res.end(JSON.stringify(err));
                                    UserDISC.findOne({
                                        user: req.session.userid
                                    })
                                    .exec(function(err, disc){
                                        if (err) res.end(JSON.stringify(err));
                                        User.findOne({
                                            id: req.session.userid
                                        })
                                        .exec(function(err, user){
                                            if (err) res.end(JSON.stringify(err));
                                            var save_data = {
                                                name : user.name,
                                                email : user.email,
                                                phone : user.phone,
                                                gender : user.gender,
                                                grade : user.grade,
                                                school : user.school,
                                                dept : user.dept,
                                                disc : disc.animal,
                                                reference : user.reference,
                                                survey : user.survey,
                                                Q1 : user_form.Q1,
                                                Q2 : user_form.Q2,
                                                Q3 : user_form.Q3,
                                                Q4 : user_form.Q4,
                                                Q5_1 : user_form.Q5_1,
                                                Q5_2 : user_form.Q5_2,
                                                Q6 : user_form.Q6
                                            };
                                            fs.readFile('credentials.json', (err, content) => {
                                                if (err) return console.log('Error loading client secret file:', err);
                                                // Authorize a client with credentials, then call the Google Drive API.
                                                authorize(JSON.parse(content), update_final_sheet, save_data);
                                            });  
                                            req.session.finished = 1;
                                            res.redirect("/finish");
                                        });

                                    });

                                });

                            });
                            
                        }
                    });                   
                }
            });
        }
    },

    
    
    //報名資料
    files: function (req, res) {
        var value = {};
        UserFiles.findOne({
            user: req.session.userid
        })
        .exec(function (err, files) {
            if (err) {
                res.end(JSON.stringify(err));
            }
            else {
                var f = 0; //判斷完成

                if( files.finished != 1){

                    files.finished = 0;
                    if (files.registrationUT != null){
                        f += 1;
                        files.registrationUT = CmsService.formatTime(files.registrationUT);
                    }
                    if (files.autobiographyUT != null){
                        f += 1;
                        files.autobiographyUT = CmsService.formatTime(files.autobiographyUT);
                    }
                }
                // if (files.receiptUT != null){
                //     f += 1;
                //     files.receiptUT = CmsService.formatTime(files.receiptUT);
                // }
                if(f == 2){
                    // files.allFiles = 1;
                    files.finished = 1;
                    value.finished = 1;
                }

                UserFiles.update({user: req.session.userid}, value)
                .exec(function (err, datas) {
                    if(err) {res.end(JSON.stringify(err));}
                    return res.view("frontend/pages/userFiles", {
                        files: files,
                    });
                });
            }
        });
    },
    //上傳學生證明
    uploadReg: function (req, res) {
        var value = {};
        //TODO: 系統開關
        var uploadOptions = {
            dirname: sails.config.appPath+"/assets/files/"+req.session.userid,
            saveAs: function (__newFileStream, cb) {
                var i = 0;
                var uploadFile = req.file("registration")._files[0].stream.filename;
                var newPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/"+uploadFile;
                var tmpPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/tmp.pdf";
                
                //檔名重複時重新命名舊檔案
                if (fs.existsSync(newPath)) {
                    fs.renameSync(newPath, tmpPath)
                }
                cb(null, __newFileStream.filename);
            },
        }

        req.file("registration").upload(uploadOptions, function (err, uploadedFiles) {
            if (err) 
                return res.end(JSON.stringify(err));
            //有上傳檔案
            if (uploadedFiles.length > 0) {
                //PDF檔
                if (uploadedFiles[0].type == "application/pdf") {    
                    if (uploadedFiles[0].size > 5 * 1024 * 1024) {
                        return res.end("檔案需小於5MB");
                    }
                    var url = uploadedFiles[0].fd;
                    var start = url.search("files") - 1;
                    url = url.slice(start);
                    url = url.replace(/\\/g, "/");
                    value.registration = url;
                    value.registrationUT = new Date();
                }
                //非PDF檔
                else {
                    fs.unlink(uploadedFiles[0].fd, function (err) {  
                        if (err) 
                            console.error(err) 
                    });  
                    return res.end("檔案格式錯誤");
                }      

                //取得舊檔案位址
                UserFiles.findOne({
                    user: req.session.userid
                })
                .exec(function (err, file) {
                    if (err)
                        res.end(JSON.stringify(err));
                    else {
                        var oldFile = file.registration;

                        UserFiles.update({id: file.id}, value)
                        .exec(function (err, datas) {
                            var uploadFile = req.file("registration")._files[0].stream.filename;
                            var newPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/"+uploadFile;
                            var tmpPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/tmp.pdf";

                            if (err) {
                                //刪除上傳檔案
                                fs.unlink(uploadedFiles[0].fd, function (err) {  
                                    if (err) 
                                        console.error(err) 
                                });  

                                //還原舊檔案
                                if (fs.existsSync(tmpPath)) {
                                    fs.renameSync(tmpPath, newPath)
                                }
                                res.end(JSON.stringify(err));
                            }
                            else {
                                if(oldFile != null){                     
                                    var filePath = sails.config.appPath + "/assets" + oldFile;

                                    //刪除舊檔案
                                    if (fs.existsSync(tmpPath)) {
                                        fs.unlink(tmpPath, function (err) {  
                                            if (err) 
                                                console.error(err) 
                                        }); 
                                    }
                                    else {
                                        fs.unlink(filePath, function (err) {  
                                            if (err) 
                                                console.error(err) 
                                        }); 
                                    }
                                }
                                if (!fs.existsSync(sails.config.appPath + "/.tmp/public/files/" + req.session.userid)){
                                    fs.mkdirSync(sails.config.appPath + "/.tmp/public/files/" + req.session.userid);
                                }
                                var source = fs.createReadStream(sails.config.appPath + "/assets" + datas[0].registration);
                                var desti = fs.createWriteStream(sails.config.appPath + "/.tmp/public" + datas[0].registration);
                                source.pipe(desti);
                                source.on('end',function() {
                                    source.close();
                                    res.redirect("/files");
                                });
                            }
                        });
                    }
                });                        
            }
            //沒上傳檔案
            else{
                return res.end("未上傳檔案");
            }
        });
    },
    //上傳自傳
    uploadAut: function (req, res) {
        var value = {};

        //TODO: 系統開關
        var uploadOptions = {
            dirname: sails.config.appPath+"/assets/files/"+req.session.userid,
            saveAs: function (__newFileStream, cb) {
                var i = 0;
                var uploadFile = req.file("autobiography")._files[0].stream.filename;
                var newPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/"+uploadFile;
                var tmpPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/tmp.pdf";
                
                //檔名重複時重新命名舊檔案
                if (fs.existsSync(newPath)) {
                    fs.renameSync(newPath, tmpPath)
                }
                cb(null, __newFileStream.filename);
            },
        }

        req.file("autobiography").upload(uploadOptions, function (err, uploadedFiles) {
            if (err) 
                return res.end(JSON.stringify(err));
            //有上傳檔案
            if (uploadedFiles.length > 0) {
                //PDF檔
                if (uploadedFiles[0].type == "application/pdf") {    
                    if (uploadedFiles[0].size > 5 * 1024 * 1024) {
                        return res.end("檔案需小於5MB");
                    }
                    var url = uploadedFiles[0].fd;
                    var start = url.search("files") - 1;
                    url = url.slice(start);
                    url = url.replace(/\\/g, "/");
                    value.autobiography = url;
                    value.autobiographyUT = new Date();
                }
                //非PDF檔
                else {
                    fs.unlink(uploadedFiles[0].fd, function (err) {  
                        if (err) 
                            console.error(err) 
                    });  
                    return res.end("檔案格式錯誤");
                }      

                //取得舊檔案位址
                UserFiles.findOne({
                    user: req.session.userid
                })
                .exec(function (err, file) {
                    if (err)
                        res.end(JSON.stringify(err));
                    else {
                        var oldFile = file.autobiography;

                        UserFiles.update({id: file.id}, value)
                        .exec(function (err, datas) {
                            var uploadFile = req.file("autobiography")._files[0].stream.filename;
                            var newPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/"+uploadFile;
                            var tmpPath = sails.config.appPath+"/assets/files/"+req.session.userid+"/tmp.pdf";

                            if (err) {
                                //刪除上傳檔案
                                fs.unlink(uploadedFiles[0].fd, function (err) {  
                                    if (err) 
                                        console.error(err) 
                                });  
                                
                                //還原舊檔案
                                if (fs.existsSync(tmpPath)) {
                                    fs.renameSync(tmpPath, newPath)
                                }
                                res.end(JSON.stringify(err));
                            }
                            else {
                                if(oldFile != null){                     
                                    var filePath = sails.config.appPath + "/assets" + oldFile;

                                    //刪除舊檔案
                                    if (fs.existsSync(tmpPath)) {
                                        fs.unlink(tmpPath, function (err) {  
                                            if (err) 
                                                console.error(err) 
                                        }); 
                                    }
                                    else {
                                        fs.unlink(filePath, function (err) {  
                                            if (err) 
                                                console.error(err) 
                                        }); 
                                    }
                                }
                                if (!fs.existsSync(sails.config.appPath + "/.tmp/public/files/" + req.session.userid)){
                                    fs.mkdirSync(sails.config.appPath + "/.tmp/public/files/" + req.session.userid);
                                }
                                var source = fs.createReadStream(sails.config.appPath + "/assets" + datas[0].autobiography);
                                var desti = fs.createWriteStream(sails.config.appPath + "/.tmp/public" + datas[0].autobiography);
                                source.pipe(desti);
                                source.on('end',function() {
                                    source.close();
                                    res.redirect("/files");
                                });
                            }
                        });
                    }
                });                        
            }
            //沒上傳檔案
            else{
                return res.end("未上傳檔案");
            }
        });
    },
};
