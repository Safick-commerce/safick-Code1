import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// User status types
type UserStatus = 'online' | 'away' | 'offline';

// Message item — a message with a seller
export interface MessageItemData {
  id: string;
  seller: {
    name: string;
    message: string;
    avatar: any; // require() image
    status: UserStatus;
  };
}

interface MessageContextType {
  messageItems: MessageItemData[];// list of messages with a seller
  addToMessage: (item: MessageItemData) => void; // add a message to the list
  removeFromMessage: (id: string) => void; // remove a message from the list
  toggleMessage: (item: MessageItemData) => void; // toggle a message to the list
  isMessage: (id: string) => boolean; // check if a message is in the list
  clearMessage: () => void; // clear the list
  getMessageCount: () => number; // get the number of messages in the list
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: ReactNode }) {
  const [messageItems, setMessageItems] = useState<MessageItemData[]>([]); // initialize the list as an empty array

  const addToMessage = useCallback((item: MessageItemData) => {
    setMessageItems((prev) => {
      if (prev.some((existing) => existing.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const removeFromMessage = useCallback((id: string) => {
    setMessageItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toggleMessage = useCallback((item: MessageItemData) => {
    setMessageItems((prev) => {
      const exists = prev.some((existing) => existing.id === item.id);
      if (exists) {
        return prev.filter((existing) => existing.id !== item.id);
      }
      return [...prev, item];
    });
  }, []);

  const isMessage = useCallback(
    (id: string) => messageItems.some((item) => item.id === id),
    [messageItems]
  );

  const clearMessage = useCallback(() => {
    setMessageItems([]);
  }, []);

  const getMessageCount = useCallback(() => {
    return messageItems.length;
  }, [messageItems]);

  return (
    <MessageContext.Provider
      value={{
        messageItems,
        addToMessage,
        removeFromMessage,
        toggleMessage,
        isMessage,
        clearMessage,
        getMessageCount,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}

// Custom hook for easy access
export function useMessage() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessage must be used within a MessageProvider");
  }
  return context;
}
