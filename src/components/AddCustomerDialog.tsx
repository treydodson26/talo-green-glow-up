import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, User, Mail, Phone, MapPin, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerAdded: () => void;
}

interface CustomerFormData {
  first_name: string;
  last_name: string;
  client_email: string;
  phone_number: string;
  address: string;
  tags: string;
  status: string;
  source: string;
  marketing_email_opt_in: boolean;
  marketing_text_opt_in: boolean;
  transactional_text_opt_in: boolean;
  agree_to_liability_waiver: boolean;
  notes: string;
}

const initialFormData: CustomerFormData = {
  first_name: "",
  last_name: "",
  client_email: "",
  phone_number: "",
  address: "",
  tags: "",
  status: "prospect",
  source: "website",
  marketing_email_opt_in: false,
  marketing_text_opt_in: false,
  transactional_text_opt_in: true,
  agree_to_liability_waiver: false,
  notes: "",
};

export default function AddCustomerDialog({
  open,
  onOpenChange,
  onCustomerAdded,
}: AddCustomerDialogProps) {
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof CustomerFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.first_name || !formData.last_name || !formData.client_email) {
      toast({
        title: "Validation Error",
        description: "First name, last name, and email are required.",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.client_email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create the customer data
      const customerData = {
        client_name: `${formData.first_name} ${formData.last_name}`,
        first_name: formData.first_name,
        last_name: formData.last_name,
        client_email: formData.client_email,
        phone_number: formData.phone_number || null,
        address: formData.address || null,
        tags: formData.tags || null,
        status: formData.status,
        source: formData.source,
        marketing_email_opt_in: formData.marketing_email_opt_in,
        marketing_text_opt_in: formData.marketing_text_opt_in,
        transactional_text_opt_in: formData.transactional_text_opt_in,
        agree_to_liability_waiver: formData.agree_to_liability_waiver,
        notes: formData.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Creating customer with data:', customerData);

      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Customer created successfully:', data);

      toast({
        title: "Success!",
        description: `${formData.first_name} ${formData.last_name} has been added as a new customer.`,
      });

      resetForm();
      onOpenChange(false);
      onCustomerAdded();

    } catch (error: any) {
      console.error('Error creating customer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Customer
          </DialogTitle>
          <DialogDescription>
            Create a new customer profile. Required fields are marked with an asterisk (*).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  First Name *
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Last Name *
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </Label>
              <Input
                id="client_email"
                type="email"
                value={formData.client_email}
                onChange={(e) => handleInputChange('client_email', e.target.value)}
                placeholder="customer@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Main St, City, State 12345"
              />
            </div>
          </div>

          {/* Customer Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Customer Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="intro_trial">Intro Trial</SelectItem>
                    <SelectItem value="active_member">Active Member</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="walk_in">Walk In</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="yoga, beginner, flexible (comma-separated)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about the customer..."
                rows={3}
              />
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Communication Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing_email_opt_in">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive promotional emails and newsletters
                  </p>
                </div>
                <Switch
                  id="marketing_email_opt_in"
                  checked={formData.marketing_email_opt_in}
                  onCheckedChange={(checked) => handleInputChange('marketing_email_opt_in', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing_text_opt_in">Marketing Texts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive promotional text messages
                  </p>
                </div>
                <Switch
                  id="marketing_text_opt_in"
                  checked={formData.marketing_text_opt_in}
                  onCheckedChange={(checked) => handleInputChange('marketing_text_opt_in', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="transactional_text_opt_in">Transactional Texts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive class reminders and important updates
                  </p>
                </div>
                <Switch
                  id="transactional_text_opt_in"
                  checked={formData.transactional_text_opt_in}
                  onCheckedChange={(checked) => handleInputChange('transactional_text_opt_in', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="agree_to_liability_waiver">Liability Waiver</Label>
                  <p className="text-sm text-muted-foreground">
                    Customer has agreed to liability waiver
                  </p>
                </div>
                <Switch
                  id="agree_to_liability_waiver"
                  checked={formData.agree_to_liability_waiver}
                  onCheckedChange={(checked) => handleInputChange('agree_to_liability_waiver', checked)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Customer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}