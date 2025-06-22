require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.dbUsername}:${process.env.dbPassword}@cluster0.wwjbp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {

        const database = client.db('RoadmapDB')
        const usersCollection = database.collection('users')
        const postCollection = database.collection('posts')
        const commentCollection = database.collection('comments')

        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // get all post
        app.get('/', async (req, res) => {
            const result = await postCollection.find().toArray()
            res.send(result)
        })
        // post comment
        app.post('/add-comment', async (req, res) => {
            const data = req.body
            console.log(data);
            const result = await commentCollection.insertOne(data)
            console.log(result);
            res.send(result)
        })
        // get a single post
        app.get('/get-post/:id', async (req, res) => {
            const result = await postCollection.findOne({ '_id': new ObjectId(req.params.id) })
            res.send(result)
        })
        // get comments for a specific post
        app.get('/get-comments/:id', async (req, res) => {
            console.log(req.query.userId);
            const result = await commentCollection.find({ postId: req.params.id }).toArray()
            res.send(result)
        })


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
