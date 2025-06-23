import React, { useState, useContext, useEffect } from 'react';
import './Sidebar.css';
import { assets } from '../../assets/assets';
import { ChatContext } from '../../context/ChatContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [extended, setExtended] = useState(false); // this is missing in your version
  const [warning, setWarning] = useState('');

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
      setWarning(`⚠️ You still have ${remaining} attempt${remaining > 1 ? 's' : ''} left in the current chat.`);
      setTimeout(() => setWarning(''), 4000);
    } else {
      setWarning('');
      startNewChat();
    }
  };

  // Close sidebar when route/chat changes (optional)
  useEffect(() => {
    if (isOpen) toggleSidebar(); // auto-close sidebar on mobile
  }, [activeChatId]);

  return (
    <div className={`sidebar ${extended ? 'expanded' : 'collapsed'} ${isOpen ? 'open' : ''}`}>
      <div className="top">
        <img
          onClick={() => setExtended(prev => !prev)}
          className="menu"
          src={assets.menu_icon}
          alt="menu"
        />

        <div className="new-chat" onClick={handleNewChat}>
          <img src={assets.plus_icon} alt="" />
          {extended && <p>New Chat</p>}
        </div>

        {extended && (
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

      {warning && (
        <div className="floating-warning-global">
          {warning}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
