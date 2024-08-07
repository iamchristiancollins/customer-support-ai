"use client";

import { useEffect, useState, useRef } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { auth, db } from "../../firebase";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messageEndRef = useRef(null);

  const user = auth.currentUser;

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);

    const newMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
      userId: user.uid,
    };

    setMessage("");
    setMessages((messages) => [...messages, newMessage]);

    try {
      await addDoc(collection(db, "messages"), newMessage);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([...messages, newMessage]),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let openaiMessage = {
        role: "assistant",
        content: "",
        timestamp: new Date(),
        userId: user.uid,
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        openaiMessage.content += text;

        // Update assistant message content as it streams in
        setMessages((messages) => {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage.role === "assistant") {
            lastMessage.content += text;
            return [...messages.slice(0, -1), lastMessage];
          }
          return [...messages, { ...openaiMessage }];
        });
      }

      await addDoc(collection(db, "messages"), openaiMessage);
    } catch (error) {
      console.error("Error:", error);
      setMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content:
            "I'm sorry, but I encountered an error. Please try again later.",
        },
      ]);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (user) {
        const q = query(
          collection(db, "messages"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "asc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedMessages = querySnapshot.docs.map((doc) => doc.data());
        setMessages(fetchedMessages);
      }
    };

    fetchMessages();
  }, [user]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        window.location.href = "/login";
      })
      .catch((error) => {
        console.error("Error logging out: ", error);
      });
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bgcolor="background.default"
    >
      <Button onClick={handleLogout}>Logout</Button>
      <Stack
        direction={"column"}
        width="500px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
        bgcolor="background.paper"
        borderRadius={2}
        boxShadow={3}
      >
        <Stack
          direction={"column"}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === "assistant" ? "flex-start" : "flex-end"
              }
            >
              <Box
                bgcolor={
                  message.role === "assistant"
                    ? "primary.main"
                    : "secondary.main"
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref={messageEndRef} />
        </Stack>
        <Stack direction={"row"} spacing={2} bgcolor={"white"}>
          <TextField
            label="Message"
            variant="outlined"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
