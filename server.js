let express = require('express');
let path = require('path');
let fs = require('fs');
let MongoClient = require('mongodb').MongoClient;
let app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get('/profile-picture', function (req, res) {
  const imgPath = path.join(__dirname, "images/profile-1.jpg");
  fs.access(imgPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error("Image not found:", err);
      return res.status(404).send({ error: "Profile picture not found" });
    }
    let img = fs.readFileSync(imgPath);
    res.writeHead(200, { 'Content-Type': 'image/jpg' });
    res.end(img, 'binary');
  });
});

let mongoUrlLocal = "mongodb://localhost:27017"; // No auth for local MongoDB
let mongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true };
let databaseName = "my-db";

app.post('/update-profile', function (req, res) {
  let userObj = req.body;

  MongoClient.connect(mongoUrlLocal, mongoClientOptions, function (err, client) {
    if (err) {
      console.error("MongoDB connection error:", err);
      return res.status(500).send({ error: "Failed to connect to database" });
    }

    let db = client.db(databaseName);
    userObj['userid'] = 1;
    let myquery = { userid: 1 };
    let newvalues = { $set: userObj };

    db.collection("users").updateOne(myquery, newvalues, { upsert: true }, function (err, result) {
      if (err) {
        console.error("Update error:", err);
        client.close();
        return res.status(500).send({ error: "Failed to update profile" });
      }
      client.close();
      res.send(userObj);
    });
  });
});

app.get('/get-profile', function (req, res) {
  let response = {};

  MongoClient.connect(mongoUrlLocal, mongoClientOptions, function (err, client) {
    if (err) {
      console.error("MongoDB connection error:", err);
      return res.status(500).send({ error: "Failed to connect to database" });
    }

    let db = client.db(databaseName);
    let myquery = { userid: 1 };

    db.collection("users").findOne(myquery, function (err, result) {
      if (err) {
        console.error("Query error:", err);
        client.close();
        return res.status(500).send({ error: "Failed to fetch profile" });
      }
      response = result;
      client.close();
      res.send(response ? response : {});
    });
  });
});

app.listen(3000, function () {
  console.log("app listening on port 3000!");
});
