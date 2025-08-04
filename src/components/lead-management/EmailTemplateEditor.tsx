import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Edit3, 
  Eye, 
  Save, 
  RotateCcw,
  Users,
  Target,
  UserPlus,
  Sparkles
} from "lucide-react";
import { useEmailTemplates, useUpdateEmailTemplate } from "@/hooks/useLeadManagement";

const getTemplateIcon = (templateType: string) => {
  switch (templateType) {
    case 'prospect_welcome':
      return Target;
    case 'drop_in_followup':
      return UserPlus;
    case 'intro_day_0':
    case 'intro_day_10':
    case 'intro_day_28':
      return Users;
    default:
      return Mail;
  }
};

const getTemplateColor = (templateType: string) => {
  switch (templateType) {
    case 'prospect_welcome':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    case 'drop_in_followup':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
    case 'intro_day_0':
    case 'intro_day_10':
    case 'intro_day_28':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
};

const formatTemplateName = (templateType: string) => {
  switch (templateType) {
    case 'prospect_welcome':
      return 'Prospect Welcome';
    case 'drop_in_followup':
      return 'Drop-in Follow-up';
    case 'intro_day_0':
      return 'Intro Day 0';
    case 'intro_day_10':
      return 'Intro Day 10';
    case 'intro_day_28':
      return 'Intro Day 28';
    default:
      return templateType;
  }
};

export const EmailTemplateEditor = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: templates, isLoading } = useEmailTemplates();
  const { mutate: updateTemplate, isPending: isUpdating } = useUpdateEmailTemplate();

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    setEditedSubject(template.subject);
    setEditedContent(template.content);
    setHasChanges(false);
    setPreviewMode(false);
  };

  const handleSubjectChange = (value: string) => {
    setEditedSubject(value);
    setHasChanges(true);
  };

  const handleContentChange = (value: string) => {
    setEditedContent(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!selectedTemplate) return;

    updateTemplate({
      templateId: selectedTemplate.id,
      subject: editedSubject,
      content: editedContent,
    });

    setHasChanges(false);
  };

  const handleReset = () => {
    if (!selectedTemplate) return;
    
    setEditedSubject(selectedTemplate.subject);
    setEditedContent(selectedTemplate.content);
    setHasChanges(false);
  };

  const renderPreview = () => {
    const previewContent = editedContent
      .replace(/{{first_name}}/g, 'Sarah')
      .replace(/{{studio_name}}/g, 'Talo Yoga Studio')
      .replace(/{{last_name}}/g, 'Johnson');

    return (
      <div className="border rounded-lg p-4 bg-background">
        <div className="mb-4 pb-4 border-b">
          <p className="font-semibold">Subject: {editedSubject.replace(/{{first_name}}/g, 'Sarah').replace(/{{studio_name}}/g, 'Talo Yoga Studio')}</p>
          <p className="text-sm text-muted-foreground">To: sarah.johnson@example.com</p>
        </div>
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: previewContent }}
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Email Templates</h3>
          <Badge variant="outline" className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Variables: {'{first_name}, {studio_name}'}
          </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Available Templates
          </h4>
          {templates?.map((template) => {
            const Icon = getTemplateIcon(template.template_type);
            const isSelected = selectedTemplate?.id === template.id;
            
            return (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all hover-scale ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleSelectTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getTemplateColor(template.template_type).replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {formatTemplateName(template.template_type)}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {template.template_name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Template Editor */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5" />
                    {formatTemplateName(selectedTemplate.template_type)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode(!previewMode)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {previewMode ? 'Edit' : 'Preview'}
                    </Button>
                    {hasChanges && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReset}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={isUpdating}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isUpdating ? 'Saving...' : 'Save'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {previewMode ? (
                  <div>
                    <h4 className="font-medium mb-3">Email Preview</h4>
                    {renderPreview()}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject Line</Label>
                      <Input
                        id="subject"
                        value={editedSubject}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        placeholder="Email subject..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Use {'{first_name}'} and {'{studio_name}'} for personalization
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="content">Email Content</Label>
                      <Textarea
                        id="content"
                        value={editedContent}
                        onChange={(e) => handleContentChange(e.target.value)}
                        rows={20}
                        className="font-mono text-sm"
                        placeholder="Email HTML content..."
                      />
                      <p className="text-xs text-muted-foreground">
                        HTML is supported. Keep the gray border styling for consistency.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Template</h3>
                <p className="text-muted-foreground">
                  Choose a template from the list to start editing
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};