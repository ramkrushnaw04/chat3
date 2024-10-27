
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const userSchema = require('./models/UserSchema')
const mongoose = require('mongoose')
const app = express()
require('dotenv').config();

// models
const User = mongoose.model('User', userSchema)


const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    },
    maxHttpBufferSize: 1e8
});

app.use(express.json())
app.use(cors({
    origin: '*'
}))



const port = process.env.PORT
const dbURL = process.env.DB_URL


mongoose.connect(dbURL)
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => console.error('Connection error:', error));


let onlineUser = new Set()




io.on('connection', socket => {
    console.log(`${socket.id} conncted`)

    socket.on('log-in', (data) => {
        console.log(data)
    })

    socket.on('sign-up', async (data) => {
        const user = User({
            authId: data.uid
        })
        await user.save()
    })

    
    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`)
    })
})


app.get('/', (req, res) => {
    res.send('backend working...')
})


server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})