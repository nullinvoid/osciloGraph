window.addEventListener('load', () => {
//  document.getElementById('load').style.opacity = 0
})

const ctx = document.querySelector('#osciloGraph').getContext('2d');
ctx.translate(0, ctx.canvas.height/2)
ctx.scale(1, -1)
ctx.lineWidth = 0.1;
ctx.lineCap = 'round'
ctx.lineJoin = 'round'
ctx.strokeStyle = '#00ff00'
ctx.filter = 'blur(0.2px)'

const Xlimits = [0, ctx.canvas.width]
const Ylimits = [-ctx.canvas.height/2, ctx.canvas.height/2]

const checkedEl = name => document.querySelector(`input[name="${name}"]:checked`)

function getPolarity() {
  const value = checkedEl('polarity').value
  return value != 'random' ? value
  : Math.round( Math.random() ) ? 1 : -1
}

function getAmplitude() {
  const value = checkedEl('amplitude').value
  return value != 'random' ? value : Math.round( Math.random()*30 )
}

function getFrequency() {
  const value = checkedEl('frequency').value
  return value != 'random' ? value : Math.round( Math.random()*9+1 )
}

function getImpulse() {
  const impulse = checkedEl('impulse').value;
  return ({
    'rectangular': drawRImpulse,
    'triangular': drawTImpulse,
    'random': [drawRImpulse, drawTImpulse][Math.round(Math.random())]
  })[impulse]
}

async function renderCanvas() {
  const period = 1/getFrequency()*Xlimits[1]
  const pauseT = period/2
  const impulseT = period/2
  const duration = 2000/(Xlimits[1]/pauseT)

  const polarity = getPolarity()
  const amplitude = polarity*getAmplitude()/30*Ylimits[1]

  const drawImpulse = getImpulse()

  ctx.beginPath()
  await (async function rec(startX) {
    if(startX+pauseT >= Xlimits[1]) {
      await drawPause({period: pauseT , startX, duration: duration})
      return
    }
    await drawPause({period: pauseT, startX, duration: duration})
    await drawImpulse({period: impulseT, amplitude, startX: impulseT+startX, duration: duration})
    await rec(period + startX)
  })(0)

  renderCanvas()
}
renderCanvas()

function drawPause({period, startX, duration}) {
  return getAnimate(duration, progress => {
    const stepX = period*progress + startX
    ctx.lineTo(stepX, 0)
    ctx.stroke()
    ctx.clearRect(stepX-15, Ylimits[0], 15, Ylimits[1]*2)
  })
}

function drawRImpulse({period, amplitude, startX, duration}) {
  return getAnimate(duration, progress => {
    const stepX = period*progress + startX
    ctx.lineTo(stepX, amplitude)
    ctx.stroke()
    ctx.clearRect(stepX-15, Ylimits[0], 15, Ylimits[1]*2)
  })
}

function drawTImpulse({period, amplitude, startX, duration}) {
  return getAnimate(duration/2, progress => {
    const stepX = (period*progress)/2 + startX
    ctx.lineTo( stepX, amplitude*progress )
    ctx.stroke()
    ctx.clearRect(stepX-15, Ylimits[0], 15, Ylimits[1]*2)
  })
  .then(() => getAnimate(duration/2, progress => {
    const stepX = (period*progress)/2 + startX + period/2
    ctx.lineTo( stepX, amplitude*(1-progress) )
    ctx.stroke()
    ctx.clearRect(stepX-20, Ylimits[0], 20, Ylimits[1]*2)
  }))
}

function getAnimate(duration, draw) {
  const start = performance.now()

  return new Promise(resolve => {
    function frame(time) {
      const progress = time - start
      if (progress >= duration) {
        resolve( draw(1) )
        return
      }
      draw(progress/duration)
      requestAnimationFrame(frame)
    }
    frame(start)
  })
}
