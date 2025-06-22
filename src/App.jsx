import React, { useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Main from './components/Main/Main';
import ContextProvider from './context/ChatContext';
import './App.css';
const App = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ContextProvider>
      <div className="app-container">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
        <Main toggleSidebar={() => setSidebarOpen(prev => !prev)} />
      </div>
    </ContextProvider>
  );
};

export default App;
