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

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   // server: {
//   //   port: 3000,
//   // }
//   server: {
//     port: 3019, // Change this to your desired port
//     host: '0.0.0.0',
//     strictPort: true,
//     allowedHosts: true,
//     hmr: {
// 	    protocol: 'ws',
// 	    host: 'ejob.eaim.edu.sg',
// 	    port:3019,
//     },
//   },
// })
