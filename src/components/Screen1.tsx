import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelRightClose } from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

export function Screen1() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'User Analysis Query',
      messages: [
        { id: '1', role: 'user', content: 'Show me all users created in the last 30 days', timestamp: new Date() },
        { id: '2', role: 'assistant', content: 'I can help you with that! Here\'s a SQL query to get users created in the last 30 days:\n\nSELECT * FROM users WHERE created_at >= NOW() - INTERVAL \'30 days\'', timestamp: new Date() }
      ]
    },
    {
      id: '2',
      title: 'Sales Report',
      messages: [
        { id: '3', role: 'user', content: 'Generate a sales report for this month', timestamp: new Date() }
      ]
    }
  ]);

  const [activeChatId, setActiveChatId] = useState<string>('1');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [userInput, setUserInput] = useState('');
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  const activeChat = chatSessions.find(chat => chat.id === activeChatId);

  const createNewChat = () => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: []
    };
    setChatSessions(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const runQuery = () => {
    console.log('Running SQL query:', sqlQuery);
  };

  const askQuestion = () => {
    if (!userInput.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    setChatSessions(prev => prev.map(chat => 
      chat.id === activeChatId 
        ? { ...chat, messages: [...chat.messages, newMessage] }
        : chat
    ));
    setUserInput('');

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I understand your question. Let me help you write a SQL query for that.',
        timestamp: new Date()
      };

      setChatSessions(prev => prev.map(chat => 
        chat.id === activeChatId 
          ? { ...chat, messages: [...chat.messages, assistantMessage] }
          : chat
      ));
    }, 1000);
  };

  const mockResults = [
    { id: 1, email: 'user1@example.com', created_at: '2024-01-15' },
    { id: 2, email: 'user2@example.com', created_at: '2024-01-16' },
    { id: 3, email: 'user3@example.com', created_at: '2024-01-17' }
  ];

  const getCenterPanelWidth = () => {
    if (leftPanelCollapsed && rightPanelCollapsed) return 'w-full';
    if (leftPanelCollapsed || rightPanelCollapsed) return 'w-[70%]';
    return 'w-[50%]';
  };

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Left Panel - Chat Sessions */}
      {!leftPanelCollapsed && (
        <div className="w-[20%] border-r bg-muted/20 p-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex justify-between items-center mb-4">
            <Button 
              onClick={createNewChat} 
              className="flex-1 mr-2"
              style={{
                fontFamily: 'var(--font-family-sans)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-normal)',
                borderRadius: 'var(--radius-button)'
              }}
            >
              New Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeftPanelCollapsed(true)}
              className="p-2"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100%-4rem)]">
            <div className="space-y-2">
              {chatSessions.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`p-3 cursor-pointer transition-colors ${
                    activeChatId === chat.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-background hover:bg-accent'
                  }`}
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <div 
                    className="truncate" 
                    style={{
                      fontFamily: 'var(--font-family-sans)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-normal)'
                    }}
                  >
                    {chat.title}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Center Panel - SQL Query Console */}
      <div 
        className={`${getCenterPanelWidth()} ${!rightPanelCollapsed ? 'border-r' : ''} flex flex-col relative`}
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Collapse buttons */}
        {leftPanelCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLeftPanelCollapsed(false)}
            className="absolute left-2 top-2 z-10 p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        {rightPanelCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRightPanelCollapsed(false)}
            className="absolute right-2 top-2 z-10 p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* SQL Query Section */}
        <div className="h-1/2 border-b p-4" style={{ borderColor: 'var(--border)' }}>
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 style={{
                fontFamily: 'var(--font-family-serif)',
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-weight-normal)'
              }}>
                SQL Query Console
              </h3>
              <Button 
                onClick={runQuery} 
                size="sm"
                style={{
                  fontFamily: 'var(--font-family-sans)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-normal)',
                  borderRadius: 'var(--radius-button)'
                }}
              >
                Run
              </Button>
            </div>
            <Textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="flex-1 resize-none"
              style={{
                fontFamily: 'monospace',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-normal)',
                borderRadius: 'var(--radius-input)',
                backgroundColor: 'var(--input-background)',
                borderColor: 'var(--border)'
              }}
              placeholder="Enter your SQL query here..."
            />
          </div>
        </div>

        {/* Results Section */}
        <div className="h-1/2 p-4">
          <h3 
            className="mb-2"
            style={{
              fontFamily: 'var(--font-family-serif)',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-weight-normal)'
            }}
          >
            Results
          </h3>
          <ScrollArea className="h-[calc(100%-2rem)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockResults.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.created_at}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>

      {/* Right Panel - Chat Thread */}
      {!rightPanelCollapsed && (
        <div className="w-[30%] flex flex-col">
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
            <h3 style={{
              fontFamily: 'var(--font-family-serif)',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-weight-normal)'
            }}>
              Chat Assistant
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRightPanelCollapsed(true)}
              className="p-2"
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          </div>
        
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {activeChat?.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : ''
                  }`}
                  style={{ 
                    borderRadius: 'var(--radius)',
                    backgroundColor: message.role === 'user' ? undefined : 'var(--input-background)'
                  }}
                >
                  <p 
                    className="whitespace-pre-wrap"
                    style={{
                      fontFamily: 'var(--font-family-sans)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-normal)',
                      lineHeight: '1.5'
                    }}
                  >
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex gap-2">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask a question..."
              onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
              className="flex-1"
              style={{
                fontFamily: 'var(--font-family-sans)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-normal)',
                borderRadius: 'var(--radius-input)',
                backgroundColor: 'var(--input-background)',
                borderColor: 'var(--border)'
              }}
            />
            <Button 
              onClick={askQuestion} 
              size="sm"
              style={{
                fontFamily: 'var(--font-family-sans)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-normal)',
                borderRadius: 'var(--radius-button)'
              }}
            >
              Ask
            </Button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}