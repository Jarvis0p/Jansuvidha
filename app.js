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
      if (username === null) {
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
      console.log(result);
      var username = result[0].FullName;
      if (username === null) {
        res.render("profile", {
          loggeduser: req.session.userinfo,
          userData: result
        });
      } else {
        res.render("profile", {
          loggeduser: username,
          userData: result
        });
      }
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
      var username = result[0].FullName;
      if (username === null) {
        res.render("updateProfile", {
          loggeduser: req.session.userinfo,
          userData: result
        });
      } else {
        res.render("updateProfile", {
          loggeduser: username,
          userData: result
        });
      }
    });
  } else {
    console.log("Login Route else");
    res.redirect("login");
  }
});

app.get("/allschemes", function (req, res) {
  mysqlQuery = "SELECT * FROM department"
  connections.query(mysqlQuery, function (err, result, fields) {
    if (err) throw err;
    result = JSON.parse(JSON.stringify(result))
    res.render("department", {
      department: result
    });
  });
});

app.get("/schemes/:department", function (req, res) {
  query = "SELECT * FROM department, scheme where department.DepartmentID = scheme.SchemeDept and department.DepartmentID =" + req.params.department
  console.log(query);
  connections.query(query, function (err, result, fields) {
    if (err) throw err;
    result = JSON.parse(JSON.stringify(result));
    console.log(result);
    res.render("schemesByCategory", {
      scheme: result
    });
  });
});

app.get("/apply/:scheme", function (req, res) {
  if (req.session.userinfo) {
    var requestedNumber = req.session.userinfo;
    connections.query("SELECT * FROM user WHERE Number = \'" + requestedNumber + "\'", function (err, nameResult, fields) {
      if (err) throw err;
      nameResult = JSON.parse(JSON.stringify(nameResult));
      var username = nameResult[0].FullName;
      connections.query("SELECT * FROM appliedschemes WHERE UserNumber = \'" + requestedNumber + "\'" + " and SchemeID =" + req.params.scheme, function (err, searchResult, fields) {
        if (err) throw err;
        searchResult = JSON.parse(JSON.stringify(searchResult));
        console.log(searchResult);
        if (searchResult.length === 0) {
          mysqlQuery = "INSERT INTO `janshuvidha`.`appliedschemes` (`UserNumber`, `SchemeID`) VALUES (\'" + requestedNumber + "\', \'" + req.params.scheme + "\')"
          console.log(mysqlQuery);
          connections.query(mysqlQuery, function (err, insertResult, fields) {
            if (err) throw err;
            console.log("Into INSERT");
            console.log(insertResult);
            res.render("thanks", {
              loggeduser: username,
            });
          });
        } else {
          res.render("registered", {
            loggeduser: username,
            application: searchResult
          });
        }
      });
    });
  } else {
    res.redirect("login");
  }
});

app.get("/user/login", function (req, res) {
  res.redirect("/login");
})

app.get("/user/schemes", function (req, res) {
  if (req.session.userinfo) {
    requestedNumber = req.session.userinfo;
    userQuery = "SELECT * FROM user WHERE Number = \'" + requestedNumber + "\'"
    connections.query(userQuery, function (err, result, fields) {
      if (err) throw err;
      result = JSON.parse(JSON.stringify(result))
      var username = result[0].FullName;
      if (result[0].FullName === null || result[0].EmailID === null || result[0].Gender === null || result[0].DOB === null || result[0].Education === null || result[0].AddressLine1 === null || result[0].Town === null || result[0].Postalcode === null || result[0].Area === null || result[0].Caste === null || result[0].DifferentlyAbledPercentage === null || result[0].IsStudent === null || result[0].IsBPL === null || result[0].Income === null) {
        res.redirect("/updateProfile");
      } else {
        userQuery = "SELECT * FROM scheme"
        connections.query(userQuery, function (err, schemeResult, fields) {
          if (err) throw err;
          schemeResult = JSON.parse(JSON.stringify(schemeResult));
          // filter
          var filterschemes = [];
          schemeResult.forEach(element => {
            var genderbool = (result[0].Gender === "MALE" && element.ForMales === "YES") || (result[0].Gender === "FEMALE" && element.ForFemales === "YES") || (result[0].Gender === "OTHERS" && element.ForOthers === "YES")
            var castebool = (result[0].Caste === "GENERAL" && element.ForGeneral === "YES") || (result[0].Caste === "OBC" && element.ForOBC === "YES") || (result[0].Caste === "SC" && element.ForSC === "YES") || (result[0].Caste === "ST" && element.ForST === "YES")
            var diffablebool = (result[0].DifferentlyAbledPercentage >= element.DifferentlyAbledCriteria)
            var studentbool = (result[0].IsStudent === "YES" ^ element.ForStudents === "NO")
            var incomebool = (result[0].IsBPL === "YES" && element.ForBPL === "YES") || (result[0].IsBPL === "NO" && (element.IncomeCriteria === -1 || element.IncomeCriteria >= result[0].Income))

            //filter statement
            if (genderbool && castebool && diffablebool && studentbool && incomebool)
              filterschemes.push(element);
          });
          res.render("schemes", {
            loggeduser: username,
            scheme: filterschemes
          });
        });
      }
    });
  } else {
    console.log("Login Route else");
    res.redirect("login");
  }
});


app.get("/logout", function (req, res) {
  res.redirect("/");
});

// jiggggggy editing
app.post("/updateProfile", function (req, res) {
  if (req.session.userinfo) {
    requestedNumber = req.session.userinfo;
    updateData = req.body
    console.log("fullname: " + req.body.fullname);
    console.log("email: " + req.body.email);
    console.log("number: " + req.body.phoneNumber);
    console.log("gender: " + req.body.gender);
    console.log("dateOfBirth: " + req.body.dateOfBirth);
    console.log("education: " + req.body.education);
    console.log("addressline1: " + req.body.addressline1);
    console.log("addressline2: " + req.body.addressline2);
    console.log("dateOfBirth: " + req.body.town);
    console.log("Area: " + req.body.area);
    console.log("postcode: " + req.body.postcode);
    console.log("caste: " + req.body.caste);
    console.log("diffable %: " + req.body.diffable);
    console.log("isstudent: " + req.body.isstudent);
    console.log("isbpl: " + req.body.isbpl);
    console.log("Income: " + req.body.Income);


    mysqlQuery = "UPDATE `janshuvidha`.`user` SET `FullName` = '" + req.body.fullname + "', `EmailID` = '" + req.body.email + "', `Gender` = '" + req.body.gender + "', `DOB` = '" + req.body.dateOfBirth + "', `Education` = '" + req.body.education + "', `AddressLine1` = '" + req.body.addressline1 + "', `AddressLine2` = '" + req.body.addressline2 + "', `Town` = '" + req.body.addressline1 + "', `Area` = '" + req.body.area + "', `PostalCode` = '" + req.body.postcode + "', `Caste` = '" + req.body.caste + "', `DifferentlyAbledPercentage` = '" + req.body.diffable + "', `Income` = '" + req.body.Income + "' WHERE (`Number` = '" + req.body.phoneNumber + "')"
    connections.query(mysqlQuery, function (err, insertResult, fields) {
      if (err) throw err;
      console.log("Into INSERT");
      console.log(insertResult);
      res.redirect("/profile");
    });
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



// admin routes
app.get("/admin", function (req, res) {
  mysqlQuery = "select * from appliedschemes, user, scheme, department where appliedschemes.userNumber = user.Number  and appliedschemes.SchemeID = scheme.SchemeID and scheme.SchemeDept = department.DepartmentID"
  connections.query(mysqlQuery, function (err, result, fields) {
    if (err) throw err;
    result = JSON.parse(JSON.stringify(result));
    res.render("admin-home",{
      userData: result
    })
  });
});

app.get("admin/addScheme",function(req,res){
  
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});