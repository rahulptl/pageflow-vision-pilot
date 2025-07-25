import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExternalLink, Download, Loader2, Check, Upload as UploadIcon, Eye } from 'lucide-react';
import { VivaLayoutStatus } from '@/types/magazine';
import { toast } from 'sonner';

interface PagePlan {
  pageNumber: number;
  typeOfPage: string;
  layoutId: number;
  layout?: any;
  layoutJson?: any;
  isCompleted: boolean;
  xmlUploaded: boolean;
  pageUid: string;
  boundingBoxImage?: string;
  createdAt: string;
  updatedAt: string;
  vivaDocumentName?: string; // Track document name in VIVA
  vivaStatus?: VivaLayoutStatus;
}

interface VivaLayoutTrackerProps {
  pages: PagePlan[];
  onUpdatePage: (pageIndex: number, vivaStatus: VivaLayoutStatus, documentName?: string) => void;
  onPublishArticle: () => void;
  article: any;
  formData: any;
}

const VIVA_CONFIG = {
  host: 'https://vd11.viva.de/patharai'
};

export function VivaLayoutTracker({ pages, onUpdatePage, onPublishArticle, article, formData }: VivaLayoutTrackerProps) {
  const [loadingStates, setLoadingStates] = useState<{ [pageIndex: number]: 'uploading' | 'converting' | 'exporting' | null }>({});
  const [isPublishing, setIsPublishing] = useState(false);

  const createVjsonFile = (layoutData: any, articleName: string, pageNumber: number): File => {
    const jsonString = JSON.stringify(layoutData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    const timestamp = Math.floor(Date.now() / 1000);
    const sanitizedArticleName = articleName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const filename = `${sanitizedArticleName}-page${pageNumber}-${timestamp}.vjson`;
    
    return new File([blob], filename, { type: 'application/json' });
  };

  const getJobId = (): string => {
    // Use articleID as jobID so all layouts of the same article go to the same folder
    return article?.article_id?.toString() || formData.articleName || 'article';
  };

  const uploadToViva = async (pageIndex: number) => {
    const page = pages[pageIndex];
    if (!page.layoutJson) {
      toast.error('No layout data available for this page');
      return;
    }

    // Skip upload if document already exists in VIVA
    if (page.vivaDocumentName) {
      console.log('🔗 VIVA: Document already exists, connecting to existing document:', page.vivaDocumentName);
      const jobId = getJobId();
      const vivaStatus: VivaLayoutStatus = {
        jobId,
        documentName: page.vivaDocumentName,
        status: 'uploaded',
        lastUpdated: new Date()
      };
      onUpdatePage(pageIndex, vivaStatus);
      await convertToDesigner(pageIndex, jobId, page.vivaDocumentName);
      return;
    }

    try {
      setLoadingStates(prev => ({ ...prev, [pageIndex]: 'uploading' }));
      
      const vjsonFile = createVjsonFile(page.layoutJson, formData.articleName, page.pageNumber);
      const formData_ = new FormData();
      formData_.append('file', vjsonFile);

      const uploadUrl = `${VIVA_CONFIG.host}/api/upload/?ticketID=${article.article_id}`;
      console.log('🚀 VIVA API: Uploading to:', uploadUrl);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData_,
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log('📥 VIVA API Response (Upload):', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 VIVA Upload Response Data:', data);
      
      if (!data.files || !Array.isArray(data.files) || data.files.length === 0) {
        throw new Error('No files in upload response');
      }

      const uploadedFile = data.files[0];
      const documentName = uploadedFile.name || vjsonFile.name;
      const jobId = getJobId();

      console.log('✅ VIVA Upload Success:', { documentName, jobId });

      const vivaStatus: VivaLayoutStatus = {
        jobId,
        documentName,
        status: 'uploaded',
        lastUpdated: new Date()
      };

      onUpdatePage(pageIndex, vivaStatus, documentName);
      toast.success('Layout uploaded to VIVA successfully');
      
      // Auto-convert to designer
      await convertToDesigner(pageIndex, jobId, documentName);
      
    } catch (error) {
      console.error('❌ VIVA Upload Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMessage);
    } finally {
      setLoadingStates(prev => ({ ...prev, [pageIndex]: null }));
    }
  };

  const convertToDesigner = async (pageIndex: number, jobId: string, documentName: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, [pageIndex]: 'converting' }));
      
      const nameWithoutExtension = documentName.replace('.vjson', '');
      
      const params = new URLSearchParams({
        waitType: 'json',
        'document-name': documentName,
        ticketID: jobId,
        exportName: nameWithoutExtension,
        resultTypes: 'desd',
        outHow: 'json'
      });

      const convertUrl = `${VIVA_CONFIG.host}/api/export/?${params}`;
      console.log('🚀 VIVA API: Converting to designer:', convertUrl);

      const response = await fetch(convertUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log('📥 VIVA API Response (Export):', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const exportData = await response.json();
      console.log('📊 VIVA Export Response Data:', exportData);

      // Check if we got a queue-id for polling
      if (exportData['queue-id']) {
        console.log('🔄 VIVA: Starting queue polling for queue-id:', exportData['queue-id']);
        const queueSuccess = await pollQueue(exportData['queue-id']);
        
        if (!queueSuccess) {
          toast.error('Document conversion failed during processing');
          return;
        }
      }

      const designerUrl = `${VIVA_CONFIG.host}/designer/?document-name=output%2F${nameWithoutExtension}.desd&jobid=${jobId}&locale=en`;
      
      console.log('✅ VIVA Convert Success:', { designerUrl });

      const vivaStatus: VivaLayoutStatus = {
        jobId,
        documentName,
        designerUrl,
        status: 'converted',
        lastUpdated: new Date()
      };

      onUpdatePage(pageIndex, vivaStatus);
      toast.success('Layout converted to designer format');
      
    } catch (error) {
      console.error('❌ VIVA Convert Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
      toast.error(errorMessage);
    } finally {
      setLoadingStates(prev => ({ ...prev, [pageIndex]: null }));
    }
  };

  const pollQueue = async (queueId: string): Promise<boolean> => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const queueUrl = `${VIVA_CONFIG.host}/api/queue/${queueId}`;
        console.log(`🔄 VIVA API: Polling queue (attempt ${attempts + 1}):`, queueUrl);

        const response = await fetch(queueUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });

        console.log('📥 VIVA API Response (Queue):', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          throw new Error(`Queue polling failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📊 VIVA Queue Response Data:', data);

        if (data.state === 'success') {
          console.log('✅ VIVA Queue Success:', data);
          return true;
        } else if (data.state === 'error' || data.state === 'failed') {
          console.error('❌ VIVA Queue Failed:', data);
          return false;
        }

        // Wait 10 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      } catch (error) {
        console.error('❌ VIVA Queue Polling Error:', error);
        return false;
      }
    }

    console.error('⏰ VIVA Queue Polling Timeout');
    return false;
  };

  const exportToPdf = async (pageIndex: number) => {
    const page = pages[pageIndex];
    const vivaStatus = page.vivaStatus;
    
    if (!vivaStatus?.jobId || !vivaStatus?.documentName) {
      toast.error('Page must be uploaded and converted first');
      return;
    }

    try {
      setLoadingStates(prev => ({ ...prev, [pageIndex]: 'exporting' }));
      
      const nameWithoutExtension = vivaStatus.documentName.replace('.vjson', '');
      
      const params = new URLSearchParams({
        waitType: 'json',
        'document-name': `output/${nameWithoutExtension}.desd`,
        ticketID: vivaStatus.jobId,
        exportName: nameWithoutExtension,
        resultTypes: 'pdf',
        outHow: 'json'
      });

      const exportUrl = `${VIVA_CONFIG.host}/api/export/?${params}`;
      console.log('🚀 VIVA API: Exporting to PDF:', exportUrl);

      const response = await fetch(exportUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log('📥 VIVA API Response (Export):', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`PDF export failed: ${response.statusText}`);
      }

      const exportData = await response.json();
      console.log('📊 VIVA Export Response Data:', exportData);

      // Check if we got a queue-id for polling
      if (exportData['queue-id']) {
        console.log('🔄 VIVA: Starting queue polling for queue-id:', exportData['queue-id']);
        const queueSuccess = await pollQueue(exportData['queue-id']);
        
        if (!queueSuccess) {
          toast.error('PDF export failed during processing');
          return;
        }
      }

      const pdfUrl = `${VIVA_CONFIG.host}/api/download/${vivaStatus.jobId}/output/${nameWithoutExtension}.pdf`;
      
      const updatedVivaStatus: VivaLayoutStatus = {
        ...vivaStatus,
        pdfDownloadUrl: pdfUrl,
        status: 'pdf_exported',
        lastUpdated: new Date()
      };

      console.log('✅ VIVA PDF Export Success:', { pdfUrl });
      onUpdatePage(pageIndex, updatedVivaStatus);
      toast.success('PDF exported successfully');
      
    } catch (error) {
      console.error('❌ VIVA Export Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'PDF export failed';
      toast.error(errorMessage);
    } finally {
      setLoadingStates(prev => ({ ...prev, [pageIndex]: null }));
    }
  };

  const handlePublish = async () => {
    const pagesWithPdfs = pages.filter(page => page.vivaStatus?.status === 'pdf_exported');
    
    if (pagesWithPdfs.length !== pages.length) {
      toast.error('All pages must be exported as PDF before publishing');
      return;
    }

    setIsPublishing(true);
    
    try {
      // Download all PDFs and merge them (simplified - in real app you'd use a PDF library)
      const pdfUrls = pagesWithPdfs.map(page => page.vivaStatus!.pdfDownloadUrl!);
      
      // For now, just download the first PDF as a demo
      // In a real implementation, you'd merge all PDFs into one
      if (pdfUrls.length > 0) {
        const link = document.createElement('a');
        link.href = pdfUrls[0];
        link.download = `${formData.articleName}-merged.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast.success('Article published successfully!');
      onPublishArticle();
      
    } catch (error) {
      toast.error('Failed to publish article');
    } finally {
      setIsPublishing(false);
    }
  };

  const getStatusBadge = (vivaStatus?: VivaLayoutStatus) => {
    if (!vivaStatus) {
      return <Badge variant="outline">Not Started</Badge>;
    }
    
    switch (vivaStatus.status) {
      case 'uploaded':
        return <Badge variant="secondary" className="gap-1">
          <UploadIcon className="h-3 w-3" />
          Uploaded
        </Badge>;
      case 'converted':
        return <Badge variant="default" className="gap-1">
          <Check className="h-3 w-3" />
          Ready for Editing
        </Badge>;
      case 'pdf_exported':
        return <Badge variant="default" className="gap-1 bg-green-500">
          <Check className="h-3 w-3" />
          PDF Ready
        </Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const completedPages = pages.filter(page => page.vivaStatus?.status === 'pdf_exported').length;
  const progress = pages.length > 0 ? (completedPages / pages.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">VIVA Designer Workflow</h3>
            <p className="text-sm text-muted-foreground">
              Upload layouts to VIVA Designer for editing and export as PDF
            </p>
          </div>
          <Button 
            onClick={handlePublish}
            disabled={isPublishing || completedPages !== pages.length}
            className="gap-2"
            size="lg"
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Publish Article
              </>
            )}
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress: {completedPages} of {pages.length} pages completed</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </Card>

      {/* Pages List */}
      <div className="grid gap-4">
        {pages.map((page, index) => (
          <Card key={page.pageUid} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                  {page.pageNumber}
                </div>
                <div>
                  <h3 className="font-medium">Page {page.pageNumber}</h3>
                  <p className="text-sm text-muted-foreground">{page.typeOfPage}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {getStatusBadge(page.vivaStatus)}
                
                <div className="flex items-center gap-2">
                  {(() => {
                    console.log(`🔍 Page ${page.pageNumber} vivaStatus:`, page.vivaStatus);
                    console.log(`🔍 Page ${page.pageNumber} vivaStatus?.status:`, page.vivaStatus?.status);
                    return null;
                  })()}
                  {!page.vivaStatus || page.vivaStatus.status === 'not_started' ? (
                    <Button
                      onClick={() => uploadToViva(index)}
                      disabled={loadingStates[index] === 'uploading'}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      {loadingStates[index] === 'uploading' ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {page.vivaDocumentName ? 'Connecting...' : 'Uploading...'}
                        </>
                      ) : (
                        <>
                          <UploadIcon className="h-3 w-3" />
                          {page.vivaDocumentName ? 'Connect to VIVA' : 'Upload to VIVA'}
                        </>
                      )}
                    </Button>
                  ) : page.vivaStatus.status === 'converted' && page.vivaStatus.designerUrl ? (
                    <>
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <a href={page.vivaStatus.designerUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                          Edit in Designer
                        </a>
                      </Button>
                      <Button
                        onClick={() => exportToPdf(index)}
                        disabled={loadingStates[index] === 'exporting'}
                        variant="secondary"
                        size="sm"
                        className="gap-2"
                      >
                        {loadingStates[index] === 'exporting' ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <Download className="h-3 w-3" />
                            Export PDF
                          </>
                        )}
                      </Button>
                    </>
                  ) : page.vivaStatus.status === 'pdf_exported' && page.vivaStatus.pdfDownloadUrl ? (
                    <>
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <a href={page.vivaStatus.designerUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-3 w-3" />
                          View in Designer
                        </a>
                      </Button>
                      <Button asChild variant="secondary" size="sm" className="gap-2">
                        <a href={page.vivaStatus.pdfDownloadUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-3 w-3" />
                          Download PDF
                        </a>
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}