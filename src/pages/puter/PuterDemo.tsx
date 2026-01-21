import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabase';

// Puter AI response type
interface PuterAIResponse {
  message: {
    content: string;
  };
  toString: () => string;
}

// Puter user type
interface PuterUser {
  username: string;
  email?: string;
}

// Image generation options
interface Txt2ImgOptions {
  model?: string;
  quality?: string;
}

// Declare puter as global
declare global {
  interface Window {
    puter: {
      ai: {
        chat: (prompt: string, options?: { model?: string }) => Promise<PuterAIResponse | string>;
        txt2img: (prompt: string, options?: Txt2ImgOptions | boolean) => Promise<HTMLImageElement>;
      };
      auth: {
        signIn: () => Promise<PuterUser>;
        signOut: () => Promise<void>;
        isSignedIn: () => Promise<boolean>;
        getUser: () => Promise<PuterUser | null>;
        getMonthlyUsage: () => Promise<Record<string, unknown>>;
      };
      print: (text: string) => void;
    };
  }
}

// Helper to extract text from Puter AI response
const extractAIResponse = (response: unknown): string => {
  // Handle string directly
  if (typeof response === 'string') {
    return response;
  }

  // Handle null/undefined
  if (response == null) {
    return 'No response received';
  }

  // Handle object responses
  if (typeof response === 'object') {
    const obj = response as Record<string, unknown>;

    // Handle {text: string} format
    if (typeof obj.text === 'string') {
      return obj.text;
    }

    // Handle {message: {content: string}} format
    if (obj.message && typeof (obj.message as Record<string, unknown>).content === 'string') {
      return (obj.message as Record<string, unknown>).content as string;
    }

    // Handle {content: string} format
    if (typeof obj.content === 'string') {
      return obj.content;
    }

    // Handle toString method
    if (typeof obj.toString === 'function' && obj.toString !== Object.prototype.toString) {
      const str = obj.toString();
      if (str !== '[object Object]') {
        return str;
      }
    }

    // Fallback to JSON
    return JSON.stringify(response);
  }

  return String(response);
};

// Progress stages for image generation
const PROGRESS_STAGES = [
  { threshold: 5, message: 'Initializing AI model...', emoji: '🚀' },
  { threshold: 15, message: 'Analyzing your prompt...', emoji: '🔍' },
  { threshold: 30, message: 'Understanding composition...', emoji: '🎨' },
  { threshold: 50, message: 'Generating base image...', emoji: '✨' },
  { threshold: 70, message: 'Adding details and textures...', emoji: '🖌️' },
  { threshold: 85, message: 'Enhancing colors and lighting...', emoji: '💡' },
  { threshold: 95, message: 'Finalizing your masterpiece...', emoji: '🎯' },
  { threshold: 100, message: 'Complete!', emoji: '✅' },
];

// Get current stage based on progress
const getProgressStage = (progress: number) => {
  for (let i = PROGRESS_STAGES.length - 1; i >= 0; i--) {
    if (progress >= PROGRESS_STAGES[i].threshold) {
      return PROGRESS_STAGES[i];
    }
  }
  return PROGRESS_STAGES[0];
};

// Available image models
const IMAGE_MODELS = [
  { id: 'dall-e-3', name: 'DALL-E 3', description: 'Best quality' },
  { id: 'gpt-image-1', name: 'GPT Image', description: 'High quality' },
  { id: 'gpt-image-1-mini', name: 'GPT Image Mini', description: 'Fast' },
];

// Quality options per model
const QUALITY_OPTIONS: Record<string, { id: string; name: string }[]> = {
  'dall-e-3': [
    { id: 'hd', name: 'HD' },
    { id: 'standard', name: 'Standard' },
  ],
  'gpt-image-1': [
    { id: 'high', name: 'High' },
    { id: 'medium', name: 'Medium' },
    { id: 'low', name: 'Low' },
  ],
  'gpt-image-1-mini': [
    { id: 'high', name: 'High' },
    { id: 'medium', name: 'Medium' },
    { id: 'low', name: 'Low' },
  ],
};

// Midjourney-style Prompt Builder Options
const PROMPT_STYLES = [
  { id: '', name: 'None' },
  { id: 'photorealistic', name: '📷 Photorealistic' },
  { id: 'cinematic', name: '🎬 Cinematic' },
  { id: 'anime', name: '🎌 Anime' },
  { id: 'digital art', name: '💻 Digital Art' },
  { id: 'oil painting', name: '🖼️ Oil Painting' },
  { id: 'watercolor', name: '🎨 Watercolor' },
  { id: '3D render', name: '🧊 3D Render' },
  { id: 'pixel art', name: '👾 Pixel Art' },
  { id: 'comic book', name: '📚 Comic Book' },
  { id: 'fantasy art', name: '🐉 Fantasy Art' },
  { id: 'concept art', name: '✏️ Concept Art' },
  { id: 'minimalist', name: '⬜ Minimalist' },
  { id: 'surrealist', name: '🌀 Surrealist' },
  { id: 'impressionist', name: '🌸 Impressionist' },
  { id: 'cyberpunk', name: '🤖 Cyberpunk' },
  { id: 'steampunk', name: '⚙️ Steampunk' },
];

const PROMPT_LIGHTING = [
  { id: '', name: 'None' },
  { id: 'golden hour', name: '🌅 Golden Hour' },
  { id: 'studio lighting', name: '💡 Studio' },
  { id: 'dramatic lighting', name: '🎭 Dramatic' },
  { id: 'soft light', name: '☁️ Soft Light' },
  { id: 'neon lighting', name: '💜 Neon' },
  { id: 'backlit', name: '🌟 Backlit' },
  { id: 'natural lighting', name: '☀️ Natural' },
  { id: 'moody lighting', name: '🌙 Moody' },
  { id: 'cinematic lighting', name: '🎬 Cinematic' },
  { id: 'volumetric lighting', name: '✨ Volumetric' },
  { id: 'rim lighting', name: '🔆 Rim Light' },
];

const PROMPT_CAMERA = [
  { id: '', name: 'None' },
  { id: 'close-up shot', name: '🔍 Close-up' },
  { id: 'portrait shot', name: '👤 Portrait' },
  { id: 'full body shot', name: '🧍 Full Body' },
  { id: 'wide angle shot', name: '🌐 Wide Angle' },
  { id: 'aerial view', name: '🦅 Aerial' },
  { id: 'low angle shot', name: '⬆️ Low Angle' },
  { id: 'eye level shot', name: '👁️ Eye Level' },
  { id: 'macro shot', name: '🔬 Macro' },
  { id: 'panoramic view', name: '🏔️ Panoramic' },
  { id: 'dutch angle', name: '📐 Dutch Angle' },
  { id: 'over the shoulder', name: '🎯 Over Shoulder' },
];

const PROMPT_MOOD = [
  { id: '', name: 'None' },
  { id: 'mysterious', name: '🔮 Mysterious' },
  { id: 'cheerful', name: '😊 Cheerful' },
  { id: 'dark', name: '🖤 Dark' },
  { id: 'ethereal', name: '✨ Ethereal' },
  { id: 'epic', name: '⚔️ Epic' },
  { id: 'peaceful', name: '🕊️ Peaceful' },
  { id: 'intense', name: '🔥 Intense' },
  { id: 'dreamy', name: '💭 Dreamy' },
  { id: 'nostalgic', name: '📜 Nostalgic' },
  { id: 'romantic', name: '💕 Romantic' },
  { id: 'melancholic', name: '🌧️ Melancholic' },
];

const PROMPT_COLORS = [
  { id: '', name: 'None' },
  { id: 'vibrant colors', name: '🌈 Vibrant' },
  { id: 'muted colors', name: '🎨 Muted' },
  { id: 'monochrome', name: '⬛ Monochrome' },
  { id: 'warm tones', name: '🔶 Warm Tones' },
  { id: 'cool tones', name: '🔷 Cool Tones' },
  { id: 'pastel colors', name: '🍬 Pastel' },
  { id: 'neon colors', name: '💜 Neon' },
  { id: 'earth tones', name: '🤎 Earth Tones' },
  { id: 'high contrast', name: '◐ High Contrast' },
  { id: 'sepia', name: '📜 Sepia' },
];

const PROMPT_QUALITY_TAGS = [
  { id: '8K resolution', name: '8K' },
  { id: 'highly detailed', name: 'Detailed' },
  { id: 'sharp focus', name: 'Sharp' },
  { id: 'professional', name: 'Pro' },
  { id: 'award-winning', name: 'Award' },
  { id: 'masterpiece', name: 'Master' },
  { id: 'trending on artstation', name: 'Artstation' },
  { id: 'ultra realistic', name: 'Ultra Real' },
];

const PROMPT_PRESETS = [
  {
    name: '📸 Portrait Photo',
    subject: 'beautiful portrait of a person',
    style: 'photorealistic',
    lighting: 'studio lighting',
    camera: 'portrait shot',
    mood: '',
    colors: '',
    quality: ['highly detailed', 'sharp focus', 'professional'],
  },
  {
    name: '🎌 Anime Character',
    subject: 'anime character',
    style: 'anime',
    lighting: 'soft light',
    camera: 'portrait shot',
    mood: 'cheerful',
    colors: 'vibrant colors',
    quality: ['highly detailed'],
  },
  {
    name: '🏔️ Epic Landscape',
    subject: 'majestic mountain landscape',
    style: 'digital art',
    lighting: 'golden hour',
    camera: 'panoramic view',
    mood: 'epic',
    colors: 'vibrant colors',
    quality: ['8K resolution', 'highly detailed'],
  },
  {
    name: '🐉 Fantasy Scene',
    subject: 'dragon flying over castle',
    style: 'fantasy art',
    lighting: 'dramatic lighting',
    camera: 'wide angle shot',
    mood: 'epic',
    colors: 'vibrant colors',
    quality: ['masterpiece', 'highly detailed'],
  },
  {
    name: '🤖 Cyberpunk City',
    subject: 'futuristic cyberpunk city street',
    style: 'cyberpunk',
    lighting: 'neon lighting',
    camera: 'wide angle shot',
    mood: 'mysterious',
    colors: 'neon colors',
    quality: ['8K resolution', 'highly detailed'],
  },
  {
    name: '🖼️ Classic Painting',
    subject: 'serene countryside scene',
    style: 'oil painting',
    lighting: 'natural lighting',
    camera: 'wide angle shot',
    mood: 'peaceful',
    colors: 'warm tones',
    quality: ['masterpiece'],
  },
];

interface Message {
  role: 'user' | 'assistant';
  content: string | unknown; // Allow any type, we'll safely render it
  timestamp: Date;
}

// Helper to safely render message content
const renderMessageContent = (content: unknown): string => {
  if (typeof content === 'string') {
    return content;
  }
  if (content == null) {
    return '';
  }
  if (typeof content === 'object') {
    const obj = content as Record<string, unknown>;
    if (typeof obj.text === 'string') {
      // Check for usage limit message
      if (obj.text.includes('usage limit')) {
        return '⚠️ ' + obj.text + '\n\nTry again later or sign in with a different Puter account.';
      }
      return obj.text;
    }
    if (typeof obj.content === 'string') {
      return obj.content;
    }
    // Handle array of objects like [{type, text}]
    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if (typeof item === 'string') return item;
          if (typeof item?.text === 'string') return item.text;
          return JSON.stringify(item);
        })
        .join('\n');
    }
    return JSON.stringify(content);
  }
  return String(content);
};

interface TableData {
  name: string;
  count: number;
  sample: any[];
  columns: string[];
}

const PuterDemo = () => {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Puter state
  const [puterLoaded, setPuterLoaded] = useState(false);
  const [puterUser, setPuterUser] = useState<PuterUser | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [puterUsage, setPuterUsage] = useState<Record<string, unknown> | null>(null);

  // Database state
  const [tables, setTables] = useState<TableData[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);

  // Image generation state
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('dall-e-3');
  const [selectedQuality, setSelectedQuality] = useState('hd');
  const [imageHistory, setImageHistory] = useState<{ prompt: string; src: string }[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  // Progress tracking state
  const [imageProgress, setImageProgress] = useState(0);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Prompt Builder state
  const [usePromptBuilder, setUsePromptBuilder] = useState(true);
  const [promptSubject, setPromptSubject] = useState('');
  const [promptStyle, setPromptStyle] = useState('');
  const [promptLighting, setPromptLighting] = useState('');
  const [promptCamera, setPromptCamera] = useState('');
  const [promptMood, setPromptMood] = useState('');
  const [promptColors, setPromptColors] = useState('');
  const [promptQualityTags, setPromptQualityTags] = useState<string[]>(['highly detailed']);
  const [negativePrompt, setNegativePrompt] = useState('');

  // Download options state
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloadQuality, setDownloadQuality] = useState(0.9);
  const [isDownloading, setIsDownloading] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<'chat' | 'database' | 'image'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };

    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadMenu]);

  // Load Puter.js script (only once)
  useEffect(() => {
    if (window.puter) {
      setPuterLoaded(true);
      checkAuthStatus();
      return;
    }

    const existingScript = document.querySelector('script[src="https://js.puter.com/v2/"]');
    if (existingScript) {
      const checkPuter = setInterval(() => {
        if (window.puter) {
          setPuterLoaded(true);
          checkAuthStatus();
          clearInterval(checkPuter);
        }
      }, 100);
      return () => clearInterval(checkPuter);
    }

    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.async = true;
    script.onload = () => {
      setPuterLoaded(true);
      checkAuthStatus();
    };
    script.onerror = () => console.error('Failed to load Puter.js');
    document.body.appendChild(script);
  }, []);

  // Update quality when model changes
  useEffect(() => {
    const qualities = QUALITY_OPTIONS[selectedModel];
    if (qualities && qualities.length > 0) {
      setSelectedQuality(qualities[0].id);
    }
  }, [selectedModel]);

  const fetchUsage = async () => {
    try {
      if (window.puter?.auth?.getMonthlyUsage) {
        const usage = await window.puter.auth.getMonthlyUsage();
        setPuterUsage(usage);
        console.log('Puter Usage:', usage);
      }
    } catch (error) {
      console.log('Usage fetch error:', error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      if (window.puter?.auth) {
        const isSignedIn = await window.puter.auth.isSignedIn();
        if (isSignedIn) {
          const user = await window.puter.auth.getUser();
          setPuterUser(user);
          fetchUsage();
        }
      }
    } catch (error) {
      console.log('Auth check:', error);
    }
  };

  const handleSignIn = async () => {
    if (!puterLoaded || authLoading) return;
    setAuthLoading(true);
    try {
      const user = await window.puter.auth.signIn();
      setPuterUser(user);
      fetchUsage();
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!puterLoaded) return;
    try {
      await window.puter.auth.signOut();
      setPuterUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Fetch database tables
  useEffect(() => {
    const fetchTables = async () => {
      setLoadingTables(true);
      try {
        const tablesToFetch = [
          {
            name: 'students',
            query: supabase
              .from('students')
              .select('id, name, email, college_school_name, grade')
              .limit(5),
          },
          {
            name: 'courses',
            query: supabase
              .from('courses')
              .select('course_id, title, code, status, duration')
              .limit(5),
          },
          {
            name: 'opportunities',
            query: supabase
              .from('opportunities')
              .select('id, title, company_name, employment_type, location')
              .limit(5),
          },
        ];

        const results: TableData[] = [];
        for (const table of tablesToFetch) {
          const { data, error } = await table.query;
          if (!error && data) {
            results.push({
              name: table.name,
              count: data.length,
              sample: data,
              columns: data.length > 0 ? Object.keys(data[0]) : [],
            });
          }
        }
        setTables(results);
      } catch (error) {
        console.error('Error fetching tables:', error);
      } finally {
        setLoadingTables(false);
      }
    };
    fetchTables();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !puterLoaded || loading) return;

    if (!puterUser) {
      const errorMessage: Message = {
        role: 'assistant',
        content:
          '🔐 Please sign in with your Puter account to use AI chat. Puter accounts are free!',
        timestamp: new Date(),
      };
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: input, timestamp: new Date() },
        errorMessage,
      ]);
      setInput('');
      return;
    }

    const userMessage: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const dbContext =
        tables.length > 0
          ? `\n\nDatabase Context:\n${tables.map((t) => `- ${t.name}: [${t.columns.join(', ')}]`).join('\n')}`
          : '';
      const prompt = `You are a helpful AI assistant. ${dbContext}\n\nUser: ${input}`;
      const response = await window.puter.ai.chat(prompt, { model: 'gpt-4o-mini' });
      const responseText = extractAIResponse(response);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: responseText, timestamp: new Date() },
      ]);
    } catch (error) {
      console.error('Puter AI error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, an error occurred. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Generate prompt from builder
  const generateBuiltPrompt = (): string => {
    const parts: string[] = [];

    if (promptSubject.trim()) {
      parts.push(promptSubject.trim());
    }
    if (promptStyle) {
      parts.push(`${promptStyle} style`);
    }
    if (promptLighting) {
      parts.push(promptLighting);
    }
    if (promptCamera) {
      parts.push(promptCamera);
    }
    if (promptMood) {
      parts.push(`${promptMood} mood`);
    }
    if (promptColors) {
      parts.push(promptColors);
    }
    if (promptQualityTags.length > 0) {
      parts.push(promptQualityTags.join(', '));
    }

    return parts.join(', ');
  };

  // Apply preset to prompt builder
  const applyPreset = (preset: (typeof PROMPT_PRESETS)[0]) => {
    setPromptSubject(preset.subject);
    setPromptStyle(preset.style);
    setPromptLighting(preset.lighting);
    setPromptCamera(preset.camera);
    setPromptMood(preset.mood);
    setPromptColors(preset.colors);
    setPromptQualityTags(preset.quality);
  };

  // Toggle quality tag
  const toggleQualityTag = (tag: string) => {
    setPromptQualityTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Get the final prompt (either from builder or manual input)
  const getFinalPrompt = (): string => {
    if (usePromptBuilder) {
      return generateBuiltPrompt();
    }
    return imagePrompt;
  };

  // Start progress simulation
  const startProgressSimulation = () => {
    setImageProgress(0);
    setGenerationStartTime(Date.now());

    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Simulate progress with variable speed
    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      // Progress slows down as it approaches 95%
      const increment =
        currentProgress < 30
          ? 2
          : currentProgress < 60
            ? 1.5
            : currentProgress < 80
              ? 1
              : currentProgress < 95
                ? 0.5
                : 0;

      currentProgress = Math.min(95, currentProgress + increment);
      setImageProgress(currentProgress);

      // Stop at 95% and wait for actual completion
      if (currentProgress >= 95) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
    }, 300);
  };

  // Stop progress simulation
  const stopProgressSimulation = (success: boolean) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (success) {
      // Animate to 100%
      setImageProgress(100);
    } else {
      setImageProgress(0);
    }
    setGenerationStartTime(null);
  };

  // Generate image using Puter AI
  const generateImage = async () => {
    const finalPrompt = getFinalPrompt();
    if (!finalPrompt.trim() || !puterLoaded || imageLoading) return;

    if (!puterUser) {
      setImageError('Please sign in with your Puter account to generate images.');
      return;
    }

    setImageLoading(true);
    setGeneratedImage(null);
    setImageError(null);
    startProgressSimulation();

    // Build full prompt with negative prompt if provided
    let fullPrompt = finalPrompt;
    if (negativePrompt.trim()) {
      fullPrompt += ` --no ${negativePrompt.trim()}`;
    }

    try {
      const options: Txt2ImgOptions = {
        model: selectedModel,
        quality: selectedQuality,
      };

      console.log('Generating image with options:', options, 'prompt:', fullPrompt);
      const result = await window.puter.ai.txt2img(fullPrompt, options);

      // Handle different response formats
      let imageSrc: string | null = null;

      if (result instanceof HTMLImageElement) {
        imageSrc = result.src;
      } else if (typeof result === 'object' && result !== null) {
        // Check for error response
        const resultObj = result as {
          success?: boolean;
          error?: { message?: string };
          src?: string;
        };
        if (resultObj.success === false) {
          throw new Error(resultObj.error?.message || 'Image generation failed');
        }
        if (resultObj.src) {
          imageSrc = resultObj.src;
        }
      } else if (typeof result === 'string') {
        imageSrc = result;
      }

      if (!imageSrc) {
        throw new Error('No image was returned from the API');
      }

      stopProgressSimulation(true);
      setGeneratedImage(imageSrc);
      setImageHistory((prev) => [{ prompt: finalPrompt, src: imageSrc! }, ...prev.slice(0, 4)]);
    } catch (error: unknown) {
      console.error('Image generation error:', error);
      stopProgressSimulation(false);

      // Extract error message - ensure it's always a string
      let errorMessage = 'Failed to generate image. ';
      try {
        if (error instanceof Error) {
          errorMessage += error.message;
        } else if (typeof error === 'string') {
          errorMessage += error;
        } else if (typeof error === 'object' && error !== null) {
          const errObj = error as Record<string, unknown>;
          // Try to extract message from various possible structures
          const msg =
            errObj.message ||
            (errObj.error as Record<string, unknown>)?.message ||
            (errObj.error as Record<string, unknown>)?.code ||
            JSON.stringify(error);
          errorMessage += typeof msg === 'string' ? msg : JSON.stringify(msg);
        } else {
          errorMessage += 'Unknown error occurred.';
        }
      } catch {
        errorMessage += 'An unexpected error occurred.';
      }

      setImageError(String(errorMessage));
    } finally {
      setImageLoading(false);
    }
  };

  // Calculate elapsed time
  const getElapsedTime = () => {
    if (!generationStartTime) return 0;
    return Math.floor((Date.now() - generationStartTime) / 1000);
  };

  // Download generated image in various formats
  const downloadImage = async (
    format: 'png' | 'jpg' | 'webp' | 'svg' | 'eps' = 'png',
    quality = downloadQuality
  ) => {
    if (!generatedImage) return;

    setIsDownloading(true);
    try {
      // Create image element
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = generatedImage;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 1024;
      canvas.height = img.height || 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.drawImage(img, 0, 0);

      let dataUrl: string;
      let filename: string;
      const timestamp = Date.now();

      switch (format) {
        case 'png':
          dataUrl = canvas.toDataURL('image/png');
          filename = `puter-ai-${timestamp}.png`;
          break;
        case 'jpg': {
          // Fill white background for JPG (no transparency)
          const jpgCanvas = document.createElement('canvas');
          jpgCanvas.width = canvas.width;
          jpgCanvas.height = canvas.height;
          const jpgCtx = jpgCanvas.getContext('2d');
          if (jpgCtx) {
            jpgCtx.fillStyle = '#FFFFFF';
            jpgCtx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
            jpgCtx.drawImage(canvas, 0, 0);
          }
          dataUrl = jpgCanvas.toDataURL('image/jpeg', quality);
          filename = `puter-ai-${timestamp}.jpg`;
          break;
        }
        case 'webp':
          dataUrl = canvas.toDataURL('image/webp', quality);
          filename = `puter-ai-${timestamp}.webp`;
          break;
        case 'svg': {
          // Create SVG with embedded image
          const base64Image = canvas.toDataURL('image/png');
          const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <title>Puter AI Generated Image</title>
  <image xlink:href="${base64Image}" width="${canvas.width}" height="${canvas.height}"/>
</svg>`;
          dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
          filename = `puter-ai-${timestamp}.svg`;
          break;
        }
        case 'eps': {
          // Create EPS (Encapsulated PostScript) with embedded image for Adobe compatibility
          const epsBase64 = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
          const epsWidth = canvas.width;
          const epsHeight = canvas.height;
          const epsContent = `%!PS-Adobe-3.0 EPSF-3.0
%%Creator: Puter AI Image Generator
%%Title: AI Generated Image
%%CreationDate: ${new Date().toISOString()}
%%BoundingBox: 0 0 ${epsWidth} ${epsHeight}
%%HiResBoundingBox: 0.0 0.0 ${epsWidth}.0 ${epsHeight}.0
%%DocumentData: Clean7Bit
%%LanguageLevel: 2
%%Pages: 1
%%EndComments

%%BeginProlog
/RGBImage {
  /height exch def
  /width exch def
  /picstr width 3 mul string def
  width height 8
  [width 0 0 height neg 0 height]
  {currentfile picstr readhexstring pop}
  false 3 colorimage
} def
%%EndProlog

%%Page: 1 1
gsave
0 0 translate
${epsWidth} ${epsHeight} scale

% Embedded JPEG Image
${epsWidth} ${epsHeight} 8 [${epsWidth} 0 0 -${epsHeight} 0 ${epsHeight}]
currentfile /ASCII85Decode filter /DCTDecode filter
false 3 colorimage
${epsBase64}
~>

grestore
showpage
%%EOF`;
          const epsBlob = new Blob([epsContent], { type: 'application/postscript' });
          dataUrl = URL.createObjectURL(epsBlob);
          filename = `puter-ai-${timestamp}.eps`;

          // Download EPS blob
          const epsLink = document.createElement('a');
          epsLink.href = dataUrl;
          epsLink.download = filename;
          document.body.appendChild(epsLink);
          epsLink.click();
          document.body.removeChild(epsLink);
          URL.revokeObjectURL(dataUrl);
          setShowDownloadMenu(false);
          setIsDownloading(false);
          return; // Early return for EPS
        }
        default:
          dataUrl = canvas.toDataURL('image/png');
          filename = `puter-ai-${timestamp}.png`;
      }

      // Download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowDownloadMenu(false);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback to direct download
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `puter-ai-${Date.now()}.png`;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleImageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateImage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 md:p-8">
      {/* Custom Styles for Animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🚀 Puter.js AI Demo</h1>
          <p className="text-gray-300">AI Chat, Image Generation & Database Integration</p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                puterLoaded ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              {puterLoaded ? '✓ Puter.js Ready' : '⏳ Loading...'}
            </span>

            {puterLoaded &&
              (puterUser ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400">
                    👤 {puterUser.username}
                  </span>
                  <button
                    onClick={fetchUsage}
                    className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                  >
                    📊 Usage
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  disabled={authLoading}
                  className="px-4 py-2 rounded-full text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 font-medium"
                >
                  {authLoading ? '⏳ Signing in...' : '🔐 Sign in with Puter (Free)'}
                </button>
              ))}
          </div>

          {!puterUser && puterLoaded && (
            <p className="text-yellow-400/80 text-sm mt-2">
              ⚠️ Sign in required for AI features - Puter accounts are free!
            </p>
          )}

          {/* Usage Data Display */}
          {puterUsage && (
            <div className="mt-4 max-w-2xl mx-auto bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  📊 Your Puter Usage
                </h3>
                <button
                  onClick={fetchUsage}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  🔄 Refresh
                </button>
              </div>

              {/* Allowance Progress Bar */}
              {(
                puterUsage as {
                  allowanceInfo?: { remaining?: number; monthUsageAllowance?: number };
                }
              ).allowanceInfo && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Monthly Allowance</span>
                    <span className="text-white font-medium">
                      {(
                        ((
                          puterUsage as {
                            allowanceInfo: { remaining: number; monthUsageAllowance: number };
                          }
                        ).allowanceInfo.remaining /
                          (puterUsage as { allowanceInfo: { monthUsageAllowance: number } })
                            .allowanceInfo.monthUsageAllowance) *
                        100
                      ).toFixed(2)}
                      % remaining
                    </span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                      style={{
                        width: `${
                          ((
                            puterUsage as {
                              allowanceInfo: { remaining: number; monthUsageAllowance: number };
                            }
                          ).allowanceInfo.remaining /
                            (puterUsage as { allowanceInfo: { monthUsageAllowance: number } })
                              .allowanceInfo.monthUsageAllowance) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1 text-gray-500">
                    <span>
                      Used:{' '}
                      {(
                        (
                          puterUsage as {
                            allowanceInfo: { monthUsageAllowance: number; remaining: number };
                          }
                        ).allowanceInfo.monthUsageAllowance -
                        (puterUsage as { allowanceInfo: { remaining: number } }).allowanceInfo
                          .remaining
                      ).toLocaleString()}{' '}
                      credits
                    </span>
                    <span>
                      Total:{' '}
                      {(
                        puterUsage as { allowanceInfo: { monthUsageAllowance: number } }
                      ).allowanceInfo.monthUsageAllowance.toLocaleString()}{' '}
                      credits
                    </span>
                  </div>
                </div>
              )}

              {/* Total Usage */}
              {typeof (puterUsage as { total?: number }).total === 'number' && (
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300 text-sm">Total Used This Month</span>
                    <span className="text-white font-bold text-lg">
                      {Math.round((puterUsage as { total: number }).total).toLocaleString()} credits
                    </span>
                  </div>
                </div>
              )}

              {/* Usage Breakdown */}
              {(
                puterUsage as {
                  usage?: Record<string, { cost: number; count: number; units: number }>;
                }
              ).usage && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">📈 Usage Breakdown</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Object.entries(
                      (
                        puterUsage as {
                          usage: Record<string, { cost: number; count: number; units: number }>;
                        }
                      ).usage
                    ).map(([key, value]) => (
                      <div
                        key={key}
                        className="bg-gray-700/50 rounded-lg p-2 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 truncate">
                            {key.includes('openai')
                              ? '🤖 '
                              : key.includes('filesystem')
                                ? '📁 '
                                : key.includes('kv')
                                  ? '💾 '
                                  : '⚡ '}
                            {key.split(':').slice(-2).join(' → ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-500">{value.count}x</span>
                          <span className="text-purple-400 font-medium">
                            {Math.round(value.cost)} credits
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* App Totals */}
              {(puterUsage as { appTotals?: Record<string, { count: number; total: number }> })
                .appTotals && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">📱 By Application</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(
                      (
                        puterUsage as {
                          appTotals: Record<string, { count: number; total: number }>;
                        }
                      ).appTotals
                    ).map(([key, value]) => (
                      <div key={key} className="bg-gray-700/50 rounded-lg p-2">
                        <p className="text-xs text-gray-400 truncate">
                          {key === 'others' ? '🌐 Other Apps' : '📱 App'}
                        </p>
                        <p className="text-white font-medium text-sm">
                          {Math.round(value.total).toLocaleString()} credits
                        </p>
                        <p className="text-xs text-gray-500">{value.count} requests</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(puterUsage).length === 0 && (
                <p className="text-gray-500 text-sm text-center">No usage data available</p>
              )}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            💬 AI Chat
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'image'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            🎨 Image Generation
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'database'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            🗄️ Database
          </button>
        </div>

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">💬 Chat with Puter AI</h2>
              <p className="text-gray-400 text-sm mt-1">Powered by GPT-4o-mini</p>
            </div>

            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-4xl mb-2">🤖</p>
                  <p>Start a conversation with Puter AI!</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{renderMessageContent(msg.content)}</p>
                    <p className="text-xs opacity-60 mt-1">{msg.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={puterUser ? 'Ask me anything...' : 'Sign in to chat...'}
                  disabled={!puterLoaded || loading}
                  className="flex-1 bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!puterLoaded || loading || !input.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Generation Tab */}
        {activeTab === 'image' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">🎨 AI Image Generation</h2>
                  <p className="text-gray-400 text-sm mt-1">Midjourney-style prompt builder</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUsePromptBuilder(true)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      usePromptBuilder
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    🛠️ Builder
                  </button>
                  <button
                    onClick={() => setUsePromptBuilder(false)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      !usePromptBuilder
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    ✏️ Manual
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {usePromptBuilder ? (
                  <>
                    {/* Quick Presets */}
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        ⚡ Quick Presets
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {PROMPT_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => applyPreset(preset)}
                            disabled={imageLoading}
                            className="px-3 py-1.5 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-purple-600 hover:to-pink-600 text-gray-200 rounded-lg text-sm transition-all disabled:opacity-50"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subject Input */}
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        🎯 Subject (Main Focus)
                      </label>
                      <input
                        type="text"
                        value={promptSubject}
                        onChange={(e) => setPromptSubject(e.target.value)}
                        placeholder="A majestic dragon, a beautiful woman, a futuristic city..."
                        disabled={imageLoading}
                        className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                      />
                    </div>

                    {/* Style & Lighting Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          🎨 Art Style
                        </label>
                        <select
                          value={promptStyle}
                          onChange={(e) => setPromptStyle(e.target.value)}
                          disabled={imageLoading}
                          className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        >
                          {PROMPT_STYLES.map((style) => (
                            <option key={style.id} value={style.id}>
                              {style.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          💡 Lighting
                        </label>
                        <select
                          value={promptLighting}
                          onChange={(e) => setPromptLighting(e.target.value)}
                          disabled={imageLoading}
                          className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        >
                          {PROMPT_LIGHTING.map((light) => (
                            <option key={light.id} value={light.id}>
                              {light.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Camera & Mood Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          📷 Camera/Shot
                        </label>
                        <select
                          value={promptCamera}
                          onChange={(e) => setPromptCamera(e.target.value)}
                          disabled={imageLoading}
                          className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        >
                          {PROMPT_CAMERA.map((cam) => (
                            <option key={cam.id} value={cam.id}>
                              {cam.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          🎭 Mood
                        </label>
                        <select
                          value={promptMood}
                          onChange={(e) => setPromptMood(e.target.value)}
                          disabled={imageLoading}
                          className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        >
                          {PROMPT_MOOD.map((mood) => (
                            <option key={mood.id} value={mood.id}>
                              {mood.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Colors */}
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        🌈 Color Palette
                      </label>
                      <select
                        value={promptColors}
                        onChange={(e) => setPromptColors(e.target.value)}
                        disabled={imageLoading}
                        className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                      >
                        {PROMPT_COLORS.map((color) => (
                          <option key={color.id} value={color.id}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quality Tags */}
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        ✨ Quality Modifiers
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {PROMPT_QUALITY_TAGS.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => toggleQualityTag(tag.id)}
                            disabled={imageLoading}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              promptQualityTags.includes(tag.id)
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            } disabled:opacity-50`}
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Negative Prompt */}
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        🚫 Negative Prompt (Optional)
                      </label>
                      <input
                        type="text"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="blurry, low quality, distorted, ugly..."
                        disabled={imageLoading}
                        className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                      />
                    </div>

                    {/* Generated Prompt Preview */}
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-gray-300 text-sm font-medium">
                          📝 Generated Prompt
                        </label>
                        <button
                          onClick={() => navigator.clipboard.writeText(generateBuiltPrompt())}
                          className="text-xs text-purple-400 hover:text-purple-300"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <p className="text-gray-200 text-sm leading-relaxed">
                        {generateBuiltPrompt() || (
                          <span className="text-gray-500 italic">
                            Enter a subject to see your prompt...
                          </span>
                        )}
                      </p>
                    </div>
                  </>
                ) : (
                  /* Manual Prompt Input */
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Describe your image
                    </label>
                    <textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      onKeyDown={handleImageKeyDown}
                      placeholder="A futuristic city at sunset with flying cars and neon lights, cinematic lighting, 8K, highly detailed..."
                      disabled={!puterLoaded || imageLoading}
                      rows={4}
                      className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 resize-none"
                    />
                  </div>
                )}

                {/* Model & Quality Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      🤖 AI Model
                    </label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      disabled={imageLoading}
                      className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {IMAGE_MODELS.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name} - {model.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      ⚙️ Quality
                    </label>
                    <select
                      value={selectedQuality}
                      onChange={(e) => setSelectedQuality(e.target.value)}
                      disabled={imageLoading}
                      className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {QUALITY_OPTIONS[selectedModel]?.map((quality) => (
                        <option key={quality.id} value={quality.id}>
                          {quality.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateImage}
                  disabled={
                    !puterLoaded ||
                    imageLoading ||
                    (!usePromptBuilder ? !imagePrompt.trim() : !promptSubject.trim()) ||
                    !puterUser
                  }
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-medium transition-all text-lg"
                >
                  {imageLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    '✨ Generate Image'
                  )}
                </button>

                {!puterUser && puterLoaded && (
                  <p className="text-yellow-400/80 text-sm text-center">
                    Sign in with Puter to generate images
                  </p>
                )}

                {/* Error Display */}
                {imageError && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <p className="font-medium">Generation Failed</p>
                        <p className="text-sm mt-1 text-red-400">{String(imageError)}</p>
                        <button
                          onClick={() => setImageError(null)}
                          className="text-sm mt-2 text-red-300 hover:text-red-200 underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Generated Image Display */}
            {(generatedImage || imageLoading) && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Generated Image</h3>
                  {generatedImage && (
                    <div className="relative" ref={downloadMenuRef}>
                      <button
                        onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                        disabled={isDownloading}
                        className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                      >
                        {isDownloading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            ⬇️ Download
                            <svg
                              className={`w-4 h-4 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </>
                        )}
                      </button>

                      {/* Download Format Menu */}
                      {showDownloadMenu && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-50 overflow-hidden">
                          <div className="p-3 border-b border-gray-700">
                            <p className="text-white font-medium text-sm">📥 Download Format</p>
                          </div>

                          {/* Format Options */}
                          <div className="p-2 space-y-1">
                            <button
                              onClick={() => downloadImage('png')}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-700 transition-colors text-left"
                            >
                              <span className="text-2xl">📷</span>
                              <div className="flex-1">
                                <p className="text-white font-medium text-sm">PNG</p>
                                <p className="text-gray-400 text-xs">Lossless, best quality</p>
                              </div>
                              <span className="text-green-400 text-xs">Recommended</span>
                            </button>

                            <button
                              onClick={() => downloadImage('jpg', downloadQuality)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-700 transition-colors text-left"
                            >
                              <span className="text-2xl">🖼️</span>
                              <div className="flex-1">
                                <p className="text-white font-medium text-sm">JPG</p>
                                <p className="text-gray-400 text-xs">Compressed, smaller file</p>
                              </div>
                            </button>

                            <button
                              onClick={() => downloadImage('webp', downloadQuality)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-700 transition-colors text-left"
                            >
                              <span className="text-2xl">🌐</span>
                              <div className="flex-1">
                                <p className="text-white font-medium text-sm">WebP</p>
                                <p className="text-gray-400 text-xs">
                                  Modern format, best compression
                                </p>
                              </div>
                            </button>

                            <button
                              onClick={() => downloadImage('svg')}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-700 transition-colors text-left"
                            >
                              <span className="text-2xl">📐</span>
                              <div className="flex-1">
                                <p className="text-white font-medium text-sm">SVG</p>
                                <p className="text-gray-400 text-xs">Vector wrapper, scalable</p>
                              </div>
                            </button>

                            <button
                              onClick={() => downloadImage('eps')}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-700 transition-colors text-left"
                            >
                              <span className="text-2xl">🎨</span>
                              <div className="flex-1">
                                <p className="text-white font-medium text-sm">EPS</p>
                                <p className="text-gray-400 text-xs">
                                  Adobe Illustrator compatible
                                </p>
                              </div>
                              <span className="text-purple-400 text-xs">Adobe</span>
                            </button>
                          </div>

                          {/* Quality Slider for JPG/WebP */}
                          <div className="p-3 border-t border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-400 text-xs">JPG/WebP Quality</span>
                              <span className="text-white text-xs font-medium">
                                {Math.round(downloadQuality * 100)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="1"
                              step="0.05"
                              value={downloadQuality}
                              onChange={(e) => setDownloadQuality(parseFloat(e.target.value))}
                              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Smaller</span>
                              <span>Better</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  {imageLoading ? (
                    <div className="max-w-lg mx-auto">
                      {/* Progress Container */}
                      <div className="bg-gray-700/50 rounded-2xl p-6 relative overflow-hidden">
                        {/* Animated Background Shimmer */}
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"
                          style={{ animation: 'shimmer 2s infinite' }}
                        />

                        {/* Circular Progress */}
                        <div className="flex justify-center mb-6">
                          <div className="relative w-32 h-32">
                            {/* Background Circle */}
                            <svg className="w-32 h-32 transform -rotate-90">
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-gray-600"
                              />
                              {/* Progress Circle */}
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="url(#progressGradient)"
                                strokeWidth="8"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 56}`}
                                strokeDashoffset={`${2 * Math.PI * 56 * (1 - imageProgress / 100)}`}
                                className="transition-all duration-300 ease-out"
                              />
                              <defs>
                                <linearGradient
                                  id="progressGradient"
                                  x1="0%"
                                  y1="0%"
                                  x2="100%"
                                  y2="0%"
                                >
                                  <stop offset="0%" stopColor="#ec4899" />
                                  <stop offset="50%" stopColor="#8b5cf6" />
                                  <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                              </defs>
                            </svg>
                            {/* Percentage Text */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-3xl font-bold text-white">
                                {Math.round(imageProgress)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stage Message */}
                        <div className="text-center mb-4">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full">
                            <span className="text-2xl">
                              {getProgressStage(imageProgress).emoji}
                            </span>
                            <span className="text-white font-medium">
                              {getProgressStage(imageProgress).message}
                            </span>
                          </div>
                        </div>

                        {/* Linear Progress Bar */}
                        <div className="relative h-2 bg-gray-600 rounded-full overflow-hidden mb-4">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${imageProgress}%` }}
                          />
                          {/* Animated Glow */}
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full blur-sm opacity-50 transition-all duration-300"
                            style={{ width: `${imageProgress}%` }}
                          />
                        </div>

                        {/* Time & Model Info */}
                        <div className="flex justify-between text-sm text-gray-400">
                          <span>⏱️ {getElapsedTime()}s elapsed</span>
                          <span>🤖 {IMAGE_MODELS.find((m) => m.id === selectedModel)?.name}</span>
                        </div>

                        {/* Prompt Preview */}
                        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Creating:</p>
                          <p className="text-sm text-gray-300 line-clamp-2">{getFinalPrompt()}</p>
                        </div>
                      </div>

                      {/* Progress Steps */}
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {PROGRESS_STAGES.slice(0, 4).map((stage, idx) => (
                          <div
                            key={idx}
                            className={`text-center p-2 rounded-lg transition-all ${
                              imageProgress >= stage.threshold
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-gray-700/30 text-gray-500'
                            }`}
                          >
                            <span className="text-lg">{stage.emoji}</span>
                            <p className="text-xs mt-1 truncate">{stage.message.split(' ')[0]}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : generatedImage ? (
                    <div className="relative">
                      <img
                        src={generatedImage}
                        alt="Generated"
                        className="max-w-lg mx-auto rounded-xl shadow-2xl"
                      />
                      {/* Success Badge */}
                      <div className="absolute top-4 right-4 bg-green-500/90 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        ✅ Generated
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Inspiration Ideas - Only show in manual mode */}
            {!usePromptBuilder && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-white mb-3">💡 Inspiration Ideas</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    'A magical forest with glowing mushrooms at night, fantasy art, volumetric lighting, 8K',
                    'Cyberpunk samurai in neon-lit Tokyo, cinematic, dramatic lighting, highly detailed',
                    'Cute robot playing with a kitten, 3D render, soft lighting, pastel colors',
                    'Underwater city with bioluminescent creatures, digital art, ethereal mood',
                    'Steampunk airship flying over mountains, oil painting style, golden hour',
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setImagePrompt(prompt)}
                      className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      {prompt.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Image History */}
            {imageHistory.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-white mb-3">🕐 Recent Generations</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {imageHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="cursor-pointer group relative"
                      onClick={() => setGeneratedImage(item.src)}
                    >
                      <img
                        src={item.src}
                        alt={item.prompt}
                        className="w-full aspect-square object-cover rounded-lg group-hover:ring-2 ring-purple-500 transition-all"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center p-2">
                        <p className="text-white text-xs text-center line-clamp-3">{item.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Database Tab */}
        {activeTab === 'database' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">🗄️ Supabase Database</h2>
              <p className="text-gray-400 text-sm mt-1">Live data from your database</p>
            </div>

            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {loadingTables ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-gray-400">Loading tables...</p>
                </div>
              ) : tables.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No tables found or connection error</p>
                </div>
              ) : (
                tables.map((table) => (
                  <div key={table.name} className="bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white capitalize">
                        📊 {table.name}
                      </h3>
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                        {table.count} rows
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      Columns: {table.columns.join(', ')}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-600">
                            {table.columns.slice(0, 4).map((col) => (
                              <th
                                key={col}
                                className="text-left py-2 px-2 text-gray-300 font-medium"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.sample.map((row, idx) => (
                            <tr key={idx} className="border-b border-gray-600/50">
                              {table.columns.slice(0, 4).map((col) => (
                                <td
                                  key={col}
                                  className="py-2 px-2 text-gray-400 truncate max-w-[150px]"
                                >
                                  {String(row[col] || '-').substring(0, 30)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>
            Powered by <span className="text-purple-400">Puter.js</span> AI +{' '}
            <span className="text-green-400">Supabase</span>
          </p>
          <p className="mt-1 text-xs">Free AI access with a Puter account</p>
        </div>
      </div>
    </div>
  );
};

export default PuterDemo;
