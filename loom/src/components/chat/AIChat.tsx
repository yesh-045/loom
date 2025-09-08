'use client'

import { SendIcon, ChevronUp, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import AISettingsPopover from './AISettingsPopover'
import ComponentToolbar from './ComponentToolbar'
import { useRouter } from 'next/navigation'
import { ChatMessage } from '@/lib/types'
import AIChatMessages from './AIChatMessages'
import fetchGenerateAIResponse from '@/utils/fetchGenerateAIResponse'
import createChat from '@/utils/createChat'
import submitMessage from '@/utils/submitMessage'

export default function AIChat({ initialMessages, userId, chatId }: { initialMessages?: ChatMessage[], userId: string, chatId?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rows, setRows] = useState(1)
  const [isToolbarOpen, setIsToolbarOpen] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      setRows(textareaRef.current.rows)
    }
  }, [input])

  const router = useRouter()

  useEffect(() => {
    if (initialMessages) {
      const updatedMessages: ChatMessage[] = initialMessages.map((message) => {
        if ('messageType' in message) {
          const { messageType, ...rest } = message;

          if (['quiz', 'ppt', 'flashcards', 'physics', 'spelling', 'canvas', 'image'].includes(messageType as string)) {
            return {
              ...rest,
              componentMessageType: messageType as ChatMessage['componentMessageType']
            };
          }
        }
        return message;
      });

      setMessages(updatedMessages);
    }
  }, [initialMessages]);


  function handleInputChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(event.target.value)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!input.trim() || isLoading) return

    const newUserMessage: ChatMessage = { role: 'user', content: input.trim() }
    setMessages(prevMessages => [...prevMessages, newUserMessage])
    setInput('')
    setIsLoading(true)

    if (!chatId) {
      try {
        const chatSessionId = await createChat(userId, input.trim(), newUserMessage)

        const aiResponse = await fetchGenerateAIResponse([...messages, newUserMessage])
        router.push(`/chat/${chatSessionId}`)
        router.refresh()

        if ((aiResponse.contentType as string) === 'quiz' || (aiResponse.contentType as string) === 'ppt' || (aiResponse.contentType as string) == 'flashcards' || (aiResponse.contentType as string) == 'spelling' || (aiResponse.contentType as string) == "canvas" || (aiResponse.contentType as string) == "image" || (aiResponse.contentType as string) == "physics" || (aiResponse.contentType as string) == "speech-training") {
          const newAiMessage: ChatMessage = { role: 'assistant', content: aiResponse.content, componentMessageType: aiResponse.contentType as ChatMessage['componentMessageType'] }

          setMessages(prevMessages => [...prevMessages, newAiMessage])
          await submitMessage(userId, chatSessionId, newAiMessage)
          return
        }
        const newAiMessage: ChatMessage = { role: 'assistant', content: aiResponse.content }

        setMessages(prevMessages => [...prevMessages, newAiMessage])
        await submitMessage(userId, chatSessionId, newAiMessage)

        return
      } catch (error) {
        console.error('Error generating AI response:', error)
        setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
      } finally {
        setIsLoading(false)
        return
      }
    }

    try {
      await submitMessage(userId, chatId, newUserMessage)

      const aiResponse = await fetchGenerateAIResponse([...messages, newUserMessage])

      console.log(aiResponse)

      if ((aiResponse.contentType as string) === 'quiz' || (aiResponse.contentType as string) === 'ppt' || (aiResponse.contentType as string) == 'flashcards' || (aiResponse.contentType as string) == 'spelling' || (aiResponse.contentType as string) == "canvas" || (aiResponse.contentType as string) == "image" || (aiResponse.contentType as string) == "physics" || (aiResponse.contentType as string) == "speech-training") {
        const newAiMessage: ChatMessage = { role: 'assistant', content: aiResponse.content, componentMessageType: aiResponse.contentType as ChatMessage['componentMessageType'] }

        setMessages(prevMessages => [...prevMessages, newAiMessage])
        await submitMessage(userId, chatId, newAiMessage)
        return
      }
      const newAiMessage: ChatMessage = { role: 'assistant', content: aiResponse.content }

      setMessages(prevMessages => [...prevMessages, newAiMessage])
      await submitMessage(userId, chatId, newAiMessage)
    } catch (error) {
      console.error('Error generating AI response:', error)
      setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle component selection from toolbar
  async function handleComponentSelect(contentType: string, defaultContent: string): Promise<void> {
    setIsLoading(true)

    try {
      const componentMessage: ChatMessage = { 
        role: 'assistant', 
        content: defaultContent, 
        componentMessageType: contentType as ChatMessage['componentMessageType']
      }

      setMessages(prevMessages => [...prevMessages, componentMessage])

      // If we have a chatId, save the message to the database
      if (chatId) {
        await submitMessage(userId, chatId, componentMessage)
      } else {
        // Create a new chat session
        const chatSessionId = await createChat(userId, `Created ${contentType} component`, componentMessage)
        router.push(`/chat/${chatSessionId}`)
        router.refresh()
      }
    } catch (error) {
      console.error('Error creating component:', error)
      setMessages(prevMessages => [...prevMessages, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error creating the component. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
  <div className="flex flex-col w-full max-w-3xl h-full mx-auto px-4">
      <AIChatMessages messages={messages} setMessages={setMessages} />
      
      {/* Component Toolbar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">Components</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsToolbarOpen(!isToolbarOpen)}
            className="h-8 w-8 p-0 border-border hover:bg-accent"
          >
            {isToolbarOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {isToolbarOpen && (
          <ComponentToolbar 
            onComponentSelect={handleComponentSelect}
            className="w-full"
          />
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-secondary border border-border rounded-2xl">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-end pb-2">
            <AISettingsPopover />
          </div>
          <div className="flex space-x-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={rows}
              className="min-h-[40px] max-h-[200px] resize-none bg-background border border-border rounded-xl"
            />
            <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-accent rounded-xl">
              <SendIcon className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}