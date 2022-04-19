const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { ExpressPeerServer } = require('peer')
const peerServer = ExpressPeerServer(server, {
	debug: true,
})
const { v4: uuidv4 } = require('uuid')

app.use('/peerjs', peerServer)
app.use(express.static('public'))
app.set('view engine', 'ejs')
const urlencodedParser = express.urlencoded({extended: false});

app.get('/', (req, res) => {

	res.render('index')
	// res.redirect(`/${uuidv4()}`)
})

app.get('/create_room', (req, res) => {
	res.redirect(`/room_${uuidv4()}`)
})

app.get('/room_:room', (req, res) => {
	res.render('room', { roomId: req.params.room })
})

io.on('connection', (socket) => {
	// console.log(socket)
	socket.on('join-room', (roomId, userId, userName) => {
		socket.join(roomId)
		socket.to(roomId).broadcast.emit('user-connected', userId)

		socket.on('message', (message) => {
			console.log(userName)
			// console.log(message)
			io.to(roomId).emit('createMessage', message, userId, userName)
		})
		socket.on('disconnect', () => {
			socket.to(roomId).broadcast.emit('user-disconnected', userId)
		})
	})
})


app.post('/', urlencodedParser, (req, res) => {
	if (!req.body.roomId) {
		res.redirect('/create_room')
	} else {
		res.redirect(`/room_${req.body.roomId}`)
	}
})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => console.log(`Listening on port ${PORT}`))
