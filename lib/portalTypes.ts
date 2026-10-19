import { StandardRole, UserProfile } from './types';

export type PortalBlockType =
  // 5 Core Free Elements (ระบบอิสระ 5 วัตถุดิบหลัก)
  | 'free_image'       // 1. รูปภาพอิสระ (อัปโหลดจากเครื่อง + ครอปตัดขอบ + ย่อขยาย + ใส่ลิงก์)
  | 'free_video'       // 2. วิดีโอและสื่อ (YouTube / ไฟล์ .mp4 จากเครื่อง + ปรับขนาด + ควบคุม)
  | 'free_text'        // 3. ข้อความ/หัวข้ออิสระ (พิมพ์สด + ฟอนต์ + สี + จัดแนว)
  | 'free_button'      // 4. ปุ่มกด & ลิงก์อิสระ (ปรับแต่งสี/ทรง/ไอคอน + ลิงก์)
  | 'free_container'   // 5. กล่องจัดกลุ่ม/การ์ด (สีพื้นหลัง/Gradient/รูปภาพ + ขอบมน + เงา)
  // Legacy / Composite Blocks (รองรับความเข้ากันได้)
  | 'royal_banner'     // บล็อกถวายพระพร / วันสำคัญ
  | 'hero_banner'      // แบนเนอร์สไลด์ภาพและไฮไลท์หลัก
  | 'urgent_alert'     // แถบแจ้งเตือนด่วน / ป๊อปอัปประกาศ
  | 'quick_links'      // การ์ดระบบงานและบริการ 6 โมดูล
  | 'buttons_grid'     // กลุ่มปุ่มกดและลิงก์ทางลัดกำหนดเองอิสระ
  | 'news_grid'        // กล่องข่าวสารและกิจกรรมคณะ
  | 'video_spotlight'  // คลิปวิดีโอประชาสัมพันธ์ / YouTube
  | 'custom_banner'    // โปสเตอร์ประชาสัมพันธ์ขนาดกำหนดเองพร้อม Hyperlink
  | 'rich_card';       // บล็อกข้อความอิสระและเนื้อหาพิเศษ

export type RoyalTheme = 'gold' | 'purple' | 'blue' | 'yellow' | 'green' | 'crimson';

export interface ActionButton {
  id: string;
  label: string;
  url: string;
  style: 'primary' | 'secondary' | 'gradient' | 'outline' | 'amber' | 'emerald' | 'rose';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  iconName?: string;
  openInNewTab?: boolean;
}

/* =========================================================================
   5 CORE FREE-FORM ELEMENT INTERFACES
   ========================================================================= */

// 1. FREE IMAGE
export interface FreeImageData {
  imageUrl: string;
  altText?: string;
  cropAspect: 'free' | '16:9' | '4:3' | '1:1' | 'poster' | 'circle';
  borderRadiusPx: number; // 0 - 100
  objectFit: 'cover' | 'contain' | 'fill';
  maxWidthMode: 'full' | 'wide' | 'medium' | 'small' | 'custom';
  customWidthPx?: number;
  customHeightPx?: number;
  align: 'left' | 'center' | 'right';
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  borderWidthPx?: number;
  borderColor?: string;
  filter?: {
    brightness?: number; // 50 - 150%
    contrast?: number;   // 50 - 150%
    grayscale?: number;  // 0 - 100%
    blurPx?: number;     // 0 - 10px
  };
  linkUrl?: string;
  openInNewTab?: boolean;
  caption?: string;
}

// 2. FREE VIDEO & MEDIA
export interface FreeVideoData {
  videoType: 'youtube' | 'local_video';
  videoUrl: string; // YouTube Embed or local base64/url
  heading?: string;
  subheading?: string;
  aspectRatio: '16:9' | '4:3' | '1:1' | 'auto';
  maxWidthMode: 'full' | 'wide' | 'medium' | 'small';
  borderRadiusPx: number;
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  align: 'left' | 'center' | 'right';
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  caption?: string;
}

// 3. FREE TEXT / HEADING
export interface FreeTextData {
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'lead';
  content: string; // rich text or plain
  fontSizePx?: number;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  textColor: string;
  align: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  linkUrl?: string;
  openInNewTab?: boolean;
  bgHighlightColor?: string;
}

// 4. FREE BUTTONS / ACTION LINKS
export interface FreeButtonData {
  heading?: string;
  subheading?: string;
  layout: 'flex-wrap' | 'grid-2' | 'grid-3' | 'grid-4' | 'column';
  align: 'left' | 'center' | 'right';
  buttons: ActionButton[];
}

// 5. FREE CONTAINER / CARD
export interface FreeContainerData {
  title?: string;
  subtitle?: string;
  bgColor?: string;
  bgGradient?: string;
  bgImageUrl?: string;
  bgOverlayOpacity?: number; // 0 - 90
  paddingY: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingX: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadiusPx: number;
  borderWidthPx?: number;
  borderColor?: string;
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  align: 'left' | 'center' | 'right';
  contentHtml?: string;
  buttons?: ActionButton[];
}

/* =========================================================================
   LEGACY INTERFACES
   ========================================================================= */

export interface RoyalBannerData {
  royalTitle: string;
  occasion: string;
  monarchName: string;
  imageUrl: string;
  prose: string;
  signBy: string;
  theme: RoyalTheme;
  buttonText?: string;
  buttonUrl?: string;
  isBlessingActive?: boolean;
}

export interface HeroBannerData {
  badgeText?: string;
  headline: string;
  subheadline: string;
  imageUrl?: string;
  bgGradient?: string;
  align?: 'left' | 'center';
  buttons?: ActionButton[];
  primaryCta?: {
    label: string;
    url: string;
    isExternal?: boolean;
  };
  secondaryCta?: {
    label: string;
    url: string;
    isExternal?: boolean;
  };
}

export interface UrgentAlertData {
  alertType: 'info' | 'warning' | 'danger' | 'success';
  displayMode: 'top_banner' | 'modal_popup';
  badge: string;
  message: string;
  linkText?: string;
  linkUrl?: string;
  expiresAt?: string;
  dismissible?: boolean;
}

export interface QuickLinkItem {
  id: string;
  title: string;
  desc: string;
  iconName: string;
  url: string;
  color: string;
  badge?: string;
  isExternal?: boolean;
}

export interface QuickLinksData {
  heading: string;
  subheading?: string;
  columns: 2 | 3 | 4 | 6;
  items: QuickLinkItem[];
}

export interface ButtonsGridData {
  heading?: string;
  subheading?: string;
  layout: 'grid-2' | 'grid-3' | 'grid-4' | 'flex-wrap' | 'column';
  align?: 'left' | 'center' | 'right';
  buttons: ActionButton[];
}

export interface NewsItem {
  id: string;
  title: string;
  category: string;
  date: string;
  imageUrl?: string;
  excerpt: string;
  linkUrl: string;
  isFeatured?: boolean;
}

export interface NewsGridData {
  heading: string;
  subheading?: string;
  viewAllUrl?: string;
  categories: string[];
  items: NewsItem[];
}

export interface VideoSpotlightData {
  heading: string;
  subheading?: string;
  youtubeUrl: string;
  caption?: string;
}

export interface CustomBannerData {
  imageUrl: string;
  altText: string;
  aspectRatio: 'wide' | 'panoramic' | 'standard' | 'square' | 'poster' | 'auto';
  heightPx?: number;
  objectFit?: 'cover' | 'contain';
  maxWidth?: 'full' | 'standard' | 'narrow';
  targetUrl: string;
  openInNewTab: boolean;
  caption?: string;
  overlayTitle?: string;
  overlaySubtitle?: string;
  overlayButtonText?: string;
  overlayButtonUrl?: string;
}

export interface RichCardData {
  heading?: string;
  contentHtml: string;
  bgColor?: string;
  textColor?: string;
  buttons?: ActionButton[];
}

export interface PortalBlock {
  id: string;
  type: PortalBlockType;
  title: string;
  isActive: boolean;
  orderIndex: number;
  data:
    | FreeImageData
    | FreeVideoData
    | FreeTextData
    | FreeButtonData
    | FreeContainerData
    | RoyalBannerData
    | HeroBannerData
    | UrgentAlertData
    | QuickLinksData
    | ButtonsGridData
    | NewsGridData
    | VideoSpotlightData
    | CustomBannerData
    | RichCardData
    | any;
  customStyles?: {
    paddingY?: 'none' | 'compact' | 'normal' | 'spacious';
    containerWidth?: 'full' | 'standard' | 'narrow';
    rounded?: 'none' | 'md' | 'xl' | '2xl' | '3xl';
    shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    bgOverride?: string;
  };
  updatedAt?: string;
  updatedBy?: string;
}

export interface PortalConfig {
  id: string;
  title: string;
  lastPublishedAt?: string;
  lastPublishedBy?: string;
  allowedRoles: StandardRole[]; // ยศที่ได้รับอนุญาตให้เข้ามาจัดหน้าเว็บ
  blocks: PortalBlock[];
}
