import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// Comment out or remove this line if index.css doesn't exist
// import './index.css'

console.log('Rendering main React component');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)