'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Heart,
  Users,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Instagram,
  Facebook,
  Linkedin,
  MapPin,
  Calendar,
  ImageIcon,
  Globe,
  Zap,
  ArrowRight,
  ArrowLeft,
  Building2,
  ChevronRight,
  Download,
  Youtube,
  Home,
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
}

interface WorkerGroup {
  id: string;
  name: string;
}

interface GeneratedPost {
  platform: string;
  hook: string;
  caption: string;
  hashtags: string[];
  score: number;
}

interface GenerationResult {
  story: {
    id: string;
    date: string;
    workerName: string;
    photoCount: number;
    location: string;
  };
  photos: {
    original: string[];
    enhanced: string[];
  };
  generated: GeneratedPost[];
}

type Step = 'client' | 'region' | 'generate' | 'results';

export default function DashboardPage() {
  const [step, setStep] = useState<Step>('client');
  const [clients, setClients] = useState<Client[]>([]);
  const [groups, setGroups] = useState<WorkerGroup[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<WorkerGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<number | 'all' | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate');
      const data = await res.json();
      if (data.clients) {
        setClients(data.clients);
      }
    } catch {
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async (clientKey: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/generate?clientKey=${clientKey}`);
      const data = await res.json();
      if (data.groups) {
        setGroups(data.groups);
      }
    } catch {
      setError('Failed to load regions');
    } finally {
      setLoading(false);
    }
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setSelectedGroup(null);
    setResult(null);
    fetchGroups(client.id);
    setStep('region');
  };

  const selectGroup = (group: WorkerGroup) => {
    setSelectedGroup(group);
    setResult(null);
    setStep('generate');
  };

  const generateContent = async () => {
    if (!selectedClient || !selectedGroup) return;

    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientKey: selectedClient.id,
          groupId: selectedGroup.id,
          platforms: ['instagram', 'facebook', 'linkedin', 'threads'],
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        setStep('results');
      }
    } catch {
      setError('Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  const goBack = () => {
    if (step === 'region') {
      setStep('client');
      setSelectedClient(null);
      setGroups([]);
    } else if (step === 'generate' || step === 'results') {
      setStep('region');
      setSelectedGroup(null);
      setResult(null);
    }
  };

  const startOver = () => {
    setStep('client');
    setSelectedClient(null);
    setSelectedGroup(null);
    setGroups([]);
    setResult(null);
    setError(null);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadImage = async (url: string, filename: string, index: number | 'all') => {
    try {
      setDownloading(index);
      // Fetch the image
      const response = await fetch(url);
      const blob = await response.blob();

      // Create a canvas to convert to PNG
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(pngBlob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
          }
        }, 'image/png');
      }
      URL.revokeObjectURL(img.src);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      if (index !== 'all') {
        setDownloading(null);
      }
    }
  };

  const downloadAllImages = async (urls: string[]) => {
    setDownloading('all');
    for (let i = 0; i < urls.length; i++) {
      await downloadImage(urls[i], `mission-connect-photo-${i + 1}.png`, 'all');
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setDownloading(null);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="h-5 w-5" />;
      case 'facebook': return <Facebook className="h-5 w-5" />;
      case 'linkedin': return <Linkedin className="h-5 w-5" />;
      case 'threads': return <span className="text-lg font-bold">@</span>;
      case 'youtube': return <Youtube className="h-5 w-5" />;
      default: return <Sparkles className="h-5 w-5" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'from-pink-500 via-purple-500 to-orange-400';
      case 'facebook': return 'from-blue-600 to-blue-400';
      case 'linkedin': return 'from-sky-700 to-sky-500';
      case 'threads': return 'from-gray-900 to-gray-700';
      case 'youtube': return 'from-red-600 to-red-500';
      default: return 'from-gray-500 to-gray-400';
    }
  };

  const getStepNumber = () => {
    switch (step) {
      case 'client': return 1;
      case 'region': return 2;
      case 'generate': return 3;
      case 'results': return 4;
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-cyan-400/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-white/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container flex h-20 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-emerald-400 rounded-2xl blur-lg opacity-50" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-lg">
                <Globe className="h-6 w-6" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">Mission Connect Studio</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Story Sharing</p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="hidden sm:flex items-center gap-2">
            {['Client', 'Region', 'Generate'].map((label, i) => (
              <div key={label} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  getStepNumber() > i + 1
                    ? 'bg-emerald-500 text-white'
                    : getStepNumber() === i + 1
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {getStepNumber() > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  getStepNumber() >= i + 1 ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'
                }`}>{label}</span>
                {i < 2 && <ChevronRight className="h-4 w-4 mx-2 text-slate-300" />}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="container py-12 px-4 sm:px-6">
        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-center">
            {error}
          </div>
        )}

        {/* Back Button */}
        {step !== 'client' && (
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        {/* Step 1: Select Client */}
        {step === 'client' && (
          <div>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500/10 to-emerald-500/10 border border-sky-500/20 px-5 py-2.5 text-sm font-medium text-sky-700 dark:text-sky-300 mb-6">
                <Building2 className="h-4 w-4" />
                Step 1 of 3
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Select a Client
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                Choose which organization&apos;s stories you want to create social media posts for.
              </p>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => selectClient(client)}
                    className="group text-left p-6 rounded-2xl border-2 border-transparent bg-white dark:bg-slate-800/50 hover:border-sky-500 hover:shadow-lg hover:shadow-sky-500/10 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {client.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">Click to select</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-sky-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Region */}
        {step === 'region' && selectedClient && (
          <div>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500/10 to-emerald-500/10 border border-sky-500/20 px-5 py-2.5 text-sm font-medium text-sky-700 dark:text-sky-300 mb-6">
                <MapPin className="h-4 w-4" />
                Step 2 of 3
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Select a Region
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                Choose a worker group from <span className="font-semibold text-sky-600">{selectedClient.name}</span>.
              </p>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <Card className="text-center py-16 rounded-2xl">
                <CardContent>
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No regions found for this client</p>
                  <Button onClick={() => fetchGroups(selectedClient.id)} variant="outline">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => selectGroup(group)}
                    className="group text-left p-5 rounded-2xl border-2 border-transparent bg-white dark:bg-slate-800/50 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {group.name}
                        </h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          Region
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Generate */}
        {step === 'generate' && selectedClient && selectedGroup && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500/10 to-emerald-500/10 border border-sky-500/20 px-5 py-2.5 text-sm font-medium text-sky-700 dark:text-sky-300 mb-6">
              <Sparkles className="h-4 w-4" />
              Step 3 of 3
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Ready to Generate
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
              We&apos;ll pick a random story with photos from{' '}
              <span className="font-semibold text-emerald-600">{selectedGroup.name}</span> and create
              social media posts for Instagram, Facebook, LinkedIn, and Threads.
            </p>

            {/* Selection Summary */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <span className="inline-flex items-center gap-2 bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 rounded-full px-4 py-2 text-sm font-medium">
                <Building2 className="h-4 w-4" />
                {selectedClient.name}
              </span>
              <span className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full px-4 py-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                {selectedGroup.name}
              </span>
            </div>

            <div className="relative inline-block">
              {!generating && (
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-emerald-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
              )}
              <Button
                size="lg"
                onClick={generateContent}
                disabled={generating}
                className="relative h-14 px-8 text-lg rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 shadow-xl shadow-sky-500/25 border-0"
              >
                {generating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                    Creating Posts...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-3" />
                    Generate Social Posts
                    <ArrowRight className="h-5 w-5 ml-3" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 'results' && result && (
          <div className="space-y-8">
            {/* Story Info Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-500 to-emerald-500 p-8 text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="h-5 w-5" />
                  <span className="text-sm font-medium text-white/90">Story Selected</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Your Posts Are Ready!</h3>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm">
                    <Users className="h-4 w-4" />
                    {result.story.workerName}
                  </span>
                  <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    {result.story.location}
                  </span>
                  <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {new Date(result.story.date).toLocaleDateString()}
                  </span>
                  <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm">
                    <ImageIcon className="h-4 w-4" />
                    {result.story.photoCount} photos
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Photos */}
            {result.photos?.enhanced?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    Enhanced Photos
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAllImages(result.photos.enhanced)}
                    disabled={downloading === 'all'}
                    className="gap-2"
                  >
                    {downloading === 'all' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download All PNG
                      </>
                    )}
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                  {result.photos.enhanced.map((url, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                      <img src={url} alt={`Enhanced photo ${i + 1}`} className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => downloadImage(url, `mission-connect-photo-${i + 1}.png`, i)}
                          disabled={downloading === i}
                          className="bg-white rounded-full p-3 hover:bg-slate-100 transition-colors disabled:opacity-50"
                        >
                          {downloading === i ? (
                            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                          ) : (
                            <Download className="h-5 w-5 text-slate-700" />
                          )}
                        </button>
                      </div>
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                          PNG
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated Posts */}
            <div>
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                Your Social Posts
              </h3>

              <div className="grid gap-6 lg:grid-cols-3">
                {result.generated.map((post, index) => (
                  <Card key={index} className="overflow-hidden rounded-2xl border-0 shadow-lg">
                    <div className={`p-4 bg-gradient-to-r ${getPlatformColor(post.platform)} text-white`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 backdrop-blur rounded-xl">
                          {getPlatformIcon(post.platform)}
                        </div>
                        <span className="font-semibold capitalize text-lg">{post.platform}</span>
                      </div>
                    </div>

                    <CardContent className="p-6 space-y-5">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hook</p>
                        <p className="font-medium leading-snug">{post.hook}</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Caption</p>
                        <div className="text-sm leading-relaxed max-h-56 overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap">
                          {post.caption}
                        </div>
                      </div>

                      {post.hashtags.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hashtags</p>
                          <div className="flex flex-wrap gap-2">
                            {post.hashtags.slice(0, 6).map((tag, i) => (
                              <span key={i} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                                #{tag.replace('#', '')}
                              </span>
                            ))}
                            {post.hashtags.length > 6 && (
                              <span className="text-xs text-muted-foreground py-1">+{post.hashtags.length - 6} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      <Button
                        variant={copiedIndex === index ? "default" : "outline"}
                        size="sm"
                        className={`w-full rounded-xl ${copiedIndex === index ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-0' : ''}`}
                        onClick={() => copyToClipboard(`${post.caption}\n\n${post.hashtags.map(t => `#${t.replace('#', '')}`).join(' ')}`, index)}
                      >
                        {copiedIndex === index ? (
                          <><Check className="h-4 w-4 mr-2" />Copied!</>
                        ) : (
                          <><Copy className="h-4 w-4 mr-2" />Copy to Clipboard</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="text-center pt-8 flex flex-wrap justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={generateContent}
                disabled={generating}
                className="rounded-xl gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                Generate Another Story
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={startOver}
                className="rounded-xl gap-2 border-sky-500 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950"
              >
                <Home className="h-4 w-4" />
                Start Over
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative mt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-600 via-cyan-600 to-emerald-600" />
        <div className="relative container py-12 text-center text-white">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur">
              <Globe className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold">Mission Connect Studio</span>
          </div>
          <p className="text-white/80 max-w-md mx-auto">
            Transforming health mission stories into inspiring social content.
          </p>
          <div className="flex justify-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-white/70">
              <Heart className="h-4 w-4" />
              <span className="text-sm">Made with love</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm">Powered by AI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
