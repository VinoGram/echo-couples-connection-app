const { exec } = require('child_process')

const ports = [3001, 3002, 3003, 3004, 3005]

console.log('🔍 Checking for processes on ports:', ports.join(', '))

ports.forEach(port => {
  exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
    if (stdout) {
      const lines = stdout.trim().split('\n')
      lines.forEach(line => {
        const match = line.match(/LISTENING\s+(\d+)/)
        if (match) {
          const pid = match[1]
          exec(`taskkill /PID ${pid} /F`, (killError, killStdout) => {
            if (!killError) {
              console.log(`✅ Killed process ${pid} on port ${port}`)
            }
          })
        }
      })
    }
  })
})

setTimeout(() => {
  console.log('🎯 Port cleanup complete!')
}, 2000)