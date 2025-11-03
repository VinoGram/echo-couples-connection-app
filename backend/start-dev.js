const { spawn } = require('child_process')
const getPort = require('get-port')

async function startDev() {
  try {
    // Try to get an available port starting from 3001
    const port = await getPort({ port: [3001, 3002, 3003, 3004, 3005] })
    
    console.log(`🚀 Starting backend on port ${port}`)
    
    // Update frontend API URL if needed
    const fs = require('fs')
    const path = require('path')
    const apiPath = path.join(__dirname, '../frontend/src/lib/api.ts')
    
    if (fs.existsSync(apiPath)) {
      let apiContent = fs.readFileSync(apiPath, 'utf8')
      const currentUrl = apiContent.match(/const API_BASE_URL = '([^']+)'/)?.[1]
      const newUrl = `http://localhost:${port}/api`
      
      if (currentUrl !== newUrl) {
        apiContent = apiContent.replace(
          /const API_BASE_URL = '[^']+'/,
          `const API_BASE_URL = '${newUrl}'`
        )
        fs.writeFileSync(apiPath, apiContent)
        console.log(`📝 Updated frontend API URL to ${newUrl}`)
      }
    }
    
    // Start Next.js with the available port
    const nextProcess = spawn('npx', ['next', 'dev', '-p', port.toString()], {
      stdio: 'inherit',
      shell: true
    })
    
    nextProcess.on('error', (error) => {
      console.error('Failed to start server:', error)
    })
    
  } catch (error) {
    console.error('Error finding available port:', error)
    process.exit(1)
  }
}

startDev()