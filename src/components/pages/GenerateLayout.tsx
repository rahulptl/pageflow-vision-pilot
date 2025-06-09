
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, Eye, Save, Trash2 } from "lucide-react";
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { PageType } from "@/types/api";
import { useNavigate } from "react-router-dom";

export function GenerateLayout() {
  const [file, setFile] = useState<File | null>(null);
  const [pageNo, setPageNo] = useState("1");
  const [pageNo2, setPageNo2] = useState("2");
  const [pageType, setPageType] = useState<PageType>(PageType.OnePager);
  const [mergeLevel, setMergeLevel] = useState("2");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const runLayoutMutation = useMutation({
    mutationFn: (req: any) => apiService.runLayoutPipeline(req),
    onSuccess: () => {
      setProgress(100);
      toast({
        title: "Layout generated successfully!",
        description: "Your layout has been processed and saved.",
      });
      
      // Invalidate and refetch layouts
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
      queryClient.invalidateQueries({ queryKey: ['runs'] });
      
      // Reset form
      setFile(null);
      setProgress(0);
      setIsProcessing(false);
      
      // Navigate to layouts page
      setTimeout(() => {
        navigate('/layouts');
      }, 1500);
    },
    onError: (error) => {
      console.error('Layout generation failed:', error);
      toast({
        title: "Generation failed",
        description: "There was an error processing your PDF. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      setProgress(0);
    },
  });

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

    // Simulate progress updates while waiting for API
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
      const pages = [parseInt(pageNo)];
      if (pageType === PageType.TwoPager) {
        pages.push(parseInt(pageNo2));
      }
      await runLayoutMutation.mutateAsync({
        file,
        type_of_page: pageType,
        page_numbers: pages,
        merge_level: parseInt(mergeLevel),
      });
      clearInterval(progressInterval);
    } catch (error) {
      clearInterval(progressInterval);
    }
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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pageType">Page Type</Label>
                  <Select value={pageType} onValueChange={(val) => setPageType(val as PageType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PageType.OnePager}>1 pager</SelectItem>
                      <SelectItem value={PageType.TwoPager}>2 pager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pageNo">Page {pageType === PageType.TwoPager ? "1" : "Number"}</Label>
                  <Input
                    id="pageNo"
                    type="number"
                    min="1"
                    value={pageNo}
                    onChange={(e) => setPageNo(e.target.value)}
                    placeholder="1"
                  />
                </div>
                {pageType === PageType.TwoPager && (
                  <div className="space-y-2">
                    <Label htmlFor="pageNo2">Page 2</Label>
                    <Input
                      id="pageNo2"
                      type="number"
                      min="1"
                      value={pageNo2}
                      onChange={(e) => setPageNo2(e.target.value)}
                      placeholder="2"
                    />
                  </div>
                )}
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
                <span className="text-sm text-muted-foreground">API Status</span>
                <span className="text-sm font-medium">Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Max File Size</span>
                <span className="text-sm font-medium">50 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Supported Format</span>
                <span className="text-sm font-medium">PDF</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
