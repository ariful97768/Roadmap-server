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
            let query = req.query.status
            const result = await postCollection.find((query === 'all' ? {} : { status: query })).toArray()
            res.send(result)
        })
        // post comment
        app.post('/add-comment', async (req, res) => {
            const data = req.body
            const result = await commentCollection.insertOne(data)
            res.send(result)
        })
        // get a single post
        app.get('/get-post/:id', async (req, res) => {
            const result = await postCollection.findOne({ '_id': new ObjectId(req.params.id) })
            res.send(result)
        })
        // get comments for a specific post
        app.get('/get-comments/:id', async (req, res) => {
            const result = await commentCollection.find({ postId: req.params.id }).toArray()

            let sortedData = result.filter(d => d.replyTo === null)
            let finalData = sortedData.map(firstLevelData => {
                let replyData = result
                    .filter(d => String(d.replyTo) === String(firstLevelData._id))
                    .map(secondLevelData => {
                        let thirdLevelReply = result.filter(d => String(d.replyTo) === String(secondLevelData._id))
                        return {
                            ...secondLevelData,
                            replies: thirdLevelReply
                        }
                    })
                return {
                    ...firstLevelData,
                    replies: replyData
                }
            })
            res.send(finalData)
        })
        // update comment
        app.patch('/update-comment/:id', async (req, res) => {
            const data = req.body
            const result = await commentCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { comment: data.comment } })
            res.send(result)
        })
        // upvote
        app.patch('/vote/:id', async (req, res) => {
            let updateOps;
            const post = await postCollection.findOne({ _id: new ObjectId(req.params.id) })
            if (post.upvotedUserIds?.includes(req.query.userId)) {
                updateOps = {
                    $pull: { upvotedUserIds: req.query.userId },
                    $inc: { upvotes: -1 }
                }
            } else {
                updateOps = {
                    $addToSet: { upvotedUserIds: req.query.userId },
                    $inc: { upvotes: 1 }
                }
            }

            const result = await postCollection.updateOne(
                { _id: new ObjectId(req.params.id) },
                updateOps
            )
            res.send(result)
            // console.log(req.query.userId);
        })

        // delete comment
        app.delete('/delete-comment/:id', async (req, res) => {
            const result = await commentCollection.deleteOne({ _id: new ObjectId(req.params.id) })
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
