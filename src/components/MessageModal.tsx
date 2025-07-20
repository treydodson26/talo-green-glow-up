
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Send, Loader2, X } from "lucide-react";

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
        content,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
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
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Recipient Info */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium text-sm">Recipient</p>
                <p className="text-sm text-muted-foreground">
                  {messageType === 'email' ? customer.client_email : customer.phone_number}
                </p>
              </div>
              <Badge variant={messageType === 'email' ? 'default' : 'secondary'} className="ml-4">
                {messageType === 'email' ? 'Email' : 'SMS'}
              </Badge>
            </div>
          </div>

          {/* Subject (Email only) */}
          {messageType === 'email' && (
            <div className="space-y-3">
              <Label htmlFor="subject" className="text-sm font-medium">Subject Line</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="w-full"
              />
              {previewSubject && previewSubject !== subject && (
                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-xs font-medium text-blue-700 mb-1">Preview:</p>
                  <p className="text-sm text-blue-800">{previewSubject}</p>
                </div>
              )}
            </div>
          )}

          {/* Message Content */}
          <div className="space-y-3">
            <Label htmlFor="content" className="text-sm font-medium">
              Message Content
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Write your ${messageType} message here...`}
              rows={messageType === 'email' ? 8 : 5}
              className="w-full resize-none"
            />
            
            {/* Template Variables Help */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Available variables:</span>
              <code className="px-1.5 py-0.5 bg-muted rounded text-xs">{{`first_name`}}</code>
              <code className="px-1.5 py-0.5 bg-muted rounded text-xs">{{`last_name`}}</code>
              <code className="px-1.5 py-0.5 bg-muted rounded text-xs">{{`full_name`}}</code>
            </div>

            {/* Preview */}
            {previewContent && previewContent !== content && (
              <div className="p-4 bg-green-50 rounded-md border border-green-200">
                <p className="text-xs font-medium text-green-700 mb-2">Message Preview:</p>
                <div className="text-sm text-green-800 whitespace-pre-wrap leading-relaxed">
                  {previewContent}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 pt-4 border-t bg-muted/20">
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" onClick={onClose} disabled={sending}>
              Cancel
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={sending || !content.trim() || (messageType === 'email' && !subject.trim())}
              className="min-w-[120px]"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send {messageType === 'email' ? 'Email' : 'Text'}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageModal;
