import React, { useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Main from './components/Main/Main';
import './App.css';

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <Main toggleSidebar={toggleSidebar} />
    </div>
  );
};

export default App;
