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

  const handleUpscale = async () => {
    setIsProcessing(true);
    setProgress(10);
    setError(null);

    try {
      // Start the upscale process
      const response = await fetch("/api/kie/upscale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          scale,
          faceEnhance,
        }),
      });

      const data = await response.json();
      
      if (!data.ok || !data.taskId) {
        throw new Error(data.error || "Failed to start upscale process");
      }

      setTaskId(data.taskId);
      setProgress(30);
      
      // Poll for status
      await checkStatus(data.taskId);
    } catch (err: any) {
      setError(err.message || "An error occurred during upscaling");
      setIsProcessing(false);
    }
  };

  const checkStatus = async (id: string) => {
    try {
      const response = await fetch("/api/kie/upscale-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: id,
        }),
      });

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.error || "Failed to check upscale status");
      }

      if (data.status === "success" && data.resultUrls?.length > 0) {
        // Upscale completed successfully
        setProgress(100);
        setTimeout(() => {
          setIsProcessing(false);
          onUpscaleComplete(data.resultUrls[0]);
          onOpenChange(false);
        }, 1000);
      } else if (data.status === "fail") {
        throw new Error("Upscale process failed");
      } else {
        // Still processing, update progress and check again
        setProgress(Math.min(90, progress + 10));
        setTimeout(() => checkStatus(id), 2000);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while checking status");
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#0B0D12] p-6">
          <h2 className="mb-4 text-xl font-semibold">Upscale Image</h2>
          
          <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg bg-black/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Original image" className="h-full w-full object-contain" />
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
              
              {error && <div className="mb-4 rounded-md bg-red-900/30 p-3 text-sm text-red-200">{error}</div>}
              
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="border-white/10 bg-white/5 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button onClick={handleUpscale} className="bg-white text-black hover:bg-white/90">
                  Upscale
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <Progress value={progress} className="h-2 w-full bg-white/10" indicatorClassName="bg-white" />
              <p className="text-center text-sm text-white/70">
                {progress < 100 ? "Processing your image..." : "Upscale complete!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
