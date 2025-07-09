import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  ImageIcon, 
  Send, 
  Upload, 
  Plus, 
  MessageCircle,
  Clock,
  Sparkles,
  X,
  Expand
} from 'lucide-react';
import { apiService } from '@/services/api';
import { ChatMessage, ChatSession, ImageEdit } from '@/types/imageGeneration';
import { formatDistanceToNow } from 'date-fns';

interface ImageGenerationProps {
  isAdmin: boolean;
}

export function ImageGeneration({ isAdmin }: ImageGenerationProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageEdit, setImageEdit] = useState<ImageEdit | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const currentUser = isAdmin ? 'admin@example.com' : 'user@example.com';

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const imageEdits = await apiService.getAllImageEdits();
      const chatSessions: ChatSession[] = imageEdits.map(edit => ({
        id: edit.session_id,
        title: edit.edits[0]?.prompt.slice(0, 30) + '...' || 'Image Edit Session',
        lastMessage: edit.edits[edit.edits.length - 1]?.prompt || 'No messages',
        timestamp: new Date(edit.updated_at),
        imageEdit: edit,
      }));
      setSessions(chatSessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load chat sessions",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select an image file.",
        });
      }
    }
  };

  const createNewSession = () => {
    setCurrentSession(null);
    setMessages([]);
    setImageEdit(null);
    setSelectedFile(null);
    setInputPrompt('');
  };

  const handleSendMessage = async () => {
    if (!inputPrompt.trim()) return;

    // If no current session and no file selected, show error
    if (!currentSession && !selectedFile) {
      toast({
        variant: "destructive",
        title: "Image required",
        description: "Please upload an image to start a new session.",
      });
      return;
    }

    setIsLoading(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputPrompt,
      timestamp: new Date(),
      image: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
    };

    setMessages(prev => [...prev, userMessage]);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: 'Generating image...',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      let result: ImageEdit;

      if (!currentSession && selectedFile) {
        // First message in session - generate image
        result = await apiService.generateImage(selectedFile, inputPrompt, currentUser);
        setCurrentSession(result.session_id);
      } else if (currentSession) {
        // Continue existing session - edit image
        result = await apiService.editImage(currentSession, inputPrompt);
      } else {
        throw new Error('Invalid session state');
      }

      setImageEdit(result);

      // Remove loading message and add response
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isLoading);
        const latestEdit = result.edits[result.edits.length - 1];
        const responseMessage: ChatMessage = {
          id: latestEdit.response_id,
          type: 'assistant',
          content: `Image ${currentSession ? 'edited' : 'generated'} successfully!`,
          timestamp: new Date(),
          image: latestEdit.edited_image,
        };
        return [...filtered, responseMessage];
      });

      // Update sessions list
      await loadSessions(); // Refresh sessions after successful operation

      // Clear input and file
      setInputPrompt('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process image",
      });

      // Remove loading message
      setMessages(prev => prev.filter(msg => !msg.isLoading));
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const sessionData = await apiService.getImageEdit(sessionId);
      setImageEdit(sessionData);
      setCurrentSession(sessionId);

      // Convert session data to messages
      const sessionMessages: ChatMessage[] = [];
      
      // Add initial upload message
      sessionMessages.push({
        id: 'initial',
        type: 'user',
        content: 'Uploaded image',
        timestamp: new Date(sessionData.created_at),
        image: sessionData.original_image_url,
      });

      // Add edit messages
      sessionData.edits.forEach((edit, index) => {
        sessionMessages.push({
          id: `edit-prompt-${index}`,
          type: 'user',
          content: edit.prompt,
          timestamp: new Date(sessionData.updated_at),
        });

        sessionMessages.push({
          id: edit.response_id,
          type: 'assistant',
          content: `Image ${index === 0 ? 'generated' : 'edited'} successfully!`,
          timestamp: new Date(sessionData.updated_at),
          image: edit.edited_image,
        });
      });

      setMessages(sessionMessages);
    } catch (error) {
      console.error('Error loading session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load session",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  return (
    <div className="h-full flex">
      {/* Sessions Sidebar */}
      <div className="w-80 border-r border-border bg-card/50">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Image Generation
            </h2>
            <Button onClick={createNewSession} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
          <Badge variant="secondary" className="text-xs">
            {isAdmin ? 'Admin Portal' : 'User Portal'}
          </Badge>
        </div>

        <ScrollArea className="flex-1 h-[calc(100vh-12rem)]">
          <div className="p-4 space-y-2">
            {sessions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sessions yet</p>
                <p className="text-xs">Start by creating a new session</p>
              </div>
            ) : (
              sessions.map((session) => (
                <Card 
                  key={session.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    currentSession === session.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => loadSession(session.id)}
                >
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate mb-1">
                      {session.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mb-2">
                      {session.lastMessage}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(session.timestamp, { addSuffix: true })}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-card/30">
          <h3 className="font-semibold">
            {currentSession ? `Session: ${currentSession}` : 'New Session'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {currentSession ? 'Continue editing your image' : 'Upload an image to get started'}
          </p>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">Ready to generate images</h3>
                <p className="text-muted-foreground">
                  Upload an image and describe what you'd like to change or create
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-md p-4 rounded-lg transition-all duration-300 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.isLoading
                        ? 'bg-muted animate-pulse border-2 border-primary/20'
                        : 'bg-muted hover:shadow-lg'
                    } ${message.isLoading ? 'animate-scale-in' : ''}`}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                        </div>
                        <p className="text-sm text-muted-foreground">Creating your image...</p>
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm mb-2">{message.content}</p>
                        {message.image && (
                          <div className="relative group">
                            <img
                              src={message.image}
                              alt="Generated or uploaded"
                              className="rounded-md max-w-full h-auto cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
                              onClick={() => handleImageClick(message.image!)}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-md flex items-center justify-center">
                              <Expand className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </div>
                          </div>
                        )}
                        <div className="text-xs opacity-70 mt-2">
                          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card/30">
          <div className="max-w-4xl mx-auto">
            {selectedFile && (
              <div className="mb-4 p-3 bg-muted rounded-lg flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Remove
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {!currentSession && (
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              )}

              <Input
                placeholder={
                  currentSession 
                    ? "Describe how you'd like to edit the image..."
                    : "Describe what you'd like to create..."
                }
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={isLoading}
              />

              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputPrompt.trim() || (!currentSession && !selectedFile)}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              {currentSession
                ? "Continue editing your image with natural language prompts"
                : "Upload an image first to start a new generation session"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="flex items-center justify-between">
              Image Preview
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsImageModalOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Full size preview"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}