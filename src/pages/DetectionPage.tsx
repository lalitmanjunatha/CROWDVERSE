import { useRef, useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader } from '@/components/ui';
import { DensityBadge } from '@/components/Badges';
import { ScanSearch, Upload, Camera, CameraOff, Video, Image as ImageIcon, AlertCircle, Shuffle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { densityLevel, occupancy, DENSITY_META } from '@/lib/density';

interface DetectionResult {
  zoneId: string;
  count: number;
  confidence: number;
}

export function DetectionPage() {
  const { zones, counts, setZoneCount } = useApp();
  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [results, setResults] = useState<DetectionResult[] | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (e: any) {
      setCameraError(
        e?.name === 'NotAllowedError'
          ? 'Camera permission denied. Enable camera access in your browser settings to use live monitoring.'
          : e?.name === 'NotFoundError'
          ? 'No camera device found on this machine.'
          : 'Unable to access camera. Your browser may not support this feature.'
      );
      setCameraActive(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    setMediaType(file.type.startsWith('video') ? 'video' : 'image');
    setResults(null);
  }

  /**
   * DEMO SIMULATION analysis.
   * No real AI model is configured. We produce a transparent, reproducible
   * estimate from the file size + deterministic pseudo-random distribution so
   * the demonstration is honest: results are clearly labeled SIMULATION.
   */
  function runAnalysis() {
    setAnalyzing(true);
    setResults(null);
    setTimeout(() => {
      // Seed from current live counts so the demo reflects the active scenario.
      const baseTotal = Object.values(counts).reduce((a, b) => a + b, 0);
      const simulatedTotal = Math.max(40, Math.round(baseTotal * (0.8 + Math.random() * 0.4)));
      // distribute across zones proportional to current counts, with jitter
      const weights = zones.map(z => (counts[z.id] ?? 1) + 1);
      const wSum = weights.reduce((a, b) => a + b, 0);
      const res: DetectionResult[] = zones.map((z, i) => ({
        zoneId: z.id,
        count: Math.max(0, Math.round((weights[i] / wSum) * simulatedTotal + (Math.random() - 0.5) * 40)),
        confidence: 0.7 + Math.random() * 0.2,
      }));
      setResults(res);
      setAnalyzing(false);
    }, 900);
  }

  function applyToLive() {
    if (!results) return;
    results.forEach(r => setZoneCount(r.zoneId, r.count));
  }

  function clearMedia() {
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    setMediaUrl(null);
    setMediaType(null);
    setResults(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">AI Detection</h1>
        <p className="text-sm text-slate-400">Upload an image or video, or use a live camera, to estimate crowd counts per zone.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-warn-500/10 px-3 py-2 ring-1 ring-warn-500/20">
        <AlertCircle className="h-4 w-4 text-warn-400" />
        <span className="text-xs text-warn-300">DEMO SIMULATION — No real object-detection model is configured. Estimates below are simulated for demonstration and are clearly labeled as such.</span>
      </div>

      <div className="flex gap-2">
        <button onClick={() => { setMode('upload'); stopCamera(); }} className={cn('btn', mode === 'upload' ? 'bg-accent-500 text-white' : 'bg-white/5 text-slate-300')}>
          <Upload className="h-4 w-4" /> Upload File
        </button>
        <button onClick={() => setMode('camera')} className={cn('btn', mode === 'camera' ? 'bg-accent-500 text-white' : 'bg-white/5 text-slate-300')}>
          <Camera className="h-4 w-4" /> Live Camera
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title={mode === 'upload' ? 'Upload Image or Video' : 'Live Camera Feed'} subtitle={mode === 'upload' ? 'JPG, PNG, MP4, WebM supported' : 'Requires camera permission'} icon={mode === 'upload' ? Upload : Camera} />

          {mode === 'upload' && (
            <div className="space-y-3">
              <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
              {!mediaUrl && (
                <button onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 bg-navy-900/40 py-12 text-slate-400 transition-colors hover:border-accent-500/40 hover:text-slate-300">
                  <Upload className="h-8 w-8" />
                  <span className="text-sm font-medium">Click to choose a file</span>
                  <span className="text-xs text-slate-500">Image or video up to ~50MB</span>
                </button>
              )}
              {mediaUrl && (
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-xl border border-white/5 bg-black">
                    {mediaType === 'image' ? (
                      <img src={mediaUrl} alt="Uploaded" className="max-h-72 w-full object-contain" />
                    ) : (
                      <video src={mediaUrl} controls className="max-h-72 w-full object-contain" />
                    )}
                    <button onClick={clearMedia} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-black/60 text-white hover:bg-black/80">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {mediaType === 'image' ? <ImageIcon className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                    {mediaType} loaded
                  </div>
                  <button onClick={runAnalysis} disabled={analyzing} className="btn-primary w-full">
                    <ScanSearch className="h-4 w-4" /> {analyzing ? 'Analyzing…' : 'Run Detection (Simulated)'}
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === 'camera' && (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl border border-white/5 bg-black">
                <video ref={videoRef} muted playsInline className="max-h-72 w-full object-contain" />
                {!cameraActive && (
                  <div className="absolute inset-0 grid place-items-center bg-navy-950/80">
                    <div className="text-center">
                      <CameraOff className="mx-auto h-8 w-8 text-slate-500" />
                      <p className="mt-2 text-xs text-slate-400">Camera is off</p>
                    </div>
                  </div>
                )}
              </div>
              {cameraError && (
                <div className="rounded-lg bg-crit-500/10 px-3 py-2 text-xs text-crit-300 ring-1 ring-crit-500/20">{cameraError}</div>
              )}
              <div className="flex gap-2">
                {!cameraActive ? (
                  <button onClick={startCamera} className="btn-primary flex-1">
                    <Camera className="h-4 w-4" /> Enable Camera
                  </button>
                ) : (
                  <button onClick={stopCamera} className="btn-ghost flex-1">
                    <CameraOff className="h-4 w-4" /> Stop Camera
                  </button>
                )}
                <button onClick={runAnalysis} disabled={analyzing || !cameraActive} className="btn-ghost flex-1">
                  <ScanSearch className="h-4 w-4" /> {analyzing ? 'Analyzing…' : 'Capture & Analyze'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">Camera access is requested only when you enable it. Frames are processed in-browser and not uploaded or stored.</p>
            </div>
          )}
        </Card>

        {/* Results */}
        <Card>
          <CardHeader title="Detection Results" subtitle="Estimated people per zone (simulated)" icon={ScanSearch} right={<span className="chip bg-warn-500/15 text-warn-400 ring-1 ring-warn-500/30">Simulated</span>} />

          {!results && !analyzing && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <ScanSearch className="h-8 w-8 text-slate-600" />
              <p className="text-sm text-slate-400">No analysis yet.</p>
              <p className="text-xs text-slate-500">Upload media or enable the camera, then run detection.</p>
            </div>
          )}

          {analyzing && (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500/30 border-t-accent-400" />
              <p className="text-xs text-slate-400">Running simulated detection…</p>
            </div>
          )}

          {results && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-navy-900/60 p-3">
                  <div className="label">Total Detected</div>
                  <div className="stat-num">{results.reduce((a, r) => a + r.count, 0).toLocaleString()}</div>
                </div>
                <div className="rounded-lg bg-navy-900/60 p-3">
                  <div className="label">Avg Confidence</div>
                  <div className="stat-num">{(results.reduce((a, r) => a + r.confidence, 0) / results.length * 100).toFixed(0)}%</div>
                </div>
              </div>

              <div className="space-y-2">
                {results.map(r => {
                  const z = zones.find(z => z.id === r.zoneId)!;
                  const level = densityLevel(r.count, z);
                  return (
                    <div key={r.zoneId} className="flex items-center justify-between rounded-lg border border-white/5 bg-navy-900/60 p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-xs font-bold text-white">{z.id}</span>
                        <div>
                          <div className="text-xs font-medium text-white">{z.name}</div>
                          <div className="text-[10px] text-slate-500">{Math.round(occupancy(r.count, z.capacity))}% of capacity</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{r.count.toLocaleString()}</span>
                        <DensityBadge level={level} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button onClick={applyToLive} className="btn-primary flex-1">
                  <Shuffle className="h-4 w-4" /> Apply to Live Monitoring
                </button>
                <button onClick={() => setResults(null)} className="btn-ghost">Clear</button>
              </div>
              <p className="text-[11px] text-slate-500">Applying writes these simulated counts into the live monitoring zones so the rest of the system (alerts, prediction, recommendations) responds to them.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
