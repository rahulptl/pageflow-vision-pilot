import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Image, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept: Record<string, string[]>;
  fileType: "json" | "image";
  selectedFile: File | null;
  title: string;
  description: string;
}

export function FileUpload({ 
  onFileSelect, 
  accept, 
  fileType, 
  selectedFile, 
  title, 
  description 
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
    setIsDragActive(false);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIcon = () => {
    if (fileType === "json") return FileText;
    return Image;
  };

  const Icon = getIcon();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </label>
      
      <Card 
        {...getRootProps()} 
        className={cn(
          "relative cursor-pointer transition-all duration-200 hover:shadow-md",
          isDragActive && "border-primary bg-primary/5 shadow-lg",
          isDragReject && "border-destructive bg-destructive/5",
          selectedFile && "border-primary/50 bg-primary/5"
        )}
      >
        <input {...getInputProps()} />
        <CardContent className="p-6">
          {selectedFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {selectedFile.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {formatFileSize(selectedFile.size)}
                    </Badge>
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      <span className="text-xs">Ready</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                type="button"
                variant="ghost" 
                size="sm"
                onClick={handleRemoveFile}
                className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <div className={cn(
                "w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center transition-colors",
                isDragActive ? "bg-primary text-primary-foreground" : "bg-muted",
                isDragReject && "bg-destructive text-destructive-foreground"
              )}>
                <Upload className="w-6 h-6" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {isDragActive 
                    ? `Drop your ${fileType} file here`
                    : `Drag & drop your ${fileType} file here`
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {description}
                </p>
                <div className="pt-2">
                  <Button type="button" variant="outline" size="sm">
                    Choose File
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {isDragReject && (
        <p className="text-xs text-destructive">
          Please upload a valid {fileType} file
        </p>
      )}
    </div>
  );
}