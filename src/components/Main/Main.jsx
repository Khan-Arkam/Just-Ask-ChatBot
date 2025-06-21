import React, { useContext, useEffect, useRef, useState, useMemo } from 'react';
import './Main.css';
import { assets } from '../../assets/assets';
import { ChatContext } from '../../context/ChatContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const Main = () => {
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

  // Chat switch reset + rehydrate assistant typing state
  useEffect(() => {
    if (!lastAssistantMsg) return;

    const msgId = lastAssistantMsg.msgId;
    previousChatIdRef.current = activeChatId;

    const existing = typingStateRef.current[msgId];
    if (existing?.doneTyping) {
      setDisplayText(existing.displayText || lastAssistantMsg.content);
      setDoneTyping(true);
    } else {
      typingStateRef.current[msgId] = {
        displayText: '',
        doneTyping: false
      };
      setDisplayText('');
      setDoneTyping(false);
    }
  }, [activeChatId, lastAssistantMsg]);

  // Typing animation effect
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

  // Auto scroll
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

  return (
    <div className="main">
      <div className="nav">
        <p>Chatbot</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={assets.user_icon} alt="user" />
        </div>
      </div>

      <div className="main-container">
        {!showResult ? (
          <>
            <div className="greet">
              <p><span>Hello, Arkam.</span></p>
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
              return (
                <div key={index} className={msg.role === 'user' ? 'user-query' : 'ai-reply'}>
                  <img
                    src={msg.role === 'user' ? assets.user_icon : assets.artificial_intelligence}
                    alt={msg.role}
                  />
                  <div className="reply-container">
                    {msg.role === 'assistant' && msg.loading ? (
                      <div className="loader">
                        <div className="loader-line"></div>
                        <div className="loader-line"></div>
                        <div className="loader-line"></div>
                      </div>
                    ) : (
                      <div className="reply-box">
                        <ReactMarkdown
                          children={
                            isLast
                              ? displayText + (!doneTyping ? '▍' : '')
                              : msg.content
                          }
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                        />
                      </div>
                    )}
                    {msg.role === 'assistant' && (
                      <div className="reply-meta">
                        <p className="attempt-counter-inline">
                          ({messages.slice(0, index + 1).filter((m) => m.role === 'assistant').length}/{maxQuestions})
                        </p>
                        {msg.modelUsed && (
                          <p className="model-label-inline">
                            {msg.modelUsed === 'Chatbot' ? 'Chatbot' : msg.modelUsed}
                          </p>
                        )}
                      </div>
                    )}
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

        <div className="main-bottom">
          <div className="search-box">
            <select value={model} onChange={(e) => setModel(e.target.value)} className="model-select">
              <option value="openrouter/auto">Auto (Recommended)</option>
              <option value="openai/gpt-3.5-turbo">GPT‑3.5 Turbo (Free)</option>
              <option value="openai/gpt-4">GPT‑4 (Paid)</option>
              <option value="anthropic/claude-3.5-sonnet">Claude 3.5 (Paid)</option>
              <option value="mistralai/mistral-small">Mistral Small (Free)</option>
              <option value="nousresearch/nous-hermes-2-mixtral-8x7b-dpo">Hermes 2 (Free)</option>
              <option value="mistralai/mixtral-8x7b-instruct">Mixtral 8x7B (Open)</option>
              <option disabled value="google/gemini-pro">Gemini Pro (Unavailable)</option>
              <option disabled value="meta-llama/llama-3-8b-instruct:free">LLaMA 3 8B (Unavailable)</option>
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
              <img
                src={assets.send_icon}
                alt="Send"
                onClick={handleSend}
                className={`send-icon ${input.trim() === '' || isLimitReached ? 'hidden' : 'visible'}`}
                style={{ cursor: isLimitReached ? 'not-allowed' : 'pointer' }}
              />
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
