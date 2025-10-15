import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type UpscaleDialogProps = {
  imageUrl: string;
  onUpscaleComplete: (newImageUrl: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function UpscaleDialog({
  imageUrl,
  onUpscaleComplete,
  open,
  onOpenChange,
}: UpscaleDialogProps) {
  const [scale, setScale] = useState<number>(2);
  const [faceEnhance, setFaceEnhance] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [retries, setRetries] = useState<number>(0);
  const [statusCheckCount, setStatusCheckCount] = useState<number>(0);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Direct API call to KIE
  const handleDirectUpscale = async () => {
    setIsProcessing(true);
    setProgress(10);
    setError(null);
    setRetries(0);
    setStatusCheckCount(0);
    setDebugInfo(null);

    try {
      // Get the KIE API key from an environment variable or config
      // This is just a fallback - you should set this in your .env.local
      const KIE_API_KEY = process.env.NEXT_PUBLIC_KIE_API_KEY || "06ebbce40758c0e4a1d0c6e4d9e6c6f7";
      const KIE_API_BASE = process.env.NEXT_PUBLIC_KIE_API_BASE || "https://api.kie.ai";
      
      // Call the KIE upscale API directly
      const response = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${KIE_API_KEY}`
        },
        body: JSON.stringify({
          model: "nano-banana-upscale",
          input: {
            image: imageUrl,
            scale: scale,
            face_enhance: !!faceEnhance
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.data?.taskId) {
        setDebugInfo(JSON.stringify(data, null, 2));
        throw new Error(data.message || "Failed to start upscale process");
      }

      setTaskId(data.data.taskId);
      setProgress(30);
      
      // Poll for status directly
      await checkDirectStatus(data.data.taskId);
    } catch (err: any) {
      console.error("Direct upscale error:", err);
      setError(err.message || "An error occurred during upscaling");
      setIsProcessing(false);
    }
  };

  const checkDirectStatus = async (id: string) => {
    if (statusCheckCount > 30) { // Limit to 30 status checks (about 1 minute)
      setError("Upscale process timed out. Please try again later.");
      setIsProcessing(false);
      return;
    }

    setStatusCheckCount(prev => prev + 1);

    try {
      // Get the KIE API key from an environment variable or config
      const KIE_API_KEY = process.env.NEXT_PUBLIC_KIE_API_KEY || "06ebbce40758c0e4a1d0c6e4d9e6c6f7";
      const KIE_API_BASE = process.env.NEXT_PUBLIC_KIE_API_BASE || "https://api.kie.ai";
      
      // Call the KIE API directly to check task status
      const response = await fetch(`${KIE_API_BASE}/api/v1/jobs/getTaskResult?taskId=${id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${KIE_API_KEY}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        setDebugInfo(JSON.stringify(data, null, 2));
        throw new Error(`Status check failed: ${response.status}`);
      }

      // Parse the result to extract the upscaled image URL if available
      if (data.data?.state === "success" && data.data?.resultJson) {
        try {
          const resultJson = JSON.parse(data.data.resultJson);
          const resultUrls = resultJson.resultUrls || [];
          
          if (resultUrls.length > 0) {
            // Upscale completed successfully
            setProgress(100);
            setTimeout(() => {
              setIsProcessing(false);
              onUpscaleComplete(resultUrls[0]);
              onOpenChange(false);
            }, 1000);
            return;
          }
        } catch (e) {
          console.error("Failed to parse resultJson:", e);
        }
      } else if (data.data?.state === "fail") {
        throw new Error("Upscale process failed");
      }
      
      // Still processing, update progress and check again
      const newProgress = Math.min(90, 30 + (statusCheckCount * 2));
      setProgress(newProgress);
      setTimeout(() => checkDirectStatus(id), 2000);
    } catch (err: any) {
      console.error("Direct status check error:", err);
      
      // If we haven't retried too many times, try again
      if (retries < 3) {
        setRetries(prev => prev + 1);
        setTimeout(() => checkDirectStatus(id), 3000);
      } else {
        setError(err.message || "An error occurred while checking status");
        setIsProcessing(false);
      }
    }
  };

  const handleCancel = () => {
    if (isProcessing) {
      setIsProcessing(false);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#0B0D12] p-6">
          <h2 className="mb-4 text-xl font-semibold">Upscale Image</h2>
          
          <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg bg-black/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={imageUrl} 
              alt="Original image" 
              className="h-full w-full object-contain"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                setError("Unable to load image. The image URL may be inaccessible.");
              }}
            />
          </div>
          
          {!isProcessing ? (
            <>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Scale Factor</label>
                <div className="flex gap-2">
                  {[2, 3, 4].map((value) => (
                    <button
                      key={value}
                      onClick={() => setScale(value)}
                      className={`flex-1 rounded-md px-3 py-2 text-center ${
                        scale === value
                          ? "bg-white text-black"
                          : "border border-white/15 bg-white/10"
                      }`}
                    >
                      {value}x
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={faceEnhance}
                    onChange={(e) => setFaceEnhance(e.target.checked)}
                    className="h-4 w-4 rounded border-white/30 bg-white/10"
                  />
                  Enhance faces
                </label>
              </div>
              
              {error && (
                <div className="mb-4 rounded-md bg-red-900/30 p-3 text-sm text-red-200">
                  <p className="font-medium">Error:</p>
                  <p>{error}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="border-white/10 bg-white/5 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button onClick={handleDirectUpscale} className="bg-white text-black hover:bg-white/90">
                  Upscale
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <Progress value={progress} className="h-2 w-full bg-white/10" />
              <p className="text-center text-sm text-white/70">
                {progress < 100 ? "Processing your image..." : "Upscale complete!"}
              </p>
              
              {error && (
                <div className="mt-4 rounded-md bg-red-900/30 p-3 text-sm text-red-200">
                  <p className="font-medium">Error:</p>
                  <p>{error}</p>
                  {debugInfo && (
                    <details className="mt-2 text-xs">
                      <summary>Debug Info</summary>
                      <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-black/50 p-2">
                        {debugInfo}
                      </pre>
                    </details>
                  )}
                  <div className="mt-2 flex justify-end">
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                      size="sm"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
