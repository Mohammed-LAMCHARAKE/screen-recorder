const video = document.querySelector('video')
const recordedVideo = document.querySelector('.recorded-video-template')
const startBtn = document.querySelector('.start-btn')
const pauseBtn = document.querySelector('.pause-btn')
const stopBtn = document.querySelector('.stop-btn')
const downloadBtn = document.querySelector('.download-btn')
// ---------------------------------------------------------------------------
let mediaStream = null
let mic = null
let recorder = null
let buffer = []
// ---------------------------------------------------------------------------

startBtn.addEventListener('click', async (ev) => {
  if (recorder?.state === 'inactive' || recorder === null) {
    await startRecording()
    startBtn.classList.add('hidden')
    pauseBtn.classList.remove('hidden')
    recordedVideo.classList.add('hidden')
    startTimer()
  } else {
    recorder.resume()
    video.play()
    startTimer()
    startBtn.classList.add('hidden')
    pauseBtn.classList.remove('hidden')
  }
  stopBtn.classList.remove('hidden')
})

pauseBtn.addEventListener('click', (ev) => {
  recorder.pause()
  video.pause()
  stopTimer()
  pauseBtn.classList.add('hidden')
  startBtn.classList.remove('hidden')
})

stopBtn.addEventListener('click', (ev) => {
  stopRecording()
  stopTimer()
  pauseBtn.classList.add('hidden')
  startBtn.classList.add('hidden')
  video.classList.add('hidden')
})
// ---------------------------------------------------------------------------

async function setupStream() {
  try {
    mediaStream = await navigator.mediaDevices.getDisplayMedia({
      // video: { width: 3840, height: 2160 }, //4K
      video: { width: 1920, height: 1080 },
      audio: { echoCancellation: true, noiseSuppression: true }
    })
    let answer = prompt('Do you want to use your mic ? Y/N', 'Y')?.toUpperCase()
    if (answer === 'Y')
      mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      })

    video.srcObject = mediaStream
    video.play()
  } catch (ex) {}
}

async function startRecording() {
  await setupStream()

  let combinedStream = mic
    ? new MediaStream([...mediaStream.getTracks(), ...mic?.getTracks?.()])
    : new MediaStream([...mediaStream?.getTracks()])
  recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' })
  // this is just used when the user hit stop sharing accedently so we can intercept onstop event
  mediaStream.getTracks().forEach((track) =>
    track.addEventListener('ended', () => {
      stopRecording()
      stopTimer()
    })
  )
  recorder.ondataavailable = (ev) => buffer.push(ev.data)
  recorder.onstop = (ev) => stopRecording()
  recorder.start()

  pauseBtn.classList.remove('hidden')
  startBtn.classList.add('hidden')
}

function stopRecording() {
  if (recorder.state != 'inactive') recorder.stop()
  pauseBtn.classList.add('hidden') // when stop sharing clicked hide this
  recordedVideo.src = URL.createObjectURL(new Blob(buffer, { type: 'video' }))
  recordedVideo.onloadeddata = async (ev) => await video.play()
  recordedVideo.load()
  recordedVideo.setAttribute('controls', 'true')
  downloadBtn.classList.remove('hidden')
  stopBtn.classList.add('hidden')
  downloadBtn.onclick = () => downloadVideo()
  mediaStream.getTracks().forEach((track) => track.stop())
  mic?.getTracks().forEach((audio) => audio.stop())
  recordedVideo.classList.remove('hidden')
  video.classList.add('hidden')
}

function downloadVideo() {
  let blob = new Blob(buffer, { type: 'video/mp4' })
  filename = prompt('Name your video')
  buffer = []
  let file = document.createElement('a')
  file.href = URL.createObjectURL(blob, { type: 'video/mp4' })
  file.setAttribute('download', `${filename || 'video'}.mp4`)
  file.click()
  downloadBtn.classList.add('hidden')
  window.onbeforeunload = null
  window.location.reload()
}

// ------------------------- Chrono Implementation --------------------------------

let chrono = document.querySelector('#chrono'),
  sec = 0,
  min = 0,
  hrs = 0,
  timer

function tick() {
  sec++
  if (sec >= 60) {
    sec = 0
    min++
    if (min >= 60) {
      min = 0
      hrs++
    }
  }
}

function add() {
  tick()
  chrono.children[0].innerText =
    (hrs > 9 ? hrs : '0' + hrs) +
    ':' +
    (min > 9 ? min : '0' + min) +
    ':' +
    (sec > 9 ? sec : '0' + sec)
  startTimer()
}

function startTimer() {
  timer = setTimeout(add, 1000)
  chrono.classList.remove('hidden')
}

function stopTimer() {
  clearTimeout(timer)
}

function resetTimer() {
  chrono.children[0].innerText = '00 : 00 : 00'
  seconds = 0
  minutes = 0
  hrs = 0
  clearTimeout(timer)
  chrono.classList.add('hidden')
}
