'use client';

import React, { useState, useRef, useEffect, useContext } from 'react';
import clsx from 'clsx';
import { ChatBubble } from './components/chat-bubble';
import { useHistory } from 'react-router';
import IconButton from '@commercetools-uikit/icon-button';
import {
  SpeechBubbleIcon,
  CloseIcon,
  SparklesIcon,
} from '@commercetools-uikit/icons';
import styles from './index.module.css';
import * as jose from 'jose';
import { useChat } from '@ai-sdk/react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';

interface AiAssistantProps {
  minimized?: boolean;
  className?: string;
}

const url =
  'https://service-aaldnxp0z4lu69ssnnrhwg95.us-central1.gcp.2.sandbox.commercetools.app/chat?isAdmin=true';

async function signWithJose(jwtKey: string) {
  const payload = {
    isAdmin: 'true',
  };

  // Create a secret key (in production, generate and store this securely)
  const secretKey = new TextEncoder().encode(jwtKey);

  // Sign the payload
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .setIssuedAt()
    .sign(secretKey);

  return jwt;
}

export const AiAssistant = ({
  minimized = false,
  className = '',
}: AiAssistantProps) => {
  const [isOpen, setIsOpen] = useState(!minimized);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const router = useHistory();
  const [token, setToken] = useState<string>('');
  const { environment }: { environment: { JWT_TOKEN: string } } = useApplicationContext();

  // Generate token on component mount
  useEffect(() => {
    const generateToken = async () => {
      try {
        const generatedToken = await signWithJose(environment?.JWT_TOKEN);
        setToken(generatedToken);
      } catch (error) {
        console.error('Failed to generate token:', error);
      }
    };

    generateToken();
  }, []);

  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    generateId: () => {
      return new Date().toISOString();
    },

    api: `${url}`,
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},

    onToolCall: ({ toolCall }) => {
      switch (toolCall.toolName) {
        case 'navigateToProduct':
          const { sku } = toolCall.args as { sku?: string };
          if (sku) {
            router.push(`/slug/p/${encodeURIComponent(sku)}`);
            return { navigatedTo: `/slug/p/${encodeURIComponent(sku)}` };
          }
          break;
        case 'navigateToProductList':
          const { categoryKey } = toolCall.args as { categoryKey?: string };
          if (categoryKey) {
            router.push(`/${encodeURIComponent(categoryKey)}`);
          }
          break;
        case 'navigateToSearchResults':
          const { searchQuery } = toolCall.args as { searchQuery?: string };
          if (searchQuery) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
          }
          break;
        case 'navigateToCart':
          router.push('/cart');
          break;
        case 'navigateToCheckout':
          router.push('/checkout');
          break;
        default:
          break;
      }
    },
  });

  console.log('status', status);

  // Scroll to bottom of chat container when messages change
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={clsx(styles.assistantContainer, className)}>
      {/* Toggle button - only shown when minimized */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className={styles.toggleButton}>
          <span className={styles.iconWrapper}>
            <SpeechBubbleIcon size="20" />
          </span>
        </button>
      )}

      {/* Chat container */}
      {isOpen && (
        <div className={styles.chatContainer}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <span className={styles.chatHeaderText}>AI Assistant</span>
            <IconButton
              label="Close"
              onClick={() => setIsOpen(false)}
              className={styles.closeButton}
              icon={<CloseIcon size="20" color="primary" />}
            >
              <CloseIcon size="20" color="primary" />
            </IconButton>
          </div>

          {/* Messages container */}
          <div ref={chatContainerRef} className={styles.messagesContainer}>
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className={styles.welcomeMessage}>
                <p>Hello! I'm your AI assistant. How can I help you today?</p>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                isUserMessage={message.role === 'user'}
              >
                {message.parts.map((part, partIndex) => {
                  if (part.type === 'text') {
                    return (
                      <div key={partIndex} className={styles.messageBubble}>
                        {part.text}
                      </div>
                    );
                  }
                  return null;
                })}
              </ChatBubble>
            ))}

            {/* Loading indicator */}
            {status !== 'ready' && status !== 'error' && (
              <div className={styles.loadingIndicator}>
                <div className={styles.loadingDots}>
                  <div className={styles.loadingDot}></div>
                  <div
                    className={styles.loadingDot}
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                  <div
                    className={styles.loadingDot}
                    style={{ animationDelay: '0.4s' }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything"
              disabled={status !== 'ready'}
              className={styles.input}
            />
            <IconButton
              label="Submit"
              type="submit"
              disabled={status !== 'ready' || !input.trim()}
              className={clsx(
                styles.submitButton,
                input.trim() && status === 'ready'
                  ? styles.submitButtonEnabled
                  : styles.submitButtonDisabled
              )}
              icon={<SparklesIcon size="20" color="primary" />}
            ></IconButton>
          </form>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
