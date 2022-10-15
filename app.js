require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const mysql = require('mysql');
const MySQLStore = require('express-mysql-session')(session);
const csrfMiddleware = csrf({
  cookie: true
});


// const admin = require("firebase-admin");

// const serviceAccount = require("./serviceAccountKey.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// admin.auth().listUsers().then(data=>{
//   console.log(data.users)
// })

// admin
//   .auth()
//   .getUserByPhoneNumber("+917484010954")
//   .then((userRecord) => {
//     // See the UserRecord reference doc for the contents of userRecord.
//     console.log(`Successfully fetched user data:  ${userRecord.toJSON()}`);
//   })
//   .catch((error) => {
//     console.log('Error fetching user data:', error);
//   });  


// let user = "";

const app = express();


app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
  extended: true
}));


// app.use(express.json());
app.use(bodyParser.json());


// mysql connection
let options = {
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: 'root',
  database: 'janshuvidha'
};

var connections = mysql.createConnection(options);
var sessionStore = new MySQLStore({
  expiration: 10800000,
  createDatabaseTable: true,
  schema: {
    tableName: 'sessiontbl',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
}, sessionStore);

connections.connect(function (err) {
  if (err) throw err;
});

app.use(session({
  key: "keyin",
  secret: "My Little Secret",
  resave: false,
  saveUninitialized: true
}))


app.get("/", function (req, res) {
  if (req.session.userinfo) {
    res.render("user", {
      loggeduser: req.session.userinfo
    });
  } else {
    res.render("home");
  }
});


app.get("/login", function (req, res) {
  if (req.session.userinfo) {
    res.redirect("user")
  } else {
    res.render("login");
  }
});

app.get("/logout", function (req, res) {
  req.session.destroy(function (err) {
    res.redirect("/")
  });
});

app.get("/user", function (req, res) {
  if (req.session.userinfo) {
    var requestedNumber = req.session.userinfo
    connections.query("SELECT * FROM user WHERE Number = \'" + requestedNumber + "\'", function (err, nameResult, fields) {
      if (err) throw err;
      nameResult = JSON.parse(JSON.stringify(nameResult));
      var username = nameResult[0].FullName;
      console.log(username + "  Logged in");
      console.log(username.length);
      if (username.length === 0) {
        res.render("user", {
          loggeduser: req.session.userinfo
        });
      } else {
        res.render("user", {
          loggeduser: username
        });
      }
    });
  } else {
    res.redirect("/login");
  }

});

app.get("/profile", function (req, res) {
  if (req.session.userinfo) {
    requestedNumber = req.session.userinfo;
    mysqlQuery = "SELECT * FROM user WHERE Number = \'" + requestedNumber + "\'"
    connections.query(mysqlQuery, function (err, result, fields) {
      if (err) throw err;
      result = JSON.parse(JSON.stringify(result))
      // console.log(result);
      res.render("profile", {
        userData: result
      });
    });
  } else {
    console.log("Login Route else");
    res.redirect("login");
  }
});

app.get("/updateProfile", function (req, res) {
  if (req.session.userinfo) {
    requestedNumber = req.session.userinfo;
    mysqlQuery = "SELECT * FROM user WHERE Number = \'" + requestedNumber + "\'"
    connections.query(mysqlQuery, function (err, result, fields) {
      if (err) throw err;
      result = JSON.parse(JSON.stringify(result))
      // console.log(result);
      res.render("updateProfile", {
        userData: result
      });
    });
  } else {
    console.log("Login Route else");
    res.redirect("login");
  }
});

app.get("/schemes", function (req, res) {
  res.render("schemes");
});


app.get("/logout", function (req, res) {
  res.redirect("/");
});


app.post("/updateProfile", function (req, res) {
  if (req.session.userinfo) {
    requestedNumber = req.session.userinfo;
    updateData = req.body
    console.log("fullname: " + req.body.fullname);
    console.log("email: " + req.body.email);
    console.log("number: " + req.body.phoneNumber);
    console.log("gender: " + req.body.gender);
    console.log("dateOfBirth: " + req.body.dateOfBirth);
    console.log("addressline1: " + req.body.addressline1);
    console.log("addressline2: " + req.body.addressline2);
    console.log("dateOfBirth: " + req.body.city);
    mysqlQuery = "UPDATE `janshuvidha`.`user` SET `FullName` = '" + req.body.fullname + "', `EmailID` = '" + req.body.email + "', `Gender` = '" + req.body.gender + "', `Education` = '" + req.body.education + "', `AddressLine1` = '" + req.body.addressline1 + "', `AddressLine2` = '" + req.body.addressline2 + "', `Postcode` = '" + req.body.postcode + "' WHERE (`Number` = '" + req.body.phoneNumber + "')"
    connections.query(mysqlQuery, function (err, insertResult, fields) {
      if (err) throw err;
      console.log("Into INSERT");
      console.log(insertResult);
    });
    res.redirect("/profile");
  }
  else {
    res.send("404 Not Authorized")
  }
});

app.post("/login", function (req, res) {
  // console.log(req.body);
  // user = req.body;
  requestedNumber = req.body.user.phoneNumber;
  // requestedUid = req.body.user.uid;
  // var verifyingUid = "";
  mysqlQuery = "SELECT * FROM user WHERE Number = \'" + requestedNumber + "\'"

  connections.query(mysqlQuery, function (err, result, fields) {
    if (err) throw err;
    result = JSON.parse(JSON.stringify(result))
    // verifyingUid = result[0].Uid;
    if (result.length === 0) {
      req.session.userinfo = requestedNumber;
      console.log(requestedNumber + "  Logged in");
      connections.query("INSERT INTO `janshuvidha`.`user` (`Number`) VALUES (\'" + requestedNumber + "\')", function (err, insertResult, fields) {
        if (err) throw err;
        console.log("Into INSERT");
        console.log(insertResult);
      res.redirect("user")
      });
    } else {
      req.session.userinfo = requestedNumber;
      res.redirect("user")
    }
  });
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});