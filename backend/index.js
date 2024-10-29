
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const mongoose = require('mongoose')
const app = express()
require('dotenv').config();

const utilities = require('./utilities')


// models
const userSchema = require('./models/UserSchema')
const User = mongoose.model('User', userSchema)

const groupChatSchema = require('./models/GroupChatSchema')
const GroupChat = mongoose.model('GroupChat', groupChatSchema)

const userGroupSchema = require('./models/UserGroupSchema')
const UserGroup = mongoose.model('UserGroup', userGroupSchema)


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







io.on('connection', socket => {
    console.log(`${socket.id} conncted`)



    socket.on('get-user-info-form-authID', async (data, callback) => {
        const user = await User.find({authID: data.authID}) 
        callback(user[0])
    })



    socket.on('sign-up', async (data, callback) => {
        const user = User({
            authID: data.user.uid,
            firstName: data.firstName,
            lastName: data.lastName,
            profile: data.profileImage,
            email: data.user.email
        })
        await user.save()
        callback(user)
    })




    socket.on('get-users-from-query', async (data, callback) => {
        const {query} = data
        const searchedUsers = await User.findByQuery(query)
        callback(searchedUsers)
    })


    socket.on('create-chat', async (data) => {
        const members = data.userIDs.map(item => {
            return { userID: item}
        })

        const groupChat = GroupChat({
            name: 'groupName',
            members,
            profile: 'groupProfile'
        })

        const groupPromises = []
        for (const user of groupChat.members) {
            const userGroup = UserGroup({
                userID: user.userID,
                groupID: groupChat._id
            })
            const p = userGroup.save()
            groupPromises.push(p)
        }
        
        await Promise.all(groupPromises)
        await groupChat.save()

    }) 


    socket.on('get-all-groupChats', async (data, callback) => {
        const searchedGroups = await UserGroup.getAllUserGroups(data.userID)
        callback(searchedGroups)
    })

    
    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`)
    })



    
})


app.get('/', (req, res) => {
    res.send('backend working...')
})

app.post('/findByQuery', async (req, res) => {
    // working as expected
    const query = req.body.query
    const response = await User.findByQuery(query)
    res.send(response)
})

app.post('/findAllGroups', async (req, res) => {
    const response = await UserGroup.getAllUserGroups(req.body.userID)
    res.send(response)
})


server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})