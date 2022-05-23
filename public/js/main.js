// Подключаем библиотеки
const socket = io('/')
const videoGrid = document.getElementById('videoGrid')
const myVideo = document.createElement('video')

myVideo.muted = true

// Создаём подключение с сервером
var peer = new Peer()
const myPeer = new Peer(undefined, {
	path: '/peerjs',
	host: '/',
	port: '5000',
})

// Запрашиваем у пользователя имя пользователя
let user = prompt("Имя");

function getNameUser(name) {
	user = name;
}

const peers = {}
let myVideoStream
navigator.mediaDevices
	.getUserMedia({
		video: true,
		audio: true,
	})
	.then((stream) => {
		myVideoStream = stream
		addVideoStream(myVideo, stream)

		// Подключение пользователя к комнате
		socket.on('user-connected', (userId) => {
			connectToNewUser(userId, stream)
			alert('Somebody connected', userId)
		})

		// Получение картинки от камеры
		peer.on('call', (call) => {
			call.answer(stream)
			const video = document.createElement('video')
			call.on('stream', (userVideoStream) => {
				addVideoStream(video, userVideoStream)
			})
		})

		let text = $('input')

		// отлавливаем нажатие enter у пользователя для отправки сообщения
		$('html').keydown(function (e) {
			if (e.which == 13 && text.val().length !== 0) {
				// Отправляем сообщение на сервер
				socket.emit('message', text.val())
				text.val('')
			}
		})

		// Высвечиваем сообщение от пользователей на странице
		socket.on('createMessage', (message, userId, userName) => {
			console.log(userId, userName)
			$('ul').append(`<li >
								<span class="messageHeader">
									<div>${userName}</div>
									${new Date().toLocaleString('en-US', {
										hour: 'numeric',
										minute: 'numeric',
										hour12: true,
									})}
								</span>
								
								<span class="message">${message}</span>
							
							</li>`)
			scrollToBottom()
		})
	})

// Событие: Пользователь вышел с комнаты
socket.on('user-disconnected', (userId) => {
	if (peers[userId]) peers[userId].close()
})

peer.on('open', (id) => {
	socket.emit('join-room', ROOM_ID, id, user)
})

// Подключение нового пользователя
const connectToNewUser = (userId, stream) => {
	const call = peer.call(userId, stream)
	const video = document.createElement('video')
	call.on('stream', (userVideoStream) => {
		addVideoStream(video, userVideoStream)
	})
	call.on('close', () => {
		video.remove()
	})

	peers[userId] = call
}

// Добавить вывод изображения с камеры пользователя
const addVideoStream = (video, stream) => {
	video.srcObject = stream
	video.addEventListener('loadedmetadata', () => {
		video.play()
	})
	videoGrid.append(video)
}

// Автоматический сролл вниз в чате при появлении новых сообщений
const scrollToBottom = () => {
	var d = $('.mainChatWindow')
	d.scrollTop(d.prop('scrollHeight'))
}

// Функция мута и анмута пользователя
const muteUnmute = () => {
	const enabled = myVideoStream.getAudioTracks()[0].enabled
	if (enabled) {
		myVideoStream.getAudioTracks()[0].enabled = false
		setUnmuteButton()
	} else {
		setMuteButton()
		myVideoStream.getAudioTracks()[0].enabled = true
	}
}

// Отображение иконки мута
const setMuteButton = () => {
	const html = `
	  <i class="fas fa-microphone"></i>
	  <span>Mute</span>
	`
	document.querySelector('.mainMuteButton').innerHTML = html
}

// Отображение иконки размута
const setUnmuteButton = () => {
	const html = `
	  <i class="unmute fas fa-microphone-slash"></i>
	  <span>Unmute</span>
	`
	document.querySelector('.mainMuteButton').innerHTML = html
}

// Остановка и запуск видео (кнопка)
const playStop = () => {
	console.log('object')
	let enabled = myVideoStream.getVideoTracks()[0].enabled
	if (enabled) {
		myVideoStream.getVideoTracks()[0].enabled = false
		setPlayVideo()
	} else {
		setStopVideo()
		myVideoStream.getVideoTracks()[0].enabled = true
	}
}

// Отображение иконки стопа видео
const setStopVideo = () => {
	const html = `
	  <i class="fas fa-video"></i>
	  <span>Stop Video</span>
	`
	document.querySelector('.mainVideoButton').innerHTML = html
}

// Отображение иконки старта видео
const setPlayVideo = () => {
	const html = `
	<i class="stop fas fa-video-slash"></i>
	  <span>Play Video</span>
	`
	document.querySelector('.mainVideoButton').innerHTML = html
}
