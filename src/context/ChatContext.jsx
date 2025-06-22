import { createContext, useState } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const ChatContext = createContext();

const ContextProvider = ({ children }) => {
  const MAX_QA = 10;
  const MAX_CHATS = 20;

  const [messages, setMessages] = useState([]);
  const [chatMap, setChatMap] = useState({});
  const [pastChats, setPastChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('openrouter/auto');
  const [modelUsed, setModelUsed] = useState('');
  const [blocking, setBlocking] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);

  const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

  const onSend = async (prompt) => {
    if (blocking) return;

    const userMsg = { role: 'user', content: prompt };
    const placeholder = {
      role: 'assistant',
      content: '',
      loading: true,
      msgId: uuidv4()
    };
    const newMsgs = [...messages, userMsg, placeholder];

    setMessages(newMsgs);

    if (!activeChatId) {
      const chatId = uuidv4();
      const title = prompt.slice(0, 40) + (prompt.length > 40 ? '...' : '');
      const newChat = { title, messages: deepClone(newMsgs), chatId };
      setChatMap((prev) => ({ ...prev, [chatId]: newChat }));
      setPastChats((prev) => [newChat, ...prev]);
      setActiveChatId(chatId);
    } else {
      setChatMap((prev) => {
        const updated = { ...prev };
        updated[activeChatId] = {
          ...updated[activeChatId],
          messages: deepClone(newMsgs)
        };
        return updated;
      });
    }

    if (newMsgs.filter((m) => m.role === 'user').length > MAX_QA) {
      setBlocking(true);
      const blocked = [...messages, userMsg, {
        role: 'assistant',
        content: 'Chat limit reached. Start a new chat.',
        loading: false,
        msgId: uuidv4()
      }];
      setMessages(blocked);
      return;
    }

    setLoading(true);

    try {
      console.log("📡 Sending to:", `${BACKEND_URL}/chat`);
      const res = await axios.post(`${BACKEND_URL}/chat`, { message: prompt, model });
      const content = res.data.reply.trim();
      const used = res.data.model || model;

      const finalMsgs = [...messages, userMsg, {
        role: 'assistant',
        content,
        loading: false,
        modelUsed: used.split('/').pop(),
        msgId: uuidv4()
      }];

      setMessages(finalMsgs);
      setModelUsed(used.split('/').pop());

      if (activeChatId) {
        setChatMap((prev) => {
          const updated = { ...prev };
          updated[activeChatId] = {
            ...updated[activeChatId],
            messages: deepClone(finalMsgs),
            firstResponseCache:
              !updated[activeChatId].firstResponseCache &&
              finalMsgs.filter((m) => m.role === 'assistant').length === 1
                ? finalMsgs.find((m) => m.role === 'assistant')?.content
                : updated[activeChatId].firstResponseCache
          };
          return updated;
        });

        setPastChats((prev) =>
          prev.map(chat =>
            chat.chatId === activeChatId
              ? {
                  ...chat,
                  messages: deepClone(finalMsgs),
                  firstResponseCache:
                    !chat.firstResponseCache &&
                    finalMsgs.filter((m) => m.role === 'assistant').length === 1
                      ? finalMsgs.find((m) => m.role === 'assistant')?.content
                      : chat.firstResponseCache
                }
              : chat
          )
        );
      }
    } catch (err) {
      const fallback = `Error talking to ${model === 'openrouter/auto' ? 'Chatbot' : model.split('/').pop()}`;
      const failedMsgs = [...messages, userMsg, {
        role: 'assistant',
        content: fallback,
        loading: false,
        modelUsed: model === 'openrouter/auto' ? 'Chatbot' : model.split('/').pop(),
        msgId: uuidv4()
      }];

      setMessages(failedMsgs);
      setModelUsed(model === 'openrouter/auto' ? 'Chatbot' : model.split('/').pop());

      if (activeChatId) {
        setChatMap((prev) => {
          const updated = { ...prev };
          updated[activeChatId] = {
            ...updated[activeChatId],
            messages: deepClone(failedMsgs)
          };
          return updated;
        });

        setPastChats((prev) =>
          prev.map(chat =>
            chat.chatId === activeChatId
              ? { ...chat, messages: deepClone(failedMsgs) }
              : chat
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    if (pastChats.length >= MAX_CHATS) {
      alert('🚫 You have reached the maximum chat limit (20).');
      return;
    }

    setMessages([]);
    setBlocking(false);
    setModelUsed('');
    setActiveChatId(null);
  };

  const loadChat = (chat) => {
    const fixedMsgs = chat.messages.map(m =>
      m.role === 'assistant' && m.loading ? { ...m, loading: false } : m
    );

    setMessages(fixedMsgs);
    setActiveChatId(chat.chatId);
    setBlocking(fixedMsgs.filter(m => m.role === 'user').length >= MAX_QA);
    setModelUsed('');
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        loading,
        model,
        setModel,
        modelUsed,
        blocking,
        pastChats,
        activeChatId,
        onSend,
        startNewChat,
        loadChat
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ContextProvider;
