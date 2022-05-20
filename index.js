const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const admin = require("firebase-admin");

const cors = require("cors");
require("dotenv").config();
const fileUpload = require("express-fileupload");
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0om44.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("nmsIT");
    const servicesCollection = database.collection("services");
    const usersCollection = database.collection("users");

    //-------------------------------------------------------

    // POST API to add services
    app.post("/services", async (req, res) => {
      const name = req.body.name;
      const details = req.body.details;
      const price = req.body.price;
      const pic = req.files.image;
      const picData = pic.data;
      const encodedPic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");
      const service = {
        name,
        details,
        price,
        image: imageBuffer,
      };
      const result = await servicesCollection.insertOne(service);
      res.json(result);
    });

    //-------------------------------------------------------

    // GET API (Get all services)
    app.get("/services", async (req, res) => {
      const cursor = servicesCollection.find({}).sort({ _id: -1 });
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const count = await cursor.count();
      let services;
      if (page) {
        services = await cursor
          .skip((page - 1) * size)
          .limit(size)
          .toArray();
      } else {
        services = await cursor.toArray();
      }
      res.send({
        count,
        services,
      });
    });

    // GET API (Get 4 New services)
    app.get("/newServices", async (req, res) => {
      const cursor = servicesCollection.find({}).sort({ _id: -1 });
      const newservices = (await cursor.limit(4).toArray()).reverse();
      res.send(newservices.reverse());
    });

    //Get api to get service with id
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await servicesCollection.findOne(query);
      res.json(result);
    });

    //-------------------------------------------------------
    // UPDATE API
    app.put("/services/:id", async (req, res) => {
      const id = req.params.id;
      const updatedRequest = req.body;
      const pic = req.files.image;
      const picData = pic.data;
      const encodedPic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updatedRequest.name,
          details: updatedRequest.details,
          price: updatedRequest.price,
          image: imageBuffer,
        },
      };
      const result = await servicesCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    //-------------------------------------------------------

    // DELETE API for cancel request
    app.delete("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await servicesCollection.deleteOne(query);
      res.json(result);
    });
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello From NMS IT Server!");
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
