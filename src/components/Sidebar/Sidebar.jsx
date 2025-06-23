// Sidebar.jsx
import React, { useContext } from 'react';
import './Sidebar.css';
import { assets } from '../../assets/assets';
import { ChatContext } from '../../context/ChatContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const {
    pastChats,
    startNewChat,
    loadChat,
    messages,
    activeChatId
  } = useContext(ChatContext);

  const userMsgCount = messages.filter(msg => msg.role === 'user').length;
  const remaining = 10 - userMsgCount;

  const handleNewChat = () => {
    if (remaining > 0 && activeChatId) {
      alert(`⚠️ You still have ${remaining} attempt${remaining > 1 ? 's' : ''} left in the current chat.`);
    } else {
      startNewChat();
    }
    setIsOpen(false);
  };

  return (
    <div className={`sidebar ${extended ? 'expanded' : 'collapsed'} ${isOpen ? 'open' : ''}`}>
      <div className="top">
        <img
          onClick={() => setIsOpen(prev => !prev)}
          className="menu"
          src={assets.menu_icon}
          alt="menu"
        />

        <div className="new-chat" onClick={handleNewChat}>
          <img src={assets.plus_icon} alt="" />
          {isOpen && <p>New Chat</p>}
        </div>

        {isOpen && (
          <div className="recent">
            <p className="recent-title">Recent</p>
            {pastChats.map(chat => (
              <div key={chat.chatId} className="recent-entry" onClick={() => { loadChat(chat); setIsOpen(false); }}>
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
          {isOpen && <p>Help</p>}
        </div>
        <div className="bottom-item recent-entry">
          <img src={assets.history_icon} alt="" />
          {isOpen && <p>Activity</p>}
        </div>
        <div className="bottom-item recent-entry">
          <img src={assets.setting_icon} alt="" />
          {isOpen && <p>Settings</p>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
