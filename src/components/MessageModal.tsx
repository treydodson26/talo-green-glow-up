
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, Send, Loader2, X, Bold, Italic, Link2, Eye } from "lucide-react";

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    client_email: string;
    phone_number?: string;
  };
  messageType: 'email' | 'text';
  template?: {
    subject?: string;
    content: string;
  };
  onSend: (messageData: {
    customerId: number;
    messageType: 'email' | 'text';
    subject?: string;
    content: string;
    recipient: string;
  }) => Promise<void>;
}

const MessageModal = ({ 
  isOpen, 
  onClose, 
  customer, 
  messageType, 
  template, 
  onSend 
}: MessageModalProps) => {
  const [subject, setSubject] = useState(template?.subject || '');
  const [content, setContent] = useState(template?.content || '');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'compose' | 'preview'>('compose');

  // Reset form when template changes and process template variables
  useEffect(() => {
    const processedSubject = template?.subject ? processTemplate(template.subject) : '';
    const processedContent = template?.content ? processTemplate(template.content) : '';
    setSubject(processedSubject);
    setContent(processedContent);
  }, [template, customer.first_name, customer.last_name]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !sending) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose, sending]);

  const handleSend = async () => {
    try {
      setSending(true);
      console.log('Sending message:', { messageType, subject, content });
      
      const recipient = messageType === 'email' ? customer.client_email : customer.phone_number || '';
      
      if (!recipient) {
        console.error('No recipient found for message type:', messageType);
        return;
      }
      
      await onSend({
        customerId: customer.id,
        messageType,
        subject: messageType === 'email' ? subject : undefined,
        content: messageType === 'email' ? formatForEmail(content) : content,
        recipient
      });
      
      console.log('Message sent successfully');
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const processTemplate = (text: string) => {
    return text
      .replace(/\{\{first_name\}\}/g, customer.first_name)
      .replace(/\{\{last_name\}\}/g, customer.last_name)
      .replace(/\{\{full_name\}\}/g, `${customer.first_name} ${customer.last_name}`);
  };

  const previewContent = processTemplate(content);
  const previewSubject = processTemplate(subject);

  // Convert plain text to Gmail-friendly HTML
  const convertToHtml = (text: string) => {
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #1a73e8; text-decoration: none;">$1</a>');
  };

  const formatForEmail = (text: string) => {
    const processedText = processTemplate(text);
    const htmlContent = convertToHtml(processedText);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${processTemplate(subject)}</title>
</head>
<body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
    <div style="padding: 30px;">
      <p style="margin: 0 0 16px 0; font-size: 16px;">${htmlContent}</p>
    </div>
    <div style="background-color: #f8f9fa; padding: 20px; border-top: 1px solid #e9ecef; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #6c757d;">
        Best regards,<br>
        <strong>Talo Yoga</strong>
      </p>
    </div>
  </div>
</body>
</html>`;
  };

  const insertFormatting = (format: 'bold' | 'italic' | 'link') => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let replacement = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold':
        replacement = `**${selectedText}**`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'italic':
        replacement = `*${selectedText}*`;
        cursorOffset = selectedText ? 0 : 1;
        break;
      case 'link':
        replacement = `[${selectedText || 'link text'}](https://example.com)`;
        cursorOffset = selectedText ? 0 : -19;
        break;
    }

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length + cursorOffset;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 z-50" 
        onEscapeKeyDown={onClose}
        onInteractOutside={(e) => {
          // Allow closing by clicking outside, but not when sending
          if (!sending) {
            onClose();
          } else {
            e.preventDefault();
          }
        }}
      >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-10"
          onClick={onClose}
          disabled={sending}
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b pr-14">
          <DialogTitle className="flex items-center gap-3 text-xl">
            {messageType === 'email' ? (
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
            )}
            <div>
              <div className="font-semibold">
                Send {messageType === 'email' ? 'Email' : 'Text Message'}
              </div>
              <div className="text-sm font-normal text-muted-foreground">
                to {customer.first_name} {customer.last_name}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Compose and send a {messageType === 'email' ? 'email' : 'text message'} to {customer.first_name} {customer.last_name}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Recipient Info Section */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-5 rounded-xl border border-blue-100/50">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                    {messageType === 'email' ? 'Email Recipient' : 'SMS Recipient'}
                  </div>
                  <Badge variant={messageType === 'email' ? 'default' : 'secondary'} className="text-xs">
                    {messageType === 'email' ? 'Email' : 'SMS'}
                  </Badge>
                </div>
                <div className="text-lg font-semibold text-slate-800">
                  {customer.first_name} {customer.last_name}
                </div>
                <div className="text-sm text-slate-600 font-mono bg-white/60 px-3 py-1 rounded-md border">
                  {messageType === 'email' ? customer.client_email : customer.phone_number}
                </div>
              </div>
              <div className={`p-3 rounded-full ${messageType === 'email' ? 'bg-blue-100' : 'bg-green-100'}`}>
                {messageType === 'email' ? (
                  <Mail className="w-6 h-6 text-blue-600" />
                ) : (
                  <Phone className="w-6 h-6 text-green-600" />
                )}
              </div>
            </div>
          </div>

          {/* Subject Section (Email only) */}
          {messageType === 'email' && (
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <Label htmlFor="subject" className="text-base font-semibold text-slate-800">
                  Email Subject Line
                </Label>
                <p className="text-sm text-slate-600 mt-1">
                  Create a compelling subject that encourages opens
                </p>
              </div>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter your email subject line..."
                className="text-base py-3 px-4 border-2 focus:border-blue-500 transition-colors"
              />
              {previewSubject && previewSubject !== subject && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                      Subject Preview
                    </p>
                  </div>
                  <p className="text-base font-medium text-blue-900">{previewSubject}</p>
                </div>
              )}
            </div>
          )}

          {/* Message Content Section */}
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <Label htmlFor="content" className="text-base font-semibold text-slate-800">
                {messageType === 'email' ? 'Email Content' : 'Message Content'}
              </Label>
              <p className="text-sm text-slate-600 mt-1">
                {messageType === 'email' 
                  ? 'Craft your email with formatting options for professional Gmail delivery'
                  : 'Craft your message using the available template variables'
                }
              </p>
            </div>

            {messageType === 'email' ? (
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'compose' | 'preview')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="compose">Compose</TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Gmail Preview
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="compose" className="space-y-4">
                  {/* Formatting Toolbar */}
                  <div className="flex items-center gap-2 p-3 bg-slate-50 border rounded-lg">
                    <span className="text-sm font-medium text-slate-600 mr-2">Format:</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertFormatting('bold')}
                      className="h-8 px-3"
                    >
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertFormatting('italic')}
                      className="h-8 px-3"
                    >
                      <Italic className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertFormatting('link')}
                      className="h-8 px-3"
                    >
                      <Link2 className="w-4 h-4" />
                    </Button>
                    <div className="ml-4 text-xs text-slate-500">
                      Use **bold**, *italic*, or [link text](url)
                    </div>
                  </div>

                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your email message here...

**Bold text** for emphasis
*Italic text* for style  
[Link text](https://example.com) for links

Use {{first_name}} for personalization"
                    rows={12}
                    className="text-base leading-relaxed py-4 px-4 border-2 focus:border-green-500 transition-colors resize-none font-mono"
                  />
                </TabsContent>

                <TabsContent value="preview" className="space-y-4">
                  <div className="bg-white border-2 border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 border-b">
                      <div className="text-sm font-medium text-slate-700">Gmail Preview</div>
                      <div className="text-xs text-slate-500">How your email will appear to {customer.first_name}</div>
                    </div>
                    <div 
                      className="p-6 min-h-[300px]"
                      dangerouslySetInnerHTML={{ 
                        __html: formatForEmail(content) 
                      }}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your text message here..."
                rows={6}
                className="text-base leading-relaxed py-4 px-4 border-2 focus:border-green-500 transition-colors resize-none"
              />
            )}
            
            {/* Template Variables Help */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700">Available Template Variables</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <code className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm font-mono text-slate-700 hover:bg-slate-100 transition-colors">
                  {"{{first_name}}"}
                </code>
                <code className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm font-mono text-slate-700 hover:bg-slate-100 transition-colors">
                  {"{{last_name}}"}
                </code>
                <code className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm font-mono text-slate-700 hover:bg-slate-100 transition-colors">
                  {"{{full_name}}"}
                </code>
              </div>
            </div>

            {/* Simple Message Preview for Text Messages */}
            {messageType === 'text' && previewContent && previewContent !== content && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                    Message Preview
                  </p>
                </div>
                <div className="bg-white border border-green-200/50 rounded-md p-4">
                  <div className="text-base text-green-900 whitespace-pre-wrap leading-relaxed font-medium">
                    {previewContent}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-6 pt-5 border-t bg-gradient-to-r from-slate-50 to-slate-100/50">
          <div className="flex items-center justify-between w-full">
            {/* Message Stats */}
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <span>Characters:</span>
                <span className="font-mono font-semibold">{content.length}</span>
              </div>
              {messageType === 'text' && (
                <div className="flex items-center gap-1">
                  <span>SMS Count:</span>
                  <span className="font-mono font-semibold">{Math.ceil(content.length / 160)}</span>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={sending}
                className="px-6 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSend} 
                disabled={sending || !content.trim() || (messageType === 'email' && !subject.trim())}
                className="px-8 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send {messageType === 'email' ? 'Email' : 'Message'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageModal;
