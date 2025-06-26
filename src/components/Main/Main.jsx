import React, { useContext, useEffect, useRef, useState, useMemo } from 'react';
import './Main.css';
import { assets } from '../../assets/assets';
import { ChatContext } from '../../context/ChatContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const Main = ({ toggleSidebar }) => {
  const {
    messages, onSend, model, setModel,
    modelUsed, blocking, activeChatId
  } = useContext(ChatContext);

  const [input, setInput] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [doneTyping, setDoneTyping] = useState(true);

  const previousChatIdRef = useRef(null);
  const endOfMessagesRef = useRef(null);
  const typingStateRef = useRef({});

  const showResult = messages.length > 0;

  const lastAssistantMsg = useMemo(() => {
    return [...messages].reverse().find(m => m.role === 'assistant' && !m.loading && m.content);
  }, [messages]);

  const lastAssistantIndex = useMemo(() => {
    return messages.findIndex((m) => m === lastAssistantMsg);
  }, [messages, lastAssistantMsg]);

  const questionCount = messages.filter((m) => m.role === 'user').length;
  const maxQuestions = 10;
  const isLimitReached = questionCount >= maxQuestions;

  useEffect(() => {
    if (!lastAssistantMsg) return;
    const msgId = lastAssistantMsg.msgId;
    previousChatIdRef.current = activeChatId;
    const existing = typingStateRef.current[msgId];

    if (existing?.doneTyping) {
      setDisplayText(existing.displayText || lastAssistantMsg.content);
      setDoneTyping(true);
    } else {
      typingStateRef.current[msgId] = { displayText: '', doneTyping: false };
      setDisplayText('');
      setDoneTyping(false);
    }
  }, [activeChatId, lastAssistantMsg]);

  useEffect(() => {
    if (!lastAssistantMsg || doneTyping) return;
    const content = lastAssistantMsg.content;
    const msgId = lastAssistantMsg.msgId;
    let i = 0;

    const interval = setInterval(() => {
      i++;
      const current = content.slice(0, i);
      setDisplayText(current);
      typingStateRef.current[msgId].displayText = current;

      if (i >= content.length) {
        clearInterval(interval);
        typingStateRef.current[msgId].doneTyping = true;
        setDoneTyping(true);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [doneTyping, lastAssistantMsg]);

  useEffect(() => {
    if (doneTyping) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, displayText, doneTyping]);

  const handleSend = () => {
    if (input.trim() && !isLimitReached) {
      onSend(input);
      setInput('');
    }
  };

  const getDisplayModelName = (model) => {
    switch (model) {
      case 'mistralai/mistral-small':
      case 'mistral-small':
        return 'Mistral Small';
      case 'openai/gpt-3.5-turbo':
      case 'gpt-3.5-turbo':
        return 'GPT-3.5 Turbo';
      case 'anthropic/claude-3.5-sonnet':
      case 'claude-3.5-sonnet':
        return 'Claude 3.5';
      case 'google/gemini-pro':
      case 'gemini-pro':
        return 'Gemini Pro';
      case 'mistralai/mixtral-8x7b-instruct':
      case 'mixtral-8x7b-instruct':
        return 'Mixtral 8x7B';
      case 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo':
      case 'nous-hermes-2-mixtral-8x7b-dpo':
        return 'Hermes 2';
      case 'Chatbot':
        return 'Chatbot';
      default:
        return model || 'Unknown Model';
    }
  };


  return (
    <div className="main">
      <div className="nav">
        <div className="mobile-menu-toggle">
          <img
            src={assets.menu_icon}
            alt="menu"
            className="mobile-toggle-icon"
            onClick={toggleSidebar}
          />
        </div>
        <div className='nav-header'>Just-Ask ChatBot
        <div className="project-author">A project by Khan Arkam</div>  
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={assets.user_icon} alt="user" />
        </div>
      </div>

      <div className="main-body">
        <div className="main-container">
          {!showResult ? (
            <>
              <div className="greet">
                <p><span>Hello, Friend.</span></p>
                <p>How can I help you today?</p>
              </div>
              <div className="cards">
                <div className="card"><p>Suggest beautiful places for a road trip</p><img src={assets.compass_icon} alt="" /></div>
                <div className="card"><p>Summarize this concept: Water Irrigation</p><img src={assets.bulb_icon} alt="" /></div>
                <div className="card"><p>Brainstorm cool concepts for my story</p><img src={assets.message_icon} alt="" /></div>
                <div className="card"><p>Improve the readability of the following code</p><img src={assets.code_icon} alt="" /></div>
              </div>
            </>
          ) : (
            <div className="result">
              {messages.map((msg, index) => {
                const isLast = index === lastAssistantIndex;
                const isUser = msg.role === 'user';

                return (
                  <div
                    key={index}
                    className={`chat-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}
                  >
                    <div className="chat-inner">
                      <img
                        src={isUser ? assets.user_icon : assets.artificial_intelligence}
                        alt={isUser ? "user" : "ai"}
                        className="chat-icon"
                      />
                      <div className="bubble-content">
                        {msg.loading ? (
                          <div className="loader">
                            <div className="loader-line"></div>
                            <div className="loader-line"></div>
                            <div className="loader-line"></div>
                          </div>
                        ) : (
                          <div className="reply-box">
                            <ReactMarkdown
                              children={
                                isLast && !isUser
                                  ? displayText + (!doneTyping ? '▍' : '')
                                  : msg.content
                              }
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw]}
                            />
                          </div>
                        )}

                        {!isUser && (
                          <div className="reply-meta">
                            <p className="attempt-counter-inline">
                              ({messages.slice(0, index + 1).filter((m) => m.role === 'assistant').length}/10)
                            </p>
                            {msg.modelUsed && (
                              <p className="model-label-inline">
                                {getDisplayModelName(msg.modelUsed)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLimitReached && (
                <div className="chat-limit-message">
                  <p>🔒 You’ve reached the 10 message limit. Please start a new chat.</p>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>
          )}
        </div>

        <div className="main-bottom">
          <div className="search-box">
            <select value={model} onChange={(e) => setModel(e.target.value)} className="model-select">
              <option value="mistralai/mistral-small">Auto (Default: Mistral Small)</option>
              <option value="openai/gpt-3.5-turbo">GPT‑3.5 Turbo (Free)</option>
              <option value="anthropic/claude-3.5-sonnet">Claude 3.5 (Free Tier)</option>
              <option value="google/gemini-pro">Gemini Pro (Free Tier)</option>
              <option value="mistralai/mixtral-8x7b-instruct">Mixtral 8x7B (Free)</option>
              <option value="nousresearch/nous-hermes-2-mixtral-8x7b-dpo">Hermes 2 (Free)</option>
            </select>

            <input
              type="text"
              placeholder={isLimitReached ? "Chat limit reached. Please start a new conversation." : "Ask anything"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => !isLimitReached && e.key === 'Enter' && handleSend()}
              disabled={isLimitReached}
            />
            <div>
              <img src={assets.gallery_icon} alt="Gallery" />
              <img src={assets.mic_icon} alt="Mic" />
              {input?<img
                src={assets.send_icon}
                alt="Send"
                onClick={handleSend}
                className={`send-icon ${input.trim() === '' || isLimitReached ? 'hidden' : 'visible'}`}
                style={{ cursor: isLimitReached ? 'not-allowed' : 'pointer' }}
              />:null}
            </div>
          </div>
          <p className="bottom-info">
            The Chatbot may display inaccurate info, including about people, so double-check its responses.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Main;
