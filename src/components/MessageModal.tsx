import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Send, Loader2 } from "lucide-react";

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
      
      const recipient = messageType === 'email' ? customer.client_email : customer.phone_number || '';
      
      await onSend({
        customerId: customer.id,
        messageType,
        subject: messageType === 'email' ? subject : undefined,
        content,
        recipient
      });
      
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {messageType === 'email' ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            Send {messageType === 'email' ? 'Email' : 'Text Message'} to {customer.first_name} {customer.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient Info */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                <p className="text-sm text-muted-foreground">
                  {messageType === 'email' ? customer.client_email : customer.phone_number}
                </p>
              </div>
              <Badge variant={messageType === 'email' ? 'default' : 'secondary'}>
                {messageType === 'email' ? 'Email' : 'Text'}
              </Badge>
            </div>
          </div>

          {/* Subject (Email only) */}
          {messageType === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
              />
              {previewSubject && previewSubject !== subject && (
                <div className="text-sm text-muted-foreground">
                  <strong>Preview:</strong> {previewSubject}
                </div>
              )}
            </div>
          )}

          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Enter your ${messageType} message...`}
              rows={messageType === 'email' ? 10 : 6}
              className="resize-none"
            />
            
            {/* Template Variables Help */}
            <div className="text-xs text-muted-foreground">
              Available variables: {`{{first_name}}, {{last_name}}, {{full_name}}`}
            </div>

            {/* Preview */}
            {previewContent && previewContent !== content && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <Label className="text-xs text-muted-foreground">Preview:</Label>
                <div className="mt-1 whitespace-pre-wrap text-sm">
                  {previewContent}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sending || !content || (messageType === 'email' && !subject)}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageModal;