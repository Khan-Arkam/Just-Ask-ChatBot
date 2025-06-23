import React, { useState, useContext, useEffect } from 'react';
import './Sidebar.css';
import { assets } from '../../assets/assets';
import { ChatContext } from '../../context/ChatContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const isMobile = window.innerWidth <= 600;
  const [extended, setExtended] = useState(false);
  const [warning, setWarning] = useState('');

  const {
    pastChats,
    startNewChat,
    loadChat,
    messages,
    activeChatId
  } = useContext(ChatContext);

  const remaining = 10 - messages.filter(msg => msg.role === 'user').length;

  const handleNewChat = () => {
    if (remaining > 0 && activeChatId) {
      setWarning(`⚠️ You still have ${remaining} attempt${remaining > 1 ? 's' : ''} left in the current chat.`);
      setTimeout(() => setWarning(''), 4000);
    } else {
      setWarning('');
      startNewChat();
    }
  };

  useEffect(() => {
    if (isMobile && isOpen && !warning) {
      toggleSidebar();
    }
  }, [activeChatId, warning]);

  const handleToggleClick = () => {
    isMobile ? toggleSidebar() : setExtended(prev => !prev);
  };

  useEffect(() => {
    if (isMobile) setExtended(true);
  }, []);

  return (
    <div className={`sidebar ${extended ? 'expanded' : 'collapsed'} ${isOpen ? 'open' : ''}`}>
      {!isMobile && (
        <img
          onClick={toggleSidebar}
          className="mobile-toggle-icon"
          src={assets.close_icon}
          alt="close"
        />
      )}

      <div className="top">
        <div className="new-chat" onClick={handleNewChat}>
          <img src={assets.plus_icon} alt="" />
          {(extended || isMobile) && <p>New Chat</p>}
        </div>

        {(extended || isMobile) && (
          <div className="recent">
            <p className="recent-title">Recent</p>
            {pastChats.map((chat) => (
              <div key={chat.chatId} className="recent-entry" onClick={() => loadChat(chat)}>
                <img src={assets.message_icon} alt="" />
                <p>{chat.title || 'Untitled'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bottom">
        <div className="bottom-item recent-entry">
          <img src={assets.question_icon} alt="" />
          {extended && <p>Help</p>}
        </div>
        <div className="bottom-item recent-entry">
          <img src={assets.history_icon} alt="" />
          {extended && <p>Activity</p>}
        </div>
        <div className="bottom-item recent-entry">
          <img src={assets.setting_icon} alt="" />
          {extended && <p>Settings</p>}
        </div>
      </div>

      {warning && <div className="floating-warning-global">{warning}</div>}
    </div>
  );

};

export default Sidebar;
