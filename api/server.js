const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();

const url = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME || 'root'}:${encodeURIComponent(process.env.MONGO_INITDB_ROOT_PASSWORD || process.env.MONGODB_PASSWORD)}@${process.env.MONGODB_HOST || 'mongodb'}:27017/${process.env.MONGO_INITDB_DATABASE || process.env.MONGODB_DATABASE || 'okteto'}?authSource=admin`;

async function startWithRetry() {
  try {
    const client = await MongoClient.connect(url, { 
      connectTimeoutMS: 1000,
      socketTimeoutMS: 1000,
    });

    const db = client.db(process.env.MONGO_INITDB_DATABASE || process.env.MONGODB_DATABASE || 'okteto');

    app.listen(8080, () => {
      app.get("/api/healthz", (req, res, next) => {
        res.sendStatus(200)
        return;
      });

      app.get("/api/movies", (req, res, next) => {
        console.log(`GET /api/movies`)
        db.collection('movies').find().toArray().then(results => {
          res.json(results);
        }).catch(err => {
          console.log(`failed to query movies: ${err}`);
          res.json([]);
        });
      });

      app.get("/api/watching", (req, res, next) => {
        console.log(`GET /api/watching`)
        db.collection('movies').find().toArray().then(results => {
          res.json(results);
        }).catch(err => {
          console.log(`failed to query watching: ${err}`);
          res.json([]);
        });
      });

      console.log("Server running on port 8080.");
    });
  } catch (err) {
    console.error(`Error connecting, retrying in 1 sec: ${err}`);
    setTimeout(startWithRetry, 1000);
  }
};

startWithRetry();