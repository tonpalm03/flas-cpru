"use client";

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  FolderKanban,
  Wallet,
  Package,
  Users,
  Sliders,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Play,
  Layers,
  Globe,
  Download,
  Award,
  Link2,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import type {
  PortalBlock,
  FreeImageData,
  FreeVideoData,
  FreeTextData,
  FreeButtonData,
  FreeContainerData,
  RoyalBannerData,
  HeroBannerData,
  UrgentAlertData,
  QuickLinksData,
  ButtonsGridData,
  NewsGridData,
  VideoSpotlightData,
  CustomBannerData,
  RichCardData,
  ActionButton
} from '@/lib/portalTypes';

// Dynamic icon resolver
export function resolveIcon(name?: string) {
  switch (name) {
    case 'FileText': return FileText;
    case 'FolderKanban': return FolderKanban;
    case 'Wallet': return Wallet;
    case 'Package': return Package;
    case 'Users': return Users;
    case 'Sliders': return Sliders;
    case 'Calendar': return Calendar;
    case 'Globe': return Globe;
    case 'Download': return Download;
    case 'Award': return Award;
    case 'ExternalLink': return ExternalLink;
    case 'Sparkles': return Sparkles;
    case 'Play': return Play;
    case 'Video': return Video;
    case 'ImageIcon': return ImageIcon;
    case 'Link2': return Link2;
    default: return ArrowRight;
  }
}

// Helper to convert YouTube URL to embed URL
export function toYouTubeEmbedUrl(url: string, autoplay = false, loop = false, muted = false): string {
  if (!url) return '';
  if (url.includes('/embed/')) {
    let embed = url;
    const params = new URLSearchParams();
    if (autoplay) params.set('autoplay', '1');
    if (loop) params.set('loop', '1');
    if (muted) params.set('mute', '1');
    const qs = params.toString();
    return qs ? `${embed}${embed.includes('?') ? '&' : '?'}${qs}` : embed;
  }

  // Regular watch url or short url
  let videoId = '';
  const watchMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (watchMatch && watchMatch[1]) {
    videoId = watchMatch[1];
  }

  if (videoId) {
    const params = new URLSearchParams();
    if (autoplay) params.set('autoplay', '1');
    if (loop) {
      params.set('loop', '1');
      params.set('playlist', videoId);
    }
    if (muted) params.set('mute', '1');
    const qs = params.toString();
    return `https://www.youtube.com/embed/${videoId}${qs ? `?${qs}` : ''}`;
  }

  return url;
}

// Universal Button Renderer
export function renderActionButton(btn: ActionButton, key?: string | number) {
  const Icon = resolveIcon(btn.iconName);
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-5 py-2.5 text-xs sm:text-sm rounded-xl font-bold gap-2',
    lg: 'px-7 py-3.5 text-sm sm:text-base rounded-2xl font-bold gap-2.5',
    xl: 'px-8 py-4 text-base sm:text-lg rounded-2xl font-black gap-3'
  }[btn.size || 'md'];

  const styleClasses = {
    primary: 'bg-blue-900 hover:bg-blue-800 text-white shadow-sm hover:shadow-md border border-blue-900',
    gradient: 'bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 hover:from-blue-800 hover:to-indigo-800 text-white shadow-md hover:shadow-lg',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 shadow-xs',
    outline: 'border-2 border-blue-900 text-blue-900 hover:bg-blue-50 font-bold bg-transparent',
    amber: 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm hover:shadow-md border border-amber-600',
    emerald: 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md border border-emerald-700',
    rose: 'bg-rose-700 hover:bg-rose-600 text-white shadow-sm hover:shadow-md border border-rose-700'
  }[btn.style || 'primary'];

  const isExternal = btn.url?.startsWith('http') || btn.openInNewTab;

  if (isExternal) {
    return (
      <a
        key={key ?? btn.id}
        href={btn.url || '#'}
        target={btn.openInNewTab ? '_blank' : '_self'}
        rel={btn.openInNewTab ? 'noreferrer' : undefined}
        className={`inline-flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer select-none ${sizeClasses} ${styleClasses}`}
      >
        <span>{btn.label}</span>
        <Icon className="w-4 h-4 shrink-0" />
      </a>
    );
  }

  return (
    <Link
      key={key ?? btn.id}
      href={btn.url || '#'}
      className={`inline-flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer select-none ${sizeClasses} ${styleClasses}`}
    >
      <span>{btn.label}</span>
      <Icon className="w-4 h-4 shrink-0" />
    </Link>
  );
}

export default function PortalBlockRenderer({
  block,
  isPreview = false
}: {
  block: PortalBlock;
  isPreview?: boolean;
}) {
  if (!block.isActive && !isPreview) return null;

  const renderContent = () => {
    switch (block.type) {
      // 5 Core Free Elements
      case 'free_image':
        return <FreeImageBlock data={block.data as FreeImageData} isPreview={isPreview} />;
      case 'free_video':
        return <FreeVideoBlock data={block.data as FreeVideoData} isPreview={isPreview} />;
      case 'free_text':
        return <FreeTextBlock data={block.data as FreeTextData} isPreview={isPreview} />;
      case 'free_button':
        return <FreeButtonBlock data={block.data as FreeButtonData} isPreview={isPreview} />;
      case 'free_container':
        return <FreeContainerBlock data={block.data as FreeContainerData} isPreview={isPreview} />;

      // Legacy / Composite Blocks
      case 'royal_banner':
        return <RoyalBannerBlock data={block.data as RoyalBannerData} isPreview={isPreview} />;
      case 'hero_banner':
        return <HeroBannerBlock data={block.data as HeroBannerData} isPreview={isPreview} />;
      case 'urgent_alert':
        return <UrgentAlertBlock data={block.data as UrgentAlertData} isPreview={isPreview} />;
      case 'quick_links':
        return <QuickLinksBlock data={block.data as QuickLinksData} isPreview={isPreview} />;
      case 'buttons_grid':
        return <ButtonsGridBlock data={block.data as ButtonsGridData} isPreview={isPreview} />;
      case 'news_grid':
        return <NewsGridBlock data={block.data as NewsGridData} isPreview={isPreview} />;
      case 'video_spotlight':
        return <VideoSpotlightBlock data={block.data as VideoSpotlightData} isPreview={isPreview} />;
      case 'custom_banner':
        return <CustomBannerBlock data={block.data as CustomBannerData} isPreview={isPreview} />;
      case 'rich_card':
        return <RichCardBlock data={block.data as RichCardData} isPreview={isPreview} />;
      default:
        return null;
    }
  };

  const padClass = {
    none: 'py-0',
    compact: 'py-2',
    normal: 'py-4',
    spacious: 'py-8'
  }[block.customStyles?.paddingY || 'normal'];

  const widthClass = {
    full: 'w-full max-w-none',
    standard: 'max-w-7xl mx-auto w-full',
    narrow: 'max-w-4xl mx-auto w-full'
  }[block.customStyles?.containerWidth || 'standard'];

  return (
    <div className={`w-full ${padClass} ${widthClass}`}>
      {renderContent()}
    </div>
  );
}

/* =========================================================================
   CORE 1: FREE IMAGE BLOCK (อัปโหลดจากเครื่อง + ครอป + สัดส่วน + ฟิลเตอร์)
   ========================================================================= */
function FreeImageBlock({ data }: { data: FreeImageData; isPreview?: boolean }) {
  const getAspectClass = (crop?: string) => {
    switch (crop) {
      case '16:9': return 'aspect-[16/9]';
      case '4:3': return 'aspect-[4/3]';
      case '1:1': return 'aspect-square';
      case 'poster': return 'aspect-[3/4]';
      case 'circle': return 'aspect-square rounded-full';
      default: return 'h-auto';
    }
  };

  const getMaxWidthClass = (mode?: string) => {
    switch (mode) {
      case 'full': return 'w-full';
      case 'wide': return 'max-w-5xl';
      case 'medium': return 'max-w-3xl';
      case 'small': return 'max-w-md';
      default: return 'max-w-full';
    }
  };

  const getAlignClass = (align?: string) => {
    switch (align) {
      case 'left': return 'mr-auto';
      case 'right': return 'ml-auto';
      default: return 'mx-auto';
    }
  };

  const getShadowClass = (shadow?: string) => {
    switch (shadow) {
      case 'sm': return 'shadow-xs';
      case 'md': return 'shadow-md';
      case 'lg': return 'shadow-lg';
      case 'xl': return 'shadow-xl';
      case '2xl': return 'shadow-2xl';
      default: return 'shadow-none';
    }
  };

  const filterStyle: React.CSSProperties = {};
  if (data.filter) {
    const parts: string[] = [];
    if (data.filter.brightness !== undefined && data.filter.brightness !== 100) {
      parts.push(`brightness(${data.filter.brightness}%)`);
    }
    if (data.filter.contrast !== undefined && data.filter.contrast !== 100) {
      parts.push(`contrast(${data.filter.contrast}%)`);
    }
    if (data.filter.grayscale !== undefined && data.filter.grayscale > 0) {
      parts.push(`grayscale(${data.filter.grayscale}%)`);
    }
    if (data.filter.blurPx !== undefined && data.filter.blurPx > 0) {
      parts.push(`blur(${data.filter.blurPx}px)`);
    }
    if (parts.length > 0) {
      filterStyle.filter = parts.join(' ');
    }
  }

  const isCircle = data.cropAspect === 'circle';
  const borderRadius = isCircle ? '9999px' : `${data.borderRadiusPx ?? 16}px`;

  const imageElement = (
    <div
      className={`relative overflow-hidden transition-all duration-300 ${getMaxWidthClass(data.maxWidthMode)} ${getAlignClass(data.align)} ${getShadowClass(data.shadow)}`}
      style={{
        borderRadius,
        borderWidth: data.borderWidthPx ? `${data.borderWidthPx}px` : undefined,
        borderColor: data.borderColor || undefined,
        borderStyle: data.borderWidthPx ? 'solid' : undefined,
        width: data.customWidthPx ? `${data.customWidthPx}px` : undefined
      }}
    >
      <div className={`w-full overflow-hidden flex items-center justify-center bg-slate-100 ${getAspectClass(data.cropAspect)}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.imageUrl || '/templates/admin/garuda-memo.png'}
          alt={data.altText || 'รูปภาพประชาสัมพันธ์'}
          loading="lazy"
          className={`w-full h-full ${data.objectFit === 'contain' ? 'object-contain' : data.objectFit === 'fill' ? 'object-fill' : 'object-cover'} transition-transform duration-300 hover:scale-[1.01]`}
          style={filterStyle}
        />
      </div>

      {data.caption && (
        <p className="text-center text-xs text-slate-500 mt-2 font-normal">
          {data.caption}
        </p>
      )}
    </div>
  );

  if (data.linkUrl) {
    return (
      <a
        href={data.linkUrl}
        target={data.openInNewTab ? '_blank' : '_self'}
        rel={data.openInNewTab ? 'noreferrer' : undefined}
        className="block cursor-pointer"
      >
        {imageElement}
      </a>
    );
  }

  return imageElement;
}

/* =========================================================================
   CORE 2: FREE VIDEO & MEDIA BLOCK (YouTube / ไฟล์ .mp4 จากเครื่อง)
   ========================================================================= */
function FreeVideoBlock({ data }: { data: FreeVideoData; isPreview?: boolean }) {
  const getAspectClass = (aspect?: string) => {
    switch (aspect) {
      case '4:3': return 'aspect-[4/3]';
      case '1:1': return 'aspect-square';
      default: return 'aspect-video'; // 16:9
    }
  };

  const getMaxWidthClass = (mode?: string) => {
    switch (mode) {
      case 'full': return 'w-full';
      case 'wide': return 'max-w-5xl';
      case 'medium': return 'max-w-3xl';
      case 'small': return 'max-w-lg';
      default: return 'max-w-4xl';
    }
  };

  const getAlignClass = (align?: string) => {
    switch (align) {
      case 'left': return 'mr-auto';
      case 'right': return 'ml-auto';
      default: return 'mx-auto';
    }
  };

  const getShadowClass = (shadow?: string) => {
    switch (shadow) {
      case 'sm': return 'shadow-xs';
      case 'md': return 'shadow-md';
      case 'lg': return 'shadow-lg';
      case 'xl': return 'shadow-xl';
      default: return 'shadow-none';
    }
  };

  const borderRadius = `${data.borderRadiusPx ?? 20}px`;
  const isLocal = data.videoType === 'local_video' || data.videoUrl?.startsWith('data:video') || data.videoUrl?.endsWith('.mp4');

  return (
    <div className={`space-y-3 ${getMaxWidthClass(data.maxWidthMode)} ${getAlignClass(data.align)}`}>
      {data.heading && (
        <div className={`space-y-1 ${data.align === 'center' ? 'text-center' : data.align === 'right' ? 'text-right' : 'text-left'}`}>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{data.heading}</h2>
          {data.subheading && <p className="text-xs text-slate-500">{data.subheading}</p>}
        </div>
      )}

      <div
        className={`w-full overflow-hidden bg-black ${getAspectClass(data.aspectRatio)} ${getShadowClass(data.shadow)}`}
        style={{ borderRadius }}
      >
        {isLocal ? (
          <video
            src={data.videoUrl}
            controls={data.controls !== false}
            autoPlay={data.autoplay}
            loop={data.loop}
            muted={data.muted}
            className="w-full h-full object-cover"
          />
        ) : (
          <iframe
            src={toYouTubeEmbedUrl(data.videoUrl, data.autoplay, data.loop, data.muted)}
            title={data.heading || 'วิดีโอแนะนำ'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>

      {data.caption && (
        <p className={`text-xs text-slate-500 ${data.align === 'center' ? 'text-center' : data.align === 'right' ? 'text-right' : 'text-left'}`}>
          {data.caption}
        </p>
      )}
    </div>
  );
}

/* =========================================================================
   CORE 3: FREE TEXT / HEADING BLOCK (พิมพ์สด + ฟอนต์ + สี + จัดแนว)
   ========================================================================= */
function FreeTextBlock({ data }: { data: FreeTextData; isPreview?: boolean }) {
  const getAlignClass = (align?: string) => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      case 'justify': return 'text-justify';
      default: return 'text-left';
    }
  };

  const getWeightClass = (weight?: string) => {
    switch (weight) {
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
      case 'extrabold': return 'font-black';
      default: return 'font-normal';
    }
  };

  const defaultFontSize = {
    h1: 'text-3xl sm:text-5xl',
    h2: 'text-2xl sm:text-3xl',
    h3: 'text-xl sm:text-2xl',
    h4: 'text-lg sm:text-xl',
    lead: 'text-base sm:text-lg leading-relaxed text-slate-600',
    p: 'text-sm sm:text-base leading-relaxed'
  }[data.tag || 'p'];

  const customStyle: React.CSSProperties = {
    color: data.textColor || undefined,
    fontSize: data.fontSizePx ? `${data.fontSizePx}px` : undefined,
    lineHeight: data.lineHeight ? data.lineHeight : undefined,
    backgroundColor: data.bgHighlightColor || undefined
  };

  const textNode = (
    <div
      className={`whitespace-pre-line tracking-tight transition-colors ${getAlignClass(data.align)} ${getWeightClass(data.fontWeight)} ${data.fontSizePx ? '' : defaultFontSize}`}
      style={customStyle}
    >
      {data.content}
    </div>
  );

  if (data.linkUrl) {
    return (
      <a
        href={data.linkUrl}
        target={data.openInNewTab ? '_blank' : '_self'}
        rel={data.openInNewTab ? 'noreferrer' : undefined}
        className="block hover:underline"
      >
        {textNode}
      </a>
    );
  }

  return textNode;
}

/* =========================================================================
   CORE 4: FREE BUTTONS & ACTION LINKS BLOCK
   ========================================================================= */
function FreeButtonBlock({ data }: { data: FreeButtonData; isPreview?: boolean }) {
  const getLayoutClass = (layout?: string) => {
    switch (layout) {
      case 'grid-2': return 'grid grid-cols-1 sm:grid-cols-2 gap-3';
      case 'grid-3': return 'grid grid-cols-1 sm:grid-cols-3 gap-3';
      case 'grid-4': return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3';
      case 'column': return 'flex flex-col gap-2.5 max-w-xl mx-auto';
      default: return 'flex flex-wrap items-center gap-3'; // flex-wrap
    }
  };

  const getAlignClass = (align?: string) => {
    switch (align) {
      case 'center': return 'justify-center text-center';
      case 'right': return 'justify-end text-right';
      default: return 'justify-start text-left';
    }
  };

  return (
    <div className={`my-2 space-y-3 ${getAlignClass(data.align)}`}>
      {data.heading && (
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{data.heading}</h2>
      )}
      {data.subheading && (
        <p className="text-xs text-slate-500 mt-0.5">{data.subheading}</p>
      )}

      <div className={`${getLayoutClass(data.layout)} ${getAlignClass(data.align)} pt-1`}>
        {data.buttons?.map((btn, i) => renderActionButton(btn, btn.id || i))}
      </div>
    </div>
  );
}

/* =========================================================================
   CORE 5: FREE CONTAINER / CARD BLOCK
   ========================================================================= */
function FreeContainerBlock({ data }: { data: FreeContainerData; isPreview?: boolean }) {
  const getPaddingClass = (padY?: string, padX?: string) => {
    const y = { none: 'py-0', sm: 'py-3', md: 'py-6', lg: 'py-10', xl: 'py-16' }[padY || 'md'];
    const x = { none: 'px-0', sm: 'px-3', md: 'px-6', lg: 'px-10', xl: 'px-16' }[padX || 'md'];
    return `${y} ${x}`;
  };

  const getShadowClass = (shadow?: string) => {
    switch (shadow) {
      case 'sm': return 'shadow-xs';
      case 'md': return 'shadow-md';
      case 'lg': return 'shadow-lg';
      case 'xl': return 'shadow-xl';
      case '2xl': return 'shadow-2xl';
      default: return 'shadow-none';
    }
  };

  const borderRadius = `${data.borderRadiusPx ?? 24}px`;

  return (
    <div
      className={`relative overflow-hidden transition-all duration-300 ${getPaddingClass(data.paddingY, data.paddingX)} ${getShadowClass(data.shadow)}`}
      style={{
        backgroundColor: data.bgColor || '#ffffff',
        backgroundImage: data.bgGradient || (data.bgImageUrl ? `url(${data.bgImageUrl})` : undefined),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius,
        borderWidth: data.borderWidthPx ? `${data.borderWidthPx}px` : '1px',
        borderColor: data.borderColor || '#e2e8f0',
        borderStyle: 'solid'
      }}
    >
      {/* Background Image Dark Overlay if applicable */}
      {data.bgImageUrl && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: `rgba(0, 0, 0, ${(data.bgOverlayOpacity ?? 40) / 100})` }}
        />
      )}

      <div className={`relative z-10 space-y-4 ${data.align === 'center' ? 'text-center' : data.align === 'right' ? 'text-right' : 'text-left'}`}>
        {data.title && (
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{data.title}</h2>
        )}
        {data.subtitle && (
          <p className="text-sm text-slate-600 max-w-2xl">{data.subtitle}</p>
        )}

        {data.contentHtml && (
          <div
            className="prose prose-sm max-w-none text-xs sm:text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: data.contentHtml }}
          />
        )}

        {data.buttons && data.buttons.length > 0 && (
          <div className={`flex flex-wrap items-center gap-3 pt-2 ${data.align === 'center' ? 'justify-center' : data.align === 'right' ? 'justify-end' : 'justify-start'}`}>
            {data.buttons.map((btn, i) => renderActionButton(btn, btn.id || i))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   LEGACY / COMPOSITE BLOCKS (ROYAL, HERO, ALERT, QUICK LINKS, NEWS, ETC.)
   ========================================================================= */
function RoyalBannerBlock({ data }: { data: RoyalBannerData; isPreview?: boolean }) {
  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'purple':
        return {
          bg: 'bg-gradient-to-b from-[#2d0a42] via-[#431464] to-[#1e052d]',
          border: 'border-[#d4af37]/60',
          accent: 'from-[#ffd700] via-[#fff3a8] to-[#d4af37]',
          textMuted: 'text-purple-200/90',
          cardBg: 'bg-purple-950/40 border-purple-800/50'
        };
      case 'blue':
        return {
          bg: 'bg-gradient-to-b from-[#0a2542] via-[#103a66] to-[#06182c]',
          border: 'border-[#d4af37]/60',
          accent: 'from-[#ffd700] via-[#fff3a8] to-[#d4af37]',
          textMuted: 'text-blue-200/90',
          cardBg: 'bg-blue-950/40 border-blue-800/50'
        };
      case 'yellow':
        return {
          bg: 'bg-gradient-to-b from-[#3a2d04] via-[#594508] to-[#241c03]',
          border: 'border-[#ffd700]/70',
          accent: 'from-[#fff3a8] via-[#ffd700] to-[#e6b800]',
          textMuted: 'text-amber-200/90',
          cardBg: 'bg-amber-950/40 border-amber-800/50'
        };
      case 'green':
        return {
          bg: 'bg-gradient-to-b from-[#0a3a24] via-[#125334] to-[#052215]',
          border: 'border-[#d4af37]/60',
          accent: 'from-[#ffd700] via-[#fff3a8] to-[#d4af37]',
          textMuted: 'text-emerald-200/90',
          cardBg: 'bg-emerald-950/40 border-emerald-800/50'
        };
      default: // gold
        return {
          bg: 'bg-gradient-to-b from-[#332204] via-[#523707] to-[#211603]',
          border: 'border-[#f5d77f]/80',
          accent: 'from-[#fff2c2] via-[#f7d885] to-[#c79a24]',
          textMuted: 'text-amber-100/90',
          cardBg: 'bg-amber-950/40 border-amber-800/50'
        };
    }
  };

  const themeStyle = getThemeClasses(data.theme || 'gold');

  return (
    <div className={`relative overflow-hidden rounded-3xl border-2 ${themeStyle.border} ${themeStyle.bg} shadow-2xl p-6 sm:p-10 my-2 text-center text-white`}>
      <div className="absolute inset-0 bg-[radial-gradient(#ffd700_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-5">
        {data.imageUrl && (
          <div className="flex justify-center">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.imageUrl}
                alt={data.monarchName || 'ตราสัญลักษณ์'}
                className="max-h-full max-w-full object-contain filter drop-shadow-md"
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-amber-300">
            {data.occasion}
          </p>
          <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r ${themeStyle.accent} bg-clip-text text-transparent drop-shadow-sm`}>
            {data.royalTitle}
          </h2>
          {data.monarchName && (
            <p className="text-sm sm:text-base font-bold text-amber-100/95 max-w-2xl mx-auto">
              {data.monarchName}
            </p>
          )}
        </div>

        {data.prose && (
          <div className={`p-5 sm:p-6 rounded-2xl ${themeStyle.cardBg} backdrop-blur-sm border max-w-2xl mx-auto shadow-inner`}>
            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium text-amber-50">
              {data.prose}
            </p>
          </div>
        )}

        {data.signBy && (
          <p className="text-[11px] sm:text-xs text-amber-200/80 leading-relaxed whitespace-pre-line font-light">
            {data.signBy}
          </p>
        )}

        {data.buttonText && data.buttonUrl && (
          <div className="pt-2">
            <a
              href={data.buttonUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-amber-950 font-bold text-xs sm:text-sm shadow-lg hover:shadow-amber-400/30 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <span>{data.buttonText}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function HeroBannerBlock({ data }: { data: HeroBannerData; isPreview?: boolean }) {
  const isCenter = data.align === 'center';

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white p-8 sm:p-14 shadow-2xl my-2 border border-blue-900/40 ${isCenter ? 'text-center' : 'text-left'}`}>
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

      <div className={`relative z-10 max-w-3xl space-y-6 ${isCenter ? 'mx-auto' : ''}`}>
        {data.badgeText && (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>{data.badgeText}</span>
          </div>
        )}

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white whitespace-pre-line">
          {data.headline}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
          {data.subheadline}
        </p>

        <div className={`flex flex-wrap items-center gap-3.5 pt-2 ${isCenter ? 'justify-center' : 'justify-start'}`}>
          {data.buttons && data.buttons.length > 0 ? (
            data.buttons.map((btn, i) => renderActionButton(btn, btn.id || i))
          ) : (
            <>
              {data.primaryCta && (
                <Link
                  href={data.primaryCta.url || '#'}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all"
                >
                  <span>{data.primaryCta.label}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              {data.secondaryCta && (
                <Link
                  href={data.secondaryCta.url || '#'}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold backdrop-blur-md border border-white/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <span>{data.secondaryCta.label}</span>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UrgentAlertBlock({ data }: { data: UrgentAlertData; isPreview?: boolean }) {
  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-950',
          badge: 'bg-rose-600 text-white',
          btn: 'bg-rose-600 hover:bg-rose-700 text-white'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-950',
          badge: 'bg-amber-500 text-white',
          btn: 'bg-amber-600 hover:bg-amber-700 text-white'
        };
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-950',
          badge: 'bg-emerald-600 text-white',
          btn: 'bg-emerald-700 hover:bg-emerald-800 text-white'
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-950',
          badge: 'bg-blue-600 text-white',
          btn: 'bg-blue-900 hover:bg-blue-800 text-white'
        };
    }
  };

  const style = getAlertStyles(data.alertType || 'info');

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border ${style.bg} shadow-xs my-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
      <div className="flex items-center gap-3">
        {data.badge && (
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${style.badge}`}>
            {data.badge}
          </span>
        )}
        <p className="text-xs sm:text-sm font-semibold leading-relaxed">
          {data.message}
        </p>
      </div>

      {data.linkText && data.linkUrl && (
        <a
          href={data.linkUrl}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${style.btn}`}
        >
          {data.linkText}
        </a>
      )}
    </div>
  );
}

function QuickLinksBlock({ data }: { data: QuickLinksData; isPreview?: boolean }) {
  const getColClass = (cols: number) => {
    switch (cols) {
      case 2: return 'grid-cols-1 sm:grid-cols-2';
      case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case 6: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
      default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100/80';
      case 'indigo': return 'bg-indigo-50 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100/80';
      case 'emerald': return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/80';
      case 'amber': return 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/80';
      case 'purple': return 'bg-purple-50 text-purple-700 border-purple-200/80 hover:bg-purple-100/80';
      default: return 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100/80';
    }
  };

  return (
    <div className="my-4 space-y-4">
      {data.heading && (
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{data.heading}</h2>
          {data.subheading && <p className="text-xs text-slate-500 mt-0.5">{data.subheading}</p>}
        </div>
      )}

      <div className={`grid ${getColClass(data.columns || 3)} gap-4`}>
        {data.items?.map(item => {
          const Icon = resolveIcon(item.iconName);
          const colorClass = getColorClasses(item.color);

          return (
            <Link
              key={item.id}
              href={item.url}
              className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${colorClass} transition-colors`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {item.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-900">
                <span>เข้าใช้งานระบบ</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ButtonsGridBlock({ data }: { data: ButtonsGridData; isPreview?: boolean }) {
  const getLayoutClass = (layout: string) => {
    switch (layout) {
      case 'grid-2': return 'grid grid-cols-1 sm:grid-cols-2 gap-3';
      case 'grid-3': return 'grid grid-cols-1 sm:grid-cols-3 gap-3';
      case 'grid-4': return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3';
      case 'column': return 'flex flex-col gap-2.5 max-w-xl mx-auto';
      default: return 'flex flex-wrap items-center gap-3';
    }
  };

  const getAlignClass = (align?: string) => {
    switch (align) {
      case 'center': return 'justify-center text-center';
      case 'right': return 'justify-end text-right';
      default: return 'justify-start text-left';
    }
  };

  return (
    <div className={`my-4 space-y-3 ${getAlignClass(data.align)}`}>
      {data.heading && (
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{data.heading}</h2>
      )}
      {data.subheading && (
        <p className="text-xs text-slate-500 mt-0.5">{data.subheading}</p>
      )}

      <div className={`${getLayoutClass(data.layout || 'flex-wrap')} ${getAlignClass(data.align)} pt-1`}>
        {data.buttons?.map((btn, i) => renderActionButton(btn, btn.id || i))}
      </div>
    </div>
  );
}

function NewsGridBlock({ data }: { data: NewsGridData; isPreview?: boolean }) {
  return (
    <div className="my-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{data.heading}</h2>
          {data.subheading && <p className="text-xs text-slate-500 mt-0.5">{data.subheading}</p>}
        </div>
        {data.viewAllUrl && (
          <Link href={data.viewAllUrl} className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1">
            <span>ดูข่าวทั้งหมด</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.items?.map(news => (
          <div
            key={news.id}
            className="group rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md overflow-hidden transition-all duration-200 flex flex-col"
          >
            {news.imageUrl ? (
              <div className="h-44 w-full overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={news.imageUrl}
                  alt={news.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="h-28 w-full bg-gradient-to-r from-blue-900 to-indigo-900 p-4 flex items-end">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md">
                  {news.category}
                </span>
              </div>
            )}

            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Calendar className="w-3 h-3" />
                  <span>{news.date}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-900 transition-colors">
                  {news.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {news.excerpt}
                </p>
              </div>

              <div className="pt-2 flex items-center text-xs font-semibold text-blue-900 gap-1">
                <span>อ่านต่อ</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VideoSpotlightBlock({ data }: { data: VideoSpotlightData; isPreview?: boolean }) {
  return (
    <div className="my-4 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
      {data.heading && (
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{data.heading}</h2>
          {data.subheading && <p className="text-xs text-slate-400">{data.subheading}</p>}
        </div>
      )}

      <div className="max-w-3xl mx-auto aspect-video rounded-2xl overflow-hidden bg-black shadow-inner border border-slate-800">
        <iframe
          src={toYouTubeEmbedUrl(data.youtubeUrl)}
          title={data.heading || 'วิดีโอแนะนำ'}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {data.caption && (
        <p className="text-center text-xs text-slate-400 max-w-2xl mx-auto">{data.caption}</p>
      )}
    </div>
  );
}

function CustomBannerBlock({ data }: { data: CustomBannerData; isPreview?: boolean }) {
  const getAspectClass = (aspect?: string) => {
    switch (aspect) {
      case 'wide': return 'aspect-[16/9]';
      case 'panoramic': return 'aspect-[21/9]';
      case 'standard': return 'aspect-[4/3]';
      case 'square': return 'aspect-square';
      case 'poster': return 'aspect-[3/4]';
      default: return 'h-auto';
    }
  };

  const getWidthClass = (w?: string) => {
    switch (w) {
      case 'full': return 'w-full';
      case 'narrow': return 'max-w-3xl mx-auto';
      default: return 'max-w-5xl mx-auto';
    }
  };

  const isCover = data.objectFit !== 'contain';

  const content = (
    <div className={`my-3 rounded-3xl overflow-hidden border border-slate-200 shadow-md hover:shadow-lg transition-all group relative ${getWidthClass(data.maxWidth)}`}>
      <div
        className={`w-full overflow-hidden bg-slate-900 flex items-center justify-center ${getAspectClass(data.aspectRatio)}`}
        style={data.heightPx ? { height: `${data.heightPx}px` } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.imageUrl || '/templates/admin/garuda-memo.png'}
          alt={data.altText || 'แบนเนอร์ประชาสัมพันธ์'}
          loading="lazy"
          className={`w-full h-full ${isCover ? 'object-cover' : 'object-contain'} group-hover:scale-[1.01] transition-transform duration-300`}
        />
      </div>

      {(data.overlayTitle || data.overlaySubtitle || data.overlayButtonText) && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white space-y-2">
          {data.overlayTitle && (
            <h3 className="text-xl sm:text-3xl font-bold tracking-tight">{data.overlayTitle}</h3>
          )}
          {data.overlaySubtitle && (
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl">{data.overlaySubtitle}</p>
          )}
          {data.overlayButtonText && (
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md">
                <span>{data.overlayButtonText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (data.targetUrl) {
    return (
      <a
        href={data.targetUrl}
        target={data.openInNewTab ? '_blank' : '_self'}
        rel={data.openInNewTab ? 'noreferrer' : undefined}
        className="block cursor-pointer"
      >
        {content}
      </a>
    );
  }

  return content;
}

function RichCardBlock({ data }: { data: RichCardData; isPreview?: boolean }) {
  return (
    <div
      className="my-3 p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4"
      style={{ backgroundColor: data.bgColor || '#ffffff', color: data.textColor || '#0f172a' }}
    >
      {data.heading && (
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{data.heading}</h2>
      )}
      <div
        className="prose prose-sm max-w-none text-xs sm:text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: data.contentHtml || '' }}
      />
      {data.buttons && data.buttons.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          {data.buttons.map((btn, i) => renderActionButton(btn, btn.id || i))}
        </div>
      )}
    </div>
  );
}
