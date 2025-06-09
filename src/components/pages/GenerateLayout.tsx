
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, XCircle, Eye, Save, Trash2 } from "lucide-react";
import { useDropzone } from 'react-dropzone';

export function GenerateLayout() {
  const [file, setFile] = useState<File | null>(null);
  const [pageNo, setPageNo] = useState("1");
  const [mergeLevel, setMergeLevel] = useState("2");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/pdf') {
      setFile(file);
      toast({
        title: "File uploaded",
        description: `${file.name} is ready for processing.`,
      });
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const handleGenerate = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload a PDF file first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    // Simulate processing with progress updates
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock successful response
      const mockPreview = {
        id: `temp-${Date.now()}`,
        name: file.name.replace('.pdf', ' - Layout'),
        original_image: `https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&h=800&fit=crop`,
        bbox_image: `https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&h=800&fit=crop&overlay=bbox`,
        elements_count: Math.floor(Math.random() * 10) + 5,
        confidence: 0.92 + Math.random() * 0.07,
        page_no: parseInt(pageNo),
        merge_level: parseInt(mergeLevel)
      };

      setProgress(100);
      setPreviewData(mockPreview);
      setShowPreview(true);
      
      toast({
        title: "Layout generated successfully!",
        description: "Preview your extracted layout below.",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "There was an error processing your PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      clearInterval(progressInterval);
    }
  };

  const handleSave = async () => {
    try {
      // Simulate save API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Layout saved!",
        description: "Your layout has been added to the collection.",
      });
      
      // Reset form
      setFile(null);
      setPreviewData(null);
      setShowPreview(false);
      setProgress(0);
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving your layout.",
        variant: "destructive",
      });
    }
  };

  const handleDiscard = () => {
    setPreviewData(null);
    setShowPreview(false);
    setProgress(0);
    toast({
      title: "Preview discarded",
      description: "The temporary layout has been removed.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Generate Layout</h1>
        <p className="text-muted-foreground">Upload a PDF and extract its layout structure</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : file 
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  {file ? (
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  ) : (
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                  )}
                  <div>
                    {file ? (
                      <>
                        <p className="text-lg font-medium text-green-700 dark:text-green-400">
                          {file.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </>
                    ) : isDragActive ? (
                      <p className="text-lg font-medium">Drop your PDF here</p>
                    ) : (
                      <>
                        <p className="text-lg font-medium">Drag & drop a PDF file</p>
                        <p className="text-sm text-muted-foreground">or click to browse (max 50MB)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pageNo">Page Number</Label>
                  <Input
                    id="pageNo"
                    type="number"
                    min="1"
                    value={pageNo}
                    onChange={(e) => setPageNo(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mergeLevel">Merge Level</Label>
                  <Select value={mergeLevel} onValueChange={setMergeLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Level 1 - Fine detail</SelectItem>
                      <SelectItem value="2">Level 2 - Balanced</SelectItem>
                      <SelectItem value="3">Level 3 - Grouped</SelectItem>
                      <SelectItem value="4">Level 4 - Coarse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate} 
                disabled={!file || isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? "Processing..." : "Generate Layout"}
              </Button>

              {/* Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing PDF...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Guidelines */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">PDF Format</p>
                    <p className="text-xs text-muted-foreground">Upload vector or high-quality raster PDFs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Page Selection</p>
                    <p className="text-xs text-muted-foreground">Choose specific page number to extract</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Merge Level</p>
                    <p className="text-xs text-muted-foreground">Higher levels group similar elements</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processing Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-sm font-medium">96.3%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Process Time</span>
                <span className="text-sm font-medium">2.4s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Queue Length</span>
                <span className="text-sm font-medium">0 jobs</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Modal/Section */}
      {showPreview && previewData && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Layout Preview
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleDiscard} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Discard
                </Button>
                <Button onClick={handleSave} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Layout
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-2xl font-bold text-primary">{previewData.elements_count}</div>
                <div className="text-sm text-muted-foreground">Elements Found</div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-2xl font-bold text-green-600">{(previewData.confidence * 100).toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Confidence</div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{previewData.page_no}</div>
                <div className="text-sm text-muted-foreground">Page Number</div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{previewData.merge_level}</div>
                <div className="text-sm text-muted-foreground">Merge Level</div>
              </div>
            </div>

            {/* Preview Images */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-medium text-center">Original Page</h3>
                <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                  <img
                    src={previewData.original_image}
                    alt="Original page preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-center">Extracted Layout</h3>
                <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                  <img
                    src={previewData.bbox_image}
                    alt="Layout with bounding boxes preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
