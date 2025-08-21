import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  //comment the followings line if you want to use the default port 5173
  server: {
    port: 3019, // Change this to your desired port
    allowedHosts: ['ejob.eaim.edu.sg']
  },
})
