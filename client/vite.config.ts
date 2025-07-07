import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // server: {
  //   port: 3000,
  // } 
// server: {
//     port: 3019, // Change this to your desired port
//     allowedHosts: ['ejob.eaim.edu.sg']
//   },
})
