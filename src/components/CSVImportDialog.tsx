import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, CheckCircle, XCircle, AlertCircle, Download, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CSVImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface CustomerImport {
  first_name: string;
  last_name: string;
  client_name: string;
  client_email: string;
  phone_number?: string;
  birthday?: string;
  address?: string;
  marketing_email_opt_in?: boolean;
  marketing_text_opt_in?: boolean;
  transactional_text_opt_in?: boolean;
  tags?: string;
}

interface ImportResult {
  success: number;
  errors: number;
  duplicates: number;
  errorLog: string[];
  importId?: number;
  processingTime?: number;
}

interface FieldMapping {
  [csvHeader: string]: string;
}

const REQUIRED_FIELDS = ['first_name', 'last_name', 'client_email'];
const OPTIONAL_FIELDS = [
  'phone_number',
  'birthday',
  'address',
  'marketing_email_opt_in',
  'marketing_text_opt_in',
  'transactional_text_opt_in',
  'tags'
];

const CSVImportDialog: React.FC<CSVImportDialogProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [step, setStep] = useState(1);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importCancelled, setImportCancelled] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Reset state when dialog closes
  const handleClose = useCallback(() => {
    setStep(1);
    setCsvFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setFieldMapping({});
    setValidationErrors([]);
    setImportProgress(0);
    setIsImporting(false);
    setImportCancelled(false);
    setImportResult(null);
    setDragActive(false);
    onClose();
  }, [onClose]);

  // Parse CSV file
  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    });
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "File size must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      
      if (parsed.length < 2) {
        toast({
          title: "Invalid CSV",
          description: "CSV must have headers and at least one data row.",
          variant: "destructive",
        });
        return;
      }
      
      setCsvHeaders(parsed[0]);
      setCsvData(parsed.slice(1));
      setStep(2);
    };
    
    reader.readAsText(file);
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Validate field mapping
  const validateMapping = (): boolean => {
    const errors = [];
    const mappedFields = Object.values(fieldMapping);
    
    // Check required fields
    for (const required of REQUIRED_FIELDS) {
      if (!mappedFields.includes(required)) {
        errors.push(`Required field "${required}" is not mapped`);
      }
    }
    
    // Check for duplicate mappings
    const duplicates = mappedFields.filter((field, index, arr) => 
      field && arr.indexOf(field) !== index
    );
    if (duplicates.length > 0) {
      errors.push(`Duplicate field mappings: ${duplicates.join(', ')}`);
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Transform and validate data
  const transformData = (rawData: string[][]): CustomerImport[] => {
    return rawData.map((row, index) => {
      const customer: any = {};
      
      csvHeaders.forEach((header, headerIndex) => {
        const mappedField = fieldMapping[header];
        if (mappedField && row[headerIndex] !== undefined) {
          let value = row[headerIndex].trim();
          
          // Transform boolean fields
          if (['marketing_email_opt_in', 'marketing_text_opt_in', 'transactional_text_opt_in'].includes(mappedField)) {
            customer[mappedField] = ['true', 'yes', '1', 'y'].includes(value.toLowerCase());
            return;
          }
          
          // Transform date fields
          if (mappedField === 'birthday' && value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              customer[mappedField] = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            } else {
              customer[mappedField] = null; // Invalid date
            }
          } else {
            customer[mappedField] = value || null;
          }
        }
      });
      
      return customer;
    });
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Process import in batches
  const processImport = async () => {
    setIsImporting(true);
    setImportProgress(0);
    
    const startTime = Date.now();
    const transformedData = transformData(csvData);
    const batchSize = 10;
    const totalBatches = Math.ceil(transformedData.length / batchSize);
    
    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    const errorLog: string[] = [];
    
    try {
      // Create import record
      const { data: importRecord, error: importError } = await supabase
        .from('csv_imports')
        .insert({
          filename: csvFile?.name || 'unknown.csv',
          total_records: transformedData.length,
          new_records: 0,
          updated_records: 0,
          status: 'processing'
        })
        .select()
        .single();
      
      if (importError) throw importError;
      
      for (let i = 0; i < totalBatches && !importCancelled; i++) {
        const batch = transformedData.slice(i * batchSize, (i + 1) * batchSize);
        
        for (const customer of batch) {
          if (importCancelled) break;
          
          try {
            // Validate required fields
            if (!customer.first_name || !customer.last_name || !customer.client_email) {
              errorLog.push(`Row ${(i * batchSize) + batch.indexOf(customer) + 2}: Missing required fields`);
              errorCount++;
              continue;
            }
            
            // Validate email
            if (!isValidEmail(customer.client_email)) {
              errorLog.push(`Row ${(i * batchSize) + batch.indexOf(customer) + 2}: Invalid email format`);
              errorCount++;
              continue;
            }
            
            // Check for duplicates
            const { data: existing } = await supabase
              .from('customers')
              .select('id')
              .eq('client_email', customer.client_email)
              .single();
            
            if (existing) {
              errorLog.push(`Row ${(i * batchSize) + batch.indexOf(customer) + 2}: Email already exists`);
              duplicateCount++;
              continue;
            }
            
            // Set client_name for compatibility
            const customerData = {
              ...customer,
              client_name: `${customer.first_name} ${customer.last_name}`
            };
            
            // Insert customer
            const { error: insertError } = await supabase
              .from('customers')
              .insert(customerData);
            
            if (insertError) {
              errorLog.push(`Row ${(i * batchSize) + batch.indexOf(customer) + 2}: ${insertError.message}`);
              errorCount++;
            } else {
              successCount++;
            }
          } catch (error: any) {
            errorLog.push(`Row ${(i * batchSize) + batch.indexOf(customer) + 2}: ${error.message}`);
            errorCount++;
          }
        }
        
        // Update progress
        setImportProgress(((i + 1) / totalBatches) * 100);
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const processingTime = Date.now() - startTime;
      
      // Update import record
      await supabase
        .from('csv_imports')
        .update({
          new_records: successCount,
          failed_records: errorCount + duplicateCount,
          error_details: errorLog.length > 0 ? { errors: errorLog } : null,
          processing_time_ms: processingTime,
          completed_at: new Date().toISOString(),
          status: importCancelled ? 'cancelled' : 'completed'
        })
        .eq('id', importRecord.id);
      
      setImportResult({
        success: successCount,
        errors: errorCount,
        duplicates: duplicateCount,
        errorLog,
        importId: importRecord.id,
        processingTime
      });
      
      setStep(5);
      
      if (successCount > 0) {
        onImportComplete();
      }
      
    } catch (error: any) {
      console.error('Import error:', error);
      errorLog.push(`System error: ${error.message}`);
      setImportResult({
        success: successCount,
        errors: errorCount + 1,
        duplicates: duplicateCount,
        errorLog
      });
      setStep(5);
    } finally {
      setIsImporting(false);
    }
  };

  // Download sample CSV
  const downloadSampleCSV = () => {
    const headers = ['first_name', 'last_name', 'client_email', 'phone_number', 'birthday', 'marketing_email_opt_in'];
    const sampleData = [
      ['John', 'Doe', 'john@example.com', '555-1234', '1990-01-15', 'true'],
      ['Jane', 'Smith', 'jane@example.com', '555-5678', '1985-06-20', 'false'],
      ['Mike', 'Johnson', 'mike@example.com', '555-9999', '1988-03-10', 'yes']
    ];
    
    const csvContent = [headers, ...sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
        <p className="text-muted-foreground mb-4">
          Select a CSV file containing customer data to import
        </p>
      </div>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <div className="space-y-2">
          <p className="text-lg font-medium">Drop your CSV file here</p>
          <p className="text-muted-foreground">or</p>
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
          >
            Choose File
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">CSV Format Requirements:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Must include headers in the first row</li>
          <li>• Required fields: first_name, last_name, client_email</li>
          <li>• Maximum file size: 5MB</li>
          <li>• Boolean fields accept: true/false, yes/no, 1/0</li>
          <li>• Date format: YYYY-MM-DD</li>
        </ul>
        <Button 
          variant="link" 
          className="mt-2 p-0 h-auto"
          onClick={downloadSampleCSV}
        >
          <Download className="h-4 w-4 mr-1" />
          Download sample CSV
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Map CSV Fields</h3>
        <p className="text-muted-foreground">
          Map your CSV columns to customer fields
        </p>
      </div>
      
      <div className="space-y-4">
        {csvHeaders.map((header, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">{header}</label>
              <p className="text-xs text-muted-foreground">
                Sample: {csvData[0]?.[index] || 'No data'}
              </p>
            </div>
            <div className="flex-1">
              <Select
                value={fieldMapping[header] || ''}
                onValueChange={(value) => {
                  setFieldMapping(prev => ({
                    ...prev,
                    [header]: value === 'none' ? '' : value
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Don't import</SelectItem>
                  {REQUIRED_FIELDS.map(field => (
                    <SelectItem key={field} value={field}>
                      {field.replace('_', ' ')} <Badge variant="destructive" className="ml-2">Required</Badge>
                    </SelectItem>
                  ))}
                  {OPTIONAL_FIELDS.map(field => (
                    <SelectItem key={field} value={field}>
                      {field.replace('_', ' ')} <Badge variant="secondary" className="ml-2">Optional</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
      
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={() => {
            if (validateMapping()) {
              setStep(3);
            }
          }}
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const previewData = transformData(csvData.slice(0, 5));
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Preview Import Data</h3>
          <p className="text-muted-foreground">
            Review the first 5 rows of mapped data before importing
          </p>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Import Summary</span>
            <Badge variant="secondary">{csvData.length} records</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {csvData.length} total records will be processed in batches of 10
          </p>
        </div>
        
        <div className="border rounded-lg overflow-auto max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                {Object.values(fieldMapping).filter(Boolean).map(field => (
                  <TableHead key={field}>{field.replace('_', ' ')}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.map((row, index) => (
                <TableRow key={index}>
                  {Object.values(fieldMapping).filter(Boolean).map(field => (
                    <TableCell key={field}>
                      {typeof row[field as keyof CustomerImport] === 'boolean' 
                        ? (row[field as keyof CustomerImport] ? 'Yes' : 'No')
                        : String(row[field as keyof CustomerImport] || '')
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={() => setStep(2)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => setStep(4)}>
            Start Import
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Importing Data</h3>
        <p className="text-muted-foreground">
          Processing {csvData.length} records in batches...
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Import Progress</span>
            <span>{Math.round(importProgress)}%</span>
          </div>
          <Progress value={importProgress} className="h-2" />
        </div>
        
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => {
              setImportCancelled(true);
              toast({
                title: "Import cancelled",
                description: "The import process has been cancelled.",
              });
            }}
            disabled={!isImporting}
          >
            Cancel Import
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {importResult && importResult.success > 0 ? (
            <CheckCircle className="h-12 w-12 text-green-500" />
          ) : (
            <XCircle className="h-12 w-12 text-red-500" />
          )}
        </div>
        <h3 className="text-lg font-semibold mb-2">Import Complete</h3>
        <p className="text-muted-foreground">
          Import finished in {importResult?.processingTime ? (importResult.processingTime / 1000).toFixed(1) : 0}s
        </p>
      </div>
      
      {importResult && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
            <div className="text-sm text-green-700">Successful</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
            <div className="text-sm text-yellow-700">Duplicates</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
            <div className="text-sm text-red-700">Errors</div>
          </div>
        </div>
      )}
      
      {importResult && importResult.errorLog.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Error Details</h4>
          <Textarea
            value={importResult.errorLog.join('\n')}
            readOnly
            className="h-32 text-sm"
            placeholder="No errors"
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              const blob = new Blob([importResult.errorLog.join('\n')], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'import_errors.txt';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Error Report
          </Button>
        </div>
      )}
      
      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={() => setStep(1)}>
          Import Another
        </Button>
        <Button onClick={handleClose}>
          Done
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Import Customer Data</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 px-4">
          {[1, 2, 3, 4, 5].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step >= stepNumber ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
              `}>
                {stepNumber}
              </div>
              {stepNumber < 5 && (
                <div className={`
                  w-12 h-0.5 mx-2
                  ${step > stepNumber ? 'bg-primary' : 'bg-muted'}
                `} />
              )}
            </div>
          ))}
        </div>
        
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && !isImporting && processImport() && renderStep4()}
        {step === 4 && isImporting && renderStep4()}
        {step === 5 && renderStep5()}
      </DialogContent>
    </Dialog>
  );
};

export default CSVImportDialog;