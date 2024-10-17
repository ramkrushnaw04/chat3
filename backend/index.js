
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const app = express()
require('dotenv').config();



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
console.log(port)
const dbURL = process.env.DB_URL






io.on('connection', socket => {
    console.log(`${socket.id} conncted`)

    

})


app.get('/', (req, res) => {
    res.send('backend working...')
})


server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})