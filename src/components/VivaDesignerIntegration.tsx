import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface VivaDesignerIntegrationProps {
  layoutJson: any;
  articleName?: string;
  pageNumber?: number;
  articleId?: number;
  pageUid?: string;
  vivaDocumentName?: string;
  onClose?: () => void;
  onVivaStatusUpdate?: (vivaDocumentName: string, jobId: string) => void;
}

interface VivaConfig {
  host: string;
}

const VIVA_CONFIG: VivaConfig = {
  host: 'https://vd11.viva.de/patharai'
};

export function VivaDesignerIntegration({ layoutJson, articleName = 'article', pageNumber = 1, articleId, pageUid, vivaDocumentName, onClose, onVivaStatusUpdate }: VivaDesignerIntegrationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [jobId, setJobId] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');
  const [designerUrl, setDesignerUrl] = useState<string>('');
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  const getJobId = (): string => {
    // Use articleID as jobID so all layouts of the same article go to the same folder
    return articleId?.toString() || articleName || 'article';
  };

  const createVjsonFile = (layoutData: any): File => {
    const jsonString = JSON.stringify(layoutData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create friendly filename: articleName + pageNumber + timestamp
    const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp
    const sanitizedArticleName = articleName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const filename = `${sanitizedArticleName}-page${pageNumber}-${timestamp}.vjson`;
    
    return new File([blob], filename, { type: 'application/json' });
  };

  const uploadLayoutToViva = async () => {
    try {
      setIsUploading(true);
      setError('');
      
      // Skip upload if document already exists in VIVA
      if (vivaDocumentName) {
        const extractedJobId = getJobId();
        setJobId(extractedJobId);
        setDocumentName(vivaDocumentName);
        
        // Notify parent component about the status
        if (onVivaStatusUpdate) {
          onVivaStatusUpdate(vivaDocumentName, extractedJobId);
        }
        
        toast.success('Connected to existing VIVA document');
        await convertToDesigner(extractedJobId, vivaDocumentName);
        return;
      }
      
      const vjsonFile = createVjsonFile(layoutJson);
      const formData = new FormData();
      formData.append('file', vjsonFile);

      const response = await fetch(`${VIVA_CONFIG.host}/api/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Upload response:', data);

      // Handle the correct response structure
      if (!data.files || !Array.isArray(data.files) || data.files.length === 0) {
        throw new Error('No files in upload response');
      }

      const uploadedFile = data.files[0];
      const extractedDocumentName = uploadedFile.name || vjsonFile.name;
      const extractedJobId = getJobId(); // Use consistent jobId approach

      setJobId(extractedJobId);
      setDocumentName(extractedDocumentName);

      // Notify parent component about the status
      if (onVivaStatusUpdate) {
        onVivaStatusUpdate(extractedDocumentName, extractedJobId);
      }

      toast.success('Layout uploaded successfully');
      
      // Start conversion
      await convertToDesigner(extractedJobId, extractedDocumentName);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const convertToDesigner = async (jobIdParam: string, documentNameParam: string) => {
    try {
      setIsConverting(true);
      
      const nameWithoutExtension = documentNameParam.replace('.vjson', '');
      
      const params = new URLSearchParams({
        waitType: 'json',
        'document-name': documentNameParam,
        ticketID: jobIdParam,
        exportName: nameWithoutExtension,
        resultTypes: 'desd',
        outHow: 'json'
      });

      console.log(params);
      const response = await fetch(`${VIVA_CONFIG.host}/api/export/?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Conversion failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Conversion response:', data);

      // Create designer URL
      const designerUrl = `${VIVA_CONFIG.host}/designer/?document-name=output%2F${nameWithoutExtension}.desd&jobid=${jobIdParam}&locale=en`;
      setDesignerUrl(designerUrl);
      console.log(designerUrl);
      toast.success('Layout converted successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Conversion failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsConverting(false);
    }
  };

  const exportToPdf = async () => {
    try {
      setIsExportingPdf(true);
      setError('');
      
      const nameWithoutExtension = documentName.replace('.vjson', '');
      
      const params = new URLSearchParams({
        waitType: 'json',
        'document-name': `output/${nameWithoutExtension}.desd`,
        ticketID: jobId,
        exportName: nameWithoutExtension,
        resultTypes: 'pdf',
        outHow: 'json'
      });

      const response = await fetch(`${VIVA_CONFIG.host}/api/export/?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`PDF export failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('PDF export response:', data);

      const pdfUrl = `${VIVA_CONFIG.host}/api/download/${jobId}/output/${nameWithoutExtension}.pdf`;
      setPdfDownloadUrl(pdfUrl);

      toast.success('PDF exported successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'PDF export failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setJobId('');
    setDocumentName('');
    setDesignerUrl('');
    setPdfDownloadUrl('');
    setError('');
    onClose?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Edit in Designer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>VIVA Designer Integration</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col space-y-4">
          {/* Control Panel */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            {!designerUrl ? (
              <Button 
                onClick={uploadLayoutToViva}
                disabled={isUploading || isConverting}
                className="gap-2"
              >
                {(isUploading || isConverting) && <Loader2 className="h-4 w-4 animate-spin" />}
                {isUploading ? (vivaDocumentName ? 'Connecting...' : 'Uploading...') : isConverting ? 'Converting...' : (vivaDocumentName ? 'Connect to VIVA' : 'Upload to VIVA')}
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <Button 
                  onClick={exportToPdf}
                  disabled={isExportingPdf}
                  variant="secondary"
                  className="gap-2"
                >
                  {isExportingPdf && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isExportingPdf ? 'Exporting...' : 'Save as PDF'}
                </Button>
                
                {pdfDownloadUrl && (
                  <Button asChild variant="outline" className="gap-2">
                    <a href={pdfDownloadUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      Download PDF
                    </a>
                  </Button>
                )}
                
                <Button onClick={handleClose} variant="ghost">
                  Close
                </Button>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {(isUploading || isConverting) && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="text-muted-foreground">
                  {isUploading ? 'Uploading layout to VIVA...' : 'Converting to designer format...'}
                </p>
              </div>
            </div>
          )}

          {/* Designer Link */}
          {designerUrl && (
            <div className="flex-1 flex items-center justify-center border rounded-lg">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Designer ready! Click the button below to open in a new tab.
                </p>
                <Button asChild className="gap-2">
                  <a href={designerUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Open Designer
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}