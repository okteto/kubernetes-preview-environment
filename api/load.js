const { MongoClient } = require("mongodb");

const url = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME || 'root'}:${encodeURIComponent(process.env.MONGO_INITDB_ROOT_PASSWORD || process.env.MONGODB_PASSWORD)}@${process.env.MONGODB_HOST || 'mongodb'}:27017/${process.env.MONGO_INITDB_DATABASE || process.env.MONGODB_DATABASE || 'okteto'}?authSource=admin`;

async function insert(collection, data) {
  const d = require(data);
  d.results.forEach((doc) => {
    doc._id = doc.id;
  });
  
  try {
    await collection.insertMany(d.results);
  } catch (err) {
    if (err.code !== 11000) {
      throw err;
    }
    // Ignore duplicate key errors
  }
}

async function loadWithRetry() {
  try {
    const client = await MongoClient.connect(url, { 
      connectTimeoutMS: 300,
      socketTimeoutMS: 300,
    });

    const db = client.db(process.env.MONGO_INITDB_DATABASE || process.env.MONGODB_DATABASE || 'okteto');
    
    const promises = [];
    promises.push(insert(db.collection('movies'), "./data/movies.json"));
    promises.push(insert(db.collection('watching'), "./data/watching.json"));
  
    await Promise.all(promises);
    console.log('all loaded'); 
    process.exit(0);
  } catch (err) {
    console.error(`Error connecting, retrying in 300 msec: ${err}`);
    setTimeout(loadWithRetry, 300);
  }
};

loadWithRetry();