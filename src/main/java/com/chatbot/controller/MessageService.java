package com.chatbot.controller;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.stereotype.Service;

@Service
public class MessageService {

	private final ConcurrentMap<Long, ChatMessage> messageStore = new ConcurrentHashMap<>();

	public void updateMessage(Long messageId, String newContent) {
		ChatMessage message = messageStore.get(messageId);
		if (message != null) {
			message.setContent(newContent);
		}
	}

	public void saveMessage(ChatMessage chatMessage) {
		// Example: Save message to store with a generated ID
		long messageId = generateMessageId();
		chatMessage.setOriginalMessageId(messageId);
		messageStore.put(messageId, chatMessage);
	}

	private long generateMessageId() {
		// Generate a unique message ID (implement as needed)
		return System.currentTimeMillis();
	}
}
